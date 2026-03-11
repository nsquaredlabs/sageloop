import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, asc, inArray, sql, desc, ne } from "drizzle-orm";
import { parseId } from "@/lib/utils";
import { resolveProvider } from "@/lib/ai/provider-resolver";
import { generateCompletion } from "@/lib/ai/generation";
import { calculateSimilarity } from "@/lib/utils/string-similarity";
import { getConfig } from "@/lib/config";
import { DEFAULT_MODEL_FALLBACK } from "@/lib/ai/default-models";
import { handleApiError } from "@/lib/api/errors";
import type { ModelConfig } from "@/types/database";
import type { RetestRequest, RetestResponse } from "@/types/api";
import { retestSchema } from "@/lib/validation/schemas";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);
    const db = getDb();

    // Validate request body with Zod
    const body = await request.json();
    const validationResult = retestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { scenarioIds, newSystemPrompt, improvementNote } =
      validationResult.data;

    // Fetch project
    const project = db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .get();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const modelConfig = JSON.parse(project.model_config || "{}") as ModelConfig;
    const oldSystemPrompt = modelConfig.system_prompt || "";

    // Get current version from prompt_versions table
    const latestVersion = db
      .select({
        maxVersion: sql<number>`MAX(${schema.prompt_versions.version_number})`,
      })
      .from(schema.prompt_versions)
      .where(eq(schema.prompt_versions.project_id, projectId))
      .get();
    const currentVersion = latestVersion?.maxVersion || 1;
    const newVersion = currentVersion + 1;

    // Get API keys from config
    const config = getConfig();
    const userKeys = {
      openai: config.openai_api_key,
      anthropic: config.anthropic_api_key,
    };

    // Determine which provider and model to use
    const { provider, modelName, apiKey } = resolveProvider(
      modelConfig.model || DEFAULT_MODEL_FALLBACK,
      userKeys,
    );

    // Fetch ALL scenarios for the project
    const allScenarios = db
      .select()
      .from(schema.scenarios)
      .where(eq(schema.scenarios.project_id, projectId))
      .orderBy(asc(schema.scenarios.order))
      .all();

    if (!allScenarios || allScenarios.length === 0) {
      return NextResponse.json(
        { error: "Failed to fetch scenarios" },
        { status: 500 },
      );
    }

    // Calculate success rate before change (for failed scenarios only)
    const oldOutputs =
      scenarioIds.length > 0
        ? db
            .select()
            .from(schema.outputs)
            .where(inArray(schema.outputs.scenario_id, scenarioIds))
            .all()
        : [];

    const oldOutputIds = oldOutputs.map((o) => o.id);
    const oldRatingsRaw =
      oldOutputIds.length > 0
        ? db
            .select()
            .from(schema.ratings)
            .where(inArray(schema.ratings.output_id, oldOutputIds))
            .all()
        : [];

    const oldRatedOutputs = oldOutputs.filter((o) =>
      oldRatingsRaw.some((r) => r.output_id === o.id),
    );
    const oldSuccessCount = oldRatedOutputs.filter((o) => {
      const rating = oldRatingsRaw.find((r) => r.output_id === o.id);
      return rating && (rating.stars ?? 0) >= 4;
    }).length;
    const successRateBefore =
      oldRatedOutputs.length > 0 ? oldSuccessCount / oldRatedOutputs.length : 0;

    // Save new prompt version
    db.insert(schema.prompt_versions)
      .values({
        project_id: projectId,
        version_number: newVersion,
        system_prompt: newSystemPrompt,
        parent_version: currentVersion,
        success_rate_before: successRateBefore,
      })
      .run();

    // Update project with new prompt
    db.update(schema.projects)
      .set({
        model_config: JSON.stringify({
          ...modelConfig,
          system_prompt: newSystemPrompt,
        }),
        updated_at: new Date().toISOString(),
      })
      .where(eq(schema.projects.id, projectId))
      .run();

    const scenarios = allScenarios;

    // Generate new outputs for each scenario
    const newOutputs: Array<{
      scenario_id: number;
      output_id: number;
      input: string;
      output: string;
    }> = [];

    for (const scenario of scenarios) {
      try {
        const result = await generateCompletion({
          provider,
          model: modelName,
          systemPrompt: newSystemPrompt,
          userMessage: scenario.input_text,
          apiKey,
          variables: modelConfig.variables,
        });

        const outputText = result.text;

        // Save new output
        const output = db
          .insert(schema.outputs)
          .values({
            scenario_id: scenario.id,
            output_text: outputText,
            model_snapshot: JSON.stringify({
              model: modelName,
              system_prompt: newSystemPrompt,
              variables: modelConfig.variables,
              version: newVersion,
              ...result.usage,
            }),
          })
          .returning()
          .get();

        if (!output) {
          console.error("Failed to save output for scenario", scenario.id);
          continue;
        }

        newOutputs.push({
          scenario_id: scenario.id,
          output_id: output.id,
          input: scenario.input_text,
          output: outputText,
        });
      } catch (error) {
        console.error("Failed to generate output:", error);
        continue;
      }
    }

    // Copy ratings from previous version outputs to new outputs
    console.log(
      `Starting rating carryforward for ${newOutputs.length} outputs...`,
    );
    for (const newOutput of newOutputs) {
      // Find ALL previous outputs for this scenario (excluding the new one)
      const previousOutputs = db
        .select({
          id: schema.outputs.id,
          output_text: schema.outputs.output_text,
        })
        .from(schema.outputs)
        .where(
          inArray(
            schema.outputs.id,
            db
              .select({ id: schema.outputs.id })
              .from(schema.outputs)
              .where(eq(schema.outputs.scenario_id, newOutput.scenario_id))
              .all()
              .map((o) => o.id)
              .filter((id) => id !== newOutput.output_id),
          ),
        )
        .orderBy(desc(schema.outputs.generated_at))
        .all();

      if (!previousOutputs || previousOutputs.length === 0) {
        console.log(
          `Scenario ${newOutput.scenario_id}: No previous outputs found`,
        );
        continue;
      }

      console.log(
        `Scenario ${newOutput.scenario_id}: Found ${previousOutputs.length} previous output(s)`,
      );

      // Search through previous outputs to find one with a rating
      let previousRating: {
        stars: number | null;
        feedback_text: string | null;
        tags: string | null;
      } | null = null;
      let ratedOutput: { id: number; output_text: string } | null = null;

      for (const prevOutput of previousOutputs) {
        const ratings = db
          .select({
            stars: schema.ratings.stars,
            feedback_text: schema.ratings.feedback_text,
            tags: schema.ratings.tags,
          })
          .from(schema.ratings)
          .where(eq(schema.ratings.output_id, prevOutput.id))
          .limit(1)
          .all();

        if (ratings && ratings.length > 0) {
          previousRating = ratings[0];
          ratedOutput = prevOutput;
          console.log(
            `Scenario ${newOutput.scenario_id}: Found rating on output ID ${prevOutput.id} (${previousRating.stars} stars)`,
          );
          break;
        }
      }

      if (!previousRating || !ratedOutput) {
        console.log(
          `Scenario ${newOutput.scenario_id}: No rating found on any previous output`,
        );
        continue;
      }

      // Calculate simple text similarity
      const similarity = calculateSimilarity(
        ratedOutput.output_text,
        newOutput.output,
      );
      console.log(
        `Scenario ${newOutput.scenario_id}: Similarity score: ${similarity.toFixed(2)}`,
      );

      // Copy the rating
      db.insert(schema.ratings)
        .values({
          output_id: newOutput.output_id,
          stars: previousRating.stars ?? undefined,
          feedback_text: previousRating.feedback_text ?? undefined,
          tags: previousRating.tags ?? undefined,
          metadata: JSON.stringify({
            carried_forward: true,
            previous_output_id: ratedOutput.id,
            similarity_score: similarity,
            needs_review: similarity < 0.9,
          }),
        })
        .run();

      console.log(
        `Scenario ${newOutput.scenario_id}: Rating copied successfully`,
      );
    }
    console.log("Rating carryforward complete");

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

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error);
  }
}
