import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { parseId } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ outputId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { outputId: outputIdString } = await params;
    const outputId = parseId(outputIdString);
    const body = await request.json();
    const { stars, feedback_text, tags } = body;

    // Validate required fields
    if (!stars || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: "Valid star rating (1-5) is required" },
        { status: 400 },
      );
    }

    const db = getDb();

    // Check if output exists
    const output = db
      .select()
      .from(schema.outputs)
      .where(eq(schema.outputs.id, outputId))
      .get();

    if (!output) {
      return NextResponse.json({ error: "Output not found" }, { status: 404 });
    }

    // Insert rating into database
    const data = db
      .insert(schema.ratings)
      .values({
        output_id: outputId,
        stars,
        feedback_text: feedback_text || null,
        tags: tags ? JSON.stringify(tags) : null,
      })
      .returning()
      .get();

    const result = {
      ...data,
      tags: data.tags ? JSON.parse(data.tags) : null,
      metadata: data.metadata ? JSON.parse(data.metadata) : null,
    };

    return NextResponse.json({ data: result }, { status: 201 });
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
    const { outputId: outputIdString } = await params;
    const outputId = parseId(outputIdString);

    const db = getDb();
    const rows = db
      .select()
      .from(schema.ratings)
      .where(eq(schema.ratings.output_id, outputId))
      .orderBy(desc(schema.ratings.created_at))
      .all();

    const data = rows.map((r) => ({
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : null,
      metadata: r.metadata ? JSON.parse(r.metadata) : null,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
