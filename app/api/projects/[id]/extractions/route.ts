import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { parseId } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);

    const db = getDb();

    // Fetch all extractions for this project
    const extractions = db
      .select()
      .from(schema.extractions)
      .where(eq(schema.extractions.project_id, projectId))
      .orderBy(desc(schema.extractions.created_at))
      .all();

    // Get scenario count for the project
    const scenarioRows = db
      .select()
      .from(schema.scenarios)
      .where(eq(schema.scenarios.project_id, projectId))
      .all();

    const scenarioCount = scenarioRows.length;

    // Format response - fetch metric for each extraction
    const formattedExtractions = extractions.map((extraction) => {
      const metric = db
        .select()
        .from(schema.metrics)
        .where(eq(schema.metrics.extraction_id, extraction.id))
        .limit(1)
        .get();

      return {
        id: extraction.id,
        created_at: extraction.created_at,
        confidence_score: extraction.confidence_score,
        success_rate: metric?.success_rate || 0,
        scenario_count: scenarioCount,
      };
    });

    return NextResponse.json({ data: formattedExtractions });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
