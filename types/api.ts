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
  severity: "high" | "medium" | "low";
}

export interface FailureAnalysis {
  total_failures: number;
  total_successes: number;
  clusters: FailureCluster[];
}

export interface QualityCriterion {
  dimension: string;
  pattern: string;
  importance: "high" | "medium" | "low";
  good_example: string;
  bad_example: string;
}

// ============================================================================
// Dimensional Analysis (P0 Feature - Phase 1)
// ============================================================================

export interface StructureElement {
  type:
    | "bullet_list"
    | "numbered_list"
    | "code_block"
    | "header"
    | "example"
    | "table";
  prevalence_high_rated: number; // percentage
  prevalence_low_rated: number;
}

export interface LengthDimension {
  metric: "words" | "characters" | "sentences" | "paragraphs";
  high_rated_range: { min: number; max: number; median: number };
  low_rated_range: { min: number; max: number; median: number };
  confidence: number; // 0-1
  sample_size: { high: number; low: number };
  insight: string; // "5-star outputs: 200-300 words, 3-4 paragraphs"
}

export interface ToneDimension {
  formality: "very_formal" | "formal" | "neutral" | "casual" | "very_casual";
  technicality: "highly_technical" | "technical" | "accessible" | "simplified";
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;
  high_rated_pattern: string; // "Professional, accessible tone"
  low_rated_pattern: string; // "Too casual or overly technical"
}

export interface StructureDimension {
  common_elements: StructureElement[];
  high_rated_includes: string[]; // ["bullet_points", "examples", "headers"]
  low_rated_includes: string[]; // ["wall_of_text", "no_formatting"]
  confidence: number;
  insight: string;
}

export interface ContentDimension {
  specificity: "very_specific" | "specific" | "general" | "vague";
  citations_present: boolean;
  examples_present: boolean;
  disclaimers_present: boolean;
  high_rated_elements: string[]; // ["concrete_examples", "data_citations", "caveats"]
  low_rated_elements: string[]; // ["vague_claims", "no_sources", "overconfidence"]
  confidence: number;
  insight: string;
}

export interface ErrorDimension {
  hallucinations: { count: number; examples: string[] };
  refusals: { count: number; reasons: string[] };
  formatting_issues: { count: number; types: string[] };
  factual_errors: { count: number; examples: string[] };
  confidence: number;
  insight: string;
}

export interface DimensionalAnalysis {
  length: LengthDimension;
  tone: ToneDimension;
  structure: StructureDimension;
  content: ContentDimension;
  errors: ErrorDimension;
}

export interface ExtractionCriteria {
  summary?: string;
  failure_analysis?: FailureAnalysis;
  success_patterns?: string[];
  criteria?: QualityCriterion[];
  dimensions?: DimensionalAnalysis; // NEW: Structured multi-dimensional analysis
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
  provider: "openai" | "anthropic";
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

// ============================================================================
// Async Generation Jobs
// ============================================================================

/**
 * Response from POST /api/projects/[id]/generate
 * Returns immediately with a job ID instead of waiting for generation
 */
export interface EnqueueGenerationResponse {
  success: boolean;
  job_id: string;
  status: "pending";
  total_scenarios: number;
}

/**
 * Generation job status and progress
 */
export interface GenerationJob {
  id: string;
  project_id: number;
  workbench_id: string;
  status: "pending" | "processing" | "completed" | "failed" | "partial";
  total_scenarios: number;
  completed_scenarios: number;
  failed_scenarios: number;
  output_ids: number[];
  errors: Array<{ scenario_id: number; error: string }>;
  created_at: string | null;
  started_at: string | null;
  completed_at: string | null;
}

/**
 * Response from GET /api/jobs/[jobId]
 */
export interface GetJobStatusResponse {
  success: boolean;
  job: GenerationJob;
  /** Outputs are included when job is completed or partial */
  outputs?: Array<{
    id: number;
    scenario_id: number | null;
    output_text: string;
    generated_at: string | null;
    model_snapshot: {
      model: string;
      system_prompt?: string;
      completion_tokens?: number;
      prompt_tokens?: number;
      total_tokens?: number;
      input_tokens?: number;
      output_tokens?: number;
    };
  }>;
}
