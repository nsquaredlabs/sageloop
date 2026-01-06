import { createServerClient } from "@/lib/supabase";
import { parseId } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { AddScenarioDialog } from "@/components/add-scenario-dialog";
import { UploadScenariosDialog } from "@/components/upload-scenarios-dialog";
import { GenerateOutputsButton } from "@/components/generate-outputs-button";
import { EditProjectDialog } from "@/components/edit-project-dialog";

// Force dynamic rendering to ensure fresh data after scenarios are added/removed
export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id: idString } = await params;
  const id = parseId(idString);

  // Use authenticated server client - enforces RLS
  const supabase = await createServerClient();

  // Fetch project with scenarios
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  const { data: scenarios } = await supabase
    .from("scenarios")
    .select("*")
    .eq("project_id", id)
    .order("order", { ascending: true });

  const modelConfig = project.model_config as {
    model?: string;
    system_prompt?: string;
    variables?: Record<string, string>;
  };

  return (
    <div>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold tracking-tight">
                  {project.name}
                </h1>
                <Badge variant="secondary">
                  {modelConfig.model || "gpt-4"}
                </Badge>
              </div>
              {project.description && (
                <p className="text-muted-foreground mt-2 max-w-3xl">
                  {project.description}
                </p>
              )}
              {project.created_at && (
                <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(project.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              )}
            </div>

            <EditProjectDialog
              projectId={String(id)}
              currentName={project.name}
              currentDescription={project.description}
              currentSystemPrompt={modelConfig.system_prompt || ""}
              currentModel={modelConfig.model || "gpt-4"}
              currentVariables={modelConfig.variables}
            />
          </div>
        </div>

        {/* System Prompt Card */}
        {modelConfig.system_prompt && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">System Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {modelConfig.system_prompt}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Scenarios Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold">Scenarios</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {scenarios?.length || 0} test scenario
                {scenarios?.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <UploadScenariosDialog projectId={String(id)} />
              <AddScenarioDialog projectId={String(id)} />
            </div>
          </div>

          {scenarios && scenarios.length > 0 ? (
            <div className="space-y-3">
              {scenarios.map((scenario, index) => (
                <Card
                  key={scenario.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className="font-mono text-xs"
                          >
                            #{index + 1}
                          </Badge>
                        </div>
                        <p className="text-sm leading-relaxed">
                          {scenario.input_text}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No scenarios yet</h3>
                <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                  Add test scenarios to evaluate your AI's behavior. Aim for
                  10-20 diverse examples.
                </p>
                <AddScenarioDialog projectId={String(id)} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Action Buttons */}
        {scenarios && scenarios.length > 0 && (
          <GenerateOutputsButton
            projectId={String(id)}
            scenarioCount={scenarios.length}
          />
        )}
      </div>
    </div>
  );
}
