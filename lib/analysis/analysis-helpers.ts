/**
 * Helper functions for safely extracting values from dimensional analysis data
 *
 * Since the validation schema allows null/undefined fields (for AI robustness),
 * these helpers provide safe extraction with sensible defaults.
 */

import type { z } from "zod";
import type { DimensionalAnalysisSchema } from "@/lib/validation/dimensional-analysis";

type DimensionalAnalysis = z.infer<typeof DimensionalAnalysisSchema>;

/**
 * Safe extraction of sample sizes with defaults
 */
export function getSampleSizes(dimensions: DimensionalAnalysis) {
  const high = dimensions.length?.sample_size?.high ?? 0;
  const low = dimensions.length?.sample_size?.low ?? 0;
  return { high, low };
}

/**
 * Safe extraction of length ranges with defaults
 */
export function getLengthRanges(dimensions: DimensionalAnalysis) {
  return {
    high: {
      min: dimensions.length?.high_rated_range?.min ?? 0,
      max: dimensions.length?.high_rated_range?.max ?? 0,
      median: dimensions.length?.high_rated_range?.median ?? 0,
    },
    low: {
      min: dimensions.length?.low_rated_range?.min ?? 0,
      max: dimensions.length?.low_rated_range?.max ?? 0,
      median: dimensions.length?.low_rated_range?.median ?? 0,
    },
  };
}

/**
 * Safe extraction of confidence scores with defaults
 */
export function getConfidences(dimensions: DimensionalAnalysis) {
  return {
    length: dimensions.length?.confidence ?? 0,
    tone: dimensions.tone?.confidence ?? 0,
    structure: dimensions.structure?.confidence ?? 0,
    content: dimensions.content?.confidence ?? 0,
    errors: dimensions.errors?.confidence ?? 0,
  };
}

/**
 * Safe extraction of tone patterns with defaults
 */
export function getTonePatterns(dimensions: DimensionalAnalysis) {
  return {
    highPattern: dimensions.tone?.high_rated_pattern ?? "",
    lowPattern: dimensions.tone?.low_rated_pattern ?? "",
  };
}

/**
 * Safe extraction of structure elements with defaults
 */
export function getStructureElements(dimensions: DimensionalAnalysis) {
  return {
    elements: (dimensions.structure?.common_elements ?? []).filter(
      (el) => el !== null && el !== undefined,
    ),
    highIncludes: dimensions.structure?.high_rated_includes ?? [],
    lowIncludes: dimensions.structure?.low_rated_includes ?? [],
  };
}

/**
 * Safe extraction of content elements with defaults
 */
export function getContentElements(dimensions: DimensionalAnalysis) {
  return {
    highElements: dimensions.content?.high_rated_elements ?? [],
    lowElements: dimensions.content?.low_rated_elements ?? [],
  };
}

/**
 * Safe extraction of error data with defaults
 */
export function getErrorData(dimensions: DimensionalAnalysis) {
  return {
    hallucinations: {
      count: dimensions.errors?.hallucinations?.count ?? 0,
      examples: dimensions.errors?.hallucinations?.examples ?? [],
    },
    refusals: {
      count: dimensions.errors?.refusals?.count ?? 0,
      reasons: dimensions.errors?.refusals?.reasons ?? [],
    },
    formattingIssues: {
      count: dimensions.errors?.formatting_issues?.count ?? 0,
      types: dimensions.errors?.formatting_issues?.types ?? [],
    },
    factualErrors: {
      count: dimensions.errors?.factual_errors?.count ?? 0,
      examples: dimensions.errors?.factual_errors?.examples ?? [],
    },
  };
}

/**
 * Safe extraction of tone attributes with defaults
 */
export function getToneAttributes(dimensions: DimensionalAnalysis) {
  return {
    formality: dimensions.tone?.formality ?? null,
    technicality: dimensions.tone?.technicality ?? null,
    sentiment: dimensions.tone?.sentiment ?? null,
  };
}

/**
 * Safe extraction of content attributes with defaults
 */
export function getContentAttributes(dimensions: DimensionalAnalysis) {
  return {
    specificity: dimensions.content?.specificity ?? null,
    citationsPresent: dimensions.content?.citations_present ?? null,
    examplesPresent: dimensions.content?.examples_present ?? null,
    disclaimersPresent: dimensions.content?.disclaimers_present ?? null,
  };
}

/**
 * Safe extraction of length metric with defaults
 */
export function getLengthMetric(dimensions: DimensionalAnalysis) {
  return dimensions.length?.metric ?? "words";
}
