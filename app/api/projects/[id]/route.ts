import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { parseId } from "@/lib/utils";
import { validateSystemPrompt } from "@/lib/security/prompt-validation";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
          user_id: user.id,
          project_id: projectId,
          operation: "update_project",
          flags: validation.flags,
        });
      }
    }

    // Update project (RLS ensures user has access)
    const { data: project, error } = await supabase
      .from("projects")
      .update({
        name,
        description,
        model_config,
      })
      .eq("id", projectId)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to update project" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
