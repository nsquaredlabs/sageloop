import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { parseId } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface BulkScenarioInput {
  input_text: string;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);
    const body = await request.json();
    const { scenarios } = body;

    // Validate required fields
    if (!scenarios || !Array.isArray(scenarios)) {
      return NextResponse.json(
        { error: "scenarios array is required" },
        { status: 400 },
      );
    }

    if (scenarios.length === 0) {
      return NextResponse.json(
        { error: "At least one scenario is required" },
        { status: 400 },
      );
    }

    // Validate each scenario
    for (let i = 0; i < scenarios.length; i++) {
      const scenario = scenarios[i];
      if (!scenario.input_text || typeof scenario.input_text !== "string") {
        return NextResponse.json(
          {
            error: `Scenario at index ${i} is missing or has invalid input_text`,
          },
          { status: 400 },
        );
      }
      if (scenario.input_text.trim().length === 0) {
        return NextResponse.json(
          { error: `Scenario at index ${i} has empty input_text` },
          { status: 400 },
        );
      }
    }

    const db = getDb();

    // Get the current max order for this project
    const maxOrderRow = db
      .select()
      .from(schema.scenarios)
      .where(eq(schema.scenarios.project_id, projectId))
      .orderBy(desc(schema.scenarios.order))
      .limit(1)
      .get();

    let nextOrder = maxOrderRow ? maxOrderRow.order + 1 : 1;

    // Prepare bulk insert data
    const scenariosToInsert = scenarios.map((scenario: BulkScenarioInput) => ({
      project_id: projectId,
      input_text: scenario.input_text.trim(),
      order: nextOrder++,
    }));

    // Insert all scenarios at once
    const data = db
      .insert(schema.scenarios)
      .values(scenariosToInsert)
      .returning()
      .all();

    return NextResponse.json(
      {
        data,
        count: data.length,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
