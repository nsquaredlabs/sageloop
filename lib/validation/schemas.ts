/**
 * Zod Validation Schemas
 *
 * Validation schemas for API request bodies.
 * These provide runtime validation and better error messages.
 */

import { z } from "zod";

// ============================================================================
// Projects
// ============================================================================

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  model_config: z.object({
    model: z.string().min(1, "Model is required"),
    system_prompt: z.string().optional(),
    variables: z.record(z.string(), z.string()).optional(),
  }),
});

// ============================================================================
// Scenarios
// ============================================================================

// Security: CWE-400 (Resource Exhaustion) - Limit scenario input length
const MAX_SCENARIO_LENGTH = 10000;

export const createScenarioSchema = z.object({
  input_text: z
    .string()
    .min(1, "Input text is required")
    .max(
      MAX_SCENARIO_LENGTH,
      `Input text must be ${MAX_SCENARIO_LENGTH} characters or less`,
    ),
  order: z.number().int().optional(),
});

export const bulkCreateScenariosSchema = z.object({
  scenarios: z
    .array(
      z.object({
        input_text: z
          .string()
          .min(1, "Input text is required")
          .max(
            MAX_SCENARIO_LENGTH,
            `Input text must be ${MAX_SCENARIO_LENGTH} characters or less`,
          ),
      }),
    )
    .min(1, "At least one scenario is required"),
});

// ============================================================================
// Retest (Prompt Iteration)
// ============================================================================

export const retestSchema = z.object({
  scenarioIds: z.array(z.number()).min(1, "At least one scenario is required"),
  newSystemPrompt: z.string().min(1, "System prompt is required"),
  improvementNote: z
    .string()
    .max(1000, "Improvement note must be 1000 characters or less")
    .optional(),
});

// ============================================================================
// Ratings
// ============================================================================

// Security: CWE-400 (Resource Exhaustion) - Limit feedback and tags
const MAX_FEEDBACK_LENGTH = 5000;
const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 50;

export const createRatingSchema = z.object({
  stars: z
    .number()
    .int()
    .min(1, "Rating must be between 1 and 5")
    .max(5, "Rating must be between 1 and 5"),
  feedback_text: z
    .string()
    .max(
      MAX_FEEDBACK_LENGTH,
      `Feedback must be ${MAX_FEEDBACK_LENGTH} characters or less`,
    )
    .optional(),
  tags: z
    .array(
      z
        .string()
        .max(
          MAX_TAG_LENGTH,
          `Each tag must be ${MAX_TAG_LENGTH} characters or less`,
        ),
    )
    .max(MAX_TAGS, `Maximum ${MAX_TAGS} tags allowed`)
    .optional(),
});

// ============================================================================
// API Keys
// ============================================================================

export const updateApiKeysSchema = z
  .object({
    openai_key: z.string().optional(),
    anthropic_key: z.string().optional(),
  })
  .refine(
    (data) => data.openai_key || data.anthropic_key,
    "At least one API key must be provided",
  );

export const testApiKeySchema = z.object({
  provider: z.enum(["openai", "anthropic"]),
  api_key: z.string().min(1, "API key is required"),
});

// ============================================================================
// Helper function to validate and parse requests
// ============================================================================

/**
 * Validates request data against a Zod schema
 * Throws ZodError if validation fails
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Safely validates request data against a Zod schema
 * Returns { success: true, data } or { success: false, error }
 */
export function safeValidateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
