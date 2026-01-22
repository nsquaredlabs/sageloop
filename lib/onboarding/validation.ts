/**
 * Onboarding Step Validation Schemas
 *
 * Zod schemas for validating onboarding wizard form data.
 */

import { z } from "zod";

/**
 * Step 1: Project Setup validation schema
 *
 * Note: Temperature has been removed as GPT-5 models don't accept temperature parameters.
 */
export const projectSetupSchema = z.object({
  name: z
    .string()
    .min(3, "Project name must be at least 3 characters")
    .max(100, "Project name must be 100 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  model: z.string().min(1, "Please select an AI model"),
  systemPrompt: z
    .string()
    .min(10, "System prompt must be at least 10 characters")
    .max(10000, "System prompt must be 10,000 characters or less"),
});

export type ProjectSetupData = z.infer<typeof projectSetupSchema>;

/**
 * Step 2: Scenario validation schema
 */
export const scenarioSchema = z.object({
  input_text: z
    .string()
    .min(1, "Scenario cannot be empty")
    .max(500, "Scenario must be 500 characters or less"),
});

export const bulkScenariosSchema = z.object({
  scenarios: z
    .array(scenarioSchema)
    .min(1, "At least 1 scenario is required")
    .max(1000, "Maximum 1000 scenarios allowed"),
});

export type BulkScenariosData = z.infer<typeof bulkScenariosSchema>;

/**
 * Parse bulk scenario text into array of scenarios
 *
 * Delimiter behavior:
 * - Double newlines (\n\n) separate scenarios
 * - Single newlines are preserved within scenarios (for multi-line input via Shift+Enter)
 * - Scenarios are trimmed of leading/trailing whitespace
 * - Empty scenarios are filtered out
 * - Scenarios over 500 characters are filtered out
 */
export function parseBulkScenarios(text: string): string[] {
  // Split by double newlines to separate scenarios
  // This allows single newlines (Shift+Enter) within a scenario
  return text
    .split(/\n\n+/)
    .map((scenario) => scenario.trim())
    .filter((scenario) => scenario.length > 0 && scenario.length <= 500);
}

/**
 * Validate bulk scenario text
 * Returns validation result with errors if any
 */
export function validateBulkScenarios(text: string): {
  valid: boolean;
  scenarios: string[];
  errors: string[];
} {
  const scenarios = parseBulkScenarios(text);
  const errors: string[] = [];

  if (scenarios.length === 0) {
    errors.push("At least 1 scenario is required");
  }

  if (scenarios.length > 1000) {
    errors.push("Maximum 1000 scenarios allowed");
  }

  // Check for scenarios that were truncated (split by double newlines, same as parseBulkScenarios)
  const allScenarios = text
    .split(/\n\n+/)
    .map((scenario) => scenario.trim())
    .filter((scenario) => scenario.length > 0);
  const truncated = allScenarios.filter((scenario) => scenario.length > 500);
  if (truncated.length > 0) {
    errors.push(
      `${truncated.length} scenario(s) exceed 500 characters and will be ignored`,
    );
  }

  return {
    valid: errors.length === 0,
    scenarios,
    errors,
  };
}
