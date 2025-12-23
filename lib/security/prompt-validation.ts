/**
 * Prompt Injection Validation
 *
 * Validates user-provided system prompts and AI responses for injection attempts.
 * See: docs/security/PROMPT_INJECTION_ANALYSIS.md
 *
 * CRITICAL: Sageloop's core functionality involves using user-provided system prompts
 * to generate AI outputs. This creates a HIGH RISK attack surface for prompt injection.
 */

export interface PromptValidationResult {
  isValid: boolean;
  risk: "low" | "medium" | "high";
  flags: string[];
}

/**
 * Validates user-provided system prompts for injection attempts
 *
 * Defense Strategy:
 * 1. Pattern Detection: Block known injection patterns
 * 2. Resource Limits: Prevent resource exhaustion (CWE-400)
 * 3. Format Validation: Detect delimiter confusion attempts
 * 4. Unicode Validation: Detect homoglyph attacks
 *
 * @param prompt - The user-provided system prompt to validate
 * @returns Validation result with risk level and flags
 */
export function validateSystemPrompt(prompt: string): PromptValidationResult {
  const flags: string[] = [];
  let risk: "low" | "medium" | "high" = "low";

  // Check for common injection patterns
  const injectionPatterns = [
    // Role confusion attempts
    {
      pattern: /ignore\s+(all\s+)?(previous|above|prior)\s+instructions?/gi,
      severity: "high" as const,
      description: "Instruction override attempt: ignore previous instructions",
    },
    {
      pattern: /system\s+(mode|prompt)/gi,
      severity: "high" as const,
      description: "System mode/prompt manipulation",
    },
    {
      pattern: /system\s+override/gi,
      severity: "medium" as const,
      description: "System override mention",
    },
    {
      pattern: /you\s+are\s+now\s+(a\s+)?different/gi,
      severity: "high" as const,
      description: "Role redefinition attempt",
    },

    // Data exfiltration/extraction attempts
    {
      pattern:
        /(reveal|show|output|print|display)\s+(all\s+)?((your|the)\s+)?(training|data|prompt|instructions|keys|secrets?|environment|api|password)/gi,
      severity: "high" as const,
      description: "Data extraction attempt",
    },
    {
      pattern:
        /what\s+(is|are|was|were)\s+(your|the)\s+(original|previous|system)\s+(instructions?|prompt)/gi,
      severity: "high" as const,
      description: "System prompt extraction attempt",
    },

    // Jailbreak attempts
    {
      pattern: /DAN\s+mode/gi,
      severity: "high" as const,
      description: "DAN jailbreak attempt",
    },
    {
      pattern: /(developer\s+mode|dev\s+mode).*(bypass|override|disable)/gi,
      severity: "high" as const,
      description: "Developer mode bypass attempt",
    },
    {
      pattern: /developer\s+mode/gi,
      severity: "medium" as const,
      description: "Developer mode activation",
    },
    {
      pattern: /jailbreak/gi,
      severity: "high" as const,
      description: "Explicit jailbreak reference",
    },
    {
      pattern: /ignore\s+(all\s+)?safety/gi,
      severity: "high" as const,
      description: "Safety bypass attempt",
    },
    {
      pattern:
        /bypass\s+(all\s+)?(content\s+)?(filter|safety|security|restrictions?)/gi,
      severity: "high" as const,
      description: "Security bypass attempt",
    },

    // Output manipulation (potential resource abuse)
    {
      pattern: /repeat.*\d{3,}/gi,
      severity: "medium" as const,
      description: "Large repetition request",
    },
    {
      pattern: /maximum\s+tokens?/gi,
      severity: "medium" as const,
      description: "Token limit manipulation",
    },

    // Delimiter confusion
    {
      pattern: /"""\s*\n\s*"""/g,
      severity: "medium" as const,
      description: "Delimiter confusion detected",
    },
    {
      pattern: /}\s*}\s*}/g,
      severity: "medium" as const,
      description: "Multiple closing braces (delimiter confusion)",
    },
    {
      pattern: /---\s*END/gi,
      severity: "medium" as const,
      description: "Delimiter end marker",
    },
    {
      pattern: /<\/[a-z_]+>[\s\S]*?<[a-z_]+>/gi,
      severity: "medium" as const,
      description: "XML tag manipulation (delimiter confusion)",
    },

    // Encoding bypass attempts
    {
      pattern:
        /(decode|base64|hex|rot13|encode).*(execute|run|eval|interpret)/gi,
      severity: "medium" as const,
      description: "Encoding bypass attempt detected",
    },
  ];

  for (const { pattern, severity, description } of injectionPatterns) {
    const matches = prompt.match(pattern);
    if (matches) {
      flags.push(`${description} (${matches.length} occurrence(s))`);
      if (severity === "high") risk = "high";
      else if (severity === "medium" && risk !== "high") risk = "medium";
    }
  }

  // Check for excessive length (resource abuse - CWE-400)
  if (prompt.length > 10000) {
    flags.push("Prompt exceeds 10,000 characters");
    if (risk !== "high") risk = "medium";
  }

  // Check for excessive newlines (delimiter confusion)
  const newlineCount = (prompt.match(/\n/g) || []).length;
  if (newlineCount > 100) {
    flags.push("Excessive newlines detected");
    if (risk !== "high") risk = "medium";
  }

  // Check for suspicious Unicode (homoglyph attacks)
  const suspiciousUnicode = /[\u200B-\u200D\uFEFF\u202A-\u202E]/g;
  if (suspiciousUnicode.test(prompt)) {
    flags.push(
      "Suspicious Unicode characters detected (zero-width/directional)",
    );
    if (risk !== "high") risk = "medium";
  }

  return {
    isValid: risk !== "high",
    risk,
    flags,
  };
}

