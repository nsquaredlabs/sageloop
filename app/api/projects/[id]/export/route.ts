import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, inArray, desc } from "drizzle-orm";
import { parseId } from "@/lib/utils";
import type { ModelConfig, ExtractionCriteria } from "@/types/database";
import { sanitizeFilename } from "@/lib/security/sanitize-utils";
import { generatePytestSuite } from "@/lib/export/pytest-template";
import { generateJestSuite } from "@/lib/export/jest-template";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json"; // 'json', 'markdown', 'pytest', or 'jest'

    // Validate format parameter
    const validFormats = ["json", "markdown", "pytest", "jest"];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${validFormats.join(", ")}` },
        { status: 400 },
      );
    }

    // Fetch project
    const project = db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .get();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch latest extraction
    const extraction = db
      .select()
      .from(schema.extractions)
      .where(eq(schema.extractions.project_id, projectId))
      .orderBy(desc(schema.extractions.created_at))
      .limit(1)
      .get();

    if (!extraction) {
      return NextResponse.json(
        { error: "No extraction found. Please analyze patterns first." },
        { status: 400 },
      );
    }

    // Fetch all scenarios for this project
    const projectScenarios = db
      .select({ id: schema.scenarios.id })
      .from(schema.scenarios)
      .where(eq(schema.scenarios.project_id, projectId))
      .all();

    const scenarioIds = projectScenarios.map((s) => s.id);

    if (scenarioIds.length === 0) {
      return NextResponse.json(
        { error: "No scenarios found for this project" },
        { status: 400 },
      );
    }

    // Fetch all outputs for these scenarios
    const allOutputs = db
      .select()
      .from(schema.outputs)
      .where(inArray(schema.outputs.scenario_id, scenarioIds))
      .all();

    const outputIds = allOutputs.map((o) => o.id);

    // Fetch all ratings for these outputs
    const allRatings =
      outputIds.length > 0
        ? db
            .select()
            .from(schema.ratings)
            .where(inArray(schema.ratings.output_id, outputIds))
            .all()
        : [];

    // Fetch all scenarios with full data for joining
    const allScenarios = db
      .select()
      .from(schema.scenarios)
      .where(inArray(schema.scenarios.id, scenarioIds))
      .all();

    // Build enriched output objects (scenario + ratings joined in memory)
    const enrichedOutputs = allOutputs
      .map((output) => {
        const outputRatings = allRatings
          .filter((r) => r.output_id === output.id)
          .map((r) => ({
            ...r,
            tags: r.tags ? JSON.parse(r.tags) : null,
            metadata: r.metadata ? JSON.parse(r.metadata) : null,
          }));
        const scenario = allScenarios.find((s) => s.id === output.scenario_id);
        return {
          ...output,
          model_snapshot: output.model_snapshot
            ? JSON.parse(output.model_snapshot)
            : null,
          ratings: outputRatings,
          scenario: scenario
            ? { id: scenario.id, input_text: scenario.input_text }
            : null,
        };
      })
      .filter((o) => o.ratings.length > 0 && o.scenario);

    const modelConfig = JSON.parse(project.model_config || "{}") as ModelConfig;
    const criteria = JSON.parse(
      extraction.criteria || "{}",
    ) as ExtractionCriteria;

    // Filter examples by star ratings in application code
    const filteredGolden = enrichedOutputs
      .filter(
        (ex: any) =>
          ex.ratings && ex.ratings.length > 0 && ex.ratings[0].stars >= 4,
      )
      .sort((a: any, b: any) => b.ratings[0].stars - a.ratings[0].stars)
      .slice(0, 10);

    const filteredNegative = enrichedOutputs
      .filter(
        (ex: any) =>
          ex.ratings && ex.ratings.length > 0 && ex.ratings[0].stars <= 2,
      )
      .sort((a: any, b: any) => a.ratings[0].stars - b.ratings[0].stars)
      .slice(0, 10);

    const safeFilename = sanitizeFilename(project.name);

    if (format === "markdown") {
      const markdown = generateMarkdownDoc(
        project,
        modelConfig,
        criteria,
        filteredGolden,
        filteredNegative,
      );

      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/markdown",
          "Content-Disposition": `attachment; filename="${safeFilename}_quality_spec.md"`,
        },
      });
    } else if (format === "pytest") {
      const exportData = {
        project: {
          name: project.name,
          model_config: {
            model: modelConfig.model || "unknown",
            system_prompt: modelConfig.system_prompt,
          },
        },
        golden_examples: filteredGolden
          .filter((ex: any) => ex.ratings && ex.ratings.length > 0)
          .map((ex: any) => ({
            input: ex.scenario.input_text,
            output: ex.output_text,
            rating: ex.ratings[0].stars,
            feedback: ex.ratings[0].feedback_text,
            tags: ex.ratings[0].tags,
          })),
        negative_examples: filteredNegative
          .filter((ex: any) => ex.ratings && ex.ratings.length > 0)
          .map((ex: any) => ({
            input: ex.scenario.input_text,
            output: ex.output_text,
            rating: ex.ratings[0].stars,
            why_failed: ex.ratings[0].feedback_text,
            suggested_fix: null,
          })),
        failure_analysis: criteria.failure_analysis || null,
        extraction: { dimensions: criteria.dimensions || null },
      };

      const pytestSuite = generatePytestSuite(exportData);

      return new NextResponse(pytestSuite, {
        headers: {
          "Content-Type": "text/x-python",
          "Content-Disposition": `attachment; filename="test_${safeFilename}.py"`,
        },
      });
    } else if (format === "jest") {
      const exportData = {
        project: {
          name: project.name,
          model_config: {
            model: modelConfig.model || "unknown",
            system_prompt: modelConfig.system_prompt,
          },
        },
        golden_examples: filteredGolden
          .filter((ex: any) => ex.ratings && ex.ratings.length > 0)
          .map((ex: any) => ({
            input: ex.scenario.input_text,
            output: ex.output_text,
            rating: ex.ratings[0].stars,
            feedback: ex.ratings[0].feedback_text,
            tags: ex.ratings[0].tags,
          })),
        negative_examples: filteredNegative
          .filter((ex: any) => ex.ratings && ex.ratings.length > 0)
          .map((ex: any) => ({
            input: ex.scenario.input_text,
            output: ex.output_text,
            rating: ex.ratings[0].stars,
            why_failed: ex.ratings[0].feedback_text,
            suggested_fix: null,
          })),
        failure_analysis: criteria.failure_analysis || null,
        extraction: { dimensions: criteria.dimensions || null },
      };

      const jestSuite = generateJestSuite(exportData);

      return new NextResponse(jestSuite, {
        headers: {
          "Content-Type": "text/javascript",
          "Content-Disposition": `attachment; filename="${safeFilename}.test.ts"`,
        },
      });
    } else {
      const testSuite = generateTestSuite(
        project,
        modelConfig,
        criteria,
        filteredGolden,
        filteredNegative,
      );

      return new NextResponse(JSON.stringify(testSuite, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${safeFilename}_test_suite.json"`,
        },
      });
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export" }, { status: 500 });
  }
}

