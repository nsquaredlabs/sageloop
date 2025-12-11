import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseId } from '@/lib/utils';
import { resolveProvider } from '@/lib/ai/provider-resolver';
import { generateCompletion } from '@/lib/ai/generation';
import type { ModelConfig, UserApiKeys, ModelSnapshot } from '@/types/database';
import type { GenerateOutputsResponse } from '@/types/api';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);

    // Fetch project details (RLS ensures user has access)
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*, workbench_id')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch workbench API keys
    const { data: apiKeys, error: keysError } = await supabase
      .rpc('get_workbench_api_keys', { workbench_uuid: project.workbench_id ?? '' }) as {
        data: UserApiKeys | null;
        error: any;
      };

    if (keysError) {
      console.error('Error fetching API keys:', keysError);
      return NextResponse.json(
        { error: 'Failed to fetch API keys' },
        { status: 500 }
      );
    }

    // Fetch all scenarios for this project
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true });

    if (scenariosError || !scenarios || scenarios.length === 0) {
      return NextResponse.json(
        { error: 'No scenarios found for this project' },
        { status: 400 }
      );
    }

    const modelConfig = project.model_config as unknown as ModelConfig;

    // Determine which provider and model to use
    const { provider, modelName, apiKey, usingFallback } = resolveProvider(
      modelConfig.model || 'gpt-3.5-turbo',
      apiKeys
    );

    // Generate outputs for each scenario
    const generatedOutputs = [];
    const errors = [];

    for (const scenario of scenarios) {
      try {
        // Generate completion using unified service
        const result = await generateCompletion({
          provider,
          model: modelName,
          temperature: modelConfig.temperature ?? 0.7,
          systemPrompt: modelConfig.system_prompt,
          userMessage: scenario.input_text,
          apiKey,
          variables: modelConfig.variables,
        });

        const outputText = result.text;
        const usage = result.usage;

        // Save output to database
        const { data: output, error: outputError } = await supabase
          .from('outputs')
          .insert({
            scenario_id: scenario.id,
            output_text: outputText,
            model_snapshot: {
              model: modelName,
              temperature: modelConfig.temperature ?? 0.7,
              system_prompt: modelConfig.system_prompt,
              variables: modelConfig.variables,
              ...usage,
            },
          })
          .select()
          .single();

        if (outputError) {
          errors.push({
            scenario_id: scenario.id,
            error: 'Failed to save output',
          });
        } else {
          generatedOutputs.push(output);
        }
      } catch (error) {
        console.error(`Error generating output for scenario ${scenario.id}:`, error);
        errors.push({
          scenario_id: scenario.id,
          error: error instanceof Error ? error.message : 'Generation failed',
        });
      }
    }

    const response: GenerateOutputsResponse = {
      success: true,
      generated: generatedOutputs.length,
      total: scenarios.length,
      outputs: generatedOutputs.map(output => ({
        ...output,
        model_snapshot: output.model_snapshot as unknown as ModelSnapshot,
      })),
      errors: errors.length > 0 ? errors : undefined,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
