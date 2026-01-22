"use client";

/**
 * Hook for making POST API requests with safe JSON error handling
 *
 * This hook provides a consistent way to make POST requests that:
 * - Safely handles non-JSON error responses (proxy errors, timeouts, etc.)
 * - Returns typed response data
 * - Manages loading and error states
 *
 * @example
 * ```tsx
 * const { post, isLoading, error } = useApiPost<GenerateResponse>();
 *
 * const handleGenerate = async () => {
 *   const result = await post('/api/projects/123/generate');
 *   if (result) {
 *     console.log('Generated:', result.generated);
 *   }
 * };
 * ```
 */

import { useState, useCallback } from "react";

export interface UseApiPostResult<T> {
  /** Execute a POST request to the given endpoint */
  post: (endpoint: string, body?: Record<string, unknown>) => Promise<T | null>;
  /** Whether a request is currently in progress */
  isLoading: boolean;
  /** Error message if the last request failed */
  error: string | null;
  /** Clear the current error */
  clearError: () => void;
}

/**
 * Safely parses a response, handling both JSON and non-JSON error responses
 *
 * Uses clone() to allow fallback to text() if json() fails.
 * Handles test mocks that may not have clone() or text() methods.
 */
async function safeParseResponse<T>(response: Response): Promise<T> {
  // Clone response if possible so we can try text() if json() fails
  const clonedResponse =
    typeof response.clone === "function" ? response.clone() : null;

  try {
    return (await response.json()) as T;
  } catch (jsonError) {
    // JSON parsing failed - try to get raw text from the clone
    if (clonedResponse && typeof clonedResponse.text === "function") {
      try {
        const text = await clonedResponse.text();
        if (text) {
          throw new Error(text.slice(0, 200));
        }
      } catch (textError) {
        // If this is our truncated error message, rethrow it
        if (
          textError instanceof Error &&
          textError !== jsonError &&
          textError.message.length <= 200
        ) {
          throw textError;
        }
      }
    }
    // Return empty object for successful responses with no/invalid JSON
    return {} as T;
  }
}

/**
 * Hook for making POST API requests with safe error handling
 *
 * @returns Object with post function, loading state, and error
 */
export function useApiPost<T = unknown>(): UseApiPostResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const post = useCallback(
    async (
      endpoint: string,
      body?: Record<string, unknown>,
    ): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          ...(body && { body: JSON.stringify(body) }),
        });

        if (!response.ok) {
          let errorMessage = "Request failed";
          try {
            const errorData = await safeParseResponse<{ error?: string }>(
              response,
            );
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            errorMessage =
              parseError instanceof Error ? parseError.message : errorMessage;
          }
          throw new Error(errorMessage);
        }

        const data = await safeParseResponse<T>(response);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Request failed";
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return {
    post,
    isLoading,
    error,
    clearError,
  };
}
