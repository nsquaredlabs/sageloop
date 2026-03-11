/**
 * Database Column Types
 *
 * Type definitions for database columns.
 */

import type {
  ExtractionCriteria,
  FailureAnalysis,
  FailureCluster,
  QualityCriterion,
  RatingMetadata,
} from "./api";

// Re-export extraction types from API types for consistency
export type {
  ExtractionCriteria,
  FailureAnalysis,
  FailureCluster,
  QualityCriterion,
  RatingMetadata,
};

// ============================================================================
// Model Configuration
// ============================================================================

/**
 * Configuration for AI model used in a project
 *
 * Note: Temperature has been removed as of 2025 to align with
 * best practices for consistent outputs, especially for reasoning models.
 */
export interface ModelConfig {
  model: string;
  system_prompt?: string;
  variables?: Record<string, string>;
}

// ============================================================================
// Model Snapshot
// ============================================================================

/**
 * Snapshot of model configuration and usage at generation time
 *
 * Note: Temperature has been removed as of 2025 to align with
 * best practices for consistent outputs, especially for reasoning models.
 */
export interface ModelSnapshot {
  model: string;
  system_prompt?: string;
  variables?: Record<string, string>;
  version?: number;
  // OpenAI token usage
  completion_tokens?: number;
  prompt_tokens?: number;
  total_tokens?: number;
  // Anthropic token usage
  input_tokens?: number;
  output_tokens?: number;
}

// ============================================================================
// User API Keys
// ============================================================================

/**
 * User-provided API keys
 */
export interface UserApiKeys {
  openai?: string;
  anthropic?: string;
}
