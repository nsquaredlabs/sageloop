export interface ProviderConfig {
  provider: "openai" | "anthropic";
  modelName: string;
  apiKey: string | undefined;
  usingFallback: boolean;
}

export interface UserApiKeys {
  openai?: string;
  anthropic?: string;
}

export function resolveProvider(
  requestedModel: string,
  userKeys: UserApiKeys | null,
): ProviderConfig {
  const defaultModel = "gpt-4o-mini";
  const modelName = requestedModel || defaultModel;
  const isClaudeModel = modelName.includes("claude");
  const provider: "openai" | "anthropic" = isClaudeModel
    ? "anthropic"
    : "openai";
  const apiKey = userKeys?.[provider] ?? undefined;

  return { provider, modelName, apiKey, usingFallback: false };
}
