import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Lightbulb,
  FileJson,
  FileText,
  History,
  Bug,
  Star,
  Download,
} from "lucide-react";
import { SmartAlertBanner } from "@/components/smart-alert-banner";
import { DimensionalAnalysisAccordion } from "@/components/dimensional-analysis-accordion";
import { CollapsibleSystemPrompt } from "@/components/collapsible-system-prompt";
import {
  interpretSuccessRate,
  interpretConfidence,
  getDetailedConfidenceAssessment,
} from "@/lib/metrics";
import { parseId } from "@/lib/utils";
import { ApplyFixButton } from "@/components/apply-fix-button";
import { PatternSummaryCard } from "@/components/pattern-summary-card";
import { PatternFingerprintCard } from "@/components/pattern-fingerprint-card";
import { ConfidenceExplainerCard } from "@/components/confidence-explainer-card";
import { detectPatterns } from "@/lib/analysis/pattern-detection";
import { generateFingerprint } from "@/lib/analysis/fingerprint-generator";
import type { ExtractionCriteria, ModelConfig } from "@/types/database";

// Force dynamic rendering to ensure fresh data after pattern extraction
export const dynamic = "force-dynamic";

interface InsightsPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ extractionId?: string }>;
}

export default async function InsightsPage({
  params,
  searchParams,
}: InsightsPageProps) {
  const { id: idString } = await params;
  const id = parseId(idString);

  // Check if viewing a specific extraction
  const queryParams = searchParams ? await searchParams : {};
  const extractionId = queryParams.extractionId
    ? parseId(queryParams.extractionId)
    : null;

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

  // Fetch extraction (specific one if extractionId provided, otherwise latest)
  const extractionQuery = supabase
    .from("extractions")
    .select("*, system_prompt_snapshot");

  if (extractionId) {
    extractionQuery.eq("id", extractionId);
  } else {
    extractionQuery
      .eq("project_id", id)
      .order("created_at", { ascending: false })
      .limit(1);
  }

  const { data: extraction } = await extractionQuery.single();

  // Fetch metric (for the specific extraction if provided, otherwise latest)
  const metricQuery = supabase.from("metrics").select("*");

  if (extractionId) {
    metricQuery.eq("extraction_id", extractionId);
  } else {
    metricQuery
      .eq("project_id", id)
      .order("snapshot_time", { ascending: false })
      .limit(1);
  }

  const { data: metric } = await metricQuery.single();

  // Use the rated_output_count from the extraction snapshot
  // This ensures historical extractions show the correct confidence based on
  // the number of ratings that existed at extraction time, not current ratings
  const ratedCount = extraction?.rated_output_count || 0;

  // Fetch total scenario count for the project
  const { count: totalScenarios } = await supabase
    .from("scenarios")
    .select("*", { count: "exact", head: true })
    .eq("project_id", id);

  if (!extraction) {
    return (
      <div>
        <div className="container mx-auto py-8">
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Analyze your rated outputs to extract behavioral patterns and
                quality criteria.
              </p>
              <Button asChild>
                <Link href={`/projects/${id}/outputs`}>View Outputs</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const criteria = extraction.criteria as unknown as ExtractionCriteria;
  const successRate = metric?.success_rate || 0;
  const confidenceScore = extraction.confidence_score || 0;

  // Get metric interpretations
  const successInterpretation = interpretSuccessRate(successRate);
  const confidenceInterpretation = interpretConfidence(
    confidenceScore,
    ratedCount || 0,
  );

  return (
    <div>
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Insights
              </h1>
              <p className="text-muted-foreground mt-2">
                Quality patterns for{" "}
                <span className="font-medium break-words">{project.name}</span>
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">
                    Success Rate:
                  </span>
                  <span className="text-foreground font-semibold">
                    {(successRate * 100).toFixed(0)}%
                  </span>
                  <Badge variant={successInterpretation.variant}>
                    {successInterpretation.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-muted-foreground">
                    Confidence:
                  </span>
                  <span className="text-foreground font-semibold">
                    {((extraction.confidence_score || 0) * 100).toFixed(0)}%
                  </span>
                  <Badge variant={confidenceInterpretation.variant}>
                    {confidenceInterpretation.label}
                  </Badge>
                </div>
                <div className="text-muted-foreground">
                  <span className="font-medium">Analyzed:</span>{" "}
                  {extraction.created_at
                    ? new Date(extraction.created_at).toLocaleDateString()
                    : "N/A"}
                </div>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button variant="default" asChild>
                <Link href={`/projects/${id}/golden-examples`}>
                  <Star className="mr-2 h-4 w-4" />
                  Golden Examples
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/projects/${id}/insights/history`}>
                  <History className="mr-2 h-4 w-4" />
                  View History
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <a href={`/api/projects/${id}/export?format=json`}>
                      <FileJson className="mr-2 h-4 w-4" />
                      JSON Format
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={`/api/projects/${id}/export?format=markdown`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Markdown Spec
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href={`/api/projects/${id}/export?format=pytest`}>
                      <FileText className="mr-2 h-4 w-4" />
                      pytest (Python)
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={`/api/projects/${id}/export?format=jest`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Jest (TypeScript)
                    </a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Smart Alert Banner - Prioritized single alert */}
        {criteria.dimensions && (
          <SmartAlertBanner
            failureRate={
              criteria.failure_analysis?.total_failures
                ? criteria.failure_analysis.total_failures /
                  (criteria.dimensions.length.sample_size.high +
                    criteria.dimensions.length.sample_size.low)
                : 0
            }
            confidence={confidenceScore}
            successRate={successRate}
            failureCount={criteria.failure_analysis?.total_failures || 0}
            needsMore={Math.max(0, 20 - (extraction.rated_output_count || 0))}
          />
        )}

        {/* Visual Pattern Diff - Hero Section (Tier 1) */}
        {criteria.dimensions && (
          <div className="mb-8">
            <PatternSummaryCard
              patternSummary={detectPatterns(criteria.dimensions)}
              successRate={successRate}
              totalOutputs={
                criteria.dimensions.length.sample_size.high +
                criteria.dimensions.length.sample_size.low
              }
            />
          </div>
        )}

        {/* Failure Analysis - Actionable fixes for failures (Tier 2) */}
        {criteria.failure_analysis &&
          criteria.failure_analysis.clusters &&
          criteria.failure_analysis.clusters.length > 0 && (
            <Card id="failures" className="mb-6 border-destructive/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <Bug className="h-5 w-5" />
                      Failure Analysis
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {criteria.failure_analysis.total_failures} output
                      {criteria.failure_analysis.total_failures !== 1
                        ? "s"
                        : ""}{" "}
                      failed (≤2 stars) - grouped by root cause
                    </CardDescription>
                  </div>
                  <ApplyFixButton
                    projectId={id.toString()}
                    currentPrompt={
                      (project.model_config as unknown as ModelConfig)
                        .system_prompt || ""
                    }
                    clusters={criteria.failure_analysis.clusters}
                    totalScenarios={totalScenarios || 0}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {criteria.failure_analysis.clusters.map(
                    (cluster: any, index: number) => (
                      <div
                        key={index}
                        className="border rounded-lg p-4 bg-muted/30"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{cluster.name}</h3>
                              <Badge variant="destructive">
                                {cluster.count} failure
                                {cluster.count !== 1 ? "s" : ""}
                              </Badge>
                              {cluster.severity === "high" && (
                                <Badge variant="destructive">
                                  High Severity
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              <span className="font-medium">Pattern:</span>{" "}
                              {cluster.pattern}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Root Cause:</span>{" "}
                              {cluster.root_cause}
                            </p>
                          </div>
                        </div>

                        {cluster.example_inputs &&
                          cluster.example_inputs.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-muted-foreground mb-1">
                                Example inputs that failed:
                              </p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {cluster.example_inputs
                                  .slice(0, 2)
                                  .map((input: string, i: number) => (
                                    <li key={i} className="truncate">
                                      • {input}
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                        <div className="bg-background border rounded-md p-3">
                          <p className="text-xs font-medium mb-1">
                            Suggested Fix:
                          </p>
                          <p className="text-sm font-mono whitespace-pre-wrap">
                            {cluster.suggested_fix}
                          </p>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        {/* Confidence Explainer - Actionable Confidence Guidance (Tier 2) */}
        {criteria.dimensions && (
          <div id="confidence" className="mb-6">
            <ConfidenceExplainerCard
              assessment={getDetailedConfidenceAssessment(
                criteria.dimensions,
                extraction.rated_output_count || 0,
              )}
            />
          </div>
        )}

        {/* Pattern Fingerprint - Quality Source of Truth (Tier 2) */}
        {criteria.dimensions && (
          <div id="fingerprint" className="mb-6">
            <PatternFingerprintCard
              fingerprint={generateFingerprint(criteria.dimensions)}
              projectName={project.name}
              successRate={successRate}
            />
          </div>
        )}

        {/* System Prompt Snapshot (Tier 3) - Collapsible */}
        {extraction.system_prompt_snapshot && (
          <CollapsibleSystemPrompt
            systemPrompt={extraction.system_prompt_snapshot}
            createdAt={extraction.created_at}
          />
        )}

        {/* Dimensional Analysis - Shows patterns across 5 dimensions (Tier 3) - Accordion */}
        {criteria.dimensions && (
          <DimensionalAnalysisAccordion dimensions={criteria.dimensions} />
        )}
      </div>
    </div>
  );
}
