/**
 * Model tier classification for quota enforcement
 * Based on marketing PRD pricing tiers
 */

export type ModelTier = 'free' | 'standard' | 'premium' | 'enterprise';

/**
 * Model tier mappings
 * Free: GPT-5-nano (free tier only)
 * Standard: GPT-5-mini (Pro/Team/Enterprise)
 * Premium: GPT-5.1, Claude Sonnet 4.5 (Pro/Team/Enterprise)
 * Enterprise: GPT-5.2, Claude Opus 4.5, o3, etc. (Enterprise only, BYOK)
 */
export const MODEL_TIER_MAP: Record<string, ModelTier> = {
  // Free tier (Phase 1 - only model available for free users)
  'gpt-5-nano': 'free',
  'gpt-4o-mini': 'free', // Fallback if GPT-5-nano unavailable

  // Standard tier (Pro and higher)
  'gpt-5-mini': 'standard',
  'gpt-4o': 'standard', // Legacy fallback
  'gpt-3.5-turbo': 'standard', // Legacy fallback

  // Premium tier (Pro and higher, uses premium quota)
  'gpt-5.1': 'premium',
  'claude-3-5-sonnet-20241022': 'premium',
  'claude-3-5-sonnet-20240620': 'premium',
  'claude-3-5-sonnet': 'premium', // Alias for latest
  'claude-sonnet-4-5': 'premium', // Future model

  // Enterprise tier (Enterprise plan only, BYOK)
  'gpt-5.2': 'enterprise',
  'claude-opus-4-5': 'enterprise',
  'claude-3-opus': 'enterprise',
  'o3': 'enterprise',
  'o3-mini': 'enterprise',
  'o1': 'enterprise',
  'o1-mini': 'enterprise',
};

/**
 * Get model tier for a given model name
 */
export function getModelTier(modelName: string): ModelTier {
  const tier = MODEL_TIER_MAP[modelName];
  if (!tier) {
    console.warn(`Unknown model: ${modelName}, defaulting to premium tier for safety`);
    return 'premium'; // Default to premium for safety (higher quota consumption)
  }
  return tier;
}

/**
 * Check if a model is allowed for a given plan
 */
export function isModelAllowedForPlan(
  modelName: string,
  planId: 'free' | 'pro' | 'team' | 'enterprise'
): boolean {
  const tier = getModelTier(modelName);

  // Free tier: Only 'free' tier models
  if (planId === 'free') {
    return tier === 'free';
  }

  // Pro/Team: 'free', 'standard', and 'premium' tier models
  if (planId === 'pro' || planId === 'team') {
    return tier === 'free' || tier === 'standard' || tier === 'premium';
  }

  // Enterprise: All models
  if (planId === 'enterprise') {
    return true;
  }

  return false;
}

/**
 * Get display name for model tier
 */
export function getModelTierDisplayName(tier: ModelTier): string {
  switch (tier) {
    case 'free':
      return 'Free';
    case 'standard':
      return 'Standard';
    case 'premium':
      return 'Premium';
    case 'enterprise':
      return 'Enterprise';
  }
}

/**
 * Get all models available for a given plan
 */
export function getAvailableModelsForPlan(
  planId: 'free' | 'pro' | 'team' | 'enterprise'
): string[] {
  return Object.keys(MODEL_TIER_MAP).filter((modelName) =>
    isModelAllowedForPlan(modelName, planId)
  );
}

/**
 * Get free tier models (GPT-5-nano)
 */
export function getFreeModels(): string[] {
  return Object.keys(MODEL_TIER_MAP).filter(
    (modelName) => MODEL_TIER_MAP[modelName] === 'free'
  );
}

/**
 * Get standard tier models (GPT-5-mini)
 */
export function getStandardModels(): string[] {
  return Object.keys(MODEL_TIER_MAP).filter(
    (modelName) => MODEL_TIER_MAP[modelName] === 'standard'
  );
}

/**
 * Get premium tier models (GPT-5.1, Claude Sonnet 4.5)
 */
export function getPremiumModels(): string[] {
  return Object.keys(MODEL_TIER_MAP).filter(
    (modelName) => MODEL_TIER_MAP[modelName] === 'premium'
  );
}

/**
 * Get enterprise tier models (GPT-5.2, Claude Opus 4.5, o3)
 */
export function getEnterpriseModels(): string[] {
  return Object.keys(MODEL_TIER_MAP).filter(
    (modelName) => MODEL_TIER_MAP[modelName] === 'enterprise'
  );
}
