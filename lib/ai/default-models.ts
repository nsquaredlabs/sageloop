export type SubscriptionPlan = "unlimited";

export const DEFAULT_MODEL_FALLBACK = "gpt-4o-mini";

export function getDefaultModelForPlan(): string {
  return DEFAULT_MODEL_FALLBACK;
}

export const SUPPORTED_MODELS = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    tier: "standard",
  },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai", tier: "standard" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "openai", tier: "standard" },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    provider: "openai",
    tier: "standard",
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    provider: "openai",
    tier: "standard",
  },
  {
    id: "o3-mini",
    name: "OpenAI o3-mini",
    provider: "openai",
    tier: "standard",
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
    tier: "standard",
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    tier: "standard",
  },
] as const;

export function getModelsForPlan() {
  return [...SUPPORTED_MODELS];
}
