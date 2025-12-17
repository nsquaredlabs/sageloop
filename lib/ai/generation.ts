/**
 * AI Generation Service
 *
 * Unified interface for generating completions using OpenAI or Anthropic.
 * This eliminates ~60 lines of duplicated generation code across routes.
 */

import { createOpenAIClient } from '@/lib/openai';
import { createAnthropicClient } from '@/lib/anthropic';

/**
 * Interpolates variables into a prompt using {{variable_name}} syntax
 *
 * @param prompt - The prompt template containing {{variable}} placeholders
 * @param variables - Record of variable names to values
 * @returns The prompt with variables replaced by their values
 *
 * @example
 * interpolateVariables(
 *   "Today is {{current_date}}. You are {{assistant_name}}.",
 *   { current_date: "2025-12-11", assistant_name: "Claude" }
 * )
 * // Returns: "Today is 2025-12-11. You are Claude."
 */
export function interpolateVariables(
  prompt: string,
  variables?: Record<string, string>
): string {
  if (!variables || Object.keys(variables).length === 0) {
    return prompt;
  }

  return Object.entries(variables).reduce((result, [key, value]) => {
    // Replace all occurrences of {{key}} with value
    return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }, prompt);
}

export interface GenerationConfig {
  provider: 'openai' | 'anthropic';
  model: string;
  temperature?: number;
  systemPrompt?: string;
  userMessage: string;
  apiKey?: string;
  maxTokens?: number;
  variables?: Record<string, string>;
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
    variables,
  } = config;

  // Interpolate variables into prompts
  const interpolatedSystemPrompt = systemPrompt
    ? interpolateVariables(systemPrompt, variables)
    : undefined;
  const interpolatedUserMessage = interpolateVariables(userMessage, variables);

  if (provider === 'openai') {
    const openai = createOpenAIClient(apiKey);

    // gpt-5-nano only supports temperature=1 (default), omit temperature parameter
    const isGpt5Nano = model === 'gpt-5-nano';

    const completion = await openai.chat.completions.create({
      model,
      ...(isGpt5Nano ? {} : { temperature }), // Omit temperature for gpt-5-nano
      messages: [
        ...(interpolatedSystemPrompt ? [{ role: 'system' as const, content: interpolatedSystemPrompt }] : []),
        { role: 'user' as const, content: interpolatedUserMessage },
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
      system: interpolatedSystemPrompt,
      messages: [{ role: 'user', content: interpolatedUserMessage }],
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
