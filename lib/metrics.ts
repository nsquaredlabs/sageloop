import type { DimensionalAnalysis } from "@/types/api";

export interface MetricInterpretation {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  message: string;
  actionable?: string;
}

// ============================================================================
// Confidence Explainer Types (MVP Enhancement)
// ============================================================================

export type DimensionName =
  | "length"
  | "tone"
  | "structure"
  | "content"
  | "errors";
export type ConfidenceStatus = "high" | "medium" | "low";

export interface ConfidenceDimensionBreakdown {
  dimension: DimensionName;
  confidence: number;
  sampleCount: number;
  status: ConfidenceStatus; // >= 0.8 = high, >= 0.5 = medium, < 0.5 = low
  recommendation?: string;
}

export interface RecommendedAction {
  action: string;
  impact: string;
  priority: "high" | "medium" | "low";
}

export interface ConfidenceProjections {
  at20Samples: number;
  at30Samples: number;
  toProductionReady: number; // Samples needed to hit 85% confidence
}

export interface DetailedConfidenceAssessment {
  overall: number;
  overallStatus: ConfidenceStatus;
  totalSamples: number;
  breakdown: ConfidenceDimensionBreakdown[];
  recommendedActions: RecommendedAction[];
  projections: ConfidenceProjections;
}

export function interpretSuccessRate(
  successRate: number,
): MetricInterpretation {
  if (successRate >= 0.8) {
    return {
      label: "Excellent",
      variant: "default",
      message: "Your AI is performing well!",
    };
  } else if (successRate >= 0.6) {
    return {
      label: "Good",
      variant: "secondary",
      message: "Good performance with room for improvement.",
      actionable:
        "Review the quality criteria below to identify areas for refinement.",
    };
  } else if (successRate >= 0.4) {
    return {
      label: "Needs Attention",
      variant: "outline",
      message: "Success rate is below target.",
      actionable:
        "Consider refining your system prompt based on the criteria and recommendations below.",
    };
  } else {
    return {
      label: "Critical",
      variant: "destructive",
      message: "Low success rate indicates significant quality issues.",
      actionable:
        "Review your system prompt and model choice. Use the recommendations below as a guide.",
    };
  }
}

/**
 * Calculate confidence score from sample counts
 *
 * This is the canonical confidence calculation used throughout the app.
 * Matches the backend calculation in extract/route.ts
 */
export function calculateConfidenceScore(totalSamples: number): number {
  return Math.min(0.9, totalSamples / 20);
}

/**
 * Determine if sample size is adequate for high confidence
 *
 * High confidence requires:
 * - Confidence score >= 0.8 (which means >= 16 samples)
 * - At least 10 high-rated samples
 * - At least 5 low-rated samples
 */
export function isHighConfidenceSampleSize(
  totalSamples: number,
  highRatedCount: number,
  lowRatedCount: number,
): boolean {
  const confidenceScore = calculateConfidenceScore(totalSamples);
  return confidenceScore >= 0.8 && highRatedCount >= 10 && lowRatedCount >= 5;
}

export function interpretConfidence(
  confidenceScore: number,
  ratedCount: number,
): MetricInterpretation {
  if (confidenceScore >= 0.8) {
    return {
      label: "High Confidence",
      variant: "default",
      message: `Based on ${ratedCount} ratings, these patterns are reliable.`,
    };
  } else if (confidenceScore >= 0.5) {
    return {
      label: "Moderate Confidence",
      variant: "secondary",
      message: `Based on ${ratedCount} ratings.`,
      actionable: "Add 5-10 more ratings to increase pattern confidence.",
    };
  } else {
    return {
      label: "Low Confidence",
      variant: "outline",
      message: `Only ${ratedCount} ratings analyzed.`,
      actionable: "Rate at least 10 outputs for reliable pattern extraction.",
    };
  }
}

// ============================================================================
// Detailed Confidence Assessment (MVP Enhancement)
// ============================================================================

/**
 * Get status based on confidence score
 */
