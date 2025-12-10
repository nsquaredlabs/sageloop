'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

interface AnalyzePatternsButtonProps {
  projectId: string;
  ratedCount: number;
}

export function AnalyzePatternsButton({ projectId, ratedCount }: AnalyzePatternsButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze patterns');
      }

      const result = await response.json();

      // Navigate to insights page
      router.push(`/projects/${projectId}/insights`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze patterns');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        onClick={handleAnalyze}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing patterns...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Analyze Patterns
            <span className="ml-2 text-xs opacity-75">
              ({ratedCount} rating{ratedCount !== 1 ? 's' : ''})
            </span>
          </>
        )}
      </Button>
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
