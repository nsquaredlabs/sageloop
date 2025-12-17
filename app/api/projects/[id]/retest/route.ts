import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseId } from '@/lib/utils';
import { resolveProvider } from '@/lib/ai/provider-resolver';
import { generateCompletion } from '@/lib/ai/generation';
import { calculateSimilarity } from '@/lib/utils/string-similarity';
import { checkQuotaAvailable, incrementUsage, getUsageHeaders } from '@/lib/api/quota-middleware';
import { getModelTier } from '@/lib/ai/model-tiers';
import { handleApiError } from '@/lib/api/errors';
import type { ModelConfig, UserApiKeys } from '@/types/database';
import type { RetestRequest, RetestResponse } from '@/types/api';
import { retestSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

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

    // Validate request body with Zod
    const body = await request.json();
    const validationResult = retestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const { scenarioIds, newSystemPrompt, improvementNote } = validationResult.data;

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

    const modelConfig = project.model_config as unknown as ModelConfig;
    const oldSystemPrompt = modelConfig.system_prompt || '';
    const currentVersion = project.prompt_version || 1;
    const newVersion = currentVersion + 1;

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

    // Determine which provider and model to use
    const { provider, modelName, apiKey } = resolveProvider(
      modelConfig.model || 'gpt-3.5-turbo',
      apiKeys
    );

    // Fetch ALL scenarios for the project first to check quota
    const { data: allScenarios, error: allScenariosError } = await supabase
      .from('scenarios')
      .select('*')
      .eq('project_id', projectId)
      .order('order', { ascending: true });

    if (allScenariosError || !allScenarios) {
      return NextResponse.json(
        { error: 'Failed to fetch scenarios' },
        { status: 500 }
      );
    }

    // CHECK QUOTA: Ensure workbench has quota for all scenarios
    if (!project.workbench_id) {
      return NextResponse.json(
        { error: 'Project has no associated workbench' },
        { status: 500 }
      );
    }

    const subscription = await checkQuotaAvailable(
      supabase,
      project.workbench_id,
      modelName,
      allScenarios.length
    );

    const modelTier = getModelTier(modelName);

    // Calculate success rate before change (for failed scenarios only)
    const { data: oldOutputs } = await supabase
      .from('outputs')
      .select(`
        *,
        ratings (
          stars
        )
      `)
      .in('scenario_id', scenarioIds);

    const oldRatedOutputs = (oldOutputs || []).filter(
      (o: any) => o.ratings && o.ratings.length > 0
    );
    const oldSuccessCount = oldRatedOutputs.filter(
      (o: any) => o.ratings[0].stars >= 4
    ).length;
    const successRateBefore = oldRatedOutputs.length > 0
      ? oldSuccessCount / oldRatedOutputs.length
      : 0;

    // Save new prompt iteration
    const { error: iterationError } = await supabase
      .from('prompt_iterations')
      .insert({
        project_id: projectId,
        version: newVersion,
        system_prompt: newSystemPrompt,
        parent_version: currentVersion,
        improvement_note: improvementNote || null,
        success_rate_before: successRateBefore,
      });

    if (iterationError) {
      console.error('Failed to save iteration:', iterationError);
      return NextResponse.json(
        { error: 'Failed to save prompt iteration' },
        { status: 500 }
      );
    }

    // Update project with new prompt and version
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        model_config: {
          ...modelConfig,
          system_prompt: newSystemPrompt,
        },
        prompt_version: newVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updateError) {
      console.error('Failed to update project:', updateError);
      return NextResponse.json(
        { error: 'Failed to update project' },
        { status: 500 }
      );
    }

    // Use scenarios already fetched for quota check
    const scenarios = allScenarios;

    // Generate new outputs for each scenario
    const newOutputs = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    for (const scenario of scenarios) {
      try {
        // Generate completion using unified service
        const result = await generateCompletion({
          provider,
          model: modelName,
          temperature: modelConfig.temperature ?? 0.7,
          systemPrompt: newSystemPrompt,
          userMessage: scenario.input_text,
          apiKey,
          variables: modelConfig.variables,
        });

        const outputText = result.text;
        const usage = result.usage;

        // Track token usage for quota increment
        if (usage.inputTokens) {
          totalInputTokens += usage.inputTokens;
        }
        if (usage.outputTokens) {
          totalOutputTokens += usage.outputTokens;
        }

        // Save new output
        const { data: output, error: outputError } = await supabase
          .from('outputs')
          .insert({
            scenario_id: scenario.id,
            output_text: outputText,
            model_snapshot: {
              model: modelName,
              temperature: modelConfig.temperature ?? 0.7,
              system_prompt: newSystemPrompt,
              variables: modelConfig.variables,
              version: newVersion,
              ...usage,
            },
          })
          .select()
          .single();

        if (outputError) {
          console.error('Failed to save output:', outputError);
          continue;
        }

        newOutputs.push({
          scenario_id: scenario.id,
          output_id: output.id,
          input: scenario.input_text,
          output: outputText,
        });
      } catch (error) {
        console.error('Failed to generate output:', error);
        continue;
      }
    }

    // Copy ratings from previous version outputs to new outputs
    // This saves the user from re-rating unchanged outputs
    console.log(`Starting rating carryforward for ${newOutputs.length} outputs...`);
    for (const newOutput of newOutputs) {
      // Step 1: Find ALL previous outputs for this scenario (excluding the new one)
      // We need to search through all of them to find one with a rating
      const { data: previousOutputs, error: previousError } = await supabase
        .from('outputs')
        .select('id, output_text')
        .eq('scenario_id', newOutput.scenario_id)
        .neq('id', newOutput.output_id)
        .order('generated_at', { ascending: false });

      if (previousError) {
        console.error(`Error fetching previous outputs for scenario ${newOutput.scenario_id}:`, previousError);
        continue;
      }

      if (!previousOutputs || previousOutputs.length === 0) {
        console.log(`Scenario ${newOutput.scenario_id}: No previous outputs found`);
        continue;
      }

      console.log(`Scenario ${newOutput.scenario_id}: Found ${previousOutputs.length} previous output(s)`);

      // Step 2: Search through previous outputs to find one with a rating
      let previousRating = null;
      let ratedOutput = null;

      for (const prevOutput of previousOutputs) {
        const { data: ratings, error: ratingError } = await supabase
          .from('ratings')
          .select('stars, feedback_text, tags')
          .eq('output_id', prevOutput.id)
          .limit(1);

        if (ratingError) {
          console.error(`Error fetching rating for output ${prevOutput.id}:`, ratingError);
          continue;
        }

        if (ratings && ratings.length > 0) {
          previousRating = ratings[0];
          ratedOutput = prevOutput;
          console.log(`Scenario ${newOutput.scenario_id}: Found rating on output ID ${prevOutput.id} (${previousRating.stars} stars)`);
          break;
        }
      }

      if (!previousRating || !ratedOutput) {
        console.log(`Scenario ${newOutput.scenario_id}: No rating found on any previous output`);
        continue;
      }

      // Calculate simple text similarity
      const similarity = calculateSimilarity(ratedOutput.output_text, newOutput.output);
      console.log(`Scenario ${newOutput.scenario_id}: Similarity score: ${similarity.toFixed(2)}`);

      // Copy the rating
      const { error: insertError } = await supabase
        .from('ratings')
        .insert({
          output_id: newOutput.output_id,
          stars: previousRating.stars,
          feedback_text: previousRating.feedback_text || null,
          tags: previousRating.tags || null,
          metadata: {
            carried_forward: true,
            previous_output_id: ratedOutput.id,
            similarity_score: similarity,
            needs_review: similarity < 0.9,
          }
        });

      if (insertError) {
        console.error(`Error inserting rating for output ${newOutput.output_id}:`, insertError);
      } else {
        console.log(`Scenario ${newOutput.scenario_id}: Rating copied successfully`);
      }
    }
    console.log('Rating carryforward complete');

    // INCREMENT USAGE: Track successful generation in quota system
    if (newOutputs.length > 0) {
      await incrementUsage(
        supabase,
        project.workbench_id,
        modelName,
        newOutputs.length,
        totalInputTokens,
        totalOutputTokens,
        projectId
      );
    }

    const response: RetestResponse = {
      success: true,
      version: newVersion,
      outputs: newOutputs,
      scenarios_retested: scenarios.length,
      prompt_diff: {
        old: oldSystemPrompt,
        new: newSystemPrompt,
      },
    };

    // Add quota usage headers to response
    const headers = getUsageHeaders(subscription, modelTier);

    return NextResponse.json(response, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}
