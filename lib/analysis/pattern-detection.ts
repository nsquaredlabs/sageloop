/**
 * Pattern Detection Algorithm for Visual Pattern Diff
 *
 * Detects ALWAYS/NEVER patterns from dimensional analysis data:
 * - ALWAYS: Present in 80%+ of high-rated outputs (4-5 stars)
 * - NEVER: Present in <20% of high-rated outputs (i.e., 80%+ of LOW-rated have it)
 *
 * Security: This module only processes validated extraction data.
 * See lib/validation/dimensional-analysis.ts for validation schemas.
 */

import type { z } from "zod";
import type { DimensionalAnalysisSchema } from "@/lib/validation/dimensional-analysis";

// Type for dimensional analysis (extracted from Zod schema)
type DimensionalAnalysis = z.infer<typeof DimensionalAnalysisSchema>;

export interface PatternItem {
  /** Human-readable description of the pattern */
  description: string;
  /** The dimension this pattern comes from */
  dimension: "length" | "tone" | "structure" | "content" | "errors";
  /** Confidence level (0-1) for this specific pattern */
  confidence: number;
  /** Whether this is a "must have" or "avoid" pattern */
  type: "always" | "never";
  /** Optional metric value for display (e.g., "200-300 words") */
  metric?: string;
}

export interface PatternSummary {
  /** Patterns that 5-star outputs ALWAYS have */
  alwaysPatterns: PatternItem[];
  /** Patterns that 5-star outputs NEVER have (or low-rated ALWAYS have) */
  neverPatterns: PatternItem[];
  /** Overall confidence in the pattern summary */
  overallConfidence: number;
  /** Number of high-rated samples analyzed */
  highRatedCount: number;
  /** Number of low-rated samples analyzed */
  lowRatedCount: number;
}

// Threshold constants
const ALWAYS_THRESHOLD = 80; // Present in 80%+ of high-rated
const NEVER_THRESHOLD = 20; // Present in <20% of high-rated

/**
 * Detects ALWAYS/NEVER patterns from dimensional analysis
 */
export function detectPatterns(
  dimensions: DimensionalAnalysis,
): PatternSummary {
  const alwaysPatterns: PatternItem[] = [];
  const neverPatterns: PatternItem[] = [];

  const highRatedCount = dimensions.length.sample_size.high;
  const lowRatedCount = dimensions.length.sample_size.low;
  const totalSamples = highRatedCount + lowRatedCount;

  if (totalSamples < 5) {
    return {
      alwaysPatterns: [],
      neverPatterns: [],
      overallConfidence: 0,
      highRatedCount,
      lowRatedCount,
    };
  }

  analyzeLengthPatterns(dimensions.length, alwaysPatterns, neverPatterns);
  analyzeStructurePatterns(dimensions.structure, alwaysPatterns, neverPatterns);
  analyzeContentPatterns(dimensions.content, alwaysPatterns, neverPatterns);
  analyzeTonePatterns(dimensions.tone, alwaysPatterns, neverPatterns);
  analyzeErrorPatterns(dimensions.errors, neverPatterns);

  alwaysPatterns.sort((a, b) => b.confidence - a.confidence);
  neverPatterns.sort((a, b) => b.confidence - a.confidence);

  const topAlways = alwaysPatterns.slice(0, 5);
  const topNever = neverPatterns.slice(0, 5);

  const dimensionConfidences = [
    dimensions.length.confidence,
    dimensions.structure.confidence,
    dimensions.content.confidence,
    dimensions.tone.confidence,
    dimensions.errors.confidence,
  ];
  const overallConfidence =
    dimensionConfidences.reduce((sum, c) => sum + c, 0) /
    dimensionConfidences.length;

  return {
    alwaysPatterns: topAlways,
    neverPatterns: topNever,
    overallConfidence,
    highRatedCount,
    lowRatedCount,
  };
}

