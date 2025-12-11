import { describe, it, expect } from 'vitest';
import { SYSTEM_MODEL_CONFIG } from '@/lib/ai/system-model-config';
import { generateCompletion } from '@/lib/ai/generation';
import { env } from '@/lib/env';

describe('System Model Configuration', () => {
  describe('Configuration validity', () => {
    it('should have a valid provider', () => {
      expect(['openai', 'anthropic']).toContain(SYSTEM_MODEL_CONFIG.provider);
    });

    it('should have a model name specified', () => {
      expect(SYSTEM_MODEL_CONFIG.model).toBeTruthy();
      expect(typeof SYSTEM_MODEL_CONFIG.model).toBe('string');
      expect(SYSTEM_MODEL_CONFIG.model.length).toBeGreaterThan(0);
    });

    it('should have a valid temperature', () => {
      expect(SYSTEM_MODEL_CONFIG.temperature).toBeGreaterThanOrEqual(0);
      expect(SYSTEM_MODEL_CONFIG.temperature).toBeLessThanOrEqual(1);
    });
  });

  describe('Provider-specific model validation', () => {
    it('should use valid OpenAI model when provider is openai', () => {
      const provider = SYSTEM_MODEL_CONFIG.provider as string;
      if (provider === 'openai') {
        const validOpenAIModels = [
          'gpt-4-turbo',
          'gpt-4o',
          'gpt-4',
          'gpt-3.5-turbo',
          'gpt-4o-mini',
        ];
        const isValidPrefix = validOpenAIModels.some(model =>
          SYSTEM_MODEL_CONFIG.model.startsWith(model.split('-').slice(0, 2).join('-'))
        );
        expect(isValidPrefix).toBe(true);
      }
    });

    it('should use valid Anthropic model when provider is anthropic', () => {
      const provider = SYSTEM_MODEL_CONFIG.provider as string;
      if (provider === 'anthropic') {
        const validAnthropicPrefixes = ['claude-opus', 'claude-sonnet', 'claude-haiku'];
        const isValidPrefix = validAnthropicPrefixes.some(prefix =>
          SYSTEM_MODEL_CONFIG.model.startsWith(prefix)
        );
        expect(isValidPrefix).toBe(true);
      }
    });
  });

  describe('Type safety', () => {
    it('should be a readonly constant', () => {
      // TypeScript enforces this at compile time with 'as const'
      // This test verifies the structure exists
      expect(SYSTEM_MODEL_CONFIG).toHaveProperty('provider');
      expect(SYSTEM_MODEL_CONFIG).toHaveProperty('model');
      expect(SYSTEM_MODEL_CONFIG).toHaveProperty('temperature');
    });

    it('should only have the expected properties', () => {
      const keys = Object.keys(SYSTEM_MODEL_CONFIG);
      expect(keys).toHaveLength(3);
      expect(keys).toEqual(['provider', 'model', 'temperature']);
    });
  });

  describe('Recommended settings', () => {
    it('should use low temperature for analytical tasks', () => {
      // Temperature should be <= 0.5 for consistent analytical work
      expect(SYSTEM_MODEL_CONFIG.temperature).toBeLessThanOrEqual(0.5);
    });

    it('should use a capable model (not free tier)', () => {
      // System operations should use quality models
      const freeTierModels = ['gpt-3.5-turbo'];
      expect(freeTierModels).not.toContain(SYSTEM_MODEL_CONFIG.model);
    });
  });

  describe('API Key and Provider Integration (CRITICAL)', () => {
    it('should have the required API key configured in environment', () => {
      const provider = SYSTEM_MODEL_CONFIG.provider as string;
      const apiKey = provider === 'openai' ? env.openai.apiKey : env.anthropic.apiKey;

      expect(apiKey).toBeTruthy();

      // Check for placeholder values that need to be replaced
      expect(apiKey).not.toBe('your-anthropic-api-key-here');
      expect(apiKey).not.toBe('your-openai-api-key-here');
      expect(apiKey).not.toBe('test-anthropic-key-placeholder');
      expect(apiKey).not.toBe('test-openai-key-placeholder');

      expect(typeof apiKey).toBe('string');
      expect(apiKey!.length).toBeGreaterThan(20); // API keys are long
    });

    it('should successfully make a real API call with the configured provider', async () => {
      // CRITICAL: This tests that the system model config actually works end-to-end
      const result = await generateCompletion({
        provider: SYSTEM_MODEL_CONFIG.provider,
        model: SYSTEM_MODEL_CONFIG.model,
        temperature: SYSTEM_MODEL_CONFIG.temperature,
        systemPrompt: 'You are a test assistant. Respond concisely.',
        userMessage: 'Say "test successful" and nothing else.',
        apiKey: undefined, // Uses system key from env
      });

      expect(result).toBeDefined();
      expect(result.text).toBeTruthy();
      expect(typeof result.text).toBe('string');
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.usage).toBeDefined();

      // Provider-specific usage validation
      const provider = SYSTEM_MODEL_CONFIG.provider as string;
      if (provider === 'openai') {
        expect(result.usage.totalTokens).toBeGreaterThan(0);
        expect(result.usage.promptTokens).toBeGreaterThan(0);
        expect(result.usage.completionTokens).toBeGreaterThan(0);
      } else {
        expect(result.usage.inputTokens).toBeGreaterThan(0);
        expect(result.usage.outputTokens).toBeGreaterThan(0);
      }
    }, 30000); // 30s timeout for API call

    it('should use the correct provider based on config', async () => {
      // This ensures the provider in the config matches what we actually use
      const provider = SYSTEM_MODEL_CONFIG.provider as string;

      if (provider === 'openai') {
        expect(env.openai.apiKey).toBeTruthy();
      } else {
        expect(env.anthropic.apiKey).toBeTruthy();
      }

      // Make a small test call to verify provider works
      const result = await generateCompletion({
        provider: SYSTEM_MODEL_CONFIG.provider,
        model: SYSTEM_MODEL_CONFIG.model,
        temperature: SYSTEM_MODEL_CONFIG.temperature,
        systemPrompt: 'Test',
        userMessage: 'Hi',
        apiKey: undefined,
      });

      expect(result.text).toBeTruthy();
    }, 30000);
  });
});
