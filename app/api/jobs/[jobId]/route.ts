import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { handleApiError } from "@/lib/api/errors";
import { env } from "@/lib/env";
import type { GetJobStatusResponse, GenerationJob } from "@/types/api";
import type { ModelSnapshot, GenerationJobStatusRow } from "@/types/database";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

/**
 * GET /api/jobs/[jobId]
 *
 * Fetches the status of a generation job.
 * RLS ensures users can only see jobs for projects in their workbenches.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(jobId)) {
      return NextResponse.json(
        { error: "Invalid job ID format" },
        { status: 400 },
      );
    }

    // Fetch job status (RLS ensures user has access via workbench membership)
    // Note: Using explicit table name since the generated types don't include
    // the new table until the migration is run and types are regenerated.
    // We use a type assertion to bypass the generated types.
    const { data: job, error: jobError } = (await supabase
      .from("generation_job_status" as never)
      .select("*")
      .eq("id", jobId)
      .single()) as { data: GenerationJobStatusRow | null; error: unknown };

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Job is already typed from the assertion above
    const typedJob = job;

    // If job is processing but seems stalled (no update in 30s), re-trigger the Edge Function
    // This handles the case where the function timed out but the queue message is still invisible
    if (typedJob.status === "processing" || typedJob.status === "pending") {
      const updatedAt = typedJob.updated_at
        ? new Date(typedJob.updated_at).getTime()
        : typedJob.created_at
          ? new Date(typedJob.created_at).getTime()
          : Date.now();
      const now = Date.now();
      const stalledThreshold = 30 * 1000; // 30 seconds

      if (now - updatedAt > stalledThreshold) {
        // Re-trigger the Edge Function (fire-and-forget)
        triggerProcessGeneration().catch((error) => {
          console.error("Error re-triggering process-generation:", error);
        });
      }
    }

    // Build the response
    const generationJob: GenerationJob = {
      id: typedJob.id,
      project_id: typedJob.project_id,
      workbench_id: typedJob.workbench_id,
      status: typedJob.status,
      total_scenarios: typedJob.total_scenarios,
      completed_scenarios: typedJob.completed_scenarios,
      failed_scenarios: typedJob.failed_scenarios,
      output_ids: typedJob.output_ids || [],
      errors: typedJob.errors || [],
      created_at: typedJob.created_at,
      started_at: typedJob.started_at,
      completed_at: typedJob.completed_at,
    };

    // If job is complete, fetch the outputs
    let outputs: GetJobStatusResponse["outputs"] = undefined;

    if (typedJob.status === "completed" || typedJob.status === "partial") {
      if (typedJob.output_ids && typedJob.output_ids.length > 0) {
        const { data: outputsData, error: outputsError } = await supabase
          .from("outputs")
          .select("id, scenario_id, output_text, generated_at, model_snapshot")
          .in("id", typedJob.output_ids);

        if (!outputsError && outputsData) {
          outputs = outputsData.map((output) => ({
            id: output.id,
            scenario_id: output.scenario_id,
            output_text: output.output_text,
            generated_at: output.generated_at,
            model_snapshot: output.model_snapshot as unknown as ModelSnapshot,
          }));
        }
      }
    }

    const response: GetJobStatusResponse = {
      success: true,
      job: generationJob,
      outputs,
    };

    return NextResponse.json(response);
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
