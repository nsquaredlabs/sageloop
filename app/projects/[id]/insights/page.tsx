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
  TrendingUp,
  TrendingDown,
  Lightbulb,
  CheckCircle2,
  FileJson,
  FileText,
  AlertCircle,
  Info,
  History,
  Bug,
  Ruler,
  MessageSquare,
  Layout,
  FileText as FileTextIcon,
  AlertTriangle,
} from "lucide-react";
import { DimensionCard } from "@/components/dimension-card";
import { SampleSizeAlert } from "@/components/sample-size-alert";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { interpretSuccessRate, interpretConfidence } from "@/lib/metrics";
import { parseId } from "@/lib/utils";
import { ApplyFixButton } from "@/components/apply-fix-button";
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
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-4xl font-bold tracking-tight">Insights</h1>
              <p className="text-muted-foreground mt-2">
                Quality patterns for{" "}
                <span className="font-medium">{project.name}</span>
              </p>
              <div className="flex gap-4 mt-4 text-sm">
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
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/projects/${id}/insights/history`}>
                  <History className="mr-2 h-4 w-4" />
                  View History
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/api/projects/${id}/export?format=json`} download>
                  <FileJson className="mr-2 h-4 w-4" />
                  Export JSON
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`/api/projects/${id}/export?format=markdown`} download>
                  <FileText className="mr-2 h-4 w-4" />
                  Export Spec
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Contextual Alerts */}
        {(successInterpretation.actionable ||
          confidenceInterpretation.actionable) && (
          <div className="space-y-3 mb-6">
            {successInterpretation.actionable && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>{successInterpretation.message}</AlertTitle>
                <AlertDescription>
                  {successInterpretation.actionable}
                </AlertDescription>
              </Alert>
            )}
            {confidenceInterpretation.actionable && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{confidenceInterpretation.message}</AlertTitle>
                <AlertDescription>
                  {confidenceInterpretation.actionable}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Sample Size Guidance */}
        {criteria.dimensions && (
          <div className="mb-6">
            <SampleSizeAlert
              totalSamples={extraction.rated_output_count || 0}
              highRatedCount={criteria.dimensions.length.sample_size.high}
              lowRatedCount={criteria.dimensions.length.sample_size.low}
              recommendedMinimum={20}
            />
          </div>
        )}

        {/* System Prompt Snapshot */}
        {extraction.system_prompt_snapshot && (
          <Card className="mb-6 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg">
                System Prompt (Snapshot)
              </CardTitle>
              <CardDescription>
                This was the prompt being evaluated at the time of this
                extraction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 p-4 rounded-md">
                {extraction.system_prompt_snapshot}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Failure Analysis - NEW: Shows clustered failures with suggested fixes */}
        {criteria.failure_analysis &&
          criteria.failure_analysis.clusters &&
          criteria.failure_analysis.clusters.length > 0 && (
            <Card className="mb-6 border-destructive/30">
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

        {/* Dimensional Analysis - NEW: Shows patterns across 5 dimensions */}
        {criteria.dimensions && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Dimensional Analysis</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Quality patterns analyzed across 5 dimensions comparing high-rated
              vs low-rated outputs
            </p>
            <div className="space-y-4">
              {/* Length Dimension */}
              <DimensionCard
                title="Length"
                icon={<Ruler className="h-5 w-5 text-primary" />}
                insight={criteria.dimensions.length.insight}
                confidence={criteria.dimensions.length.confidence}
                highRatedPattern={
                  <div className="space-y-1">
                    <p className="font-medium">
                      {criteria.dimensions.length.high_rated_range.min}-
                      {criteria.dimensions.length.high_rated_range.max}{" "}
                      {criteria.dimensions.length.metric}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Median:{" "}
                      {criteria.dimensions.length.high_rated_range.median}{" "}
                      {criteria.dimensions.length.metric}
                    </p>
                  </div>
                }
                lowRatedPattern={
                  <div className="space-y-1">
                    <p className="font-medium">
                      {criteria.dimensions.length.low_rated_range.min}-
                      {criteria.dimensions.length.low_rated_range.max}{" "}
                      {criteria.dimensions.length.metric}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Median:{" "}
                      {criteria.dimensions.length.low_rated_range.median}{" "}
                      {criteria.dimensions.length.metric}
                    </p>
                  </div>
                }
                metrics={[
                  {
                    label: "High-rated samples",
                    value: criteria.dimensions.length.sample_size.high,
                  },
                  {
                    label: "Low-rated samples",
                    value: criteria.dimensions.length.sample_size.low,
                  },
                ]}
              />

              {/* Tone Dimension */}
              <DimensionCard
                title="Tone"
                icon={<MessageSquare className="h-5 w-5 text-primary" />}
                insight={`Formality: ${criteria.dimensions.tone.formality.replace("_", " ")}, Technicality: ${criteria.dimensions.tone.technicality.replace("_", " ")}, Sentiment: ${criteria.dimensions.tone.sentiment}`}
                confidence={criteria.dimensions.tone.confidence}
                highRatedPattern={
                  <div className="space-y-1">
                    <p className="text-sm">
                      {criteria.dimensions.tone.high_rated_pattern}
                    </p>
                  </div>
                }
                lowRatedPattern={
                  <div className="space-y-1">
                    <p className="text-sm">
                      {criteria.dimensions.tone.low_rated_pattern}
                    </p>
                  </div>
                }
                metrics={[
                  {
                    label: "Formality",
                    value: criteria.dimensions.tone.formality.replace("_", " "),
                  },
                  {
                    label: "Technicality",
                    value: criteria.dimensions.tone.technicality.replace(
                      "_",
                      " ",
                    ),
                  },
                  {
                    label: "Sentiment",
                    value: criteria.dimensions.tone.sentiment,
                  },
                ]}
              />

              {/* Structure Dimension */}
              <DimensionCard
                title="Structure"
                icon={<Layout className="h-5 w-5 text-primary" />}
                insight={criteria.dimensions.structure.insight}
                confidence={criteria.dimensions.structure.confidence}
                highRatedPattern={
                  <div className="space-y-1">
                    {criteria.dimensions.structure.high_rated_includes.length >
                    0 ? (
                      <ul className="text-sm space-y-1">
                        {criteria.dimensions.structure.high_rated_includes.map(
                          (elem: string, i: number) => (
                            <li key={i}>• {elem.replace("_", " ")}</li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No specific elements
                      </p>
                    )}
                  </div>
                }
                lowRatedPattern={
                  <div className="space-y-1">
                    {criteria.dimensions.structure.low_rated_includes.length >
                    0 ? (
                      <ul className="text-sm space-y-1">
                        {criteria.dimensions.structure.low_rated_includes.map(
                          (elem: string, i: number) => (
                            <li key={i}>• {elem.replace("_", " ")}</li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No specific elements
                      </p>
                    )}
                  </div>
                }
              />

              {/* Content Dimension */}
              <DimensionCard
                title="Content"
                icon={<FileTextIcon className="h-5 w-5 text-primary" />}
                insight={criteria.dimensions.content.insight}
                confidence={criteria.dimensions.content.confidence}
                highRatedPattern={
                  <div className="space-y-1">
                    {criteria.dimensions.content.high_rated_elements.length >
                    0 ? (
                      <ul className="text-sm space-y-1">
                        {criteria.dimensions.content.high_rated_elements.map(
                          (elem: string, i: number) => (
                            <li key={i}>• {elem.replace("_", " ")}</li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No specific elements
                      </p>
                    )}
                    <div className="flex gap-2 text-xs text-muted-foreground mt-2 pt-2 border-t">
                      {criteria.dimensions.content.citations_present && (
                        <span>✓ Citations</span>
                      )}
                      {criteria.dimensions.content.examples_present && (
                        <span>✓ Examples</span>
                      )}
                      {criteria.dimensions.content.disclaimers_present && (
                        <span>✓ Disclaimers</span>
                      )}
                    </div>
                  </div>
                }
                lowRatedPattern={
                  <div className="space-y-1">
                    {criteria.dimensions.content.low_rated_elements.length >
                    0 ? (
                      <ul className="text-sm space-y-1">
                        {criteria.dimensions.content.low_rated_elements.map(
                          (elem: string, i: number) => (
                            <li key={i}>• {elem.replace("_", " ")}</li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No specific elements
                      </p>
                    )}
                  </div>
                }
                metrics={[
                  {
                    label: "Specificity",
                    value: criteria.dimensions.content.specificity,
                  },
                ]}
              />

              {/* Errors Dimension */}
              <DimensionCard
                title="Errors"
                icon={<AlertTriangle className="h-5 w-5 text-primary" />}
                insight={criteria.dimensions.errors.insight}
                confidence={criteria.dimensions.errors.confidence}
                highRatedPattern={
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Minimal errors
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Clean, accurate outputs
                    </p>
                  </div>
                }
                lowRatedPattern={
                  <div className="space-y-2 text-sm">
                    {criteria.dimensions.errors.hallucinations.count > 0 && (
                      <div>
                        <p className="font-medium">
                          Hallucinations:{" "}
                          {criteria.dimensions.errors.hallucinations.count}
                        </p>
                        {criteria.dimensions.errors.hallucinations.examples
                          .slice(0, 2)
                          .map((ex: string, i: number) => (
                            <p
                              key={i}
                              className="text-xs text-muted-foreground truncate"
                            >
                              • {ex}
                            </p>
                          ))}
                      </div>
                    )}
                    {criteria.dimensions.errors.refusals.count > 0 && (
                      <div>
                        <p className="font-medium">
                          Refusals: {criteria.dimensions.errors.refusals.count}
                        </p>
                      </div>
                    )}
                    {criteria.dimensions.errors.formatting_issues.count > 0 && (
                      <div>
                        <p className="font-medium">
                          Formatting:{" "}
                          {criteria.dimensions.errors.formatting_issues.count}
                        </p>
                      </div>
                    )}
                    {criteria.dimensions.errors.factual_errors.count > 0 && (
                      <div>
                        <p className="font-medium">
                          Factual errors:{" "}
                          {criteria.dimensions.errors.factual_errors.count}
                        </p>
                      </div>
                    )}
                  </div>
                }
              />
            </div>
          </div>
        )}

        {/* Summary */}
        {criteria.summary && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{criteria.summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Quality Criteria */}
        {criteria.criteria && criteria.criteria.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Quality Criteria</h2>
            <div className="space-y-4">
              {criteria.criteria.map((criterion: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {criterion.dimension}
                          {criterion.importance === "high" && (
                            <Badge variant="destructive">High Priority</Badge>
                          )}
                          {criterion.importance === "medium" && (
                            <Badge variant="secondary">Medium Priority</Badge>
                          )}
                          {criterion.importance === "low" && (
                            <Badge variant="outline">Low Priority</Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {criterion.pattern}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                          <TrendingUp className="h-4 w-4" />
                          Good Outputs
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {criterion.good_example}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                          <TrendingDown className="h-4 w-4" />
                          Poor Outputs
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {criterion.bad_example}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Key Insights */}
        {criteria.key_insights && criteria.key_insights.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {criteria.key_insights.map((insight: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-1">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {criteria.recommendations && criteria.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recommendations
              </CardTitle>
              <CardDescription>
                Actions to improve output quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {criteria.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                    </div>
                    <span className="leading-relaxed">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
