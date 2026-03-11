"use client";

/**
 * Hook for fetching available AI models.
 *
 * This hook provides a consistent way to fetch models across the application.
 * It handles:
 * - Loading state while fetching
 * - Error handling
 * - Default model selection
 * - Caching to prevent unnecessary re-fetches
 *
 * @example
 * ```tsx
 * const { models, defaultModel, isLoading, error } = useAvailableModels();
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

export interface ModelInfo {
  id: string;
  name: string;
  provider: "openai" | "anthropic";
}

export interface UseAvailableModelsResult {
  /** List of all available models */
  models: ModelInfo[];
  /** The recommended default model */
  defaultModel: string;
  /** Whether the models are currently being fetched */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refetch models */
  refetch: () => Promise<void>;
}

/**
 * Fetches available AI models from the /api/models endpoint.
 */
export function useAvailableModels(): UseAvailableModelsResult {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [defaultModel, setDefaultModel] = useState<string>("");
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
      setDefaultModel(data.defaultModel || "gpt-4o-mini");
    } catch (err) {
      console.error("Failed to fetch models:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch models");
      setModels([]);
      setDefaultModel("gpt-4o-mini");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  return {
    models,
    defaultModel,
    isLoading,
    error,
    refetch: fetchModels,
  };
}
