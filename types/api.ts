/**
 * API Contract Types
 *
 * This file defines TypeScript interfaces for all API request/response types.
 * These types ensure type safety between frontend and backend code.
 */

// ============================================================================
// Common Types
// ============================================================================

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

// ============================================================================
// Projects
// ============================================================================

export interface CreateProjectRequest {
  name: string;
  description?: string;
  model_config: {
    model: string;
    temperature?: number;
    system_prompt?: string;
  };
}

export interface CreateProjectResponse {
  data: {
    id: number;
    name: string;
    description: string | null;
    model_config: {
      model: string;
      temperature?: number;
      system_prompt?: string;
    };
    workbench_id: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    prompt_version: number;
  };
}

export interface GetProjectsResponse {
  data: Array<{
    id: number;
    name: string;
    description: string | null;
    model_config: {
      model: string;
      temperature?: number;
      system_prompt?: string;
    };
    workbench_id: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    prompt_version: number;
  }>;
}

// ============================================================================
// Scenarios
// ============================================================================

export interface CreateScenarioRequest {
  input_text: string;
}

export interface CreateScenarioResponse {
  data: {
    id: number;
    project_id: number;
    input_text: string;
    order: number;
    created_at: string;
  };
}

export interface GetScenariosResponse {
  data: Array<{
    id: number;
    project_id: number;
    input_text: string;
    order: number;
    created_at: string;
  }>;
}

// ============================================================================
// Generate Outputs
// ============================================================================

export interface GenerateOutputsResponse {
  success: boolean;
  generated: number;
  total: number;
  outputs: Array<{
    id: number;
    scenario_id: number | null;
    output_text: string;
    generated_at: string | null;
    model_snapshot: {
      model: string;
      temperature: number;
      system_prompt?: string;
      completion_tokens?: number;
      prompt_tokens?: number;
      total_tokens?: number;
      input_tokens?: number;
      output_tokens?: number;
    };
  }>;
  errors?: Array<{
    scenario_id: number;
    error: string;
  }>;
}

// ============================================================================
// Retest (Prompt Iteration)
// ============================================================================

export interface RetestRequest {
  scenarioIds: number[];
  newSystemPrompt: string;
  improvementNote?: string;
}

export interface RetestResponse {
  success: boolean;
  version: number;
  outputs: Array<{
    scenario_id: number;
    output_id: number;
    input: string;
    output: string;
  }>;
  scenarios_retested: number;
  prompt_diff: {
    old: string;
    new: string;
  };
}

// ============================================================================
// Pattern Extraction
// ============================================================================

export interface FailureCluster {
  name: string;
  count: number;
  pattern: string;
  root_cause: string;
  suggested_fix: string;
  example_inputs: string[];
  scenario_ids: number[];
  severity: 'high' | 'medium' | 'low';
}

export interface FailureAnalysis {
  total_failures: number;
  total_successes: number;
  clusters: FailureCluster[];
}

export interface QualityCriterion {
  dimension: string;
  pattern: string;
  importance: 'high' | 'medium' | 'low';
  good_example: string;
  bad_example: string;
}

export interface ExtractionCriteria {
  summary?: string;
  failure_analysis?: FailureAnalysis;
  success_patterns?: string[];
  criteria?: QualityCriterion[];
  key_insights?: string[];
  recommendations?: string[];
}

export interface ExtractResponse {
  success: boolean;
  extraction: {
    id: number;
    project_id: number | null;
    criteria: ExtractionCriteria;
    confidence_score: number | null;
    rated_output_count: number;
    system_prompt_snapshot: string;
    created_at: string | null;
  };
  metric: {
    id: number;
    project_id: number | null;
    extraction_id: number | null;
    success_rate: number | null;
    criteria_breakdown: Record<string, string> | null;
    snapshot_time: string | null;
  } | null;
  analyzed_outputs: number;
}

// ============================================================================
// Ratings
// ============================================================================

export interface CreateRatingRequest {
  stars: number;
  feedback_text?: string;
  tags?: string[];
}

export interface RatingMetadata {
  carried_forward?: boolean;
  previous_output_id?: number;
  similarity_score?: number;
  needs_review?: boolean;
}

export interface CreateRatingResponse {
  data: {
    id: number;
    output_id: number;
    stars: number;
    feedback_text: string | null;
    tags: string[] | null;
    metadata: RatingMetadata | null;
    created_at: string;
  };
}

export interface GetRatingsResponse {
  data: Array<{
    id: number;
    output_id: number;
    stars: number;
    feedback_text: string | null;
    tags: string[] | null;
    metadata: RatingMetadata | null;
    created_at: string;
  }>;
}

// ============================================================================
// Exports
// ============================================================================

export interface ExportResponse {
  data: {
    project: {
      name: string;
      model_config: {
        model: string;
        temperature?: number;
        system_prompt?: string;
      };
    };
    scenarios: Array<{
      input: string;
      expected_output: string;
      rating: number;
    }>;
    criteria: ExtractionCriteria;
    success_rate: number;
  };
}

// ============================================================================
// API Keys
// ============================================================================

export interface UpdateApiKeysRequest {
  openai_key?: string;
  anthropic_key?: string;
}

export interface UpdateApiKeysResponse {
  success: boolean;
}

export interface TestApiKeyRequest {
  provider: 'openai' | 'anthropic';
  api_key: string;
}

export interface TestApiKeyResponse {
  success: boolean;
  provider: string;
  error?: string;
}

// ============================================================================
// Models
// ============================================================================

export interface GetModelsResponse {
  data: {
    openai: Array<{
      id: string;
      name: string;
      description: string;
    }>;
    anthropic: Array<{
      id: string;
      name: string;
      description: string;
    }>;
  };
}

// ============================================================================
// Versions/History
// ============================================================================

export interface PromptVersion {
  id: number;
  project_id: number | null;
  version: number;
  system_prompt: string;
  parent_version: number | null;
  improvement_note: string | null;
  success_rate_before: number | null;
  success_rate_after: number | null;
  created_at: string | null;
}

export interface GetVersionsResponse {
  data: PromptVersion[];
}

// ============================================================================
// Extractions
// ============================================================================

export interface GetExtractionsResponse {
  data: Array<{
    id: number;
    project_id: number;
    criteria: ExtractionCriteria;
    confidence_score: number;
    rated_output_count: number;
    system_prompt_snapshot: string;
    created_at: string;
  }>;
}
