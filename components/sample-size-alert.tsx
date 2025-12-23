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
  // Calculate if sample size is adequate for statistical confidence
  const isAdequate =
    totalSamples >= recommendedMinimum &&
    highRatedCount >= 10 &&
    lowRatedCount >= 5;

  // Calculate what's needed
  const needsMoreTotal = Math.max(0, recommendedMinimum - totalSamples);
  const needsMoreHigh = Math.max(0, 10 - highRatedCount);
  const needsMoreLow = Math.max(0, 5 - lowRatedCount);

  if (isAdequate) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-900 dark:text-green-100">
          High Confidence Sample Size
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          You have {totalSamples} rated output{totalSamples !== 1 ? "s" : ""} (
          {highRatedCount} high-rated, {lowRatedCount} low-rated). This provides
          strong statistical confidence in the extracted patterns.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Low Confidence: More Samples Recommended</AlertTitle>
      <AlertDescription>
        <p>
          You have {totalSamples} rated output{totalSamples !== 1 ? "s" : ""} (
          {highRatedCount} high-rated, {lowRatedCount} low-rated).
        </p>
        <p className="mt-2 font-medium">For robust patterns, we recommend:</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            • At least {recommendedMinimum} total rated outputs
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
