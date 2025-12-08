import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseId } from '@/lib/utils';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
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

    const modelConfig = project.model_config as {
      model?: string;
      temperature?: number;
      system_prompt?: string;
    };

    // Generate outputs for each scenario
    const generatedOutputs = [];
    const errors = [];

    for (const scenario of scenarios) {
      try {
        const completion = await openai.chat.completions.create({
          model: modelConfig.model || 'gpt-4',
          temperature: modelConfig.temperature ?? 0.7,
          messages: [
            ...(modelConfig.system_prompt
              ? [{ role: 'system' as const, content: modelConfig.system_prompt }]
              : []),
            { role: 'user' as const, content: scenario.input_text },
          ],
        });

        const outputText = completion.choices[0]?.message?.content || '';

        // Save output to database
        const { data: output, error: outputError } = await supabase
          .from('outputs')
          .insert({
            scenario_id: scenario.id,
            output_text: outputText,
            model_snapshot: {
              model: modelConfig.model || 'gpt-4',
              temperature: modelConfig.temperature ?? 0.7,
              system_prompt: modelConfig.system_prompt,
              completion_tokens: completion.usage?.completion_tokens,
              prompt_tokens: completion.usage?.prompt_tokens,
              total_tokens: completion.usage?.total_tokens,
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

    return NextResponse.json({
      success: true,
      generated: generatedOutputs.length,
      total: scenarios.length,
      outputs: generatedOutputs,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
