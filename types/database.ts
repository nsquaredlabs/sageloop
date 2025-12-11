/**
 * Database JSONB Column Types
 *
 * Type definitions for JSONB columns in the database.
 * These replace "as any" casts throughout the codebase.
 */

import type { Database } from './supabase';
import type {
  ExtractionCriteria,
  FailureAnalysis,
  FailureCluster,
  QualityCriterion,
  RatingMetadata,
} from './api';

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
 * Stored in projects.model_config JSONB column
 */
export interface ModelConfig {
  model: string;
  temperature?: number;
  system_prompt?: string;
}

// ============================================================================
// Model Snapshot
// ============================================================================

/**
 * Snapshot of model configuration and usage at generation time
 * Stored in outputs.model_snapshot JSONB column
 */
export interface ModelSnapshot {
  model: string;
  temperature: number;
  system_prompt?: string;
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
// User API Keys (from RPC)
// ============================================================================

/**
 * Decrypted API keys returned from get_workbench_api_keys RPC
 */
export interface UserApiKeys {
  openai?: string;
  anthropic?: string;
}

// ============================================================================
// Augmented Supabase Types with JSONB Structure
// ============================================================================

/**
 * Augment generated Supabase types with proper JSONB column types
 */

export type Project = Omit<Database['public']['Tables']['projects']['Row'], 'model_config'> & {
  model_config: ModelConfig;
};

export type Output = Omit<Database['public']['Tables']['outputs']['Row'], 'model_snapshot'> & {
  model_snapshot: ModelSnapshot;
};

export type Extraction = Omit<Database['public']['Tables']['extractions']['Row'], 'criteria'> & {
  criteria: ExtractionCriteria;
};

export type Rating = Database['public']['Tables']['ratings']['Row'] & {
  metadata?: RatingMetadata;
};

export type Metric = Omit<Database['public']['Tables']['metrics']['Row'], 'criteria_breakdown'> & {
  criteria_breakdown: Record<string, string>;
};
