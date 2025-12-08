import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseId } from '@/lib/utils';
import { createOpenAIClient } from '@/lib/openai';
import { createAnthropicClient } from '@/lib/anthropic';

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
        data: { openai?: string; anthropic?: string } | null;
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

    const modelConfig = project.model_config as {
      model?: string;
      temperature?: number;
      system_prompt?: string;
    };

    // Determine which provider and model to use
    let modelName = modelConfig.model || 'gpt-3.5-turbo';
    let isClaudeModel = modelName.includes('claude');
    let provider: 'openai' | 'anthropic' = isClaudeModel ? 'anthropic' : 'openai';
    let usingFallback = false;

    // Check if user has configured their own API keys
    const hasUserKeys = apiKeys?.openai || apiKeys?.anthropic;

    if (!hasUserKeys) {
      // No user keys - use system keys with inexpensive model
      console.log('No user API keys configured, using system fallback');

      // Use GPT-3.5 Turbo as the fallback (cheapest OpenAI model)
      modelName = 'gpt-3.5-turbo';
      provider = 'openai';
      isClaudeModel = false;
      usingFallback = true;
    } else if (!apiKeys[provider]) {
      // User has keys but not for the requested provider
      // Fall back to whichever provider they have configured with an inexpensive model
      if (apiKeys.openai) {
        console.log(`User requested ${provider} but only has OpenAI key, falling back to GPT-3.5 Turbo`);
        modelName = 'gpt-3.5-turbo';
        provider = 'openai';
        isClaudeModel = false;
        usingFallback = true;
      } else if (apiKeys.anthropic) {
        console.log(`User requested ${provider} but only has Anthropic key, falling back to Claude Haiku`);
        modelName = 'claude-haiku-4-5-20251001';
        provider = 'anthropic';
        isClaudeModel = true;
        usingFallback = true;
      }
    }

    // Get the appropriate API key (user's or system's)
    const apiKey = usingFallback ? undefined : (apiKeys?.[provider] ?? undefined);

    // Generate outputs for each scenario
    const generatedOutputs = [];
    const errors = [];

    for (const scenario of scenarios) {
      try {
        let outputText = '';
        let usage = {};

        if (provider === 'openai') {
          const openai = createOpenAIClient(apiKey);
          const completion = await openai.chat.completions.create({
            model: modelName,
            temperature: modelConfig.temperature ?? 0.7,
            messages: [
              ...(modelConfig.system_prompt
                ? [{ role: 'system' as const, content: modelConfig.system_prompt }]
                : []),
              { role: 'user' as const, content: scenario.input_text },
            ],
          });

          outputText = completion.choices[0]?.message?.content || '';
          usage = {
            completion_tokens: completion.usage?.completion_tokens,
            prompt_tokens: completion.usage?.prompt_tokens,
            total_tokens: completion.usage?.total_tokens,
          };
        } else {
          const anthropic = createAnthropicClient(apiKey);
          const message = await anthropic.messages.create({
            model: modelName,
            max_tokens: 4096,
            temperature: modelConfig.temperature ?? 0.7,
            system: modelConfig.system_prompt,
            messages: [
              { role: 'user', content: scenario.input_text },
            ],
          });

          outputText = message.content[0]?.type === 'text' ? message.content[0].text : '';
          usage = {
            input_tokens: message.usage.input_tokens,
            output_tokens: message.usage.output_tokens,
          };
        }

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
