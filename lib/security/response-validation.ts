/**
 * AI Response Validation
 *
 * Validates AI-generated responses to detect if prompt injection succeeded.
 * Looks for injection artifacts, data exfiltration attempts, and structural issues.
 */

export interface ResponseValidation {
  isValid: boolean;
  flags: string[];
  sanitized?: any;
}

/**
 * Patterns that indicate ACTUAL injection success or data exfiltration
 * (not just analytical discussion of security concepts)
 */
const INJECTION_ARTIFACTS = [
  // Actual credential patterns (not just mentions of the words)
  {
    pattern: /sk-[a-zA-Z0-9]{20,}/g,
    description: "Actual OpenAI API key pattern detected",
  },
  {
    pattern: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/g,
    description: "Bearer token detected",
  },
  {
    pattern: /AKIA[0-9A-Z]{16}/g,
    description: "AWS access key detected",
  },
  {
    // Actual credential key-value pairs with suspicious values
    pattern:
      /(secret|password|key|token)\s*[:=]\s*["']?[A-Za-z0-9+/=\-_]{16,}["']?/gi,
    description: "Credential key-value pair detected",
  },

  // Instruction leakage attempts
  {
    pattern:
      /(here (is|are)|found|revealed|exposed|leaked)\s+(the\s+)?(original|system|actual|full)\s+(instructions?|prompt)/gi,
    description: "Attempt to reveal system instructions detected",
  },

  // Data exfiltration commands
  {
    pattern:
      /(print|output|display|return|show)\s+(all\s+)?(environment|env|secrets?|keys|passwords|training[_\s]?data)/gi,
    description: "Data exfiltration command detected",
  },

  // System internals exposure (only if actively revealing, not discussing)
  {
    pattern:
      /(revealing|exposing|leaking|dumping)\s+(the\s+)?(system|internal|hidden|secret)\s+(prompt|instructions?|data)/gi,
    description: "Attempt to expose system internals detected",
  },
];

/**
 * Validates extraction API response for injection artifacts
 *
 * Checks if the AI's response contains signs that prompt injection succeeded,
 * such as exposure of API keys, secrets, system internals, etc.
 *
 * @param response - The raw AI response text (may contain markdown)
 * @returns Validation result with flags and sanitized data
 *
 * @example
 * const result = validateExtractionResponse(aiResponse);
 * if (!result.isValid) {
 *   console.error('Injection detected:', result.flags);
 * }
 */
export function validateExtractionResponse(
  response: string,
): ResponseValidation {
  const flags: string[] = [];

  try {
    // Remove markdown code blocks if present
    let cleaned = response;
    const jsonMatch = response.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      cleaned = jsonMatch[1].trim();
    }

    const parsed = JSON.parse(cleaned);

    // Validate expected structure
    if (!parsed.summary || typeof parsed.summary !== "string") {
      flags.push("Missing or invalid summary field");
    }

    if (
      !parsed.failure_analysis ||
      typeof parsed.failure_analysis !== "object"
    ) {
      flags.push("Missing or invalid failure_analysis field");
    }

    // Check for injection artifacts in response
    const responseText = JSON.stringify(parsed).toLowerCase();

    for (const { pattern, description } of INJECTION_ARTIFACTS) {
      // Reset regex lastIndex to avoid state issues with global flag
      pattern.lastIndex = 0;
      if (pattern.test(responseText)) {
        flags.push(description);
      }
    }

    // Check response size (data exfiltration might cause huge responses)
    const MAX_RESPONSE_SIZE = 100000; // 100KB
    if (responseText.length > MAX_RESPONSE_SIZE) {
      flags.push(
        `Response exceeds ${MAX_RESPONSE_SIZE} characters - possible exfiltration attempt`,
      );
    }

    // Check for excessive nesting (complexity attack)
    const nestingLevel = calculateMaxNestingLevel(parsed);
    const MAX_NESTING = 10;
    if (nestingLevel > MAX_NESTING) {
      flags.push(`Excessive nesting depth (${nestingLevel} levels)`);
    }

    // Note: Some flags are warnings, not blockers
    // Only block on high-risk flags (secrets, excessive size)
    const highRiskFlags = flags.filter(
      (flag) =>
        flag.includes("key") ||
        flag.includes("secret") ||
        flag.includes("password") ||
        flag.includes("token") ||
        flag.includes("exfiltration"),
    );

    return {
      isValid: highRiskFlags.length === 0,
      flags,
      sanitized: parsed,
    };
  } catch (error) {
    return {
      isValid: false,
      flags: ["Invalid JSON response - possible injection attempt"],
    };
  }
}

/**
 * Calculates the maximum nesting level in a JSON object
 *
 * @param obj - The object to analyze
 * @param currentLevel - Current recursion level
 * @returns Maximum nesting depth
 */
function calculateMaxNestingLevel(obj: any, currentLevel: number = 0): number {
  if (typeof obj !== "object" || obj === null) {
    return currentLevel;
  }

  const childLevels = Object.values(obj).map((value) =>
    calculateMaxNestingLevel(value, currentLevel + 1),
  );

  return Math.max(currentLevel, ...childLevels);
}

/**
 * Validates generation output text for suspicious content
 *
 * Lighter validation than extraction responses since user outputs
 * are meant to be creative and varied.
 *
 * @param outputText - The generated output text
 * @returns Validation result
 */
export function validateGenerationOutput(
  outputText: string,
): ResponseValidation {
  const flags: string[] = [];

  // Check for excessive length (resource abuse)
  const MAX_OUTPUT_LENGTH = 50000; // 50KB
  if (outputText.length > MAX_OUTPUT_LENGTH) {
    flags.push(
      `Output exceeds ${MAX_OUTPUT_LENGTH} characters (${outputText.length} chars)`,
    );
  }

  // Check for repetitive content (generation attack)
  const repetitivePattern = /(.{20,}?)\1{5,}/; // Same 20+ char sequence repeated 5+ times
  if (repetitivePattern.test(outputText)) {
    flags.push("Excessive repetitive content detected");
  }

  // Only block on high-risk issues
  const isValid = flags.length === 0;

  return {
    isValid,
    flags,
  };
}
