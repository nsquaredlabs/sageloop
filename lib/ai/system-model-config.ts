/**
 * System Model Configuration
 *
 * Centralized configuration for the AI model used for system operations:
 * - Pattern extraction (analyzing rated outputs)
 * - Prompt fix integration (applying fixes to system prompts)
 * - Future: Insights generation, quality analysis, etc.
 *
 * The model is read from sageloop.config.yaml (`system_model` field),
 * falling back to claude-haiku-4-5-20251001 if not configured.
 */

import { getConfig } from "@/lib/config";

function resolveSystemModel(): {
  provider: "openai" | "anthropic";
  model: string;
} {
  const config = getConfig();
  const model = config.system_model || "claude-haiku-4-5-20251001";
  const provider: "openai" | "anthropic" = model.includes("claude")
    ? "anthropic"
    : "openai";
  return { provider, model };
}

export const SYSTEM_MODEL_CONFIG = {
  get provider(): "openai" | "anthropic" {
    return resolveSystemModel().provider;
  },
  get model(): string {
    return resolveSystemModel().model;
  },
};

/**
 * Type representing the system model configuration
 */
export type SystemModelConfig = typeof SYSTEM_MODEL_CONFIG;
