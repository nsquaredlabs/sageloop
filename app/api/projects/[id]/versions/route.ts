import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { parseId } from "@/lib/utils";
import type { ModelConfig } from "@/types/database";
import type { GetVersionsResponse } from "@/types/api";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);

    const db = getDb();

    // Fetch project details
    const project = db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, projectId))
      .get();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch all prompt versions for this project
    const iterations = db
      .select()
      .from(schema.prompt_versions)
      .where(eq(schema.prompt_versions.project_id, projectId))
      .orderBy(desc(schema.prompt_versions.version_number))
      .all();

    const modelConfig = project.model_config
      ? (JSON.parse(project.model_config) as ModelConfig)
      : ({} as ModelConfig);

    const currentVersion = 1;
    const currentSystemPrompt = modelConfig.system_prompt || "";

    // Map DB rows to API shape (version_number -> version)
    const mappedIterations = iterations.map((i) => ({
      id: i.id,
      project_id: i.project_id,
      version: i.version_number,
      system_prompt: i.system_prompt || "",
      parent_version: i.parent_version,
      improvement_note: null as string | null,
      success_rate_before: i.success_rate_before,
      success_rate_after: i.success_rate_after,
      created_at: i.created_at,
    }));

    // Check if current version is already in iterations
    const hasCurrentVersion = mappedIterations.some(
      (i) => i.version === currentVersion,
    );

    const versions = [
      ...(hasCurrentVersion
        ? []
        : [
            {
              id: -1,
              project_id: projectId,
              version: currentVersion,
              system_prompt: currentSystemPrompt,
              created_at: project.updated_at,
              parent_version: currentVersion > 1 ? currentVersion - 1 : null,
              improvement_note: "Current version",
              success_rate_before: null,
              success_rate_after: null,
            },
          ]),
      ...mappedIterations,
    ];

    const response: GetVersionsResponse = {
      data: versions,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
