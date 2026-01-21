"use client";

import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface UsageMeterProps {
  used: number;
  limit: number;
  resetDate: string;
  modelTier?: "standard" | "premium";
}

/**
 * Calculate the next reset date from an original reset date.
 * If the reset date is in the past, calculates the next upcoming reset date.
 * Reset dates are always on the 1st of the month at midnight UTC.
 *
 * This is a client-side fallback for cases where the database hasn't been
 * updated yet (e.g., cron job hasn't run, or migration not applied).
 *
 * @param originalResetDate - The stored reset date from the database
 * @returns ISO string of the next reset date
 */
export function calculateNextResetDate(originalResetDate: string): string {
  const resetDate = new Date(originalResetDate);
  const now = new Date();

  // If the reset date is already in the future, return it as-is
  if (resetDate > now) {
    return originalResetDate;
  }

  // Calculate the next reset date (first of a future month)
  // Start from the original reset date and keep adding months until we're in the future
  while (resetDate <= now) {
    // Move to the first of the next month
    resetDate.setUTCMonth(resetDate.getUTCMonth() + 1);
    resetDate.setUTCDate(1);
    resetDate.setUTCHours(0, 0, 0, 0);
  }

  return resetDate.toISOString();
}

export function UsageMeter({
  used,
  limit,
  resetDate,
  modelTier = "standard",
}: UsageMeterProps) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const remaining = Math.max(limit - used, 0);

  // Color coding: green (<80%), yellow (80-99%), red (100%)
  const getBadgeVariant = ():
    | "default"
    | "secondary"
    | "destructive"
    | "outline" => {
    if (percentage >= 100) return "destructive";
    if (percentage >= 80) return "outline";
    return "secondary";
  };

  const getProgressColor = () => {
    if (percentage >= 100) return "bg-destructive";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-primary";
  };

  const badgeVariant = getBadgeVariant();
  const progressColor = getProgressColor();

  // Calculate effective reset date (handles stale dates from database)
  const effectiveResetDate = calculateNextResetDate(resetDate);

  // Format reset date for display
  const resetDateFormatted = new Date(effectiveResetDate).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {modelTier === "premium" ? "Premium Outputs" : "Standard Outputs"}
            </CardTitle>
            <CardDescription>This billing period</CardDescription>
          </div>
          <Badge variant={badgeVariant}>
            {percentage >= 100
              ? "Quota Exceeded"
              : percentage >= 80
                ? "Running Low"
                : "Active"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {used.toLocaleString()} of {limit.toLocaleString()} used
            </span>
            <span className="font-semibold">
              {remaining.toLocaleString()} remaining
            </span>
          </div>
          <Progress
            value={percentage}
            className="h-2"
            indicatorClassName={progressColor}
          />
        </div>

        {/* Reset date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Resets on {resetDateFormatted}</span>
        </div>

        {/* Warning message when quota is high */}
        {percentage >= 80 && percentage < 100 && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3 text-sm text-yellow-900 dark:text-yellow-100">
            You've used {percentage.toFixed(0)}% of your outputs. Consider
            upgrading for higher limits.
          </div>
        )}

        {/* Quota exceeded message */}
        {percentage >= 100 && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            You've reached your output limit for this period. Upgrade to
            continue generating outputs.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
