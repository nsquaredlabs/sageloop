export const SUPPORTED_MODELS = [
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "openai" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", provider: "openai" },
  { id: "gpt-4.1-nano", name: "GPT-4.1 Nano", provider: "openai" },
  { id: "o3-mini", name: "OpenAI o3-mini", provider: "openai" },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "anthropic",
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
  },
] as const;
