import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { parseId } from "@/lib/utils";
import { handleApiError, NotFoundError } from "@/lib/api/errors";

interface RouteParams {
  params: Promise<{ id: string; scenarioId: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectIdString, scenarioId: scenarioIdString } = await params;
    const projectId = parseId(projectIdString);
    const scenarioId = parseId(scenarioIdString);

    // Verify the scenario exists and belongs to this project
    // RLS will enforce that the user owns this project
    const { data: scenario, error: fetchError } = await supabase
      .from("scenarios")
      .select("id, project_id")
      .eq("id", scenarioId)
      .eq("project_id", projectId)
      .single();

    if (fetchError || !scenario) {
      throw new NotFoundError("Scenario not found");
    }

    // Delete the scenario
    const { error: deleteError } = await supabase
      .from("scenarios")
      .delete()
      .eq("id", scenarioId);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete scenario" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
