'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface QuotaWarningBannerProps {
  used: number;
  limit: number;
  planId: string;
}

export function QuotaWarningBanner({ used, limit, planId }: QuotaWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const percentage = limit > 0 ? (used / limit) * 100 : 0;

  // Only show warning when usage >= 80%
  if (percentage < 80 || dismissed) {
    return null;
  }

  const isExceeded = percentage >= 100;
  const remaining = Math.max(limit - used, 0);

  return (
    <Alert variant={isExceeded ? 'destructive' : 'default'} className="relative">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isExceeded ? 'Quota Exceeded' : 'Running Low on Outputs'}
      </AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>
          {isExceeded ? (
            <>You've used all {limit.toLocaleString()} outputs this month.</>
          ) : (
            <>
              You've used {used.toLocaleString()} of {limit.toLocaleString()} outputs ({percentage.toFixed(0)}%).
              {remaining > 0 && <> Only {remaining.toLocaleString()} remaining.</>}
            </>
          )}
          {' '}
          {planId === 'free' && (
            <span className="font-semibold">
              Join the waitlist for higher limits.
            </span>
          )}
        </span>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings/subscription">
              View Usage
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
