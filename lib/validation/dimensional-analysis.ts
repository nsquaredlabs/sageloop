/**
 * Zod Validation Schemas for Dimensional Analysis
 *
 * Validates AI-generated dimensional analysis responses to ensure they match
 * our TypeScript types and prevent malformed data from entering the database.
 */

import { z } from "zod";

// Structure element schema
export const StructureElementSchema = z.object({
  type: z.enum([
    "bullet_list",
    "numbered_list",
    "code_block",
    "header",
    "example",
    "table",
  ]),
  prevalence_high_rated: z.number().min(0).max(100),
  prevalence_low_rated: z.number().min(0).max(100),
});

// Length dimension schema
export const LengthDimensionSchema = z.object({
  metric: z.enum(["words", "characters", "sentences", "paragraphs"]),
  high_rated_range: z.object({
    min: z.number(),
    max: z.number(),
    median: z.number(),
  }),
  low_rated_range: z.object({
    min: z.number(),
    max: z.number(),
    median: z.number(),
  }),
  confidence: z.number().min(0).max(1),
  sample_size: z.object({
    high: z.number(),
    low: z.number(),
  }),
  insight: z.string(),
});

// Tone dimension schema
export const ToneDimensionSchema = z.object({
  formality: z.enum([
    "very_formal",
    "formal",
    "neutral",
    "casual",
    "very_casual",
  ]),
  technicality: z.enum([
    "highly_technical",
    "technical",
    "accessible",
    "simplified",
  ]),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  confidence: z.number().min(0).max(1),
  high_rated_pattern: z.string(),
  low_rated_pattern: z.string(),
});

// Structure dimension schema
export const StructureDimensionSchema = z.object({
  common_elements: z.array(StructureElementSchema),
  high_rated_includes: z.array(z.string()),
  low_rated_includes: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  insight: z.string(),
});

// Content dimension schema
export const ContentDimensionSchema = z.object({
  specificity: z.enum(["very_specific", "specific", "general", "vague"]),
  citations_present: z.boolean(),
  examples_present: z.boolean(),
  disclaimers_present: z.boolean(),
  high_rated_elements: z.array(z.string()),
  low_rated_elements: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  insight: z.string(),
});

// Error dimension schema
export const ErrorDimensionSchema = z.object({
  hallucinations: z.object({
    count: z.number(),
    examples: z.array(z.string()),
  }),
  refusals: z.object({
    count: z.number(),
    reasons: z.array(z.string()),
  }),
  formatting_issues: z.object({
    count: z.number(),
    types: z.array(z.string()),
  }),
  factual_errors: z.object({
    count: z.number(),
    examples: z.array(z.string()),
  }),
  confidence: z.number().min(0).max(1),
  insight: z.string(),
});

// Complete dimensional analysis schema
export const DimensionalAnalysisSchema = z.object({
  length: LengthDimensionSchema,
  tone: ToneDimensionSchema,
  structure: StructureDimensionSchema,
  content: ContentDimensionSchema,
  errors: ErrorDimensionSchema,
});

// Failure cluster schema (existing)
const FailureClusterSchema = z.object({
  name: z.string(),
  count: z.number(),
  pattern: z.string(),
  root_cause: z.string(),
  suggested_fix: z.string(),
  example_inputs: z.array(z.string()),
  scenario_ids: z.array(z.number()),
  severity: z.enum(["high", "medium", "low"]),
});

// Complete extraction response schema with dimensions
export const ExtractionResponseSchema = z.object({
  summary: z.string(),
  dimensions: DimensionalAnalysisSchema,
  failure_analysis: z.object({
    total_failures: z.number(),
    total_successes: z.number(),
    clusters: z.array(FailureClusterSchema),
  }),
  success_patterns: z.array(z.string()),
  key_insights: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
});
