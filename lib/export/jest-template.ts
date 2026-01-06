interface ExportData {
  project: {
    name: string;
    model_config: {
      model: string;
      system_prompt?: string;
    };
  };
  golden_examples: Array<{
    input: string;
    output: string;
    rating: number;
    feedback?: string | null;
    tags?: string[] | null;
  }>;
  negative_examples: Array<{
    input: string;
    output: string;
    rating: number;
    why_failed?: string | null;
    suggested_fix?: string | null;
  }>;
  failure_analysis?: {
    total_failures: number;
    clusters: Array<{
      name: string;
      count: number;
      pattern: string;
      root_cause: string;
    }>;
  } | null;
  extraction?: {
    dimensions?: {
      length: {
        high_rated_range: { min: number; max: number; median: number };
        metric: string;
      };
      tone: {
        high_rated_pattern: string;
      };
      structure: {
        high_rated_includes: string[];
      };
    } | null;
  } | null;
}

function escapeBackticks(text: string): string {
  return text.replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

export function generateJestSuite(data: ExportData): string {
  const {
    project,
    golden_examples,
    negative_examples,
    failure_analysis,
    extraction,
  } = data;

  let output = `/**
 * Test Suite: ${project.model_config.model} - ${project.name}
 * Generated: ${new Date().toISOString()}
 * Model: ${project.model_config.model}
 *
 * This test suite was auto-generated from Sageloop golden examples.
 * It validates that AI outputs meet the quality criteria discovered through PM evaluation.
 */

import { describe, test, expect } from '@jest/globals';

// TODO: Replace this import with your actual AI generation function
// import { generateAIResponse } from './your-module';

interface GoldenExample {
  id: number;
  input: string;
  expected_output: string;
  rating: number;
  feedback: string;
  criteria: {
    length_range: [number, number];
    must_include: string[];
    tone: string;
  };
  tags: string[];
}

const goldenExamples: GoldenExample[] = [
`;

  // Add golden examples
  golden_examples.forEach((example, idx) => {
    output += `  {\n`;
    output += `    id: ${idx + 1},\n`;
    output += `    input: \`${escapeBackticks(example.input)}\`,\n`;
    output += `    expected_output: \`${escapeBackticks(example.output)}\`,\n`;
    output += `    rating: ${example.rating},\n`;
    output += `    feedback: \`${escapeBackticks(example.feedback || "")}\`,\n`;
    output += `    criteria: {\n`;

    if (extraction?.dimensions) {
      const dims = extraction.dimensions;
      output += `      length_range: [${dims.length.high_rated_range.min}, ${dims.length.high_rated_range.max}],\n`;
      output += `      must_include: ${JSON.stringify(dims.structure.high_rated_includes)},\n`;
      output += `      tone: "${dims.tone.high_rated_pattern}",\n`;
    } else {
      output += `      length_range: [0, 10000],\n`;
      output += `      must_include: [],\n`;
      output += `      tone: "professional",\n`;
    }

    output += `    },\n`;
    output += `    tags: ${JSON.stringify(example.tags || [])},\n`;
    output += `  },\n`;
  });

  output += `];\n\n`;

  // Add test suite
  output += `describe('${project.name} - Golden Examples', () => {\n`;
  output += `  test.each(goldenExamples)(\n`;
  output += `    'Golden example $id: rated $rating stars',\n`;
  output += `    async ({ input, expected_output, criteria, feedback }) => {\n`;
  output += `      // TODO: Replace with your actual AI generation call\n`;
  output += `      // const result = await generateAIResponse(input);\n`;
  output += `      const result = 'TODO: Implement your AI generation';\n\n`;
  output += `      // Validate length\n`;
  output += `      const wordCount = result.split(/\\s+/).length;\n`;
  output += `      const [minWords, maxWords] = criteria.length_range;\n`;
  output += `      expect(wordCount).toBeGreaterThanOrEqual(minWords);\n`;
  output += `      expect(wordCount).toBeLessThanOrEqual(maxWords);\n\n`;
  output += `      // Validate required elements\n`;
  output += `      const resultLower = result.toLowerCase();\n`;
  output += `      criteria.must_include.forEach((element) => {\n`;
  output += `        expect(resultLower).toContain(element.toLowerCase());\n`;
  output += `      });\n`;
  output += `    }\n`;
  output += `  );\n`;
  output += `});\n\n`;

  // Add failure pattern tests
  if (failure_analysis && failure_analysis.clusters.length > 0) {
    output += `describe('${project.name} - Regression Tests (Avoid Failures)', () => {\n`;
    output += `  /**\n`;
    output += `   * Failure patterns identified from 1-2 star ratings:\n`;
    failure_analysis.clusters.forEach((cluster) => {
      output += `   * - ${cluster.name} (${cluster.count} occurrences): ${cluster.pattern}\n`;
    });
    output += `   */\n\n`;

    output += `  test('should avoid known failure patterns', () => {\n`;
    output += `    // TODO: Implement regression tests based on failure patterns\n`;
    output += `    expect(true).toBe(true);\n`;
    output += `  });\n`;
    output += `});\n\n`;
  }

  // Add negative examples
  if (negative_examples.length > 0) {
    output += `interface NegativeExample {\n`;
    output += `  id: number;\n`;
    output += `  input: string;\n`;
    output += `  bad_output: string;\n`;
    output += `  why_failed: string;\n`;
    output += `  suggested_fix: string;\n`;
    output += `}\n\n`;

    output += `const negativeExamples: NegativeExample[] = [\n`;

    negative_examples.slice(0, 5).forEach((example, idx) => {
      output += `  {\n`;
      output += `    id: ${idx + 1},\n`;
      output += `    input: \`${escapeBackticks(example.input)}\`,\n`;
      output += `    bad_output: \`${escapeBackticks(example.output)}\`,\n`;
      output += `    why_failed: \`${escapeBackticks(example.why_failed || "")}\`,\n`;
      output += `    suggested_fix: \`${escapeBackticks(example.suggested_fix || "")}\`,\n`;
      output += `  },\n`;
    });

    output += `];\n\n`;

    output += `describe('${project.name} - Negative Examples', () => {\n`;
    output += `  test.each(negativeExamples)(\n`;
    output += `    'Should avoid anti-pattern $id',\n`;
    output += `    async ({ input, bad_output, why_failed }) => {\n`;
    output += `      // TODO: Implement test to ensure these failures don't recur\n`;
    output += `      // const result = await generateAIResponse(input);\n`;
    output += `      // expect(result).not.toBe(bad_output);\n`;
    output += `      expect(true).toBe(true);\n`;
    output += `    }\n`;
    output += `  );\n`;
    output += `});\n\n`;
  }

  // Helper functions
  output += `// Helper functions for custom validation\n\n`;
  output += `function checkTone(text: string, expectedTone: string): boolean {\n`;
  output += `  // TODO: Implement tone checking (e.g., using sentiment analysis)\n`;
  output += `  return true;\n`;
  output += `}\n\n`;

  output += `function checkStructure(text: string, requiredElements: string[]): boolean {\n`;
  output += `  for (const element of requiredElements) {\n`;
  output += `    if (element === 'bullet_list' && !text.includes('•') && !text.includes('-')) {\n`;
  output += `      return false;\n`;
  output += `    }\n`;
  output += `    if (element === 'example' && !text.toLowerCase().includes('example')) {\n`;
  output += `      return false;\n`;
  output += `    }\n`;
  output += `  }\n`;
  output += `  return true;\n`;
  output += `}\n`;

  return output;
}
