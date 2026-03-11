import { describe, it, expect } from "vitest";
import { resolveProvider } from "@/lib/ai/provider-resolver";

/**
 * Provider Resolver Tests
 *
 * BYOK (bring your own key) is the only behavior:
 * - Users configure their own API keys via Settings or sageloop.config.yaml
 * - When a matching provider key is configured, it is used for the request
 * - When no matching key is configured, apiKey is undefined and the caller
 *   is responsible for falling back to system credentials (if any)
 * - The requested model is used as-is (no fallback logic)
 */

describe("Provider Resolver - With user API keys", () => {
  it("should use requested OpenAI model when user has OpenAI key", () => {
    const result = resolveProvider("gpt-4", { openai: "sk-test-key" });

    expect(result.provider).toBe("openai");
    expect(result.modelName).toBe("gpt-4");
    expect(result.apiKey).toBe("sk-test-key");
    expect(result.usingFallback).toBe(false);
  });

  it("should use requested Anthropic model when user has Anthropic key", () => {
    const result = resolveProvider("claude-opus-4", {
      anthropic: "sk-ant-test",
    });

    expect(result.provider).toBe("anthropic");
    expect(result.modelName).toBe("claude-opus-4");
    expect(result.apiKey).toBe("sk-ant-test");
    expect(result.usingFallback).toBe(false);
  });

  it("should use requested model when user has both keys", () => {
    const apiKeys = { openai: "sk-test", anthropic: "sk-ant-test" };

    // Request OpenAI model
    const openaiResult = resolveProvider("gpt-4", apiKeys);
    expect(openaiResult.provider).toBe("openai");
    expect(openaiResult.modelName).toBe("gpt-4");
    expect(openaiResult.apiKey).toBe("sk-test");
    expect(openaiResult.usingFallback).toBe(false);

    // Request Anthropic model
    const anthropicResult = resolveProvider("claude-sonnet-4-5", apiKeys);
    expect(anthropicResult.provider).toBe("anthropic");
    expect(anthropicResult.modelName).toBe("claude-sonnet-4-5");
    expect(anthropicResult.apiKey).toBe("sk-ant-test");
    expect(anthropicResult.usingFallback).toBe(false);
  });
});

describe("Provider Resolver - No user API keys configured", () => {
  it("should use requested model as-is when no API keys configured", () => {
    const result = resolveProvider("gpt-4", null);

    expect(result.provider).toBe("openai");
    expect(result.modelName).toBe("gpt-4");
    expect(result.apiKey).toBeUndefined();
    expect(result.usingFallback).toBe(false);
  });

  it("should use requested Claude model when no API keys configured", () => {
    const result = resolveProvider("claude-opus-4", null);

    expect(result.provider).toBe("anthropic");
    expect(result.modelName).toBe("claude-opus-4");
    expect(result.apiKey).toBeUndefined();
    expect(result.usingFallback).toBe(false);
  });

  it("should use default model (gpt-4o-mini) when no model specified and no keys", () => {
    const result = resolveProvider("", null);

    expect(result.provider).toBe("openai");
    expect(result.modelName).toBe("gpt-4o-mini");
    expect(result.apiKey).toBeUndefined();
    expect(result.usingFallback).toBe(false);
  });
});

describe("Provider Resolver - Mismatched provider keys (BYOK)", () => {
  it("should not use OpenAI key for a Claude model request", () => {
    // User has an OpenAI key but requested a Claude model — no matching key
    const result = resolveProvider("claude-opus-4", { openai: "sk-test" });

    expect(result.provider).toBe("anthropic");
    expect(result.modelName).toBe("claude-opus-4");
    expect(result.apiKey).toBeUndefined(); // No Anthropic key configured
    expect(result.usingFallback).toBe(false);
  });

  it("should not use Anthropic key for a GPT model request", () => {
    // User has an Anthropic key but requested a GPT model — no matching key
    const result = resolveProvider("gpt-4", { anthropic: "sk-ant-test" });

    expect(result.provider).toBe("openai");
    expect(result.modelName).toBe("gpt-4");
    expect(result.apiKey).toBeUndefined(); // No OpenAI key configured
    expect(result.usingFallback).toBe(false);
  });

  it("should use correct provider key when user has matching key", () => {
    // User requests GPT-4 and has OpenAI key - use it
    const result = resolveProvider("gpt-4", { openai: "sk-test" });

    expect(result.provider).toBe("openai");
    expect(result.modelName).toBe("gpt-4");
    expect(result.apiKey).toBe("sk-test");
    expect(result.usingFallback).toBe(false);
  });
});

describe("Provider Resolver - Model detection", () => {
  it("should detect Claude models by name pattern", () => {
    const models = [
      "claude-opus-4",
      "claude-sonnet-4-5",
      "claude-haiku-4-5-20251001",
      "claude-3-opus-20240229",
    ];

    models.forEach((model) => {
      const result = resolveProvider(model, { anthropic: "sk-ant-test" });
      expect(result.provider).toBe("anthropic");
      expect(result.modelName).toBe(model);
    });
  });

  it("should detect OpenAI models by name pattern", () => {
    const models = ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo", "gpt-4o"];

    models.forEach((model) => {
      const result = resolveProvider(model, { openai: "sk-test" });
      expect(result.provider).toBe("openai");
      expect(result.modelName).toBe(model);
    });
  });
});

describe("Provider Resolver - Edge cases", () => {
  it("should handle empty string model name", () => {
    const result = resolveProvider("", { openai: "sk-test" });

    expect(result.provider).toBe("openai");
    expect(result.modelName).toBe("gpt-4o-mini"); // Default model
    expect(result.apiKey).toBe("sk-test");
    expect(result.usingFallback).toBe(false);
  });

  it("should handle undefined model name", () => {
    const result = resolveProvider(undefined as any, { openai: "sk-test" });

    expect(result.provider).toBe("openai");
    expect(result.modelName).toBe("gpt-4o-mini"); // Default model
    expect(result.apiKey).toBe("sk-test");
    expect(result.usingFallback).toBe(false);
  });

  it("should handle empty API keys object", () => {
    const result = resolveProvider("gpt-4", {});

    expect(result.provider).toBe("openai");
    expect(result.modelName).toBe("gpt-4");
    expect(result.apiKey).toBeUndefined();
    expect(result.usingFallback).toBe(false);
  });

  it("should handle API keys with undefined values", () => {
    const result = resolveProvider("gpt-4", {
      openai: undefined,
      anthropic: undefined,
    });

    expect(result.provider).toBe("openai");
    expect(result.modelName).toBe("gpt-4");
    expect(result.apiKey).toBeUndefined();
    expect(result.usingFallback).toBe(false);
  });
});

describe("Provider Resolver - System key usage", () => {
  it("should return undefined apiKey when no user keys provided", () => {
    const result = resolveProvider("claude-opus-4", null);

    expect(result.apiKey).toBeUndefined(); // Caller uses system env var
    expect(result.usingFallback).toBe(false);
  });

  it("should return undefined apiKey when user has a key for a different provider", () => {
    // User has an OpenAI key but requested Claude — no Anthropic key configured
    const result = resolveProvider("claude-opus-4", { openai: "sk-user-test" });

    expect(result.apiKey).toBeUndefined();
    expect(result.usingFallback).toBe(false);
  });
});
