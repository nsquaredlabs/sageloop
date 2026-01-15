/**
 * Default Model Configuration
 *
 * Centralized configuration for default AI models based on subscription tier.
 * This ensures consistent model defaults across the application.
 *
 * Model tier mapping (from marketing pricing):
 * - Free tier: gpt-5-nano (standard outputs)
 * - Pro/Team/Enterprise: gpt-5-mini (standard), GPT-5.1/Claude Sonnet 4.5 (premium)
 *
 * @see /docs/guides/ai-integration.md for full AI integration guide
 * @see model-tiers.ts for model tier definitions
 */

export type SubscriptionPlan = "free" | "pro" | "team" | "enterprise";

/**
 * Default model for each subscription plan
 *
 * These are the standard tier defaults:
 * - Free: gpt-5-nano (only standard model available)
 * - Pro/Team/Enterprise: gpt-5-mini (standard tier default)
 *
 * Users can always select other models allowed by their plan.
 */
export const DEFAULT_MODEL_BY_PLAN: Record<SubscriptionPlan, string> = {
  free: "gpt-5-nano",
  pro: "gpt-5-mini",
  team: "gpt-5-mini",
  enterprise: "gpt-5-mini",
};

/**
 * Default model for new users (onboarding)
 *
 * New users start on the free tier, so default to gpt-5-nano.
 * This model provides excellent quality while being cost-effective
 * for the free tier's 100 outputs/month limit.
 */
export const DEFAULT_MODEL_FOR_ONBOARDING = "gpt-5-nano";

/**
 * Default model when user's plan is unknown
 *
 * Use the free tier model as a safe fallback.
 * The quota system will enforce proper limits regardless.
 */
export const DEFAULT_MODEL_FALLBACK = "gpt-5-nano";

/**
 * Get the default model for a subscription plan
 *
 * @param plan - The user's subscription plan
 * @returns The default model ID for that plan
 *
 * @example
 * const model = getDefaultModelForPlan('free'); // 'gpt-5-nano'
 * const model = getDefaultModelForPlan('pro');  // 'gpt-5-mini'
 */
export function getDefaultModelForPlan(plan: SubscriptionPlan): string {
  return DEFAULT_MODEL_BY_PLAN[plan] || DEFAULT_MODEL_FALLBACK;
}

/**
 * Supported AI models for onboarding wizard
 *
 * Shows models in order of recommendation:
 * 1. Free tier model (gpt-5-nano) - available to all users
 * 2. Standard tier models (gpt-5-mini, gpt-4o) - Pro+ users
 * 3. Premium tier models (gpt-5.1, Claude Sonnet) - Pro+ users
 *
 * Note: The UI should filter these based on user's plan.
 * @see model-tiers.ts for plan-based model filtering
 */
export const SUPPORTED_MODELS = [
  // Free tier models (available to all)
  { id: "gpt-5-nano", name: "GPT-5 Nano", provider: "openai", tier: "free" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai", tier: "free" },

  // Standard tier models (Pro+)
  {
    id: "gpt-5-mini",
    name: "GPT-5 Mini",
    provider: "openai",
    tier: "standard",
  },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", tier: "standard" },

  // Premium tier models (Pro+)
  { id: "gpt-5.1", name: "GPT-5.1", provider: "openai", tier: "premium" },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    tier: "premium",
  },
  {
    id: "claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    tier: "premium",
  },

  // Enterprise tier models (Enterprise only, BYOK)
  { id: "gpt-5.2", name: "GPT-5.2", provider: "openai", tier: "enterprise" },
  {
    id: "claude-opus-4-5",
    name: "Claude Opus 4.5",
    provider: "anthropic",
    tier: "enterprise",
  },
  { id: "o3", name: "OpenAI o3", provider: "openai", tier: "enterprise" },
] as const;

/**
 * Get models available for a subscription plan
 *
 * Filters SUPPORTED_MODELS to only include models the user can access.
 *
 * @param plan - The user's subscription plan
 * @returns Array of models available for that plan
 *
 * @example
 * const models = getModelsForPlan('free');
 * // Returns only gpt-5-nano and gpt-4o-mini
 */
export function getModelsForPlan(plan: SubscriptionPlan) {
  const tiersByPlan: Record<SubscriptionPlan, string[]> = {
    free: ["free"],
    pro: ["free", "standard", "premium"],
    team: ["free", "standard", "premium"],
    enterprise: ["free", "standard", "premium", "enterprise"],
  };

  const allowedTiers = tiersByPlan[plan] || ["free"];
  return SUPPORTED_MODELS.filter((model) => allowedTiers.includes(model.tier));
}
