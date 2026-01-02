/**
 * Pattern Fingerprint Generator
 *
 * Generates a one-page visual spec ("fingerprint") from dimensional analysis data.
 * The fingerprint becomes the "source of truth" for quality - a shareable,
 * understandable spec that non-technical stakeholders can validate.
 *
 * MVP Implementation: Generates fingerprint on-demand from existing dimensional data.
 * Future: Will be stored in database with versioning.
 *
 * Security: This module only processes validated extraction data.
 * See lib/validation/dimensional-analysis.ts for validation schemas.
 */

import type { z } from "zod";
import type { DimensionalAnalysisSchema } from "@/lib/validation/dimensional-analysis";
import { detectPatterns } from "./pattern-detection";

// Type for dimensional analysis (extracted from Zod schema)
type DimensionalAnalysis = z.infer<typeof DimensionalAnalysisSchema>;

/**
 * Pattern Fingerprint - The "source of truth" for quality
 *
 * A condensed, shareable representation of what makes outputs great.
 * Designed to be printable, shareable, and implementable by engineers.
 */
export interface PatternFingerprint {
  /** Response structure/flow pattern */
  structure: {
    /** Step-by-step flow pattern (e.g., ["Greeting", "Problem", "Solution", "Follow-up"]) */
    pattern: string[];
    /** Human-readable description of the structure */
    description: string;
  };

  /** Optimal response length */
  length: {
    /** Word/character range (e.g., "200-300 words") */
    range: string;
    /** Description of length style (e.g., "conversational, not terse") */
    description: string;
  };

  /** Tone characteristics */
  tone: {
    /** Primary tone descriptor (e.g., "Empathetic + Solution-focused") */
    primary: string;
    /** List of tone characteristics */
    characteristics: string[];
  };

  /** Top 3-5 patterns that MUST be present (from ALWAYS patterns) */
  mustHaves: string[];

  /** Top 3-5 patterns that should NEVER appear (from NEVER patterns) */
  neverDo: string[];

  /** Overall confidence in this fingerprint (0-1) */
  confidence: number;

  /** Number of samples this fingerprint is based on */
  sampleSize: number;
}

/**
 * Generates a Pattern Fingerprint from dimensional analysis data
 *
 * @param dimensions - Validated dimensional analysis from extraction
 * @returns PatternFingerprint - The condensed quality spec
 */
export function generateFingerprint(
  dimensions: DimensionalAnalysis,
): PatternFingerprint {
  // Use the pattern detection module to get ALWAYS/NEVER patterns
  const patterns = detectPatterns(dimensions);

  // Extract structure pattern from high-rated structure elements
  const structurePattern = extractStructurePattern(dimensions.structure);

  // Extract length pattern from high-rated range
  const lengthPattern = extractLengthPattern(dimensions.length);

  // Extract tone pattern from tone dimension
  const tonePattern = extractTonePattern(dimensions.tone);

  // Extract must-haves from ALWAYS patterns (top 5)
  const mustHaves = patterns.alwaysPatterns
    .slice(0, 5)
    .map((p) => p.description);

  // Extract never-dos from NEVER patterns (top 5)
  const neverDo = patterns.neverPatterns.slice(0, 5).map((p) => p.description);

  return {
    structure: structurePattern,
    length: lengthPattern,
    tone: tonePattern,
    mustHaves,
    neverDo,
    confidence: patterns.overallConfidence,
    sampleSize: patterns.highRatedCount + patterns.lowRatedCount,
  };
}

/**
 * Extract a readable structure pattern from the structure dimension
 */
function extractStructurePattern(
  structure: DimensionalAnalysis["structure"],
): PatternFingerprint["structure"] {
  const highRatedIncludes = structure.high_rated_includes;
  const commonElements = structure.common_elements;

  // Build a flow pattern from high-rated elements
  const flowSteps: string[] = [];

  // Look for common structural elements in order of typical response flow
  const flowOrder = [
    { keywords: ["greeting", "introduction", "hello"], label: "Greeting" },
    {
      keywords: ["acknowledge", "understand", "problem", "issue"],
      label: "Acknowledge",
    },
    { keywords: ["context", "background", "explanation"], label: "Context" },
    {
      keywords: ["solution", "answer", "response", "steps", "instructions"],
      label: "Solution",
    },
    { keywords: ["example", "code", "sample"], label: "Example" },
    { keywords: ["summary", "conclusion", "recap"], label: "Summary" },
    {
      keywords: ["follow", "next", "additional", "help", "question"],
      label: "Follow-up",
    },
  ];

  // Check which flow elements are present in high-rated outputs
  for (const flowItem of flowOrder) {
    const found = highRatedIncludes.some((element) =>
      flowItem.keywords.some((keyword) =>
        element.toLowerCase().includes(keyword),
      ),
    );
    if (found) {
      flowSteps.push(flowItem.label);
    }
  }

  // If no specific flow detected, create from common elements
  if (flowSteps.length === 0) {
    const elementsFound = commonElements
      .filter((el) => el.prevalence_high_rated >= 60)
      .map((el) => formatElementType(el.type));

    if (elementsFound.length > 0) {
      flowSteps.push(...elementsFound.slice(0, 4));
    } else {
      flowSteps.push("Opening", "Main Content", "Conclusion");
    }
  }

  // Generate description based on insight
  const description =
    structure.insight ||
    "Follows a clear, logical structure with distinct sections";

  return {
    pattern: flowSteps,
    description,
  };
}

