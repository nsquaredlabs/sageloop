"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useApiPost, useJobPolling } from "@/lib/hooks";
import type { EnqueueGenerationResponse } from "@/types/api";

interface GenerateOutputsButtonProps {
  projectId: string;
  scenarioCount: number;
}

export function GenerateOutputsButton({
  projectId,
  scenarioCount,
}: GenerateOutputsButtonProps) {
  const router = useRouter();
  const { post, error: apiError } = useApiPost<EnqueueGenerationResponse>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Job polling hook for async generation
  const { startPolling, stopPolling, job, progress } = useJobPolling({
    onComplete: (_job, _outputs) => {
      setIsGenerating(false);
      router.refresh();
      router.push(`/projects/${projectId}/outputs`);
    },
    onError: (_job, errorMessage) => {
      setIsGenerating(false);
      setError(errorMessage);
    },
    pollInterval: 2000,
  });

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);

    // Enqueue the generation job
    const result = await post(`/api/projects/${projectId}/generate`);

    if (!result || !result.job_id) {
      setError(apiError || "Failed to start generation");
      setIsGenerating(false);
      return;
    }

    // Start polling for job progress
    startPolling(result.job_id);
  };

  const isProcessing = isGenerating && job?.status === "processing";
  const isPending = isGenerating && (!job || job.status === "pending");

  return (
    <div className="space-y-2">
      <Button
        variant="default"
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isPending ? "Starting..." : "Generating outputs..."}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Outputs
            <span className="ml-2 text-xs opacity-75">
              {scenarioCount} scenario{scenarioCount !== 1 ? "s" : ""}
            </span>
          </>
        )}
      </Button>

      {/* Progress bar during generation */}
      {isGenerating && job && (
        <div className="space-y-1">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {job.completed_scenarios}/{job.total_scenarios} complete
          </p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
