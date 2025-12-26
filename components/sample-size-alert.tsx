/**
 * SampleSizeAlert Component
 *
 * Provides guidance on sample size adequacy for statistical confidence.
 * Shows success state when samples are adequate, warning when more are needed.
 *
 * Follows sageloop/CLAUDE.md design patterns:
 * - Uses semantic Alert components
 * - Semantic color tokens (border-green-200, bg-green-50, etc.)
 * - Clear actionable guidance
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  calculateConfidenceScore,
  isHighConfidenceSampleSize,
} from "@/lib/metrics";

interface SampleSizeAlertProps {
  totalSamples: number;
  highRatedCount: number;
  lowRatedCount: number;
  recommendedMinimum?: number;
}

export function SampleSizeAlert({
  totalSamples,
  highRatedCount,
  lowRatedCount,
  recommendedMinimum = 20,
}: SampleSizeAlertProps) {
  // Calculate if sample size is adequate for high confidence (>= 80%)
  // Uses shared calculation from lib/metrics to match backend confidence score
  const isAdequate = isHighConfidenceSampleSize(
    totalSamples,
    highRatedCount,
    lowRatedCount,
  );
  const confidenceScore = calculateConfidenceScore(totalSamples);

  // Calculate what's needed for high confidence (80%)
  // High confidence requires >= 16 total samples (16/20 = 80%)
  const needsMoreTotal = Math.max(0, 16 - totalSamples);
  const needsMoreHigh = Math.max(0, 10 - highRatedCount);
  const needsMoreLow = Math.max(0, 5 - lowRatedCount);

  // Determine confidence level for display
  const confidenceLevel =
    confidenceScore >= 0.8 ? "High" : confidenceScore >= 0.6 ? "Medium" : "Low";

  if (isAdequate) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-900 dark:text-green-100">
          High Confidence ({(confidenceScore * 100).toFixed(0)}%)
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          You have {totalSamples} rated output{totalSamples !== 1 ? "s" : ""} (
          {highRatedCount} high-rated, {lowRatedCount} low-rated). This provides
          strong statistical confidence in the extracted patterns.
        </AlertDescription>
      </Alert>
    );
  }

  // Show warning if confidence is below 80%
  return (
    <Alert
      variant={confidenceScore >= 0.6 ? "default" : "destructive"}
      className={
        confidenceScore >= 0.6
          ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800"
          : ""
      }
    >
      <AlertCircle
        className={
          confidenceScore >= 0.6
            ? "h-4 w-4 text-yellow-600 dark:text-yellow-400"
            : "h-4 w-4"
        }
      />
      <AlertTitle
        className={
          confidenceScore >= 0.6 ? "text-yellow-900 dark:text-yellow-100" : ""
        }
      >
        {confidenceLevel} Confidence ({(confidenceScore * 100).toFixed(0)}%):
        More Samples Recommended
      </AlertTitle>
      <AlertDescription
        className={
          confidenceScore >= 0.6 ? "text-yellow-800 dark:text-yellow-200" : ""
        }
      >
        <p>
          You have {totalSamples} rated output{totalSamples !== 1 ? "s" : ""} (
          {highRatedCount} high-rated, {lowRatedCount} low-rated).
        </p>
        <p className="mt-2 font-medium">
          For high confidence (≥80%), we recommend:
        </p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            • At least 16 total rated outputs
            {needsMoreTotal > 0 && (
              <span className="font-medium"> (need {needsMoreTotal} more)</span>
            )}
          </li>
          <li>
            • At least 10 high-rated (4-5 stars)
            {needsMoreHigh > 0 && (
              <span className="font-medium"> (need {needsMoreHigh} more)</span>
            )}
          </li>
          <li>
            • At least 5 low-rated (1-2 stars)
            {needsMoreLow > 0 && (
              <span className="font-medium"> (need {needsMoreLow} more)</span>
            )}
          </li>
        </ul>
        <p className="mt-2 text-sm">
          More samples = higher confidence in extracted criteria
        </p>
      </AlertDescription>
    </Alert>
  );
}