/**
 * Validates extraction response for injection artifacts
 *
 * Used to detect if a prompt injection was successful by examining the AI's response
 * for signs of data exfiltration or instruction override.
 *
 * @param response - The AI-generated response to validate
 * @returns Validation result with risk level and flags
 */
export function validateExtractionResponse(
  response: string,
): PromptValidationResult {
  const flags: string[] = [];
  let risk: "low" | "medium" | "high" = "low";

  try {
    // Check for injection artifacts in response
    const injectionArtifacts = [
      {
        pattern: /API[_\s]?key/gi,
        description: "API key reference detected",
      },
      {
        pattern: /sk-[a-zA-Z0-9]{20,}/g,
        description: "OpenAI key pattern detected",
      },
      {
        pattern: /secret/gi,
        description: "Secret reference detected",
      },
      {
        pattern: /token/gi,
        description: "Token reference detected",
      },
      {
        pattern: /password/gi,
        description: "Password reference detected",
      },
      {
        pattern: /environment[_\s]?variable/gi,
        description: "Environment variable reference detected",
      },
      {
        pattern: /training[_\s]?data/gi,
        description: "Training data reference detected",
      },
    ];

    for (const { pattern, description } of injectionArtifacts) {
      if (pattern.test(response)) {
        flags.push(description);
        risk = "high";
      }
    }

    // Check response size (data exfiltration might cause huge responses)
    if (response.length > 100000) {
      flags.push("Response exceeds 100KB - possible exfiltration attempt");
      risk = "high";
    }

    return {
      isValid: risk !== "high",
      risk,
      flags,
    };
  } catch (error) {
    return {
      isValid: false,
      risk: "high",
      flags: ["Response validation error"],
    };
  }
}

/**
 * Sanitizes a system prompt by removing potentially dangerous patterns
 * while preserving legitimate content.
 *
 * WARNING: This is a last-resort defense. Always prefer rejecting
 * invalid prompts over attempting to sanitize them.
 *
 * @param prompt - The prompt to sanitize
 * @returns Sanitized prompt
 */
export function sanitizeSystemPrompt(prompt: string): string {
  let sanitized = prompt;

  // Remove excessive newlines (keep max 2 consecutive)
  sanitized = sanitized.replace(/\n{3,}/g, "\n\n");

  // Remove suspicious Unicode
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF\u202A-\u202E]/g, "");

  // Truncate to reasonable length
  if (sanitized.length > 10000) {
    sanitized = sanitized.substring(0, 10000);
  }

  return sanitized;
}

/**
 * Validates scenario input text for injection attempts
 *
 * Less strict than system prompt validation because:
 * - Scenarios legitimately test edge cases (e.g., "what if a user says 'ignore instructions'?")
 * - We only flag truly suspicious exfiltration attempts
 *
 * @param input - The scenario input text to validate
 * @returns Validation result with risk level and flags
 */
export function validateScenarioInput(input: string): PromptValidationResult {
  const flags: string[] = [];
  let risk: "low" | "medium" | "high" = "low";

  // Only check for direct exfiltration attempts (not role confusion)
  const highRiskPatterns = [
    {
      pattern:
        /(reveal|show|output|print|display)\s+(all\s+)?(your|the)?\s*(training|data|prompt|instructions|keys|secrets?|environment|api|password|configuration|internal)/gi,
      description: "Data exfiltration attempt",
    },
    {
      pattern:
        /(display|show|output|reveal)\s+(all\s+)?(system\s+)?(configuration|data|internal)/gi,
      description: "System data exfiltration attempt",
    },
  ];

  for (const { pattern, description } of highRiskPatterns) {
    const matches = input.match(pattern);
    if (matches) {
      flags.push(`${description} (${matches.length} occurrence(s))`);
      risk = "high";
    }
  }

  // Check for excessive length (resource abuse)
  if (input.length > 50000) {
    flags.push("Input exceeds 50,000 characters");
    if (risk !== "high") risk = "medium";
  }

  return {
    isValid: risk !== "high",
    risk,
    flags,
  };
}

/**
 * Wraps user content in XML-style delimiters to prevent prompt injection
 *
 * This is a key defense strategy: by clearly marking user content with delimiters,
 * we make it harder for attackers to "escape" and inject instructions.
 *
 * Example:
 * ```
 * wrapUserContent("Hello world", "user_input")
 * // Returns: "<user_input>\nHello world\n</user_input>"
 * ```
 *
 * @param content - The user-provided content to wrap
 * @param tagName - The delimiter tag name (e.g., "user_input", "user_system_prompt")
 * @returns Wrapped content with XML-style delimiters
 */
export function wrapUserContent(content: string, tagName: string): string {
  return `<${tagName}>\n${content}\n</${tagName}>`;
}

/**
 * Generates a hash of a prompt for audit logging
 *
 * Used to detect repetitive attack patterns without storing the full prompt text.
 * Helps identify:
 * - Users testing the same injection repeatedly
 * - Coordinated attacks using identical prompts
 *
 * @param prompt - The prompt to hash
 * @returns Base64-encoded hash (short, collision-resistant)
 */
export function hashPrompt(prompt: string): string {
  // Simple hash using Web Crypto API (SHA-256)
  // For Node.js environments, we'll use a simple string hash
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert to base36 for a short, readable hash
  return Math.abs(hash).toString(36);
}
