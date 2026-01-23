"use client";

/**
 * Hook for polling job status during async generation
 *
 * This hook polls the job status endpoint and provides real-time progress updates.
 * It automatically stops polling when the job completes or fails.
 *
 * @example
 * ```tsx
 * const { startPolling, stopPolling, job, isPolling, error } = useJobPolling({
 *   onComplete: (job, outputs) => {
 *     console.log('Generation complete!', outputs);
 *     router.push(`/projects/${projectId}/outputs`);
 *   },
 *   onError: (job, error) => {
 *     console.error('Generation failed:', error);
 *   },
 *   onProgress: (job) => {
 *     console.log(`Progress: ${job.completed_scenarios}/${job.total_scenarios}`);
 *   },
 * });
 *
 * // Start polling when job is enqueued
 * const handleGenerate = async () => {
 *   const response = await post('/api/projects/123/generate');
 *   if (response?.job_id) {
 *     startPolling(response.job_id);
 *   }
 * };
 * ```
 */

import { useState, useCallback, useRef, useEffect } from "react";
import type { GenerationJob, GetJobStatusResponse } from "@/types/api";

export interface UseJobPollingOptions {
  /** Called when job completes successfully (status: completed or partial) */
  onComplete?: (
    job: GenerationJob,
    outputs: GetJobStatusResponse["outputs"],
  ) => void;
  /** Called when job fails (status: failed) */
  onError?: (job: GenerationJob, error: string) => void;
  /** Called on each poll with updated progress */
  onProgress?: (job: GenerationJob) => void;
  /** Polling interval in milliseconds (default: 2000) */
  pollInterval?: number;
  /** Maximum polling duration in milliseconds (default: 300000 = 5 minutes) */
  maxPollDuration?: number;
}

export interface UseJobPollingResult {
  /** Start polling for a specific job */
  startPolling: (jobId: string) => void;
  /** Stop polling */
  stopPolling: () => void;
  /** Current job state (null if not polling) */
  job: GenerationJob | null;
  /** Whether polling is currently active */
  isPolling: boolean;
  /** Error message if polling failed */
  error: string | null;
  /** Progress percentage (0-100) */
  progress: number;
}

/**
 * Hook for polling generation job status
 */
export function useJobPolling(
  options: UseJobPollingOptions = {},
): UseJobPollingResult {
  const {
    onComplete,
    onError,
    onProgress,
    pollInterval = 2000,
    maxPollDuration = 300000, // 5 minutes
  } = options;

  const [job, setJob] = useState<GenerationJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs to track polling state
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const jobIdRef = useRef<string | null>(null);

  // Calculate progress percentage
  const progress = job
    ? Math.round((job.completed_scenarios / job.total_scenarios) * 100)
    : 0;

  // Stop polling and clean up
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    startTimeRef.current = null;
    jobIdRef.current = null;
  }, []);

  // Fetch job status
  const fetchJobStatus = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch job status");
      }

      const data: GetJobStatusResponse = await response.json();
      return data;
    } catch (err) {
      throw err instanceof Error
        ? err
        : new Error("Failed to fetch job status");
    }
  }, []);

  // Poll once
  const pollOnce = useCallback(async () => {
    const jobId = jobIdRef.current;
    if (!jobId) return;

    // Check if we've exceeded max poll duration
    const elapsed = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : 0;
    if (elapsed > maxPollDuration) {
      setError(
        "Generation timed out. Please check the project page for status.",
      );
      stopPolling();
      return;
    }

    try {
      const data = await fetchJobStatus(jobId);
      setJob(data.job);
      setError(null);

      // Call progress callback
      onProgress?.(data.job);

      // Check if job is finished
      if (data.job.status === "completed" || data.job.status === "partial") {
        stopPolling();
        onComplete?.(data.job, data.outputs);
      } else if (data.job.status === "failed") {
        stopPolling();
        const errorMessage = data.job.errors?.[0]?.error || "Generation failed";
        setError(errorMessage);
        onError?.(data.job, errorMessage);
      }
    } catch (err) {
      console.error("Error polling job status:", err);
      // Don't stop polling on transient errors, but do update error state
      setError(
        err instanceof Error ? err.message : "Failed to poll job status",
      );
    }
  }, [
    fetchJobStatus,
    maxPollDuration,
    onComplete,
    onError,
    onProgress,
    stopPolling,
  ]);

  // Start polling for a job
  const startPolling = useCallback(
    (jobId: string) => {
      // Stop any existing polling
      stopPolling();

      // Set up new polling
      jobIdRef.current = jobId;
      startTimeRef.current = Date.now();
      setIsPolling(true);
      setError(null);
      setJob(null);

      // Poll immediately
      pollOnce();

      // Set up interval polling
      intervalRef.current = setInterval(pollOnce, pollInterval);
    },
    [pollInterval, pollOnce, stopPolling],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    startPolling,
    stopPolling,
    job,
    isPolling,
    error,
    progress,
  };
}