function getConfidenceStatus(confidence: number): ConfidenceStatus {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

/**
 * Calculate dimension-specific sample count from DimensionalAnalysis
 * Each dimension may have different sample sizes based on how it's calculated
 */
function getDimensionSampleCount(
  dimensions: DimensionalAnalysis,
  dimension: DimensionName,
): number {
  switch (dimension) {
    case "length":
      return (
        dimensions.length.sample_size.high + dimensions.length.sample_size.low
      );
    case "tone":
      // Tone doesn't have explicit sample_size, estimate from length
      return (
        dimensions.length.sample_size.high + dimensions.length.sample_size.low
      );
    case "structure":
      // Structure doesn't have explicit sample_size, estimate from length
      return (
        dimensions.length.sample_size.high + dimensions.length.sample_size.low
      );
    case "content":
      // Content doesn't have explicit sample_size, estimate from length
      return (
        dimensions.length.sample_size.high + dimensions.length.sample_size.low
      );
    case "errors":
      // Errors are typically from low-rated samples
      return dimensions.length.sample_size.low;
    default:
      return 0;
  }
}

/**
 * Generate recommendation for a dimension based on its confidence level
 */
function getDimensionRecommendation(
  dimension: DimensionName,
  confidence: number,
  sampleCount: number,
): string | undefined {
  const dimensionLabels: Record<DimensionName, string> = {
    length: "length patterns",
    tone: "tone variations",
    structure: "structural elements",
    content: "content specificity",
    errors: "error patterns",
  };

  if (confidence >= 0.8) {
    return undefined; // No recommendation needed
  }

  const label = dimensionLabels[dimension];
  const samplesNeeded = Math.ceil((0.8 - confidence) * 20);

  if (confidence < 0.5) {
    return `Add ${samplesNeeded}+ more scenarios testing ${label}`;
  }
  return `Add ${samplesNeeded} more scenarios to improve ${label} detection`;
}

/**
 * Generate prioritized recommended actions based on dimension breakdown
 */
function generateRecommendedActions(
  breakdown: ConfidenceDimensionBreakdown[],
): RecommendedAction[] {
  const actions: RecommendedAction[] = [];

  // Priority order: errors > tone > content > structure > length
  const priorityOrder: DimensionName[] = [
    "errors",
    "tone",
    "content",
    "structure",
    "length",
  ];

  // Sort breakdown by priority and filter to those needing improvement
  const needsImprovement = breakdown
    .filter((b) => b.status !== "high" && b.recommendation)
    .sort(
      (a, b) =>
        priorityOrder.indexOf(a.dimension) - priorityOrder.indexOf(b.dimension),
    );

  for (const dim of needsImprovement) {
    const samplesNeeded = Math.ceil((0.8 - dim.confidence) * 20);
    const projectedConfidence = Math.min(
      0.9,
      (dim.sampleCount + samplesNeeded) / 20,
    );

    const actionLabels: Record<DimensionName, string> = {
      errors: `Add ${samplesNeeded} edge cases to test error handling`,
      tone: `Add ${samplesNeeded} more scenarios testing tone variations`,
      content: `Add ${samplesNeeded} scenarios with varying content specificity`,
      structure: `Add ${samplesNeeded} scenarios with different structural elements`,
      length: `Add ${samplesNeeded} scenarios with varying lengths`,
    };

    const priority: "high" | "medium" | "low" =
      dim.status === "low" ? "high" : "medium";

    actions.push({
      action: actionLabels[dim.dimension],
      impact: `${dim.dimension.charAt(0).toUpperCase() + dim.dimension.slice(1)} confidence: ${(dim.confidence * 100).toFixed(0)}% → ${(projectedConfidence * 100).toFixed(0)}%`,
      priority,
    });
  }

  // Limit to top 3 most important actions
  return actions.slice(0, 3);
}

/**
 * Calculate confidence projections based on current sample count
 */
function calculateProjections(totalSamples: number): ConfidenceProjections {
  // Using the canonical formula: min(0.9, samples / 20)
  const at20Samples = Math.min(0.9, 20 / 20); // 0.9 (90%)
  const at30Samples = Math.min(0.9, 30 / 20); // 0.9 (capped at 90%)

  // To reach 85% confidence: 0.85 = samples / 20 => samples = 17
  // But we need to account for current samples
  const samplesFor85 = Math.ceil(0.85 * 20);
  const toProductionReady = Math.max(0, samplesFor85 - totalSamples);

  return {
    at20Samples,
    at30Samples,
    toProductionReady,
  };
}

/**
 * Get detailed confidence assessment for dimensional analysis
 *
 * Transforms raw confidence scores into actionable guidance:
 * - Breaks down confidence by dimension
 * - Provides status indicators (high/medium/low)
 * - Generates specific recommendations
 * - Projects confidence with more samples
 */
export function getDetailedConfidenceAssessment(
  dimensions: DimensionalAnalysis,
  totalSamples: number,
): DetailedConfidenceAssessment {
  const dimensionNames: DimensionName[] = [
    "length",
    "tone",
    "structure",
    "content",
    "errors",
  ];

  // Build dimension breakdown
  const breakdown: ConfidenceDimensionBreakdown[] = dimensionNames.map(
    (dimension) => {
      const confidence = dimensions[dimension].confidence;
      const sampleCount = getDimensionSampleCount(dimensions, dimension);
      const status = getConfidenceStatus(confidence);
      const recommendation = getDimensionRecommendation(
        dimension,
        confidence,
        sampleCount,
      );

      return {
        dimension,
        confidence,
        sampleCount,
        status,
        recommendation,
      };
    },
  );

  // Calculate overall confidence (average of all dimensions)
  const overallConfidence =
    breakdown.reduce((sum, b) => sum + b.confidence, 0) / breakdown.length;
  const overallStatus = getConfidenceStatus(overallConfidence);

  // Generate recommended actions
  const recommendedActions = generateRecommendedActions(breakdown);

  // Calculate projections
  const projections = calculateProjections(totalSamples);

  return {
    overall: overallConfidence,
    overallStatus,
    totalSamples,
    breakdown,
    recommendedActions,
    projections,
  };
}
