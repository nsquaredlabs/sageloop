/**
 * Provider Resolver
 *
 * Determines which AI provider and model to use based on:
 * 1. User's requested model
 * 2. Available API keys (user-provided or system)
 * 3. Fallback behavior when keys are missing
 *
 * This eliminates ~80 lines of duplicated provider selection logic
 * across multiple API routes.
 */

export interface ProviderConfig {
  provider: 'openai' | 'anthropic';
  modelName: string;
  apiKey: string | undefined;
  usingFallback: boolean;
}

export interface UserApiKeys {
  openai?: string;
  anthropic?: string;
}

/**
 * Resolves which AI provider and model to use based on:
 * 1. User's requested model
 * 2. Available API keys (user or system)
 *
 * Phase 1 Strategy:
 * - All users (free tier) use system API keys with quota limits enforced by subscription system
 * - No user API keys (BYOK) in Phase 1
 * - Requested model is used as-is (no fallback logic needed)
 *
 * Phase 2+ Strategy (Future):
 * - Paid users can bring their own API keys (BYOK)
 * - Fallback logic will be added for users without keys for specific providers
 *
 * @param requestedModel - The model name requested (e.g., 'gpt-5-nano', 'claude-opus-4')
 * @param userKeys - User's API keys object (or null if not configured)
 * @returns Provider configuration with model, API key, and fallback status
 *
 * @example
 * // Phase 1: No user keys, use system keys with requested model
 * const config = resolveProvider('gpt-5-nano', null);
 * // Returns: { provider: 'openai', modelName: 'gpt-5-nano', apiKey: undefined, usingFallback: false }
 */
export function resolveProvider(
  requestedModel: string,
  userKeys: UserApiKeys | null
): ProviderConfig {
  const defaultModel = 'gpt-5-nano';
  const modelName = requestedModel || defaultModel;
  const isClaudeModel = modelName.includes('claude');
  const provider: 'openai' | 'anthropic' = isClaudeModel ? 'anthropic' : 'openai';

  // Phase 1: All users use system API keys (apiKey is undefined)
  // The quota system enforces model access based on subscription plan
  // No fallback needed - use the requested model as-is
  const hasUserKeys = userKeys?.openai || userKeys?.anthropic;

  if (!hasUserKeys) {
    console.log('No user API keys configured, using system keys');
  }

  // Get the appropriate API key (will be undefined for Phase 1, system keys used in generation.ts)
  const apiKey = userKeys?.[provider] ?? undefined;

  return {
    provider,
    modelName,
    apiKey,
    usingFallback: false, // Phase 1: No fallback, quota system handles model restrictions
  };
}