/**
 * Extract a readable length pattern from the length dimension
 */
function extractLengthPattern(
  length: DimensionalAnalysis["length"],
): PatternFingerprint["length"] {
  const { high_rated_range, metric, insight } = length;

  // Format range string
  const range = `${high_rated_range.min}-${high_rated_range.max} ${metric}`;

  // Determine length style description
  let description: string;

  const avgLength = high_rated_range.median;
  if (metric === "words") {
    if (avgLength < 100) {
      description = "concise and direct";
    } else if (avgLength < 200) {
      description = "brief but complete";
    } else if (avgLength < 400) {
      description = "conversational, not terse";
    } else if (avgLength < 700) {
      description = "detailed and thorough";
    } else {
      description = "comprehensive and in-depth";
    }
  } else if (metric === "sentences") {
    if (avgLength < 5) {
      description = "concise and direct";
    } else if (avgLength < 10) {
      description = "brief but complete";
    } else if (avgLength < 20) {
      description = "conversational, not terse";
    } else {
      description = "detailed and thorough";
    }
  } else {
    // Use insight as fallback
    description =
      insight || `Optimal around ${high_rated_range.median} ${metric}`;
  }

  return {
    range,
    description,
  };
}

/**
 * Extract a readable tone pattern from the tone dimension
 */
function extractTonePattern(
  tone: DimensionalAnalysis["tone"],
): PatternFingerprint["tone"] {
  const { formality, technicality, sentiment, high_rated_pattern } = tone;

  // Build primary tone description
  const toneComponents: string[] = [];

  // Add sentiment-based descriptor
  if (sentiment === "positive") {
    toneComponents.push("Positive");
  } else if (sentiment === "negative") {
    toneComponents.push("Direct");
  }

  // Add formality descriptor
  if (formality === "very_formal" || formality === "formal") {
    toneComponents.push("Professional");
  } else if (formality === "very_casual" || formality === "casual") {
    toneComponents.push("Friendly");
  } else {
    toneComponents.push("Balanced");
  }

  // Add technicality-based descriptor
  if (technicality === "highly_technical" || technicality === "technical") {
    toneComponents.push("Technical");
  } else if (technicality === "simplified") {
    toneComponents.push("Accessible");
  }

  // Create primary string
  const primary =
    toneComponents.length > 0
      ? toneComponents.slice(0, 2).join(" + ")
      : "Neutral";

  // Build characteristics list
  const characteristics: string[] = [];

  // Add formality characteristic
  characteristics.push(formatFormality(formality));

  // Add technicality characteristic
  characteristics.push(formatTechnicality(technicality));

  // Add sentiment characteristic
  characteristics.push(
    `${sentiment.charAt(0).toUpperCase() + sentiment.slice(1)} sentiment`,
  );

  // Add high-rated pattern if meaningful
  if (
    high_rated_pattern &&
    high_rated_pattern.length > 10 &&
    high_rated_pattern.length < 100
  ) {
    characteristics.push(high_rated_pattern);
  }

  return {
    primary,
    characteristics: characteristics.slice(0, 4), // Keep top 4
  };
}

/**
 * Format structure element type to human-readable label
 */
function formatElementType(type: string): string {
  const typeMap: Record<string, string> = {
    bullet_list: "Bullet Lists",
    numbered_list: "Numbered Lists",
    code_block: "Code Examples",
    header: "Clear Headers",
    example: "Examples",
    table: "Tables",
  };
  return typeMap[type] || type.replace(/_/g, " ");
}

/**
 * Format formality level to human-readable description
 */
function formatFormality(formality: string): string {
  const formalityMap: Record<string, string> = {
    very_formal: "Very formal language",
    formal: "Professional tone",
    neutral: "Balanced formality",
    casual: "Conversational style",
    very_casual: "Friendly, casual tone",
  };
  return formalityMap[formality] || "Standard formality";
}

/**
 * Format technicality level to human-readable description
 */
function formatTechnicality(technicality: string): string {
  const technicalityMap: Record<string, string> = {
    highly_technical: "Expert-level terminology",
    technical: "Technical but accessible",
    accessible: "Easy to understand",
    simplified: "Simple, plain language",
  };
  return technicalityMap[technicality] || "Standard complexity";
}
