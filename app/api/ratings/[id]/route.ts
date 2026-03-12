import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { parseId } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id: idString } = await params;
    const id = parseId(idString);
    const body = await request.json();
    const { stars, feedback_text, metadata } = body;

    // Validate required fields
    if (!stars || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: "Valid star rating (1-5) is required" },
        { status: 400 },
      );
    }

    const db = getDb();

    const data = db
      .update(schema.ratings)
      .set({
        stars,
        feedback_text: feedback_text ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .where(eq(schema.ratings.id, id))
      .returning()
      .get();

    if (!data) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    const result = {
      ...data,
      tags: data.tags ? JSON.parse(data.tags) : null,
      metadata: data.metadata ? JSON.parse(data.metadata) : null,
    };

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
