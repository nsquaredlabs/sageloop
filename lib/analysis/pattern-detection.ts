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
import {
  getSampleSizes,
  getConfidences,
  getTonePatterns,
  getStructureElements,
  getContentElements,
  getErrorData,
  getToneAttributes,
  getContentAttributes,
  getLengthRanges,
  getLengthMetric,
} from "./analysis-helpers";

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

  const { high: highRatedCount, low: lowRatedCount } =
    getSampleSizes(dimensions);
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

  const confidences = getConfidences(dimensions);
  const dimensionConfidences = [
    confidences.length,
    confidences.structure,
    confidences.content,
    confidences.tone,
    confidences.errors,
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
  if (!length) return;

  const dims = { length } as unknown as DimensionalAnalysis;
  const { high: highRange, low: lowRange } = getLengthRanges(dims);
  const metric = getLengthMetric(dims) || "words";
  const confidence = length.confidence ?? 0;

  const highMedian = highRange.median;
  const lowMedian = lowRange.median;

  if (lowMedian === 0) return; // Can't calculate ratio with zero
  const ratio = highMedian / lowMedian;

  if (ratio >= 1.5) {
    alwaysPatterns.push({
      description: `Longer responses (${highRange.min}-${highRange.max} ${metric})`,
      dimension: "length",
      confidence,
      type: "always",
      metric: `${highRange.min}-${highRange.max} ${metric}`,
    });
    neverPatterns.push({
      description: `Short responses under ${lowRange.max} ${metric}`,
      dimension: "length",
      confidence,
      type: "never",
      metric: `<${lowRange.max} ${metric}`,
    });
  } else if (ratio <= 0.67) {
    alwaysPatterns.push({
      description: `Concise responses (${highRange.min}-${highRange.max} ${metric})`,
      dimension: "length",
      confidence,
      type: "always",
      metric: `${highRange.min}-${highRange.max} ${metric}`,
    });
    neverPatterns.push({
      description: `Overly long responses (${lowRange.min}+ ${metric})`,
      dimension: "length",
      confidence,
      type: "never",
      metric: `>${lowRange.min} ${metric}`,
    });
  }
}

function analyzeStructurePatterns(
  structure: DimensionalAnalysis["structure"],
  alwaysPatterns: PatternItem[],
  neverPatterns: PatternItem[],
): void {
  if (!structure) return;

  const dims = { structure } as unknown as DimensionalAnalysis;
  const { elements, highIncludes, lowIncludes } = getStructureElements(dims);
  const confidence = structure.confidence ?? 0;

  for (const element of elements) {
    if (!element) continue;
    const highPrevalence = element.prevalence_high_rated ?? 0;
    const lowPrevalence = element.prevalence_low_rated ?? 0;
    const elementName = element.type
      ? formatElementType(element.type)
      : "Structure element";

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

  for (const element of highIncludes) {
    const formattedElement = formatStructureElement(element || "");
    if (!alwaysPatterns.some((p) => p.description === formattedElement)) {
      alwaysPatterns.push({
        description: formattedElement,
        dimension: "structure",
        confidence: confidence * 0.8,
        type: "always",
      });
    }
  }

  for (const element of lowIncludes) {
    const formattedElement = formatStructureElement(element || "");
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
  if (!content) return;

  const dims = { content } as unknown as DimensionalAnalysis;
  const { highElements, lowElements } = getContentElements(dims);
  const attrs = getContentAttributes(dims);
  const confidence = content.confidence ?? 0;

  if (
    attrs.specificity === "very_specific" ||
    attrs.specificity === "specific"
  ) {
    alwaysPatterns.push({
      description: "Specific, detailed content",
      dimension: "content",
      confidence,
      type: "always",
    });
  }

  if (attrs.citationsPresent) {
    alwaysPatterns.push({
      description: "Citations or references",
      dimension: "content",
      confidence: confidence * 0.9,
      type: "always",
    });
  }

  if (attrs.examplesPresent) {
    alwaysPatterns.push({
      description: "Concrete examples",
      dimension: "content",
      confidence: confidence * 0.9,
      type: "always",
    });
  }

  for (const element of highElements.slice(0, 3)) {
    if (element) {
      alwaysPatterns.push({
        description: formatContentElement(element),
        dimension: "content",
        confidence: confidence * 0.85,
        type: "always",
      });
    }
  }

  for (const element of lowElements.slice(0, 3)) {
    if (element) {
      neverPatterns.push({
        description: formatContentElement(element),
        dimension: "content",
        confidence: confidence * 0.85,
        type: "never",
      });
    }
  }
}

function analyzeTonePatterns(
  tone: DimensionalAnalysis["tone"],
  alwaysPatterns: PatternItem[],
  neverPatterns: PatternItem[],
): void {
  if (!tone) return;

  const dims = { tone } as unknown as DimensionalAnalysis;
  const patterns = getTonePatterns(dims);
  const attrs = getToneAttributes(dims);
  const confidence = tone.confidence ?? 0;

  if (patterns.highPattern && patterns.highPattern.length > 10) {
    alwaysPatterns.push({
      description: patterns.highPattern,
      dimension: "tone",
      confidence,
      type: "always",
    });
  }

  if (patterns.lowPattern && patterns.lowPattern.length > 10) {
    neverPatterns.push({
      description: patterns.lowPattern,
      dimension: "tone",
      confidence,
      type: "never",
    });
  }

  if (attrs.formality === "very_formal") {
    alwaysPatterns.push({
      description: "Formal, professional tone",
      dimension: "tone",
      confidence: confidence * 0.8,
      type: "always",
    });
  } else if (attrs.formality === "very_casual") {
    alwaysPatterns.push({
      description: "Casual, conversational tone",
      dimension: "tone",
      confidence: confidence * 0.8,
      type: "always",
    });
  }

  if (attrs.technicality === "highly_technical") {
    alwaysPatterns.push({
      description: "Technical, expert language",
      dimension: "tone",
      confidence: confidence * 0.8,
      type: "always",
    });
  } else if (attrs.technicality === "simplified") {
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
  if (!errors) return;

  const dims = { errors } as unknown as DimensionalAnalysis;
  const errorData = getErrorData(dims);
  const confidence = errors.confidence ?? 0;

  if (errorData.hallucinations.count > 0) {
    neverPatterns.push({
      description: `Hallucinations or made-up information`,
      dimension: "errors",
      confidence,
      type: "never",
      metric: `${errorData.hallucinations.count} found`,
    });
  }

  if (errorData.refusals.count > 0) {
    neverPatterns.push({
      description: "Unnecessary refusals",
      dimension: "errors",
      confidence,
      type: "never",
      metric: `${errorData.refusals.count} found`,
    });
  }

  if (errorData.formattingIssues.count > 2) {
    neverPatterns.push({
      description: "Formatting problems (broken markdown, etc.)",
      dimension: "errors",
      confidence,
      type: "never",
      metric: `${errorData.formattingIssues.count} found`,
    });
  }

  if (errorData.factualErrors.count > 0) {
    neverPatterns.push({
      description: "Factual errors or incorrect information",
      dimension: "errors",
      confidence,
      type: "never",
      metric: `${errorData.factualErrors.count} found`,
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
