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

function escapeTripleQuotes(text: string): string {
  return text.replace(/"""/g, '\\"\\"\\"');
}

export function generatePytestSuite(data: ExportData): string {
  const {
    project,
    golden_examples,
    negative_examples,
    failure_analysis,
    extraction,
  } = data;

  let output = `"""
Test Suite: ${project.model_config.model} - ${project.name}
Generated: ${new Date().toISOString()}
Model: ${project.model_config.model}

This test suite was auto-generated from Sageloop golden examples.
It validates that AI outputs meet the quality criteria discovered through PM evaluation.
"""

import pytest
from typing import Dict, Any, List, Tuple

# TODO: Replace this import with your actual AI generation function
# from your_module import generate_ai_response


@pytest.fixture
def golden_examples() -> List[Dict[str, Any]]:
    """
    Golden examples: outputs rated 4-5 stars by PM evaluation.
    These represent the quality bar for this AI feature.
    """
    return [
`;

  // Add golden examples as fixture data
  golden_examples.forEach((example, idx) => {
    output += `        {\n`;
    output += `            "id": ${idx + 1},\n`;
    output += `            "input": """${escapeTripleQuotes(example.input)}""",\n`;
    output += `            "expected_output": """${escapeTripleQuotes(example.output)}""",\n`;
    output += `            "rating": ${example.rating},\n`;
    output += `            "feedback": """${escapeTripleQuotes(example.feedback || "")}""",\n`;
    output += `            "criteria": {\n`;

    // Add extracted criteria for this example
    if (extraction?.dimensions) {
      const dims = extraction.dimensions;
      output += `                "length_range": (${dims.length.high_rated_range.min}, ${dims.length.high_rated_range.max}),\n`;
      output += `                "must_include": ${JSON.stringify(dims.structure.high_rated_includes)},\n`;
      output += `                "tone": "${dims.tone.high_rated_pattern}",\n`;
    } else {
      output += `                "length_range": (0, 10000),\n`;
      output += `                "must_include": [],\n`;
      output += `                "tone": "professional",\n`;
    }

    output += `            },\n`;
    output += `            "tags": ${JSON.stringify(example.tags || [])},\n`;
    output += `        },\n`;
  });

  output += `    ]\n\n\n`;

  // Add test functions for golden examples
  output += `def test_golden_example_quality(golden_examples: List[Dict[str, Any]]):\n`;
  output += `    """\n`;
  output += `    Test that AI generates outputs matching golden example quality criteria.\n`;
  output += `    \n`;
  output += `    This test uses the extracted criteria from PM ratings:\n`;
  if (extraction?.dimensions) {
    output += `    - Length: ${extraction.dimensions.length.high_rated_range.min}-${extraction.dimensions.length.high_rated_range.max} ${extraction.dimensions.length.metric}\n`;
    output += `    - Tone: ${extraction.dimensions.tone.high_rated_pattern}\n`;
    output += `    - Structure: ${extraction.dimensions.structure.high_rated_includes.join(", ")}\n`;
  }
  output += `    """\n`;
  output += `    for example in golden_examples:\n`;
  output += `        # TODO: Replace with your actual AI generation call\n`;
  output += `        # result = generate_ai_response(example["input"])\n`;
  output += `        result = "TODO: Implement your AI generation"\n`;
  output += `        \n`;
  output += `        # Validate length\n`;
  output += `        word_count = len(result.split())\n`;
  output += `        min_words, max_words = example["criteria"]["length_range"]\n`;
  output += `        assert min_words <= word_count <= max_words, (\n`;
  output += `            f"Output length {word_count} words outside expected range "\n`;
  output += `            f"({min_words}-{max_words} words). "\n`;
  output += `            f"Input: {example['input'][:50]}..."\n`;
  output += `        )\n`;
  output += `        \n`;
  output += `        # Validate required elements\n`;
  output += `        result_lower = result.lower()\n`;
  output += `        for element in example["criteria"]["must_include"]:\n`;
  output += `            assert element.lower() in result_lower, (\n`;
  output += `                f"Output missing required element: {element}. "\n`;
  output += `                f"Input: {example['input'][:50]}..."\n`;
  output += `            )\n\n\n`;

  // Add regression tests for failure patterns
  if (failure_analysis && failure_analysis.clusters.length > 0) {
    output += `def test_failure_patterns_avoided():\n`;
    output += `    """\n`;
    output += `    Regression tests: ensure previously identified failure patterns don't recur.\n`;
    output += `    \n`;
    output += `    Failure patterns identified from 1-2 star ratings:\n`;
    failure_analysis.clusters.forEach((cluster) => {
      output += `    - ${cluster.name} (${cluster.count} occurrences): ${cluster.pattern}\n`;
    });
    output += `    """\n`;
    output += `    # TODO: Implement regression tests based on failure patterns\n`;
    output += `    # Example:\n`;
    output += `    # result = generate_ai_response("test input")\n`;
    output += `    # assert not is_failure_pattern(result), "Detected known failure pattern"\n`;
    output += `    pass\n\n\n`;
  }

  // Add negative examples as regression tests
  if (negative_examples.length > 0) {
    output += `@pytest.fixture\n`;
    output += `def negative_examples() -> List[Dict[str, Any]]:\n`;
    output += `    """Anti-patterns: outputs rated 1-2 stars (what to avoid)."""\n`;
    output += `    return [\n`;

    negative_examples.slice(0, 5).forEach((example, idx) => {
      output += `        {\n`;
      output += `            "id": ${idx + 1},\n`;
      output += `            "input": """${escapeTripleQuotes(example.input)}""",\n`;
      output += `            "bad_output": """${escapeTripleQuotes(example.output)}""",\n`;
      output += `            "why_failed": """${escapeTripleQuotes(example.why_failed || "")}""",\n`;
      output += `            "suggested_fix": """${escapeTripleQuotes(example.suggested_fix || "")}""",\n`;
      output += `        },\n`;
    });

    output += `    ]\n\n\n`;

    output += `def test_avoids_negative_patterns(negative_examples: List[Dict[str, Any]]):\n`;
    output += `    """\n`;
    output += `    Ensure AI doesn't reproduce known failure patterns.\n`;
    output += `    """\n`;
    output += `    for example in negative_examples:\n`;
    output += `        # TODO: Implement test to ensure these failures don't recur\n`;
    output += `        # result = generate_ai_response(example["input"])\n`;
    output += `        # assert result != example["bad_output"], "Reproduced known bad output"\n`;
    output += `        pass\n\n`;
  }

  // Add helper functions
  output += `\n# Helper functions for custom validation\n\n`;
  output += `def check_tone(text: str, expected_tone: str) -> bool:\n`;
  output += `    """Check if text matches expected tone (placeholder - implement with actual logic)."""\n`;
  output += `    # TODO: Implement tone checking (e.g., using sentiment analysis)\n`;
  output += `    return True\n\n`;

  output += `def check_structure(text: str, required_elements: List[str]) -> bool:\n`;
  output += `    """Check if text includes required structural elements."""\n`;
  output += `    for element in required_elements:\n`;
  output += `        if element == "bullet_list" and ("•" not in text and "-" not in text):\n`;
  output += `            return False\n`;
  output += `        if element == "example" and "example" not in text.lower():\n`;
  output += `            return False\n`;
  output += `    return True\n`;

  return output;
}
