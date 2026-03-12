export interface MetricInterpretation {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  message: string;
  actionable?: string;
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
  } else if (confidenceScore >= 0.4) {
    return {
      label: "Moderate Confidence",
      variant: "secondary",
      message: `Based on ${ratedCount} ratings.`,
      actionable:
        "Patterns are emerging. Add more ratings to strengthen confidence.",
    };
  } else {
    return {
      label: "Low Confidence",
      variant: "outline",
      message: `Only ${ratedCount} ratings analyzed.`,
      actionable:
        "Rate more outputs for reliable patterns. At least 8-10 rated outputs recommended.",
    };
  }
}
