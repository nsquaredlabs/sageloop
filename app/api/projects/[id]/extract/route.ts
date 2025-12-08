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

    // Get the system prompt from project config
    const modelConfig = project.model_config as { system_prompt?: string };
    const systemPrompt = modelConfig.system_prompt || '';

    // Get the last extraction timestamp to determine which ratings are new
    const { data: lastExtraction } = await supabase
      .from('extractions')
      .select('created_at')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const lastExtractionTime = lastExtraction?.created_at || '1970-01-01T00:00:00Z';

    // Fetch outputs with ratings created AFTER the last extraction
    // This ensures each extraction analyzes only the current iteration's ratings
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
      .eq('scenario.project_id', projectId)
      .gt('ratings.created_at', lastExtractionTime);

    if (outputsError) {
      console.error('Error fetching outputs:', outputsError);
      return NextResponse.json(
        { error: 'Failed to fetch outputs' },
        { status: 500 }
      );
    }

    // Filter to only outputs that have new ratings
    const ratedOutputs = outputs.filter((output: any) =>
      output.ratings && output.ratings.length > 0
    );

    if (ratedOutputs.length === 0) {
      const errorMessage = lastExtraction
        ? 'No new ratings found since the last extraction. Please rate some outputs before running another analysis.'
        : 'No rated outputs found. Please rate at least a few outputs before analyzing patterns.';

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Prepare data for AI analysis
    const analysisData = ratedOutputs.map((output: any) => {
      const rating = output.ratings[0];
      return {
        input: output.scenario.input_text,
        output: output.output_text,
        stars: rating.stars,
        feedback: rating.feedback_text,
        tags: rating.tags,
      };
    });

    // Call OpenAI to analyze patterns
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      temperature: 0.3,
      messages: [
        {
          role: 'system',
          content: `You are an expert at analyzing AI output quality patterns. You will be given a set of rated AI outputs from the most recent iteration.

${lastExtraction ? `NOTE: This is an incremental analysis. You are analyzing only the NEW ratings since the last extraction, not all historical ratings. Focus on patterns from this specific set of ${ratedOutputs.length} outputs.` : `This is the first extraction for this project.`}

Your task is to identify patterns that distinguish good outputs (4-5 stars) from poor outputs (1-3 stars). Focus on:
1. Length patterns (word count, detail level)
2. Tone patterns (formal/casual, empathetic/clinical)
3. Structure patterns (format, organization, use of lists/paragraphs)
4. Content patterns (specificity, examples, actionability)

Provide actionable criteria that can be used to evaluate future outputs. Your summary should accurately reflect the number of outputs you're analyzing.

Return your analysis as a JSON object with this structure:
{
  "summary": "Brief overview of quality patterns identified",
  "criteria": [
    {
      "dimension": "Length/Tone/Structure/Content",
      "pattern": "Description of the pattern",
      "good_example": "Characteristic of high-rated outputs",
      "bad_example": "Characteristic of low-rated outputs",
      "importance": "high/medium/low"
    }
  ],
  "key_insights": [
    "Specific insight about what makes outputs good/bad"
  ],
  "recommendations": [
    "Actionable recommendation for improving outputs"
  ]
}`
        },
        {
          role: 'user',
          content: `Analyze these ${ratedOutputs.length} rated outputs:\n\n${JSON.stringify(analysisData, null, 2)}`
        }
      ],
      response_format: { type: 'json_object' }
    });

    const analysisResult = JSON.parse(completion.choices[0].message.content || '{}');

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

    return NextResponse.json({
      success: true,
      extraction,
      metric,
      analyzed_outputs: totalOutputs,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
