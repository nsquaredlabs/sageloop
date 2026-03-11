import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { parseId } from "@/lib/utils";
import { handleApiError, NotFoundError } from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ id: string; scenarioId: string }>;
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id: projectIdString, scenarioId: scenarioIdString } = await params;
    const projectId = parseId(projectIdString);
    const scenarioId = parseId(scenarioIdString);

    const db = getDb();

    // Verify the scenario exists and belongs to this project
    const scenario = db
      .select()
      .from(schema.scenarios)
      .where(
        and(
          eq(schema.scenarios.id, scenarioId),
          eq(schema.scenarios.project_id, projectId),
        ),
      )
      .get();

    if (!scenario) {
      throw new NotFoundError("Scenario not found");
    }

    // Delete the scenario
    db.delete(schema.scenarios)
      .where(eq(schema.scenarios.id, scenarioId))
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
