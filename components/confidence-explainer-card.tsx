/**
 * ConfidenceExplainerCard Component
 *
 * Displays a detailed confidence assessment with actionable guidance.
 * Transforms "Confidence: 67%" into specific next steps for improving
 * pattern detection reliability.
 *
 * Features:
 * - Dimension-by-dimension confidence breakdown
 * - Visual progress bars for each dimension
 * - Recommended actions (specific, actionable)
 * - Projections showing path to production-ready confidence
 *
 * Design System: Following sageloop/docs/DESIGN_SYSTEM.md
 * - Semantic color tokens (bg-background, text-foreground, text-muted-foreground)
 * - Indigo primary accent
 * - High contrast, monochrome with accent
 * - Card-based layout with clear sections
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Target, BarChart3 } from "lucide-react";
import type {
  DetailedConfidenceAssessment,
  ConfidenceDimensionBreakdown,
  ConfidenceStatus,
  DimensionName,
} from "@/lib/metrics";

interface ConfidenceExplainerCardProps {
  /** The detailed confidence assessment from getDetailedConfidenceAssessment */
  assessment: DetailedConfidenceAssessment;
}

/**
 * Get display name for dimension
 */
function getDimensionDisplayName(dimension: DimensionName): string {
  const names: Record<DimensionName, string> = {
    length: "Length pattern",
    tone: "Tone",
    structure: "Structure elements",
    content: "Content specificity",
    errors: "Error patterns",
  };
  return names[dimension];
}

/**
 * Get status badge variant
 */
function getStatusBadgeVariant(
  status: ConfidenceStatus,
): "default" | "secondary" | "outline" {
  switch (status) {
    case "high":
      return "default";
    case "medium":
      return "secondary";
    case "low":
      return "outline";
  }
}

/**
 * Get status label
 */
function getStatusLabel(status: ConfidenceStatus): string {
  switch (status) {
    case "high":
      return "HIGH";
    case "medium":
      return "MEDIUM";
    case "low":
      return "LOW";
  }
}

/**
 * Get progress bar color class based on confidence
 */
function getProgressColorClass(confidence: number): string {
  if (confidence >= 0.8) return "bg-green-500";
  if (confidence >= 0.5) return "bg-yellow-500";
  return "bg-red-500";
}

/**
 * DimensionRow component for consistent dimension display
 */
function DimensionRow({
  breakdown,
}: {
  breakdown: ConfidenceDimensionBreakdown;
}) {
  const confidencePercent = Math.round(breakdown.confidence * 100);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {getDimensionDisplayName(breakdown.dimension)}
          </span>
          {breakdown.status === "low" && breakdown.sampleCount < 5 && (
            <span className="text-xs text-muted-foreground">
              (only {breakdown.sampleCount} samples)
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-foreground">
          {confidencePercent}%
        </span>
      </div>
      <Progress
        value={confidencePercent}
        className="h-2"
        indicatorClassName={getProgressColorClass(breakdown.confidence)}
      />
    </div>
  );
}

export function ConfidenceExplainerCard({
  assessment,
}: ConfidenceExplainerCardProps) {
  const {
    overall,
    overallStatus,
    totalSamples,
    breakdown,
    recommendedActions,
    projections,
  } = assessment;

  const overallPercent = Math.round(overall * 100);

  // Group dimensions by status
  const highConfidence = breakdown.filter((b) => b.status === "high");
  const mediumConfidence = breakdown.filter((b) => b.status === "medium");
  const lowConfidence = breakdown.filter((b) => b.status === "low");

  // Check if already at high confidence
  const isProductionReady = projections.toProductionReady === 0;

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-muted/30 border-b border-border pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              Confidence Assessment
            </CardTitle>
            <CardDescription className="mt-1">
              How reliable are the detected patterns?
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xl font-bold text-foreground">
                {overallPercent}%
              </div>
              <Badge variant={getStatusBadgeVariant(overallStatus)}>
                {getStatusLabel(overallStatus)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground border-l border-border pl-3">
              <span className="font-medium text-foreground">
                {totalSamples}
              </span>
              <br />
              samples
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* High Confidence Dimensions */}
        {highConfidence.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <span className="text-xs font-semibold tracking-wide uppercase">
                High Confidence (9+ samples each)
              </span>
            </div>
            <div className="space-y-3">
              {highConfidence.map((dim) => (
                <DimensionRow key={dim.dimension} breakdown={dim} />
              ))}
            </div>
          </div>
        )}

        {/* Medium Confidence Dimensions */}
        {mediumConfidence.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <span className="text-xs font-semibold tracking-wide uppercase">
                Medium Confidence (5-8 samples)
              </span>
            </div>
            <div className="space-y-3">
              {mediumConfidence.map((dim) => (
                <DimensionRow key={dim.dimension} breakdown={dim} />
              ))}
            </div>
          </div>
        )}

        {/* Low Confidence Dimensions */}
        {lowConfidence.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <span className="text-xs font-semibold tracking-wide uppercase">
                Low Confidence (&lt; 5 samples)
              </span>
            </div>
            <div className="space-y-3">
              {lowConfidence.map((dim) => (
                <DimensionRow key={dim.dimension} breakdown={dim} />
              ))}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {recommendedActions.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-xs font-semibold tracking-wide uppercase">
                Recommended Actions
              </span>
            </div>
            <div className="space-y-3">
              {recommendedActions.map((action, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-sm bg-muted/50 rounded-lg p-3"
                >
                  <div
                    className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold ${
                      action.priority === "high"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {action.action}
                    </p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      Impact: {action.impact}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projections */}
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-semibold tracking-wide uppercase">
              Projections
            </span>
          </div>
          <div className="space-y-2 text-sm">
            {isProductionReady ? (
              <p className="text-green-600 dark:text-green-400 font-medium">
                Your sample size is production-ready with high confidence.
              </p>
            ) : (
              <>
                <p className="text-muted-foreground">
                  <span className="text-foreground font-medium">
                    With 20 samples:
                  </span>{" "}
                  {Math.round(projections.at20Samples * 100)}% confidence
                  (production-ready)
                </p>
                <p className="text-muted-foreground">
                  <span className="text-foreground font-medium">
                    With 30 samples:
                  </span>{" "}
                  {Math.round(projections.at30Samples * 100)}% confidence (high
                  reliability)
                </p>
                {projections.toProductionReady > 0 && (
                  <p className="text-primary font-medium mt-2">
                    Add {projections.toProductionReady} more rated outputs to
                    reach 85% confidence.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
