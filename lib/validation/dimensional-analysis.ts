/**
 * Zod Validation Schemas for Dimensional Analysis
 *
 * Validates AI-generated dimensional analysis responses to ensure they match
 * our TypeScript types and prevent malformed data from entering the database.
 */

import { z } from "zod";

// Structure element schema
export const StructureElementSchema = z
  .object({
    type: z
      .enum([
        "bullet_list",
        "numbered_list",
        "code_block",
        "header",
        "example",
        "table",
      ])
      .nullable()
      .optional(),
    prevalence_high_rated: z.number().min(0).max(100).nullable().optional(),
    prevalence_low_rated: z.number().min(0).max(100).nullable().optional(),
  })
  .nullable()
  .optional();

// Length dimension schema
export const LengthDimensionSchema = z.object({
  metric: z
    .enum(["words", "characters", "sentences", "paragraphs"])
    .nullable()
    .optional(),
  high_rated_range: z
    .object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional(),
      median: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  low_rated_range: z
    .object({
      min: z.number().nullable().optional(),
      max: z.number().nullable().optional(),
      median: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  sample_size: z
    .object({
      high: z.number().nullable().optional(),
      low: z.number().nullable().optional(),
    })
    .nullable()
    .optional(),
  insight: z.string().nullable().optional(),
});

// Tone dimension schema
export const ToneDimensionSchema = z.object({
  formality: z
    .enum(["very_formal", "formal", "neutral", "casual", "very_casual"])
    .nullable()
    .optional(),
  technicality: z
    .enum(["highly_technical", "technical", "accessible", "simplified"])
    .nullable()
    .optional(),
  sentiment: z.enum(["positive", "neutral", "negative"]).nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  high_rated_pattern: z.string().nullable().optional(),
  low_rated_pattern: z.string().nullable().optional(),
});

// Structure dimension schema
export const StructureDimensionSchema = z.object({
  common_elements: z.array(StructureElementSchema).nullable().optional(),
  high_rated_includes: z.array(z.string()).nullable().optional(),
  low_rated_includes: z.array(z.string()).nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  insight: z.string().nullable().optional(),
});

// Content dimension schema
export const ContentDimensionSchema = z.object({
  specificity: z
    .enum(["very_specific", "specific", "general", "vague"])
    .nullable()
    .optional(),
  citations_present: z.boolean().nullable().optional(),
  examples_present: z.boolean().nullable().optional(),
  disclaimers_present: z.boolean().nullable().optional(),
  high_rated_elements: z.array(z.string()).nullable().optional(),
  low_rated_elements: z.array(z.string()).nullable().optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  insight: z.string().nullable().optional(),
});

// Error dimension schema
export const ErrorDimensionSchema = z.object({
  hallucinations: z
    .object({
      count: z.number().nullable().optional(),
      examples: z.array(z.string()).nullable().optional(),
    })
    .nullable()
    .optional(),
  refusals: z
    .object({
      count: z.number().nullable().optional(),
      reasons: z.array(z.string()).nullable().optional(),
    })
    .nullable()
    .optional(),
  formatting_issues: z
    .object({
      count: z.number().nullable().optional(),
      types: z.array(z.string()).nullable().optional(),
    })
    .nullable()
    .optional(),
  factual_errors: z
    .object({
      count: z.number().nullable().optional(),
      examples: z.array(z.string()).nullable().optional(),
    })
    .nullable()
    .optional(),
  confidence: z.number().min(0).max(1).nullable().optional(),
  insight: z.string().nullable().optional(),
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
  name: z.string().nullable().optional(),
  count: z.number().nullable().optional(),
  pattern: z.string().nullable().optional(),
  root_cause: z.string().nullable().optional(),
  suggested_fix: z.string().nullable().optional(),
  example_inputs: z.array(z.string()).nullable().optional(),
  scenario_ids: z.array(z.number()).nullable().optional(),
  severity: z.enum(["high", "medium", "low"]).nullable().optional(),
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
