import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { parseId } from '@/lib/utils';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
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
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // 'json' or 'markdown'

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

    // Fetch latest extraction
    const { data: extraction } = await supabase
      .from('extractions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!extraction) {
      return NextResponse.json(
        { error: 'No extraction found. Please analyze patterns first.' },
        { status: 400 }
      );
    }

    // First fetch all scenarios for this project
    const { data: projectScenarios } = await supabase
      .from('scenarios')
      .select('id')
      .eq('project_id', projectId);

    const scenarioIds = projectScenarios?.map(s => s.id) || [];

    if (scenarioIds.length === 0) {
      return NextResponse.json(
        { error: 'No scenarios found for this project' },
        { status: 400 }
      );
    }

    // Fetch golden examples (high-rated outputs)
    const { data: goldenExamples } = await supabase
      .from('outputs')
      .select(`
        *,
        scenario:scenarios (
          id,
          input_text
        ),
        ratings (
          stars,
          feedback_text,
          tags
        )
      `)
      .in('scenario_id', scenarioIds)
      .not('ratings', 'is', null);

    // Fetch negative examples (low-rated outputs)
    const { data: negativeExamples } = await supabase
      .from('outputs')
      .select(`
        *,
        scenario:scenarios (
          id,
          input_text
        ),
        ratings (
          stars,
          feedback_text
        )
      `)
      .in('scenario_id', scenarioIds)
      .not('ratings', 'is', null);

    const modelConfig = project.model_config as any;
    const criteria = extraction.criteria as any;

    // Filter examples by star ratings in application code
    const filteredGolden = (goldenExamples || [])
      .filter((ex: any) => ex.ratings && ex.ratings.length > 0 && ex.ratings[0].stars >= 4)
      .sort((a: any, b: any) => b.ratings[0].stars - a.ratings[0].stars)
      .slice(0, 10);

    const filteredNegative = (negativeExamples || [])
      .filter((ex: any) => ex.ratings && ex.ratings.length > 0 && ex.ratings[0].stars <= 2)
      .sort((a: any, b: any) => a.ratings[0].stars - b.ratings[0].stars)
      .slice(0, 10); // Get more negative examples for analysis

    if (format === 'markdown') {
      // Generate Markdown documentation
      const markdown = generateMarkdownDoc(
        project,
        modelConfig,
        criteria,
        filteredGolden,
        filteredNegative
      );

      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '_')}_quality_spec.md"`,
        },
      });
    } else {
      // Generate JSON test suite
      const testSuite = generateTestSuite(
        project,
        modelConfig,
        criteria,
        filteredGolden,
        filteredNegative
      );

      return new NextResponse(JSON.stringify(testSuite, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-z0-9]/gi, '_')}_test_suite.json"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export' },
      { status: 500 }
    );
  }
}

function generateTestSuite(
  project: any,
  modelConfig: any,
  criteria: any,
  goldenExamples: any[],
  negativeExamples: any[]
) {
  return {
    project: {
      name: project.name,
      description: project.description,
      exported_at: new Date().toISOString(),
    },
    model_config: {
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      system_prompt: modelConfig.system_prompt,
    },
    golden_examples: goldenExamples
      .filter((ex: any) => ex.ratings && ex.ratings.length > 0)
      .map((example: any) => ({
        input: example.scenario.input_text,
        output: example.output_text,
        rating: example.ratings[0].stars,
        feedback: example.ratings[0].feedback_text,
        tags: example.ratings[0].tags,
      })),
    negative_examples: negativeExamples
      .filter((ex: any) => ex.ratings && ex.ratings.length > 0)
      .map((example: any) => {
        // Try to match this failure to a cluster for suggested fix
        let suggestedFix = null;
        let clusterName = null;

        if (criteria.failure_analysis?.clusters) {
          // Find cluster that includes this input
          const matchingCluster = criteria.failure_analysis.clusters.find((cluster: any) =>
            cluster.example_inputs?.some((input: string) =>
              input === example.scenario.input_text ||
              input.includes(example.scenario.input_text.substring(0, 30))
            )
          );

          if (matchingCluster) {
            suggestedFix = matchingCluster.suggested_fix;
            clusterName = matchingCluster.name;
          }
        }

        return {
          input: example.scenario.input_text,
          output: example.output_text,
          rating: example.ratings[0].stars,
          why_failed: example.ratings[0].feedback_text,
          suggested_fix: suggestedFix,
          failure_cluster: clusterName,
        };
      }),
    failure_analysis: criteria.failure_analysis || null,
  };
}

