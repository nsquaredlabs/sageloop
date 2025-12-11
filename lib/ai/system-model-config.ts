/**
 * System Model Configuration
 *
 * Centralized configuration for the AI model used for system operations:
 * - Pattern extraction (analyzing rated outputs)
 * - Prompt fix integration (applying fixes to system prompts)
 * - Future: Insights generation, quality analysis, etc.
 *
 * This uses system API keys (not user's) to ensure consistent, high-quality analysis.
 * Change these settings to control which provider/model handles all system operations.
 */

export const SYSTEM_MODEL_CONFIG = {
  /**
   * AI provider for system operations
   * - 'openai': Use OpenAI models (GPT-4, etc.)
   * - 'anthropic': Use Anthropic models (Claude, etc.)
   */
  provider: 'anthropic' as const,

  /**
   * Model name for system operations
   * OpenAI options: 'gpt-4-turbo', 'gpt-4o', 'gpt-4', 'gpt-3.5-turbo'
   * Anthropic options: 'claude-opus-4-5-20251101', 'claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001'
   */
  model: 'claude-haiku-4-5' as const,

  /**
   * Temperature for system operations (0-1)
   * Lower = more deterministic and consistent
   * Higher = more creative but less predictable
   *
   * 0.3 is recommended for analytical tasks (extraction, pattern analysis)
   */
  temperature: 0.3,
} as const;

/**
 * Type representing the system model configuration
 */
export type SystemModelConfig = typeof SYSTEM_MODEL_CONFIG;
