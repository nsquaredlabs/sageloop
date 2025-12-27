import { createServerClient } from "@/lib/supabase";
import { parseId } from "@/lib/utils";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Star } from "lucide-react";
import Link from "next/link";
import { AnalyzePatternsButton } from "@/components/analyze-patterns-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { OutputsList } from "@/components/outputs-list";
import { Card, CardContent } from "@/components/ui/card";

// Force dynamic rendering to ensure fresh data after generation
export const dynamic = "force-dynamic";

interface OutputsPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ retest?: string; version?: string; count?: string }>;
}

export default async function OutputsPage({
  params,
  searchParams,
}: OutputsPageProps) {
  const { id: idString } = await params;
  const id = parseId(idString);

  // Get search params for retest success message
  const queryParams = searchParams ? await searchParams : {};
  const retestSuccess = queryParams.retest === "success";
  const retestVersion = queryParams.version;
  const retestCount = queryParams.count;

  // Use authenticated server client - enforces RLS
  const supabase = await createServerClient();

  // Fetch project details
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Fetch scenarios with their outputs and ratings
  // Note: Supabase doesn't support ordering nested relations in the select query
  // We need to fetch scenarios and then get outputs separately with proper ordering
  const { data: scenarios } = await supabase
    .from("scenarios")
    .select("*")
    .eq("project_id", id)
    .order("order", { ascending: true });

  // Fetch all outputs for these scenarios, ordered by generated_at DESC
  const scenarioIds = scenarios?.map((s) => s.id) || [];

  // Only fetch outputs if we have scenarios
  let outputs = null;
  if (scenarioIds.length > 0) {
    const { data: outputsData, error: outputsError } = await supabase
      .from("outputs")
      .select(
        `
        id,
        scenario_id,
        output_text,
        generated_at,
        ratings (
          id,
          stars,
          feedback_text,
          created_at
        )
      `,
      )
      .in("scenario_id", scenarioIds)
      .order("generated_at", { ascending: false });

    if (outputsError) {
      console.error("Error fetching outputs:", outputsError);
    }
    outputs = outputsData;
  }

  const modelConfig = project.model_config as {
    model?: string;
    temperature?: number;
    system_prompt?: string;
  };

  // Get the most recent output for each scenario
  const scenariosWithLatestOutput = scenarios?.map((scenario: any) => {
    // Find all outputs for this scenario (already ordered by generated_at DESC)
    const scenarioOutputs =
      outputs?.filter((o) => o.scenario_id === scenario.id) || [];
    // First output is the most recent (due to DESC ordering)
    const latestOutput = scenarioOutputs.length > 0 ? scenarioOutputs[0] : null;

    return {
      ...scenario,
      latestOutput,
    };
  });

  const totalOutputs =
    scenariosWithLatestOutput?.filter((s) => s.latestOutput).length || 0;
  const ratedOutputs =
    scenariosWithLatestOutput?.filter(
      (s) => s.latestOutput?.ratings && s.latestOutput.ratings.length > 0,
    ).length || 0;

  // Count carried-forward ratings that need review
  const needsReviewCount =
    scenariosWithLatestOutput?.filter((s) => {
      const rating = s.latestOutput?.ratings?.[0];
      const metadata = rating?.metadata as {
        carried_forward?: boolean;
        needs_review?: boolean;
      } | null;
      return (
        metadata?.carried_forward === true && metadata?.needs_review === true
      );
    }).length || 0;

  return (
    <div>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold tracking-tight">Outputs</h1>
                <Badge variant="secondary">
                  {modelConfig.model || "gpt-4"}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-2">
                Review and rate AI outputs
              </p>
              <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Generated:</span> {totalOutputs}
                  /{scenarios?.length || 0} outputs
                </div>
                <div>
                  <span className="font-medium">Rated:</span> {ratedOutputs}/
                  {totalOutputs} outputs
                </div>
              </div>
            </div>

            {ratedOutputs > 0 && (
              <Button variant="default" asChild>
                <Link href={`/projects/${id}/golden-examples`}>
                  <Star className="mr-2 h-4 w-4" />
                  View Golden Examples
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Review Needed Alert - Always show when there are carried-forward ratings needing review */}
        {needsReviewCount > 0 && (
          <Alert className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-900 dark:text-amber-100">
              {needsReviewCount} output{needsReviewCount !== 1 ? "s" : ""} need
              {needsReviewCount === 1 ? "s" : ""} review
            </AlertTitle>
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              {retestSuccess &&
                `Regenerated ${retestCount} outputs with updated prompt (version ${retestVersion}). `}
              These outputs have changed significantly since their last rating.
              Please review them to ensure the ratings are still accurate.
            </AlertDescription>
          </Alert>
        )}

        {/* Success message for unchanged outputs */}
        {retestSuccess && needsReviewCount === 0 && ratedOutputs > 0 && (
          <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-900 dark:text-green-100">
              Fixes Applied Successfully
            </AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200">
              {retestCount} scenario{retestCount !== "1" ? "s" : ""} regenerated
              with updated prompt (version {retestVersion}). All outputs remain
              similar to previous versions - no review needed.
            </AlertDescription>
          </Alert>
        )}

        {/* Outputs List */}
        {scenariosWithLatestOutput && scenariosWithLatestOutput.length > 0 ? (
          <OutputsList projectId={id} scenarios={scenariosWithLatestOutput} />
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <h3 className="text-lg font-semibold mb-2">No outputs yet</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Generate outputs from the Overview tab to see them here.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        {totalOutputs > 0 && ratedOutputs === totalOutputs && (
          <div className="mt-8">
            <AnalyzePatternsButton
              projectId={String(id)}
              ratedCount={ratedOutputs}
            />
          </div>
        )}
      </div>
    </div>
  );
}
