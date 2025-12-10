'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';

interface GenerateOutputsButtonProps {
  projectId: string;
  scenarioCount: number;
}

export function GenerateOutputsButton({ projectId, scenarioCount }: GenerateOutputsButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate outputs');
      }

      const result = await response.json();

      // Refresh the page data to get new outputs, then navigate
      router.refresh();
      router.push(`/projects/${projectId}/outputs`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate outputs');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating outputs...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Outputs
            <span className="ml-2 text-xs opacity-75">
              ({scenarioCount} scenario{scenarioCount !== 1 ? 's' : ''})
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