function generateMarkdownDoc(
  project: any,
  modelConfig: any,
  criteria: any,
  goldenExamples: any[],
  negativeExamples: any[]
) {
  const lines: string[] = [];

  lines.push(`# ${project.name} - Quality Specification`);
  lines.push('');
  lines.push(`**Exported**: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`);
  lines.push('');

  if (project.description) {
    lines.push(`## Overview`);
    lines.push('');
    lines.push(project.description);
    lines.push('');
  }

  lines.push(`## Model Configuration`);
  lines.push('');
  lines.push(`- **Model**: ${modelConfig.model}`);
  lines.push(`- **Temperature**: ${modelConfig.temperature}`);
  lines.push('');
  if (modelConfig.system_prompt) {
    lines.push(`### System Prompt`);
    lines.push('');
    lines.push('```');
    lines.push(modelConfig.system_prompt);
    lines.push('```');
    lines.push('');
  }

  // Failure Analysis Section (replaces generic quality criteria)
  if (criteria.failure_analysis && criteria.failure_analysis.clusters && criteria.failure_analysis.clusters.length > 0) {
    lines.push(`## Failure Analysis`);
    lines.push('');
    lines.push(`**Total Failures**: ${criteria.failure_analysis.total_failures} outputs rated ≤2 stars`);
    lines.push('');

    criteria.failure_analysis.clusters.forEach((cluster: any, index: number) => {
      lines.push(`### ${index + 1}. ${cluster.name} (${cluster.count} outputs)`);
      lines.push('');
      lines.push(`**Pattern**: ${cluster.pattern}`);
      lines.push('');
      lines.push(`**Root Cause**: ${cluster.root_cause}`);
      lines.push('');
      lines.push(`**Suggested Fix**:`);
      lines.push('```');
      lines.push(cluster.suggested_fix);
      lines.push('```');
      lines.push('');
      if (cluster.example_inputs && cluster.example_inputs.length > 0) {
        lines.push(`**Example Inputs That Failed**:`);
        cluster.example_inputs.slice(0, 2).forEach((input: string) => {
          lines.push(`- "${input}"`);
        });
        lines.push('');
      }
    });
  }

  if (goldenExamples.length > 0) {
    lines.push(`## Golden Examples`);
    lines.push('');
    lines.push('These are high-quality outputs (4-5 stars) that exemplify the desired behavior:');
    lines.push('');

    goldenExamples
      .filter((ex: any) => ex.ratings && ex.ratings.length > 0)
      .slice(0, 5)
      .forEach((example: any, index: number) => {
        const rating = example.ratings[0];
        lines.push(`### Example ${index + 1} - ${rating.stars} ⭐`);
        lines.push('');
        lines.push(`**Input**:`);
        lines.push(`> ${example.scenario.input_text}`);
        lines.push('');
        lines.push(`**Output**:`);
        lines.push('```');
        lines.push(example.output_text);
        lines.push('```');
        lines.push('');
        if (rating.feedback_text) {
          lines.push(`**Why This Works**: ${rating.feedback_text}`);
          lines.push('');
        }
        if (rating.tags && rating.tags.length > 0) {
          lines.push(`**Tags**: ${rating.tags.join(', ')}`);
          lines.push('');
        }
      });
  }

  if (negativeExamples.length > 0) {
    lines.push(`## What to Avoid`);
    lines.push('');
    lines.push('These are low-quality outputs (1-2 stars) that demonstrate undesired behavior:');
    lines.push('');

    negativeExamples
      .filter((ex: any) => ex.ratings && ex.ratings.length > 0)
      .slice(0, 5)
      .forEach((example: any, index: number) => {
        const rating = example.ratings[0];

        // Find matching cluster for this example
        let matchingCluster = null;
        if (criteria.failure_analysis?.clusters) {
          matchingCluster = criteria.failure_analysis.clusters.find((cluster: any) =>
            cluster.example_inputs?.some((input: string) =>
              input === example.scenario.input_text ||
              input.includes(example.scenario.input_text.substring(0, 30))
            )
          );
        }

        lines.push(`### Anti-Pattern ${index + 1}${matchingCluster ? ` - ${matchingCluster.name}` : ''}`);
        lines.push('');
        lines.push(`**Input**:`);
        lines.push(`> ${example.scenario.input_text}`);
        lines.push('');
        lines.push(`**Poor Output**:`);
        lines.push('```');
        lines.push(example.output_text);
        lines.push('```');
        lines.push('');
        if (rating.feedback_text) {
          lines.push(`**Why This Failed**: ${rating.feedback_text}`);
          lines.push('');
        }
        if (matchingCluster?.suggested_fix) {
          lines.push(`**Suggested Fix**:`);
          lines.push('```');
          lines.push(matchingCluster.suggested_fix);
          lines.push('```');
          lines.push('');
        }
      });
  }

  lines.push(`---`);
  lines.push('');
  lines.push(`*Generated by Tellah - Behavioral design tool for AI products*`);

  return lines.join('\n');
}
