import { describe, it, expect } from "vitest";
import { SYSTEM_MODEL_CONFIG } from "@/lib/ai/system-model-config";
import { generateCompletion } from "@/lib/ai/generation";
import { env } from "@/lib/env";

describe("System Model Configuration", () => {
  describe("Configuration validity", () => {
    it("should have a valid provider", () => {
      expect(["openai", "anthropic"]).toContain(SYSTEM_MODEL_CONFIG.provider);
    });

    it("should have a model name specified", () => {
      expect(SYSTEM_MODEL_CONFIG.model).toBeTruthy();
      expect(typeof SYSTEM_MODEL_CONFIG.model).toBe("string");
      expect(SYSTEM_MODEL_CONFIG.model.length).toBeGreaterThan(0);
    });

    it("should not have temperature (removed for consistent outputs)", () => {
      expect(SYSTEM_MODEL_CONFIG).not.toHaveProperty("temperature");
    });
  });

  describe("Provider-specific model validation", () => {
    it("should use valid OpenAI model when provider is openai", () => {
      const provider = SYSTEM_MODEL_CONFIG.provider as string;
      if (provider === "openai") {
        const validOpenAIModels = [
          "gpt-4-turbo",
          "gpt-4o",
          "gpt-4",
          "gpt-3.5-turbo",
          "gpt-4o-mini",
        ];
        const isValidPrefix = validOpenAIModels.some((model) =>
          SYSTEM_MODEL_CONFIG.model.startsWith(
            model.split("-").slice(0, 2).join("-"),
          ),
        );
        expect(isValidPrefix).toBe(true);
      }
    });

    it("should use valid Anthropic model when provider is anthropic", () => {
      const provider = SYSTEM_MODEL_CONFIG.provider as string;
      if (provider === "anthropic") {
        const validAnthropicPrefixes = [
          "claude-opus",
          "claude-sonnet",
          "claude-haiku",
        ];
        const isValidPrefix = validAnthropicPrefixes.some((prefix) =>
          SYSTEM_MODEL_CONFIG.model.startsWith(prefix),
        );
        expect(isValidPrefix).toBe(true);
      }
    });
  });

  describe("Type safety", () => {
    it("should be a readonly constant", () => {
      // TypeScript enforces this at compile time with 'as const'
      // This test verifies the structure exists
      expect(SYSTEM_MODEL_CONFIG).toHaveProperty("provider");
      expect(SYSTEM_MODEL_CONFIG).toHaveProperty("model");
    });

    it("should only have the expected properties (no temperature)", () => {
      const keys = Object.keys(SYSTEM_MODEL_CONFIG);
      expect(keys).toHaveLength(2);
      expect(keys).toEqual(["provider", "model"]);
    });
  });

  describe("Recommended settings", () => {
    it("should use a capable model (not a minimal model)", () => {
      // System operations (extraction, insights) should use quality models
      const freeTierModels = ["gpt-5-nano", "gpt-4o-mini"];
      expect(freeTierModels).not.toContain(SYSTEM_MODEL_CONFIG.model);
    });
  });

  describe("API Key and Provider Integration (CRITICAL)", () => {
    // Helper to check if we're in CI environment
    const isCI =
      process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

    // Helper to check if real API keys are available
    const hasRealApiKeys = () => {
      const provider = SYSTEM_MODEL_CONFIG.provider as string;
      const apiKey =
        provider === "openai" ? env.openai.apiKey : env.anthropic.apiKey;
      const placeholders = [
        "test-anthropic-key-placeholder",
        "test-openai-key-placeholder",
        "your-anthropic-api-key-here",
        "your-openai-api-key-here",
      ];
      return apiKey && !placeholders.includes(apiKey);
    };

    it.skipIf(!hasRealApiKeys())(
      "should have a valid API key format in environment",
      () => {
        const provider = SYSTEM_MODEL_CONFIG.provider as string;
        const apiKey =
          provider === "openai" ? env.openai.apiKey : env.anthropic.apiKey;

        expect(apiKey).toBeTruthy();
        expect(typeof apiKey).toBe("string");
        expect(apiKey!.length).toBeGreaterThan(0);

        // In CI, we allow placeholder keys
        if (!isCI) {
          // Local development: require real API keys
          expect(apiKey).not.toBe("your-anthropic-api-key-here");
          expect(apiKey).not.toBe("your-openai-api-key-here");
          expect(apiKey).not.toBe("test-anthropic-key-placeholder");
          expect(apiKey).not.toBe("test-openai-key-placeholder");
          expect(apiKey!.length).toBeGreaterThan(20); // Real API keys are long
        }
      },
    );

    it.skipIf(isCI || !hasRealApiKeys())(
      "should successfully make a real API call with the configured provider",
      async () => {
        // CRITICAL: This tests that the system model config actually works end-to-end
        // Only runs locally when real API keys are available
        const result = await generateCompletion({
          provider: SYSTEM_MODEL_CONFIG.provider,
          model: SYSTEM_MODEL_CONFIG.model,
          systemPrompt: "You are a test assistant. Respond concisely.",
          userMessage: 'Say "test successful" and nothing else.',
          apiKey: undefined, // Uses system key from env
        });

        expect(result).toBeDefined();
        expect(result.text).toBeTruthy();
        expect(typeof result.text).toBe("string");
        expect(result.text.length).toBeGreaterThan(0);
        expect(result.usage).toBeDefined();

        // Provider-specific usage validation
        const provider = SYSTEM_MODEL_CONFIG.provider as string;
        if (provider === "openai") {
          expect(result.usage.totalTokens).toBeGreaterThan(0);
          expect(result.usage.promptTokens).toBeGreaterThan(0);
          expect(result.usage.completionTokens).toBeGreaterThan(0);
        } else {
          expect(result.usage.inputTokens).toBeGreaterThan(0);
          expect(result.usage.outputTokens).toBeGreaterThan(0);
        }
      },
      30000,
    ); // 30s timeout for API call

    it.skipIf(isCI || !hasRealApiKeys())(
      "should use the correct provider based on config",
      async () => {
        // This ensures the provider in the config matches what we actually use
        // Only runs locally when real API keys are available
        const provider = SYSTEM_MODEL_CONFIG.provider as string;

        if (provider === "openai") {
          expect(env.openai.apiKey).toBeTruthy();
        } else {
          expect(env.anthropic.apiKey).toBeTruthy();
        }

        // Make a small test call to verify provider works
        const result = await generateCompletion({
          provider: SYSTEM_MODEL_CONFIG.provider,
          model: SYSTEM_MODEL_CONFIG.model,
          systemPrompt: "Test",
          userMessage: "Hi",
          apiKey: undefined,
        });

        expect(result.text).toBeTruthy();
      },
      30000,
    );
  });
});