function analyzeLengthPatterns(
  length: DimensionalAnalysis["length"],
  alwaysPatterns: PatternItem[],
  neverPatterns: PatternItem[],
): void {
  const { high_rated_range, low_rated_range, confidence, metric } = length;
  const highMedian = high_rated_range.median;
  const lowMedian = low_rated_range.median;
  const ratio = highMedian / lowMedian;

  if (ratio >= 1.5) {
    alwaysPatterns.push({
      description: `Longer responses (${high_rated_range.min}-${high_rated_range.max} ${metric})`,
      dimension: "length",
      confidence,
      type: "always",
      metric: `${high_rated_range.min}-${high_rated_range.max} ${metric}`,
    });
    neverPatterns.push({
      description: `Short responses under ${low_rated_range.max} ${metric}`,
      dimension: "length",
      confidence,
      type: "never",
      metric: `<${low_rated_range.max} ${metric}`,
    });
  } else if (ratio <= 0.67) {
    alwaysPatterns.push({
      description: `Concise responses (${high_rated_range.min}-${high_rated_range.max} ${metric})`,
      dimension: "length",
      confidence,
      type: "always",
      metric: `${high_rated_range.min}-${high_rated_range.max} ${metric}`,
    });
    neverPatterns.push({
      description: `Overly long responses (${low_rated_range.min}+ ${metric})`,
      dimension: "length",
      confidence,
      type: "never",
      metric: `>${low_rated_range.min} ${metric}`,
    });
  }
}

function analyzeStructurePatterns(
  structure: DimensionalAnalysis["structure"],
  alwaysPatterns: PatternItem[],
  neverPatterns: PatternItem[],
): void {
  const {
    common_elements,
    high_rated_includes,
    low_rated_includes,
    confidence,
  } = structure;

  for (const element of common_elements) {
    const highPrevalence = element.prevalence_high_rated;
    const lowPrevalence = element.prevalence_low_rated;
    const elementName = formatElementType(element.type);

    if (highPrevalence >= ALWAYS_THRESHOLD && lowPrevalence < 50) {
      alwaysPatterns.push({
        description: elementName,
        dimension: "structure",
        confidence: confidence * (highPrevalence / 100),
        type: "always",
      });
    }

    if (highPrevalence <= NEVER_THRESHOLD && lowPrevalence >= 50) {
      neverPatterns.push({
        description: elementName,
        dimension: "structure",
        confidence: confidence * (1 - highPrevalence / 100),
        type: "never",
      });
    }
  }

  for (const element of high_rated_includes) {
    const formattedElement = formatStructureElement(element);
    if (!alwaysPatterns.some((p) => p.description === formattedElement)) {
      alwaysPatterns.push({
        description: formattedElement,
        dimension: "structure",
        confidence: confidence * 0.8,
        type: "always",
      });
    }
  }

  for (const element of low_rated_includes) {
    const formattedElement = formatStructureElement(element);
    if (!neverPatterns.some((p) => p.description === formattedElement)) {
      neverPatterns.push({
        description: formattedElement,
        dimension: "structure",
        confidence: confidence * 0.8,
        type: "never",
      });
    }
  }
}

function analyzeContentPatterns(
  content: DimensionalAnalysis["content"],
  alwaysPatterns: PatternItem[],
  neverPatterns: PatternItem[],
): void {
  const {
    high_rated_elements,
    low_rated_elements,
    confidence,
    specificity,
    citations_present,
    examples_present,
  } = content;

  if (specificity === "very_specific" || specificity === "specific") {
    alwaysPatterns.push({
      description: "Specific, detailed content",
      dimension: "content",
      confidence,
      type: "always",
    });
  }

  if (citations_present) {
    alwaysPatterns.push({
      description: "Citations or references",
      dimension: "content",
      confidence: confidence * 0.9,
      type: "always",
    });
  }

  if (examples_present) {
    alwaysPatterns.push({
      description: "Concrete examples",
      dimension: "content",
      confidence: confidence * 0.9,
      type: "always",
    });
  }

  for (const element of high_rated_elements.slice(0, 3)) {
    alwaysPatterns.push({
      description: formatContentElement(element),
      dimension: "content",
      confidence: confidence * 0.85,
      type: "always",
    });
  }

  for (const element of low_rated_elements.slice(0, 3)) {
    neverPatterns.push({
      description: formatContentElement(element),
      dimension: "content",
      confidence: confidence * 0.85,
      type: "never",
    });
  }
}

