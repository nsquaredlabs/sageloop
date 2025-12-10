/**
 * AI Generation Service
 *
 * Unified interface for generating completions using OpenAI or Anthropic.
 * This eliminates ~60 lines of duplicated generation code across routes.
 */

import { createOpenAIClient } from '@/lib/openai';
import { createAnthropicClient } from '@/lib/anthropic';

export interface GenerationConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  temperature?: number;
  systemPrompt?: string;
  userMessage: string;
  apiKey?: string;
  maxTokens?: number;
}

export interface GenerationResult {
  text: string;
  usage: {
    // OpenAI fields
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    // Anthropic fields
    inputTokens?: number;
    outputTokens?: number;
  };
}

/**
 * Generates AI completion using OpenAI or Anthropic based on provider
 *
 * @param config - Generation configuration including provider, model, prompts, etc.
 * @returns Generated text and token usage information
 *
 * @example
 * // Generate with OpenAI
 * const result = await generateCompletion({
 *   provider: 'openai',
 *   model: 'gpt-4',
 *   temperature: 0.7,
 *   systemPrompt: 'You are a helpful assistant',
 *   userMessage: 'Hello!',
 *   apiKey: 'sk-...'
 * });
 *
 * @example
 * // Generate with Anthropic
 * const result = await generateCompletion({
 *   provider: 'anthropic',
 *   model: 'claude-opus-4',
 *   temperature: 0.3,
 *   systemPrompt: 'You are Claude',
 *   userMessage: 'Tell me about AI',
 *   apiKey: 'sk-ant-...',
 *   maxTokens: 2048
 * });
 */
export async function generateCompletion(
  config: GenerationConfig
): Promise<GenerationResult> {
  const {
    provider,
    model,
    temperature = 0.7,
    systemPrompt,
    userMessage,
    apiKey,
    maxTokens,
  } = config;

  if (provider === 'openai') {
    const openai = createOpenAIClient(apiKey);
    const completion = await openai.chat.completions.create({
      model,
      temperature,
      messages: [
        ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
        { role: 'user' as const, content: userMessage },
      ],
    });

    return {
      text: completion.choices[0]?.message?.content || '',
      usage: {
        completionTokens: completion.usage?.completion_tokens,
        promptTokens: completion.usage?.prompt_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    };
  } else {
    // Anthropic
    const anthropic = createAnthropicClient(apiKey);
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens || 4096,
      temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    return {
      text: message.content[0]?.type === 'text' ? message.content[0].text : '',
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  }
}