function generateTestSuite(
  project: any,
  modelConfig: any,
  criteria: any,
  goldenExamples: any[],
  negativeExamples: any[],
) {
  return {
    project: {
      name: project.name,
      description: project.description,
      exported_at: new Date().toISOString(),
    },
    model_config: {
      model: modelConfig.model,
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
          const matchingCluster = criteria.failure_analysis.clusters.find(
            (cluster: any) =>
              cluster.example_inputs?.some(
                (input: string) =>
                  input === example.scenario.input_text ||
                  input.includes(example.scenario.input_text.substring(0, 30)),
              ),
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
  negativeExamples: any[],
) {
  const lines: string[] = [];

  lines.push(`# ${project.name} - Quality Specification`);
  lines.push("");
  lines.push(
    `**Exported**: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
  );
  lines.push("");

  if (project.description) {
    lines.push(`## Overview`);
    lines.push("");
    lines.push(project.description);
    lines.push("");
  }

  lines.push(`## Model Configuration`);
  lines.push("");
  lines.push(`- **Model**: ${modelConfig.model}`);
  lines.push("");
  if (modelConfig.system_prompt) {
    lines.push(`### System Prompt`);
    lines.push("");
    lines.push("```");
    lines.push(modelConfig.system_prompt);
    lines.push("```");
    lines.push("");
  }

  // Failure Analysis Section
  if (
    criteria.failure_analysis &&
    criteria.failure_analysis.clusters &&
    criteria.failure_analysis.clusters.length > 0
  ) {
    lines.push(`## Failure Analysis`);
    lines.push("");
    lines.push(
      `**Total Failures**: ${criteria.failure_analysis.total_failures} outputs rated ≤2 stars`,
    );
    lines.push("");

    criteria.failure_analysis.clusters.forEach(
      (cluster: any, index: number) => {
        lines.push(
          `### ${index + 1}. ${cluster.name} (${cluster.count} outputs)`,
        );
        lines.push("");
        lines.push(`**Pattern**: ${cluster.pattern}`);
        lines.push("");
        lines.push(`**Root Cause**: ${cluster.root_cause}`);
        lines.push("");
        lines.push(`**Suggested Fix**:`);
        lines.push("```");
        lines.push(cluster.suggested_fix);
        lines.push("```");
        lines.push("");
        if (cluster.example_inputs && cluster.example_inputs.length > 0) {
          lines.push(`**Example Inputs That Failed**:`);
          cluster.example_inputs.slice(0, 2).forEach((input: string) => {
            lines.push(`- "${input}"`);
          });
          lines.push("");
        }
      },
    );
  }

  if (goldenExamples.length > 0) {
    lines.push(`## Golden Examples`);
    lines.push("");
    lines.push(
      "These are high-quality outputs (4-5 stars) that exemplify the desired behavior:",
    );
    lines.push("");

    goldenExamples
      .filter((ex: any) => ex.ratings && ex.ratings.length > 0)
      .slice(0, 5)
      .forEach((example: any, index: number) => {
        const rating = example.ratings[0];
        lines.push(`### Example ${index + 1} - ${rating.stars} ⭐`);
        lines.push("");
        lines.push(`**Input**:`);
        lines.push(`> ${example.scenario.input_text}`);
        lines.push("");
        lines.push(`**Output**:`);
        lines.push("```");
        lines.push(example.output_text);
        lines.push("```");
        lines.push("");
        if (rating.feedback_text) {
          lines.push(`**Why This Works**: ${rating.feedback_text}`);
          lines.push("");
        }
        if (rating.tags && rating.tags.length > 0) {
          lines.push(`**Tags**: ${rating.tags.join(", ")}`);
          lines.push("");
        }
      });
  }

  if (negativeExamples.length > 0) {
    lines.push(`## What to Avoid`);
    lines.push("");
    lines.push(
      "These are low-quality outputs (1-2 stars) that demonstrate undesired behavior:",
    );
    lines.push("");

    negativeExamples
      .filter((ex: any) => ex.ratings && ex.ratings.length > 0)
      .slice(0, 5)
      .forEach((example: any, index: number) => {
        const rating = example.ratings[0];

        let matchingCluster = null;
        if (criteria.failure_analysis?.clusters) {
          matchingCluster = criteria.failure_analysis.clusters.find(
            (cluster: any) =>
              cluster.example_inputs?.some(
                (input: string) =>
                  input === example.scenario.input_text ||
                  input.includes(example.scenario.input_text.substring(0, 30)),
              ),
          );
        }

        lines.push(
          `### Anti-Pattern ${index + 1}${matchingCluster ? ` - ${matchingCluster.name}` : ""}`,
        );
        lines.push("");
        lines.push(`**Input**:`);
        lines.push(`> ${example.scenario.input_text}`);
        lines.push("");
        lines.push(`**Poor Output**:`);
        lines.push("```");
        lines.push(example.output_text);
        lines.push("```");
        lines.push("");
        if (rating.feedback_text) {
          lines.push(`**Why This Failed**: ${rating.feedback_text}`);
          lines.push("");
        }
        if (matchingCluster?.suggested_fix) {
          lines.push(`**Suggested Fix**:`);
          lines.push("```");
          lines.push(matchingCluster.suggested_fix);
          lines.push("```");
          lines.push("");
        }
      });
  }

  lines.push(`---`);
  lines.push("");
  lines.push(
    `*Generated by Sageloop - Behavioral design tool for AI products*`,
  );

  return lines.join("\n");
}