function analyzeTonePatterns(
  tone: DimensionalAnalysis["tone"],
  alwaysPatterns: PatternItem[],
  neverPatterns: PatternItem[],
): void {
  const {
    high_rated_pattern,
    low_rated_pattern,
    confidence,
    formality,
    technicality,
  } = tone;

  if (high_rated_pattern && high_rated_pattern.length > 10) {
    alwaysPatterns.push({
      description: high_rated_pattern,
      dimension: "tone",
      confidence,
      type: "always",
    });
  }

  if (low_rated_pattern && low_rated_pattern.length > 10) {
    neverPatterns.push({
      description: low_rated_pattern,
      dimension: "tone",
      confidence,
      type: "never",
    });
  }

  if (formality === "very_formal") {
    alwaysPatterns.push({
      description: "Formal, professional tone",
      dimension: "tone",
      confidence: confidence * 0.8,
      type: "always",
    });
  } else if (formality === "very_casual") {
    alwaysPatterns.push({
      description: "Casual, conversational tone",
      dimension: "tone",
      confidence: confidence * 0.8,
      type: "always",
    });
  }

  if (technicality === "highly_technical") {
    alwaysPatterns.push({
      description: "Technical, expert language",
      dimension: "tone",
      confidence: confidence * 0.8,
      type: "always",
    });
  } else if (technicality === "simplified") {
    alwaysPatterns.push({
      description: "Simple, accessible language",
      dimension: "tone",
      confidence: confidence * 0.8,
      type: "always",
    });
  }
}

function analyzeErrorPatterns(
  errors: DimensionalAnalysis["errors"],
  neverPatterns: PatternItem[],
): void {
  const {
    hallucinations,
    refusals,
    formatting_issues,
    factual_errors,
    confidence,
  } = errors;

  if (hallucinations.count > 0) {
    neverPatterns.push({
      description: `Hallucinations or made-up information`,
      dimension: "errors",
      confidence,
      type: "never",
      metric: `${hallucinations.count} found`,
    });
  }

  if (refusals.count > 0) {
    neverPatterns.push({
      description: "Unnecessary refusals",
      dimension: "errors",
      confidence,
      type: "never",
      metric: `${refusals.count} found`,
    });
  }

  if (formatting_issues.count > 2) {
    neverPatterns.push({
      description: "Formatting problems (broken markdown, etc.)",
      dimension: "errors",
      confidence,
      type: "never",
      metric: `${formatting_issues.count} found`,
    });
  }

  if (factual_errors.count > 0) {
    neverPatterns.push({
      description: "Factual errors or incorrect information",
      dimension: "errors",
      confidence,
      type: "never",
      metric: `${factual_errors.count} found`,
    });
  }
}

function formatElementType(type: string): string {
  const typeMap: Record<string, string> = {
    bullet_list: "Bullet points",
    numbered_list: "Numbered lists",
    code_block: "Code blocks",
    header: "Headers/sections",
    example: "Examples",
    table: "Tables",
  };
  return typeMap[type] || type.replace(/_/g, " ");
}

function formatStructureElement(element: string): string {
  return element
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatContentElement(element: string): string {
  const formatted = element.replace(/_/g, " ");
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getKeyPatternDifference(summary: PatternSummary): string {
  if (
    summary.alwaysPatterns.length === 0 &&
    summary.neverPatterns.length === 0
  ) {
    return "Not enough data to determine patterns";
  }

  const topAlways = summary.alwaysPatterns[0];
  const topNever = summary.neverPatterns[0];

  if (topAlways && topNever) {
    return `High-rated outputs ${topAlways.description.toLowerCase()}, while low-rated outputs ${topNever.description.toLowerCase()}`;
  } else if (topAlways) {
    return `High-rated outputs consistently ${topAlways.description.toLowerCase()}`;
  } else if (topNever) {
    return `Low-rated outputs consistently ${topNever.description.toLowerCase()}`;
  }

  return "Patterns detected but no clear differentiators found";
}
