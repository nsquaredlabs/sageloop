import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, desc, asc } from "drizzle-orm";
import { parseId } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);
    const body = await request.json();
    const { input_text } = body;

    // Validate required fields
    if (!input_text) {
      return NextResponse.json(
        { error: "input_text is required" },
        { status: 400 },
      );
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

    const nextOrder = maxOrderRow ? maxOrderRow.order + 1 : 1;

    const data = db
      .insert(schema.scenarios)
      .values({
        project_id: projectId,
        input_text,
        order: nextOrder,
      })
      .returning()
      .get();

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);

    const db = getDb();
    const data = db
      .select()
      .from(schema.scenarios)
      .where(eq(schema.scenarios.project_id, projectId))
      .orderBy(asc(schema.scenarios.order))
      .all();

    return NextResponse.json({ data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
