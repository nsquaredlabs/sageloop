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
 * 2. Available API keys
 * 3. Fallback to free tier if needed
 *
 * @param requestedModel - The model name requested (e.g., 'gpt-4', 'claude-opus-4')
 * @param userKeys - User's API keys object (or null if not configured)
 * @returns Provider configuration with model, API key, and fallback status
 *
 * @example
 * // User has OpenAI key and requests GPT-4
 * const config = resolveProvider('gpt-4', { openai: 'sk-test' });
 * // Returns: { provider: 'openai', modelName: 'gpt-4', apiKey: 'sk-test', usingFallback: false }
 *
 * @example
 * // User has no keys - fallback to system
 * const config = resolveProvider('claude-opus-4', null);
 * // Returns: { provider: 'openai', modelName: 'gpt-3.5-turbo', apiKey: undefined, usingFallback: true }
 */
export function resolveProvider(
  requestedModel: string,
  userKeys: UserApiKeys | null
): ProviderConfig {
  const defaultModel = 'gpt-3.5-turbo';
  let modelName = requestedModel || defaultModel;
  let isClaudeModel = modelName.includes('claude');
  let provider: 'openai' | 'anthropic' = isClaudeModel ? 'anthropic' : 'openai';
  let usingFallback = false;

  // Check if user has any API keys configured
  const hasUserKeys = userKeys?.openai || userKeys?.anthropic;

  if (!hasUserKeys) {
    // No user keys - use system keys with inexpensive model
    console.log('No user API keys configured, using system fallback');
    modelName = 'gpt-3.5-turbo';
    provider = 'openai';
    usingFallback = true;
  } else if (!userKeys[provider]) {
    // User has keys but not for the requested provider
    // Fall back to whichever provider they have configured
    if (userKeys.openai) {
      console.log(`User requested ${provider} but only has OpenAI key, falling back to GPT-3.5 Turbo`);
      modelName = 'gpt-3.5-turbo';
      provider = 'openai';
      usingFallback = true;
    } else if (userKeys.anthropic) {
      console.log(`User requested ${provider} but only has Anthropic key, falling back to Claude Haiku`);
      modelName = 'claude-haiku-4-5-20251001';
      provider = 'anthropic';
      usingFallback = true;
    }
  }

  // Get the appropriate API key
  // At this point, 'provider' has been updated to either:
  // 1. The originally requested provider (if user has that key)
  // 2. The fallback provider (if we switched to user's available provider)
  // So userKeys[provider] gives us the correct key for whichever provider we're using
  const apiKey = userKeys?.[provider] ?? undefined;

  return {
    provider,
    modelName,
    apiKey,
    usingFallback,
  };
}
