import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { parseId } from "@/lib/utils";
import { resolveProvider } from "@/lib/ai/provider-resolver";
import {
  checkQuotaAvailable,
  getUsageHeaders,
} from "@/lib/api/quota-middleware";
import { getModelTier } from "@/lib/ai/model-tiers";
import { DEFAULT_MODEL_FALLBACK } from "@/lib/ai/default-models";
import { handleApiError } from "@/lib/api/errors";
import {
  validateSystemPrompt,
  validateScenarioInput,
} from "@/lib/security/prompt-validation";
import { env } from "@/lib/env";
import type { ModelConfig, UserApiKeys } from "@/types/database";
import type { EnqueueGenerationResponse } from "@/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);

    // Fetch project details (RLS ensures user has access)
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, workbench_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch workbench API keys (for Enterprise BYOK)
    const { data: apiKeys, error: keysError } = (await supabase.rpc(
      "get_workbench_api_keys",
      { workbench_uuid: project.workbench_id ?? "" },
    )) as {
      data: UserApiKeys | null;
      error: unknown;
    };

    if (keysError) {
      console.error("Error fetching API keys:", keysError);
      return NextResponse.json(
        { error: "Failed to fetch API keys" },
        { status: 500 },
      );
    }

    // Fetch all scenarios for this project
    const { data: scenarios, error: scenariosError } = await supabase
      .from("scenarios")
      .select("*")
      .eq("project_id", projectId)
      .order("order", { ascending: true });

    if (scenariosError || !scenarios || scenarios.length === 0) {
      return NextResponse.json(
        { error: "No scenarios found for this project" },
        { status: 400 },
      );
    }

    const modelConfig = project.model_config as unknown as ModelConfig;

    // Validate system prompt for injection attempts
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
          user_id: user.id,
          project_id: projectId,
          operation: "generate_outputs",
          flags: validation.flags,
        });
      }
    }

    // Validate scenario inputs for injection attempts
    const invalidScenarios = scenarios
      .map((scenario) => {
        const validation = validateScenarioInput(scenario.input_text);
        return {
          scenario_id: scenario.id,
          validation,
        };
      })
      .filter((result) => !result.validation.isValid);

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

    // Determine which provider and model to use
    const { modelName } = resolveProvider(
      modelConfig.model || DEFAULT_MODEL_FALLBACK,
      apiKeys,
    );

    // CHECK QUOTA: Ensure workbench has quota for the number of outputs to generate
    const scenarioCount = scenarios.length;

    if (!project.workbench_id) {
      return NextResponse.json(
        { error: "Project has no associated workbench" },
        { status: 500 },
      );
    }

    const subscription = await checkQuotaAvailable(
      supabase,
      project.workbench_id,
      modelName,
      scenarioCount,
    );

    const modelTier = getModelTier(modelName);

    // Enqueue the generation job instead of processing synchronously
    // Note: Using type assertion since the RPC function is defined in the migration
    // but not yet in the generated Supabase types
    const { data: jobId, error: enqueueError } = (await supabase.rpc(
      "enqueue_generation_job" as "get_workbench_subscription",
      {
        p_project_id: projectId,
        p_workbench_id: project.workbench_id,
        p_model_config: modelConfig,
        p_scenario_count: scenarioCount,
        // For Enterprise BYOK, pass the API keys; for standard tiers, null
        p_api_keys_snapshot: apiKeys ? apiKeys : null,
      } as unknown as { workbench_uuid: string },
    )) as { data: string | null; error: unknown };

    if (enqueueError || !jobId) {
      console.error("Error enqueueing generation job:", enqueueError);
      return NextResponse.json(
        { error: "Failed to start generation job" },
        { status: 500 },
      );
    }

    // Fire-and-forget: Trigger the Edge Function to process the job
    // Don't await - let it run in the background
    triggerProcessGeneration().catch((error) => {
      console.error("Error triggering process-generation:", error);
    });

    const response: EnqueueGenerationResponse = {
      success: true,
      job_id: jobId,
      status: "pending",
      total_scenarios: scenarioCount,
    };

    // Add quota usage headers to response
    const headers = getUsageHeaders(subscription, modelTier);

    return NextResponse.json(response, { headers });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Fire-and-forget trigger for the process-generation Edge Function
 */
async function triggerProcessGeneration(): Promise<void> {
  const supabaseUrl = env.supabase.url;
  const serviceRoleKey = env.supabase.serviceRoleKey;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase configuration for Edge Function trigger");
    return;
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/process-generation`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Edge Function trigger failed:", response.status, text);
    }
  } catch (error) {
    console.error("Error calling Edge Function:", error);
  }
}
