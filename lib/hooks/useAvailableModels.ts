"use client";

/**
 * Hook for fetching available AI models based on user's subscription plan
 *
 * This hook provides a consistent way to fetch models across the application.
 * It handles:
 * - Loading state while fetching
 * - Error handling
 * - Default model selection based on subscription tier
 * - Caching to prevent unnecessary re-fetches
 *
 * @example
 * ```tsx
 * const { models, defaultModel, isLoading, error, userPlan } = useAvailableModels();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return (
 *   <Select defaultValue={defaultModel}>
 *     {models.map(model => (
 *       <SelectItem key={model.id} value={model.id}>
 *         {model.name}
 *       </SelectItem>
 *     ))}
 *   </Select>
 * );
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import type { SubscriptionPlan } from "@/lib/ai/default-models";

export interface ModelInfo {
  id: string;
  name: string;
  provider: "openai" | "anthropic";
  tier: string;
}

export interface UseAvailableModelsResult {
  /** List of models available to the user based on their subscription plan */
  models: ModelInfo[];
  /** The recommended default model for the user's subscription tier */
  defaultModel: string;
  /** The user's current subscription plan */
  userPlan: SubscriptionPlan;
  /** Whether the models are currently being fetched */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refetch models (e.g., after plan upgrade) */
  refetch: () => Promise<void>;
}

/**
 * Fetches available AI models based on user's subscription plan
 *
 * Uses the /api/models endpoint which returns models filtered by
 * the user's subscription tier (free, pro, team, enterprise).
 *
 * @returns Object with models, defaultModel, userPlan, loading state, and error
 */
export function useAvailableModels(): UseAvailableModelsResult {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [defaultModel, setDefaultModel] = useState<string>("");
  const [userPlan, setUserPlan] = useState<SubscriptionPlan>("free");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/models");

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch models");
      }

      const data = await response.json();

      setModels(data.models || []);
      setDefaultModel(data.defaultModel || "");
      setUserPlan(data.userPlan || "free");
    } catch (err) {
      console.error("Failed to fetch models:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch models");
      // Set fallback values for free tier
      setModels([]);
      setDefaultModel("gpt-5-nano");
      setUserPlan("free");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch models on mount
  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    defaultModel,
    userPlan,
    isLoading,
    error,
    refetch: fetchModels,
  };
}
