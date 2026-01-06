/**
 * Database JSONB Column Types
 *
 * Type definitions for JSONB columns in the database.
 * These replace "as any" casts throughout the codebase.
 */

import type { Database } from "./supabase";
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
 * Stored in projects.model_config JSONB column
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
 * Stored in outputs.model_snapshot JSONB column
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

export type Project = Omit<
  Database["public"]["Tables"]["projects"]["Row"],
  "model_config"
> & {
  model_config: ModelConfig;
};

export type Output = Omit<
  Database["public"]["Tables"]["outputs"]["Row"],
  "model_snapshot"
> & {
  model_snapshot: ModelSnapshot;
};

export type Extraction = Omit<
  Database["public"]["Tables"]["extractions"]["Row"],
  "criteria"
> & {
  criteria: ExtractionCriteria;
};

export type Rating = Database["public"]["Tables"]["ratings"]["Row"] & {
  metadata?: RatingMetadata;
};

export type Metric = Omit<
  Database["public"]["Tables"]["metrics"]["Row"],
  "criteria_breakdown"
> & {
  criteria_breakdown: Record<string, string>;
};

// ============================================================================
// Subscription System Types (Phase 1)
// ============================================================================

/**
 * Subscription plan features stored in JSONB
 * Stored in subscription_plans.features JSONB column
 */
export type PlanFeatures = string[];

/**
 * Subscription plan
 * Note: Run `npx supabase gen types typescript` after migration to update Database types
 */
export interface SubscriptionPlan {
  id: string; // 'free', 'pro', 'team', 'enterprise'
  name: string;
  display_name: string;
  description: string | null;
  price_monthly_cents: number;
  standard_outputs_limit: number;
  premium_outputs_limit: number;
  allow_premium_models: boolean;
  allow_team_collaboration: boolean;
  is_available: boolean;
  features: PlanFeatures | null;
  sort_order: number;
  created_at: string | null;
}

/**
 * Active subscription for a workbench
 * Note: Run `npx supabase gen types typescript` after migration to update Database types
 */
export interface Subscription {
  id: string;
  workbench_id: string;
  plan_id: string;
  status: "active" | "past_due" | "canceled" | "trialing";
  current_period_start: string;
  current_period_end: string;
  standard_outputs_used: number;
  premium_outputs_used: number;
  last_usage_reset: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Usage event for analytics
 * Note: Run `npx supabase gen types typescript` after migration to update Database types
 */
export interface UsageEvent {
  id: string;
  workbench_id: string;
  subscription_id: string | null;
  model_tier: "free" | "standard" | "premium" | "enterprise";
  model_name: string;
  output_count: number;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  project_id: number | null;
  created_at: string | null;
}

/**
 * Result from get_workbench_subscription RPC
 */
export interface WorkbenchSubscription {
  id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  standard_outputs_used: number;
  standard_outputs_limit: number;
  premium_outputs_used: number;
  premium_outputs_limit: number;
  current_period_end: string;
  allow_premium_models: boolean;
}
