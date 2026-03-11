import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { parseId } from "@/lib/utils";
import { resolveProvider } from "@/lib/ai/provider-resolver";
import { generateCompletion } from "@/lib/ai/generation";
import { getConfig } from "@/lib/config";
import { DEFAULT_MODEL_FALLBACK } from "@/lib/ai/default-models";
import {
  validateSystemPrompt,
  validateScenarioInput,
} from "@/lib/security/prompt-validation";
import {
  createJob,
  enqueue,
  addJobResult,
  updateJob,
} from "@/lib/queue/generation-queue";
import type { ModelConfig } from "@/types/database";
import { randomUUID } from "crypto";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);
    const db = getDb();

    // Fetch project
    const project = db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .get();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch scenarios
    const scenarios = db
      .select()
      .from(schema.scenarios)
      .where(eq(schema.scenarios.project_id, projectId))
      .orderBy(asc(schema.scenarios.order))
      .all();
    if (!scenarios || scenarios.length === 0) {
      return NextResponse.json(
        { error: "No scenarios found for this project" },
        { status: 400 },
      );
    }

    const modelConfig = JSON.parse(project.model_config || "{}") as ModelConfig;

    // Validate system prompt
    if (modelConfig.system_prompt) {
      const validation = validateSystemPrompt(modelConfig.system_prompt);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: "System prompt failed security validation",
            details: validation.flags,
            risk: validation.risk,
          },
          { status: 400 },
        );
      }
      if (validation.risk === "medium") {
        console.warn("[SECURITY] Medium-risk prompt detected:", {
          project_id: projectId,
          operation: "generate_outputs",
          flags: validation.flags,
        });
      }
    }

    // Validate scenario inputs
    const invalidScenarios = scenarios
      .map((s) => ({
        scenario_id: s.id,
        validation: validateScenarioInput(s.input_text),
      }))
      .filter((r) => !r.validation.isValid);
    if (invalidScenarios.length > 0) {
      return NextResponse.json(
        {
          error: "One or more scenario inputs failed security validation",
          invalid_scenarios: invalidScenarios.map((s) => ({
            scenario_id: s.scenario_id,
            flags: s.validation.flags,
            risk: s.validation.risk,
          })),
        },
        { status: 400 },
      );
    }

    // Get API keys from config
    const config = getConfig();
    const userKeys = {
      openai: config.openai_api_key,
      anthropic: config.anthropic_api_key,
    };
    const { provider, modelName, apiKey } = resolveProvider(
      modelConfig.model || DEFAULT_MODEL_FALLBACK,
      userKeys,
    );

    // Create job and enqueue generation
    const jobId = randomUUID();
    createJob(jobId, scenarios.length);

    // Enqueue each scenario for processing
    for (const scenario of scenarios) {
      enqueue(async () => {
        try {
          updateJob(jobId, { status: "processing" });
          const result = await generateCompletion({
            provider,
            model: modelName,
            systemPrompt: modelConfig.system_prompt,
            userMessage: scenario.input_text,
            apiKey,
            variables: modelConfig.variables,
          });

          // Save output to DB
          const output = db
            .insert(schema.outputs)
            .values({
              scenario_id: scenario.id,
              output_text: result.text,
              model_snapshot: JSON.stringify({
                model: modelName,
                system_prompt: modelConfig.system_prompt,
                variables: modelConfig.variables,
                ...result.usage,
              }),
            })
            .returning()
            .get();

          addJobResult(jobId, { scenarioId: scenario.id, outputId: output.id });
        } catch (error) {
          const errMsg = error instanceof Error ? error.message : String(error);
          addJobResult(jobId, { scenarioId: scenario.id, error: errMsg });
        }
      });
    }

    return NextResponse.json({
      success: true,
      job_id: jobId,
      status: "pending",
      total_scenarios: scenarios.length,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
