/**
 * SmartAlertBanner Component
 *
 * Displays a single, prioritized contextual alert for the Insights page.
 * Replaces multiple competing alerts with intelligent priority logic.
 *
 * Priority Order:
 * 1. Failure Alert (failure rate > 20%)
 * 2. Sample Size Warning (confidence < 80%)
 * 3. Success Celebration (success > 80% AND confidence > 85%)
 */

"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface SmartAlertBannerProps {
  failureRate: number;
  confidence: number;
  successRate: number;
  failureCount: number;
  needsMore: number;
}

type AlertPriority = "failure" | "sample_size" | "success" | null;

function getAlertPriority(
  failureRate: number,
  confidence: number,
  successRate: number,
): AlertPriority {
  if (failureRate > 0.2) return "failure";
  if (confidence < 0.8) return "sample_size";
  if (successRate > 0.8 && confidence > 0.85) return "success";
  return null;
}

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function SmartAlertBanner({
  failureRate,
  confidence,
  successRate,
  failureCount,
  needsMore,
}: SmartAlertBannerProps) {
  const priority = getAlertPriority(failureRate, confidence, successRate);

  if (!priority) return null;

  // Failure Alert (Highest Priority)
  if (priority === "failure") {
    return (
      <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 mb-6">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertTitle className="text-red-900 dark:text-red-100">
          Action Required: {failureCount} output{failureCount !== 1 ? "s" : ""}{" "}
          failing
        </AlertTitle>
        <AlertDescription className="text-red-800 dark:text-red-200">
          <p className="mb-2">
            {Math.round(failureRate * 100)}% of outputs received low ratings.
            Review Failure Analysis for suggested fixes.
          </p>
          <Button
            variant="link"
            className="p-0 h-auto text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
            onClick={() => scrollToSection("failures")}
          >
            Jump to Failure Analysis
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Sample Size Warning (Medium Priority)
  if (priority === "sample_size") {
    const confidencePercent = Math.round(confidence * 100);
    return (
      <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 mb-6">
        <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertTitle className="text-yellow-900 dark:text-yellow-100">
          {confidencePercent < 40 ? "Early patterns" : "Emerging patterns"} (
          {confidencePercent}%): More samples recommended
        </AlertTitle>
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <p>
            Add <strong>{needsMore} more rated outputs</strong> for stronger
            patterns. Current patterns may shift with more data.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  // Success Celebration (Low Priority)
  if (priority === "success") {
    const successPercent = Math.round(successRate * 100);
    const confidencePercent = Math.round(confidence * 100);
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 mb-6">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-900 dark:text-green-100">
          Production Ready: High confidence patterns detected
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          <p className="mb-2">
            <strong>{successPercent}% success rate</strong> with{" "}
            <strong>{confidencePercent}% confidence</strong>. Patterns are
            statistically reliable and ready to export.
          </p>
          <Button
            variant="link"
            className="p-0 h-auto text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
            onClick={() => scrollToSection("fingerprint")}
          >
            View Quality Fingerprint
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
