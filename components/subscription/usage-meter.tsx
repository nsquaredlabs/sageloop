'use client';

import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface UsageMeterProps {
  used: number;
  limit: number;
  resetDate: string;
  modelTier?: 'standard' | 'premium';
}

export function UsageMeter({ used, limit, resetDate, modelTier = 'standard' }: UsageMeterProps) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const remaining = Math.max(limit - used, 0);

  // Color coding: green (<80%), yellow (80-99%), red (100%)
  const getBadgeVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (percentage >= 100) return 'destructive';
    if (percentage >= 80) return 'outline';
    return 'secondary';
  };

  const getProgressColor = () => {
    if (percentage >= 100) return 'bg-destructive';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-primary';
  };

  const badgeVariant = getBadgeVariant();
  const progressColor = getProgressColor();

  // Format reset date
  const resetDateFormatted = new Date(resetDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {modelTier === 'premium' ? 'Premium Outputs' : 'Standard Outputs'}
            </CardTitle>
            <CardDescription>This billing period</CardDescription>
          </div>
          <Badge variant={badgeVariant}>
            {percentage >= 100 ? 'Quota Exceeded' : percentage >= 80 ? 'Running Low' : 'Active'}
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
          <Progress value={percentage} className="h-2" indicatorClassName={progressColor} />
        </div>

        {/* Reset date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Resets on {resetDateFormatted}</span>
        </div>

        {/* Warning message when quota is high */}
        {percentage >= 80 && percentage < 100 && (
          <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-3 text-sm text-yellow-900 dark:text-yellow-100">
            You've used {percentage.toFixed(0)}% of your outputs. Consider upgrading for higher limits.
          </div>
        )}

        {/* Quota exceeded message */}
        {percentage >= 100 && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            You've reached your output limit for this period. Upgrade to continue generating outputs.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
