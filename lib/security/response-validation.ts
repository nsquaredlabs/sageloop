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
 * Patterns that might indicate successful injection or data exfiltration
 */
const INJECTION_ARTIFACTS = [
  // Secrets and credentials
  { pattern: /\bapi[_\s]?key\b/gi, description: "Possible API key exposure" },
  { pattern: /\bsecret\b/gi, description: "Possible secret exposure" },
  { pattern: /\btoken\b/gi, description: "Possible token exposure" },
  { pattern: /\bpassword\b/gi, description: "Possible password exposure" },
  {
    pattern: /\benvironment[_\s]?variable\b/gi,
    description: "Possible environment variable exposure",
  },

  // Training data references
  {
    pattern: /training[_\s]?data/gi,
    description: "Reference to training data",
  },
  {
    pattern: /system[_\s]?prompt/gi,
    description: "Reference to system prompt internals",
  },

  // Tool/function exposure (if we add tools in the future)
  {
    pattern: /available[_\s]?tools/gi,
    description: "Listing available tools",
  },
  { pattern: /function[_\s]?list/gi, description: "Listing functions" },
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
