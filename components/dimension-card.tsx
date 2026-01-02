/**
 * DimensionCard Component
 *
 * Displays dimensional analysis insights for AI output quality patterns.
 * Shows high-rated vs low-rated patterns with confidence scoring.
 *
 * Follows sageloop/CLAUDE.md design patterns:
 * - Semantic color tokens (bg-primary, text-foreground, etc.)
 * - Card-based UI with proper spacing
 * - Accessible contrast for dark mode
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";
import type { ReactNode } from "react";

interface DimensionCardProps {
  title: string;
  icon: ReactNode;
  insight: string;
  confidence: number;
  highRatedPattern: ReactNode;
  lowRatedPattern: ReactNode;
  metrics?: { label: string; value: string | number }[];
}

export function DimensionCard({
  title,
  icon,
  insight,
  confidence,
  highRatedPattern,
  lowRatedPattern,
  metrics,
}: DimensionCardProps) {
  // Determine confidence badge variant
  const confidenceBadge =
    confidence > 0.8
      ? { variant: "default" as const, label: "High Confidence" }
      : confidence > 0.6
        ? { variant: "secondary" as const, label: "Medium Confidence" }
        : { variant: "outline" as const, label: "Low Confidence" };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <Badge variant={confidenceBadge.variant}>
            {(confidence * 100).toFixed(0)}% confidence
          </Badge>
        </div>
        <CardDescription>{insight}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* High-rated pattern */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>High-Rated (4-5 stars)</span>
            </div>
            <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm border border-green-200 dark:border-green-800">
              {highRatedPattern}
            </div>
          </div>

          {/* Low-rated pattern */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
              <XCircle className="h-4 w-4" />
              <span>Low-Rated (1-2 stars)</span>
            </div>
            <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm border border-red-200 dark:border-red-800">
              {lowRatedPattern}
            </div>
          </div>
        </div>

        {/* Optional metrics */}
        {metrics && metrics.length > 0 && (
          <div className="flex gap-4 text-sm text-muted-foreground border-t pt-3">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="font-medium">{metric.label}:</span>
                <span className="text-foreground">{metric.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
