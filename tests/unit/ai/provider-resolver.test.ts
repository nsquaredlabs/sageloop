import { describe, it, expect } from 'vitest';
import { resolveProvider } from '@/lib/ai/provider-resolver';

/**
 * Provider Resolver Tests (Sprint 2 - Issue #4)
 *
 * Tests the logic for determining which AI provider and model to use based on:
 * 1. User's requested model
 * 2. Available API keys (user-provided or system)
 * 3. Fallback behavior when keys are missing
 */

describe('Provider Resolver - With user API keys', () => {
  it('should use requested OpenAI model when user has OpenAI key', () => {
    const result = resolveProvider('gpt-4', { openai: 'sk-test-key' });

    expect(result.provider).toBe('openai');
    expect(result.modelName).toBe('gpt-4');
    expect(result.apiKey).toBe('sk-test-key');
    expect(result.usingFallback).toBe(false);
  });

  it('should use requested Anthropic model when user has Anthropic key', () => {
    const result = resolveProvider('claude-opus-4', { anthropic: 'sk-ant-test' });

    expect(result.provider).toBe('anthropic');
    expect(result.modelName).toBe('claude-opus-4');
    expect(result.apiKey).toBe('sk-ant-test');
    expect(result.usingFallback).toBe(false);
  });

  it('should use requested model when user has both keys', () => {
    const apiKeys = { openai: 'sk-test', anthropic: 'sk-ant-test' };

    // Request OpenAI model
    const openaiResult = resolveProvider('gpt-4', apiKeys);
    expect(openaiResult.provider).toBe('openai');
    expect(openaiResult.modelName).toBe('gpt-4');
    expect(openaiResult.apiKey).toBe('sk-test');
    expect(openaiResult.usingFallback).toBe(false);

    // Request Anthropic model
    const anthropicResult = resolveProvider('claude-sonnet-4-5', apiKeys);
    expect(anthropicResult.provider).toBe('anthropic');
    expect(anthropicResult.modelName).toBe('claude-sonnet-4-5');
    expect(anthropicResult.apiKey).toBe('sk-ant-test');
    expect(anthropicResult.usingFallback).toBe(false);
  });
});

describe('Provider Resolver - Fallback behavior (No user keys)', () => {
  it('should fallback to gpt-3.5-turbo when no API keys configured', () => {
    const result = resolveProvider('gpt-4', null);

    expect(result.provider).toBe('openai');
    expect(result.modelName).toBe('gpt-3.5-turbo');
    expect(result.apiKey).toBeUndefined();
    expect(result.usingFallback).toBe(true);
  });

  it('should fallback to gpt-3.5-turbo even when requesting Claude', () => {
    const result = resolveProvider('claude-opus-4', null);

    expect(result.provider).toBe('openai');
    expect(result.modelName).toBe('gpt-3.5-turbo');
    expect(result.apiKey).toBeUndefined();
    expect(result.usingFallback).toBe(true);
  });

  it('should use default model when no model specified and no keys', () => {
    const result = resolveProvider('', null);

    expect(result.provider).toBe('openai');
    expect(result.modelName).toBe('gpt-3.5-turbo');
    expect(result.apiKey).toBeUndefined();
    expect(result.usingFallback).toBe(true);
  });
});

describe('Provider Resolver - Fallback behavior (Missing provider key)', () => {
  it('should fallback to gpt-3.5-turbo when requesting Claude but only have OpenAI key', () => {
    const result = resolveProvider('claude-opus-4', { openai: 'sk-test' });

    expect(result.provider).toBe('openai');
    expect(result.modelName).toBe('gpt-3.5-turbo');
    expect(result.apiKey).toBe('sk-test');
    expect(result.usingFallback).toBe(true);
  });

  it('should fallback to Claude Haiku when requesting GPT but only have Anthropic key', () => {
    const result = resolveProvider('gpt-4', { anthropic: 'sk-ant-test' });

    expect(result.provider).toBe('anthropic');
    expect(result.modelName).toBe('claude-haiku-4-5-20251001');
    expect(result.apiKey).toBe('sk-ant-test');
    expect(result.usingFallback).toBe(true);
  });

  it('should NOT fallback when user has correct provider key', () => {
    // User requests GPT-4 and has OpenAI key - use it!
    const result = resolveProvider('gpt-4', { openai: 'sk-test' });

    expect(result.provider).toBe('openai');
    expect(result.modelName).toBe('gpt-4');
    expect(result.apiKey).toBe('sk-test');
    expect(result.usingFallback).toBe(false); // Not a fallback
  });
});

describe('Provider Resolver - Model detection', () => {
  it('should detect Claude models by name pattern', () => {
    const models = [
      'claude-opus-4',
      'claude-sonnet-4-5',
      'claude-haiku-4-5-20251001',
      'claude-3-opus-20240229',
    ];

    models.forEach(model => {
      const result = resolveProvider(model, { anthropic: 'sk-ant-test' });
      expect(result.provider).toBe('anthropic');
      expect(result.modelName).toBe(model);
    });
  });

  it('should detect OpenAI models by name pattern', () => {
    const models = [
      'gpt-3.5-turbo',
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4o',
    ];

    models.forEach(model => {
      const result = resolveProvider(model, { openai: 'sk-test' });
      expect(result.provider).toBe('openai');
      expect(result.modelName).toBe(model);
    });
  });
});

describe('Provider Resolver - Edge cases', () => {
  it('should handle empty string model name', () => {
    const result = resolveProvider('', { openai: 'sk-test' });

    expect(result.provider).toBe('openai');
    expect(result.modelName).toBe('gpt-3.5-turbo');
    expect(result.apiKey).toBe('sk-test');
    expect(result.usingFallback).toBe(false);
  });

  it('should handle undefined model name', () => {
    const result = resolveProvider(undefined as any, { openai: 'sk-test' });

    expect(result.provider).toBe('openai');
    expect(result.modelName).toBe('gpt-3.5-turbo');
    expect(result.apiKey).toBe('sk-test');
    expect(result.usingFallback).toBe(false);
  });

  it('should handle empty API keys object', () => {
    const result = resolveProvider('gpt-4', {});

    expect(result.provider).toBe('openai');
    expect(result.modelName).toBe('gpt-3.5-turbo');
    expect(result.apiKey).toBeUndefined();
    expect(result.usingFallback).toBe(true);
  });

  it('should handle API keys with undefined values', () => {
    const result = resolveProvider('gpt-4', { openai: undefined, anthropic: undefined });

    expect(result.provider).toBe('openai');
    expect(result.modelName).toBe('gpt-3.5-turbo');
    expect(result.apiKey).toBeUndefined();
    expect(result.usingFallback).toBe(true);
  });
});

describe('Provider Resolver - System key usage', () => {
  it('should use system key (undefined) when no user keys and fallback', () => {
    const result = resolveProvider('claude-opus-4', null);

    expect(result.apiKey).toBeUndefined(); // System will use env var
    expect(result.usingFallback).toBe(true);
  });

  it('should use user key when available even for fallback model', () => {
    const result = resolveProvider('claude-opus-4', { openai: 'sk-user-test' });

    expect(result.apiKey).toBe('sk-user-test'); // Uses user's key
    expect(result.usingFallback).toBe(true); // But it's still a fallback
  });
});
