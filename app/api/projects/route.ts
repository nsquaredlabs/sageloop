import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { validateSystemPrompt } from "@/lib/security/prompt-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, model_config } = body;

    // Validate required fields
    if (!name || !model_config) {
      return NextResponse.json(
        { error: "Name and model_config are required" },
        { status: 400 },
      );
    }

    // Validate model_config structure
    if (!model_config.model) {
      return NextResponse.json(
        { error: "model_config.model is required" },
        { status: 400 },
      );
    }

    // Validate system prompt for injection attempts
    if (model_config.system_prompt) {
      const validation = validateSystemPrompt(model_config.system_prompt);

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

      // Log medium-risk prompts for monitoring
      if (validation.risk === "medium") {
        console.warn("[SECURITY] Medium-risk prompt detected:", {
          operation: "create_project",
          flags: validation.flags,
        });
      }
    }

    const db = getDb();
    const data = db
      .insert(schema.projects)
      .values({
        name,
        description: description || null,
        model_config: JSON.stringify(model_config),
      })
      .returning()
      .get();

    return NextResponse.json(
      {
        data: {
          ...data,
          model_config: data.model_config
            ? JSON.parse(data.model_config)
            : null,
        },
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

export async function GET() {
  try {
    const db = getDb();
    const rows = db
      .select()
      .from(schema.projects)
      .orderBy(desc(schema.projects.created_at))
      .all();

    const data = rows.map((p) => ({
      ...p,
      model_config: p.model_config ? JSON.parse(p.model_config) : null,
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
