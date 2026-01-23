"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApiPost, useJobPolling } from "@/lib/hooks";
import type { UseOnboardingState } from "@/lib/hooks/useOnboardingState";
import type { EnqueueGenerationResponse } from "@/types/api";

interface Step3GenerateProps {
  projectId: string;
  scenarioCount: number;
  model: string;
  projectName: string;
  onSkip: () => void;
  onBack: () => void;
  setGenerating: UseOnboardingState["setGenerating"];
  setGenerationProgress: UseOnboardingState["setGenerationProgress"];
  isGenerating: boolean;
  generationProgress: { completed: number; total: number };
}

type GenerationState = "ready" | "generating" | "complete" | "error";

interface GenerationError {
  message: string;
  details?: string;
}

export function Step3Generate({
  projectId,
  scenarioCount,
  model,
  projectName,
  onSkip,
  onBack,
  setGenerating,
  setGenerationProgress,
  isGenerating,
  generationProgress,
}: Step3GenerateProps) {
  const router = useRouter();
  const { post, error: apiError } = useApiPost<EnqueueGenerationResponse>();
  const [generationState, setGenerationState] = useState<GenerationState>(
    isGenerating ? "generating" : "ready",
  );
  const [error, setError] = useState<GenerationError | null>(null);

  // Estimated time calculation (~3 seconds per output)
  const estimatedSeconds = Math.ceil(scenarioCount * 3);
  const estimatedTimeStr =
    estimatedSeconds < 60
      ? `~${estimatedSeconds} seconds`
      : `~${Math.ceil(estimatedSeconds / 60)} minute${Math.ceil(estimatedSeconds / 60) > 1 ? "s" : ""}`;

  // Job polling hook for async generation
  const {
    startPolling,
    job,
    isPolling,
    error: pollingError,
    progress,
  } = useJobPolling({
    onComplete: async (completedJob, _outputs) => {
      // Update progress with final results
      setGenerationProgress({
        completed: completedJob.completed_scenarios,
        total: completedJob.total_scenarios,
      });

      if (completedJob.failed_scenarios > 0) {
        // Partial failure
        setError({
          message: `Generated ${completedJob.completed_scenarios}/${completedJob.total_scenarios} outputs. ${completedJob.failed_scenarios} failed.`,
          details: "You can retry failed scenarios from the project page.",
        });
      }

      setGenerationState("complete");
      setGenerating(false);

      // Mark onboarding as complete
      await post("/api/onboarding/complete");
    },
    onError: (failedJob, errorMessage) => {
      setError({
        message: errorMessage,
        details: "Please try again or skip for now.",
      });
      setGenerationState("error");
      setGenerating(false);
    },
    onProgress: (progressJob) => {
      setGenerationProgress({
        completed: progressJob.completed_scenarios,
        total: progressJob.total_scenarios,
      });
    },
    pollInterval: 2000,
  });

  // Sync polling progress to local state
  useEffect(() => {
    if (job) {
      setGenerationProgress({
        completed: job.completed_scenarios,
        total: job.total_scenarios,
      });
    }
  }, [job, setGenerationProgress]);

  // Handle polling errors
  useEffect(() => {
    if (pollingError && generationState === "generating") {
      // Only show error if it persists
      console.warn("Polling error (will retry):", pollingError);
    }
  }, [pollingError, generationState]);

  const handleGenerate = async () => {
    setError(null);
    setGenerationState("generating");
    setGenerating(true);
    setGenerationProgress({ completed: 0, total: scenarioCount });

    // Enqueue the generation job
    const result = await post(`/api/projects/${projectId}/generate`);

    if (!result || !result.job_id) {
      setError({
        message: apiError || "Failed to start generation",
        details: "Please try again or skip for now.",
      });
      setGenerationState("error");
      setGenerating(false);
      return;
    }

    // Start polling for job progress
    startPolling(result.job_id);
  };

  // Complete state
  if (generationState === "complete") {
    return (
      <div className="text-center py-12 space-y-8">
        {/* Success Icon */}
        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-2">All outputs generated!</h2>
          <p className="text-muted-foreground">
            Your project is ready. See all your AI outputs at once!
          </p>
        </div>

        {error && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-left">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {error.message}
            </p>
            {error.details && (
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                {error.details}
              </p>
            )}
          </div>
        )}

        <Link href={`/projects/${projectId}/outputs`} className="inline-block">
          <Button size="lg" className="px-8">
            View Outputs
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Project Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generation Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Project</p>
              <p className="font-medium">{projectName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Model</p>
              <p className="font-medium">{model}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Scenarios</p>
              <p className="font-medium">{scenarioCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated time</p>
              <p className="font-medium">{estimatedTimeStr}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Status */}
      {generationState === "generating" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <svg
              className="w-5 h-5 animate-spin text-primary"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="font-medium">
              {job?.status === "processing"
                ? "Generating outputs..."
                : "Starting generation..."}
            </span>
          </div>
          <Progress
            value={
              progress ||
              (generationProgress.completed / generationProgress.total) * 100
            }
            className="h-3"
          />
          <p className="text-center text-sm text-muted-foreground">
            {job
              ? `${job.completed_scenarios}/${job.total_scenarios} complete`
              : `${generationProgress.completed}/${generationProgress.total} complete`}
          </p>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-muted-foreground">
            Ready to generate {scenarioCount} outputs using {model}
          </p>
        </div>
      )}

      {/* Error State */}
      {generationState === "error" && error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
          <p className="font-medium">{error.message}</p>
          {error.details && (
            <p className="text-sm mt-1 opacity-80">{error.details}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={generationState === "generating"}
        >
          Back to Step 2
        </Button>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onSkip}
            disabled={generationState === "generating"}
          >
            Do this later
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={generationState === "generating"}
          >
            {generationState === "generating"
              ? "Generating..."
              : generationState === "error"
                ? "Retry"
                : "Generate"}
          </Button>
        </div>
      </div>
    </div>
  );
}
