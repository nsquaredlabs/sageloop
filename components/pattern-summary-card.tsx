"use client";

/**
 * PatternSummaryCard Component
 *
 * The hero component for Visual Pattern Diff - the core "aha moment" feature.
 * Shows a striking side-by-side comparison of what makes outputs great vs poor.
 *
 * Left side: "5-star outputs ALWAYS have..." (green checkmarks)
 * Right side: "1-star outputs NEVER have..." (red X marks)
 *
 * Design System: Following sageloop/docs/DESIGN_SYSTEM.md
 * - Semantic color tokens
 * - High contrast
 * - Card-based UI with proper spacing
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type {
  PatternSummary,
  PatternItem,
} from "@/lib/analysis/pattern-detection";

interface PatternSummaryCardProps {
  /** Pattern summary from detectPatterns() */
  patternSummary: PatternSummary;
  /** Success rate (0-1) for display */
  successRate: number;
  /** Total number of outputs analyzed */
  totalOutputs: number;
}

/**
 * Get dimension badge color based on dimension type
 */
function getDimensionBadgeVariant(
  dimension: PatternItem["dimension"],
): "default" | "secondary" | "outline" {
  switch (dimension) {
    case "length":
    case "structure":
      return "default";
    case "content":
    case "tone":
      return "secondary";
    case "errors":
      return "outline";
    default:
      return "secondary";
  }
}

/**
 * Format dimension name for display
 */
function formatDimension(dimension: PatternItem["dimension"]): string {
  const names: Record<string, string> = {
    length: "Length",
    structure: "Structure",
    content: "Content",
    tone: "Tone",
    errors: "Errors",
  };
  return names[dimension] || dimension;
}

export function PatternSummaryCard({
  patternSummary,
  successRate,
  totalOutputs,
}: PatternSummaryCardProps) {
  const {
    alwaysPatterns,
    neverPatterns,
    highRatedCount,
    lowRatedCount,
    overallConfidence,
  } = patternSummary;

  // Determine if we have enough data to show patterns
  const hasPatterns = alwaysPatterns.length > 0 || neverPatterns.length > 0;
  const confidencePercent = Math.round(overallConfidence * 100);
  const successPercent = Math.round(successRate * 100);

  if (!hasPatterns) {
    return (
      <Card className="border-dashed border-2 border-muted-foreground/25">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Sparkles className="h-10 w-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Pattern Analysis Pending
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Need <strong>5+ high-rated</strong> (4-5 stars) and{" "}
            <strong>5+ low-rated</strong> (1-2 stars) outputs to detect clear
            patterns.
            <br />
            <span className="text-xs mt-2 block">
              Currently: {highRatedCount} high, {lowRatedCount} low
            </span>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-background to-muted/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-primary" />
            Pattern Summary
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge
              variant={
                successPercent >= 70
                  ? "default"
                  : successPercent >= 40
                    ? "secondary"
                    : "destructive"
              }
            >
              {successPercent}% Success Rate
            </Badge>
            <Badge variant="outline">{confidencePercent}% Confidence</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Based on {totalOutputs} outputs ({highRatedCount} high-rated,{" "}
          {lowRatedCount} low-rated)
        </p>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT SIDE: 5-star patterns (ALWAYS have) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-green-200 dark:border-green-800">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-900">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-700 dark:text-green-300">
                  5-Star Outputs ALWAYS Have
                </h3>
                <p className="text-xs text-muted-foreground">
                  Present in 80%+ of high-rated outputs
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {alwaysPatterns.length > 0 ? (
                alwaysPatterns.map((pattern, index) => (
                  <PatternRow key={index} pattern={pattern} type="always" />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic py-4">
                  No clear &quot;always&quot; patterns detected yet
                </p>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: 1-star patterns (NEVER have) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-red-200 dark:border-red-800">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900">
                <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-red-700 dark:text-red-300">
                  1-Star Outputs NEVER Have
                </h3>
                <p className="text-xs text-muted-foreground">
                  Present in less than 20% of high-rated outputs
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {neverPatterns.length > 0 ? (
                neverPatterns.map((pattern, index) => (
                  <PatternRow key={index} pattern={pattern} type="never" />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic py-4">
                  No clear &quot;never&quot; patterns detected yet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Explore section with anchor links */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 border-t pt-3">
          <span>Explore:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const element = document.getElementById("failures");
              if (element)
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Failures
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const element = document.getElementById("dimensions");
              if (element)
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Dimensions (5)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const element = document.getElementById("fingerprint");
              if (element)
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          >
            Full Spec
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Individual pattern row component
 */
function PatternRow({
  pattern,
  type,
}: {
  pattern: PatternItem;
  type: "always" | "never";
}) {
  const isAlways = type === "always";

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
        isAlways
          ? "bg-green-50 dark:bg-green-950/50 hover:bg-green-100 dark:hover:bg-green-950"
          : "bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-950"
      }`}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {isAlways ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium ${
            isAlways
              ? "text-green-900 dark:text-green-100"
              : "text-red-900 dark:text-red-100"
          }`}
        >
          {pattern.description}
        </p>

        {/* Metric and dimension badge */}
        <div className="flex items-center gap-2 mt-1.5">
          <Badge
            variant={getDimensionBadgeVariant(pattern.dimension)}
            className="text-xs"
          >
            {formatDimension(pattern.dimension)}
          </Badge>

          {pattern.metric && (
            <span className="text-xs text-muted-foreground">
              {pattern.metric}
            </span>
          )}

          {/* Confidence indicator */}
          <span className="text-xs text-muted-foreground ml-auto">
            {Math.round(pattern.confidence * 100)}% confident
          </span>
        </div>
      </div>
    </div>
  );
}
