import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCompletion } from '@/lib/ai/generation';

/**
 * Generation Service Tests (Sprint 2 - Issue #5)
 *
 * Tests the unified AI generation service that abstracts OpenAI and Anthropic API calls.
 */

// Mock the OpenAI and Anthropic clients
vi.mock('@/lib/openai', () => ({
  createOpenAIClient: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}));

vi.mock('@/lib/anthropic', () => ({
  createAnthropicClient: vi.fn(() => ({
    messages: {
      create: vi.fn(),
    },
  })),
}));

describe('Generation Service - OpenAI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate completion using OpenAI', async () => {
    const { createOpenAIClient } = await import('@/lib/openai');
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'Generated response from GPT-4' } }],
      usage: {
        completion_tokens: 10,
        prompt_tokens: 20,
        total_tokens: 30,
      },
    });

    (createOpenAIClient as any).mockReturnValue({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    });

    const result = await generateCompletion({
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      systemPrompt: 'You are a helpful assistant',
      userMessage: 'Hello, how are you?',
      apiKey: 'sk-test-key',
    });

    expect(result.text).toBe('Generated response from GPT-4');
    expect(result.usage.completionTokens).toBe(10);
    expect(result.usage.promptTokens).toBe(20);
    expect(result.usage.totalTokens).toBe(30);

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-4',
      temperature: 0.7,
      messages: [
        { role: 'system', content: 'You are a helpful assistant' },
        { role: 'user', content: 'Hello, how are you?' },
      ],
    });
  });

  it('should handle OpenAI completion without system prompt', async () => {
    const { createOpenAIClient } = await import('@/lib/openai');
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'Response without system prompt' } }],
      usage: {
        completion_tokens: 5,
        prompt_tokens: 10,
        total_tokens: 15,
      },
    });

    (createOpenAIClient as any).mockReturnValue({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    });

    const result = await generateCompletion({
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      userMessage: 'What is 2+2?',
    });

    expect(result.text).toBe('Response without system prompt');
    expect(mockCreate).toHaveBeenCalledWith({
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      messages: [
        { role: 'user', content: 'What is 2+2?' },
      ],
    });
  });
});

describe('Generation Service - Anthropic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate completion using Anthropic', async () => {
    const { createAnthropicClient } = await import('@/lib/anthropic');
    const mockCreate = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'Generated response from Claude' }],
      usage: {
        input_tokens: 15,
        output_tokens: 25,
      },
    });

    (createAnthropicClient as any).mockReturnValue({
      messages: {
        create: mockCreate,
      },
    });

    const result = await generateCompletion({
      provider: 'anthropic',
      model: 'claude-opus-4',
      temperature: 0.3,
      systemPrompt: 'You are Claude',
      userMessage: 'Tell me about AI',
      apiKey: 'sk-ant-test',
      maxTokens: 2048,
    });

    expect(result.text).toBe('Generated response from Claude');
    expect(result.usage.inputTokens).toBe(15);
    expect(result.usage.outputTokens).toBe(25);

    expect(mockCreate).toHaveBeenCalledWith({
      model: 'claude-opus-4',
      max_tokens: 2048,
      temperature: 0.3,
      system: 'You are Claude',
      messages: [{ role: 'user', content: 'Tell me about AI' }],
    });
  });

  it('should use default maxTokens for Anthropic if not provided', async () => {
    const { createAnthropicClient } = await import('@/lib/anthropic');
    const mockCreate = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'Default max tokens response' }],
      usage: {
        input_tokens: 10,
        output_tokens: 20,
      },
    });

    (createAnthropicClient as any).mockReturnValue({
      messages: {
        create: mockCreate,
      },
    });

    await generateCompletion({
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      temperature: 0.7,
      userMessage: 'Quick question',
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        max_tokens: 4096, // Default value
      })
    );
  });
});

describe('Generation Service - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle empty response from OpenAI', async () => {
    const { createOpenAIClient } = await import('@/lib/openai');
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [],
      usage: {
        completion_tokens: 0,
        prompt_tokens: 10,
        total_tokens: 10,
      },
    });

    (createOpenAIClient as any).mockReturnValue({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    });

    const result = await generateCompletion({
      provider: 'openai',
      model: 'gpt-4',
      userMessage: 'Test',
    });

    expect(result.text).toBe('');
  });

  it('should handle non-text response from Anthropic', async () => {
    const { createAnthropicClient } = await import('@/lib/anthropic');
    const mockCreate = vi.fn().mockResolvedValue({
      content: [{ type: 'image', data: 'base64...' }],
      usage: {
        input_tokens: 5,
        output_tokens: 0,
      },
    });

    (createAnthropicClient as any).mockReturnValue({
      messages: {
        create: mockCreate,
      },
    });

    const result = await generateCompletion({
      provider: 'anthropic',
      model: 'claude-opus-4',
      userMessage: 'Generate image',
    });

    expect(result.text).toBe('');
  });

  it('should use default temperature if not provided', async () => {
    const { createOpenAIClient } = await import('@/lib/openai');
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: 'test' } }],
      usage: {},
    });

    (createOpenAIClient as any).mockReturnValue({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    });

    await generateCompletion({
      provider: 'openai',
      model: 'gpt-4',
      userMessage: 'Test',
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.7, // Default value
      })
    );
  });
});
