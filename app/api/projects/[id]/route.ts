import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { parseId } from "@/lib/utils";
import { validateSystemPrompt } from "@/lib/security/prompt-validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);
    const body = await request.json();

    const { name, description, model_config } = body;

    // Validate required fields
    if (!name || !model_config?.system_prompt) {
      return NextResponse.json(
        { error: "Name and system prompt are required" },
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
          project_id: projectId,
          operation: "update_project",
          flags: validation.flags,
        });
      }
    }

    const db = getDb();
    const row = db
      .update(schema.projects)
      .set({
        name,
        description,
        model_config: JSON.stringify(model_config),
        updated_at: new Date().toISOString(),
      })
      .where(eq(schema.projects.id, projectId))
      .returning()
      .get();

    if (!row) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = {
      ...row,
      model_config: row.model_config ? JSON.parse(row.model_config) : null,
    };

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
