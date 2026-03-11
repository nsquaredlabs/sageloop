import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { inArray } from "drizzle-orm";
import { getJob } from "@/lib/queue/generation-queue";
import { handleApiError } from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ jobId: string }>;
}

/**
 * GET /api/jobs/[jobId]
 *
 * Fetches the status of a generation job from the in-memory queue.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { jobId } = await params;

    const job = getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // If completed, fetch outputs from DB
    let outputs;
    if (job.status === "completed") {
      const outputIds = job.results
        .filter((r) => r.outputId)
        .map((r) => r.outputId!);

      if (outputIds.length > 0) {
        const db = getDb();
        outputs = db
          .select()
          .from(schema.outputs)
          .where(inArray(schema.outputs.id, outputIds))
          .all()
          .map((o) => ({
            ...o,
            model_snapshot: o.model_snapshot
              ? JSON.parse(o.model_snapshot)
              : null,
          }));
      }
    }

    return NextResponse.json({
      success: true,
      job: {
        id: job.id,
        status: job.status,
        total_scenarios: job.progress.total,
        completed_scenarios: job.progress.completed,
        failed_scenarios: job.results.filter((r) => r.error).length,
        output_ids: job.results
          .filter((r) => r.outputId)
          .map((r) => r.outputId),
        errors: job.results
          .filter((r) => r.error)
          .map((r) => ({
            scenario_id: r.scenarioId,
            error: r.error,
          })),
        created_at: job.createdAt.toISOString(),
        completed_at: job.completedAt?.toISOString() || null,
      },
      outputs,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
