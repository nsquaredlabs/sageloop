import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseId } from '@/lib/utils';
import { generateCompletion } from '@/lib/ai/generation';
import type { ModelConfig, ExtractionCriteria } from '@/types/database';
import type { ExtractResponse } from '@/types/api';

// Configuration for pattern extraction model
// This is kept separate from user's configured model to ensure consistent, high-quality analysis
const EXTRACTION_MODEL_CONFIG = {
  model: 'gpt-4-turbo' as const,
  temperature: 0.3,
  // Future: could make this configurable to support other providers (Anthropic, etc.)
  provider: 'openai' as const,
};

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

    // Get the system prompt from project config
    const modelConfig = project.model_config as unknown as ModelConfig;
    const systemPrompt = modelConfig.system_prompt || '';

    // Get the current prompt version
    const currentVersion = project.prompt_version || 1;

    // Fetch ALL rated outputs for the current prompt version
    // This ensures we analyze the complete picture of the current prompt's performance
    // IMPORTANT: Use two-step query pattern to avoid PostgREST nested filter limitation

    // Step 1: Get scenario IDs for this project
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('id')
      .eq('project_id', projectId);

    if (scenariosError) {
      console.error('Error fetching scenarios:', scenariosError);
      return NextResponse.json(
        { error: 'Failed to fetch scenarios' },
        { status: 500 }
      );
    }

    const scenarioIds = scenarios?.map(s => s.id) || [];

    if (scenarioIds.length === 0) {
      return NextResponse.json(
        { error: 'No scenarios found for this project. Please add scenarios first.' },
        { status: 400 }
      );
    }

    // Step 2: Query outputs using scenario IDs
    // Note: We filter by version OR null to handle outputs created before versioning was added
    const { data: outputs, error: outputsError } = await supabase
      .from('outputs')
      .select(`
        *,
        ratings!inner (
          id,
          stars,
          feedback_text,
          tags,
          created_at
        ),
        scenario:scenarios (
          id,
          input_text
        )
      `)
      .in('scenario_id', scenarioIds)
      .or(`model_snapshot->>version.eq.${currentVersion},model_snapshot->>version.is.null`);

    if (outputsError) {
      console.error('Error fetching outputs:', outputsError);
      return NextResponse.json(
        { error: 'Failed to fetch outputs' },
        { status: 500 }
      );
    }

    // Filter to only outputs that have ratings
    const outputsWithRatings = outputs.filter((output: any) =>
      output.ratings && output.ratings.length > 0
    );

    if (outputsWithRatings.length === 0) {
      return NextResponse.json(
        { error: 'No rated outputs found for the current prompt version. Please rate some outputs before analyzing patterns.' },
        { status: 400 }
      );
    }

    // Deduplicate to get only the most recent output per scenario
    // This ensures we analyze each scenario once with its latest result
    const scenarioToLatestOutput = new Map<number, any>();

    outputsWithRatings.forEach((output: any) => {
      const scenarioId = output.scenario_id;
      const existingOutput = scenarioToLatestOutput.get(scenarioId);

      // Keep the output with the most recent generated_at timestamp
      if (!existingOutput || new Date(output.generated_at) > new Date(existingOutput.generated_at)) {
        scenarioToLatestOutput.set(scenarioId, output);
      }
    });

    const ratedOutputs = Array.from(scenarioToLatestOutput.values());

    // Prepare data for AI analysis with scenario IDs
    const analysisData = ratedOutputs.map((output: any) => {
      const rating = output.ratings[0];
      return {
        scenario_id: output.scenario.id,
        input: output.scenario.input_text,
        output: output.output_text,
        stars: rating.stars,
        feedback: rating.feedback_text,
        tags: rating.tags,
      };
    });

    // Prepare failure data for clustering analysis
    const failures = analysisData.filter((d: any) => d.stars <= 2);
    const successes = analysisData.filter((d: any) => d.stars >= 4);

    // Call OpenAI to analyze patterns with focus on failure clustering
    // Note: Pattern extraction uses system API key (not user's) to ensure consistent analysis
    const result = await generateCompletion({
      provider: EXTRACTION_MODEL_CONFIG.provider,
      model: EXTRACTION_MODEL_CONFIG.model,
      temperature: EXTRACTION_MODEL_CONFIG.temperature,
      systemPrompt: `You are an expert at analyzing AI output quality patterns and diagnosing failures.

NOTE: You are analyzing ALL ${ratedOutputs.length} rated outputs for the current prompt version. This gives you a complete picture of the prompt's overall performance.

CRITICAL: Your primary job is FAILURE ANALYSIS - identifying concrete, fixable problems:

1. **Cluster Similar Failures**: Group outputs that failed for the SAME underlying reason
2. **Root Cause Analysis**: For each cluster, identify WHY it failed (missing context, wrong format, hallucination, etc.)
3. **Concrete Fixes**: Provide specific, copy-pasteable fixes to the system prompt
4. **Example Inputs**: Show which inputs triggered each failure pattern

Secondary: Note what makes successful outputs work well.

Return your analysis as a JSON object with this structure:
{
  "summary": "Brief overview focusing on main failure patterns and fixes",
  "failure_analysis": {
    "total_failures": ${failures.length},
    "total_successes": ${successes.length},
    "clusters": [
      {
        "name": "short_descriptive_name",
        "count": 3,
        "pattern": "Clear description of what went wrong",
        "root_cause": "Why this failure occurred (missing context, bad instruction, etc.)",
        "suggested_fix": "Concrete fix to add/modify in system prompt. Be specific - show exact text to add.",
        "example_inputs": ["First input that failed this way", "Second input..."],
        "scenario_ids": [1, 2, 3],
        "severity": "high/medium/low"
      }
    ]
  },
  "success_patterns": [
    "What made highly-rated outputs work well (be specific, not generic)"
  ]
}

IMPORTANT: For each cluster, include the scenario_ids array with the IDs of all inputs that belong to this failure cluster. Look at the scenario_id field in the data.`,
      userMessage: `System prompt being tested:
"""
${systemPrompt}
"""

Analyze these ${ratedOutputs.length} rated outputs (${failures.length} failures, ${successes.length} successes):

${JSON.stringify(analysisData, null, 2)}

Focus on clustering failures and providing concrete fixes.`,
      apiKey: undefined, // Use system key from env
    });

    const analysisResult = JSON.parse(result.text || '{}');

    // Calculate confidence score based on number of ratings
    const confidenceScore = Math.min(0.9, ratedOutputs.length / 20);

    // Save extraction to database with snapshots
    const { data: extraction, error: extractionError } = await supabase
      .from('extractions')
      .insert({
        project_id: projectId,
        criteria: analysisResult,
        confidence_score: confidenceScore,
        rated_output_count: ratedOutputs.length,
        system_prompt_snapshot: systemPrompt,
      })
      .select()
      .single();

    if (extractionError) {
      console.error('Supabase error:', extractionError);
      return NextResponse.json(
        { error: 'Failed to save extraction' },
        { status: 500 }
      );
    }

    // Calculate and save metrics
    const totalOutputs = ratedOutputs.length;
    const successfulOutputs = ratedOutputs.filter((o: any) => o.ratings[0].stars >= 4).length;
    const successRate = totalOutputs > 0 ? successfulOutputs / totalOutputs : 0;

    // Calculate breakdown by criteria
    const criteriaBreakdown = analysisResult.criteria?.reduce((acc: any, criterion: any) => {
      acc[criterion.dimension] = criterion.importance;
      return acc;
    }, {});

    const { data: metric, error: metricError } = await supabase
      .from('metrics')
      .insert({
        project_id: projectId,
        extraction_id: extraction.id,
        success_rate: successRate,
        criteria_breakdown: criteriaBreakdown || {},
      })
      .select()
      .single();

    if (metricError) {
      console.error('Metric error:', metricError);
    }

    const response: ExtractResponse = {
      success: true,
      extraction: {
        ...extraction,
        criteria: extraction.criteria as unknown as ExtractionCriteria,
      },
      metric: metric ? {
        ...metric,
        criteria_breakdown: metric.criteria_breakdown as unknown as Record<string, string> | null,
      } : null,
      analyzed_outputs: totalOutputs,
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
