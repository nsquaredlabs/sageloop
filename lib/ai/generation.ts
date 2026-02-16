/**
 * AI Generation Service
 *
 * Unified interface for generating completions using OpenAI or Anthropic.
 * This eliminates ~60 lines of duplicated generation code across routes.
 */

import { createOpenAIClient } from "@/lib/openai";
import { createAnthropicClient } from "@/lib/anthropic";

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
  variables?: Record<string, string>,
): string {
  if (!variables || Object.keys(variables).length === 0) {
    return prompt;
  }

  return Object.entries(variables).reduce((result, [key, value]) => {
    // Replace all occurrences of {{key}} with value
    return result.replace(new RegExp(`{{${key}}}`, "g"), value);
  }, prompt);
}

export interface GenerationConfig {
  provider: "openai" | "anthropic";
  model: string;
  systemPrompt?: string;
  userMessage: string;
  apiKey?: string;
  maxTokens?: number;
  variables?: Record<string, string>;
  jsonMode?: boolean; // Force valid JSON output (OpenAI only)
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
 * Note: Temperature is intentionally omitted to align with best practices
 * for consistent outputs, especially for reasoning models like GPT-5.
 *
 * @param config - Generation configuration including provider, model, prompts, etc.
 * @returns Generated text and token usage information
 *
 * @example
 * // Generate with OpenAI
 * const result = await generateCompletion({
 *   provider: 'openai',
 *   model: 'gpt-4',
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
 *   systemPrompt: 'You are Claude',
 *   userMessage: 'Tell me about AI',
 *   apiKey: 'sk-ant-...',
 *   maxTokens: 2048
 * });
 */
export async function generateCompletion(
  config: GenerationConfig,
): Promise<GenerationResult> {
  const {
    provider,
    model,
    systemPrompt,
    userMessage,
    apiKey,
    maxTokens,
    variables,
    jsonMode = false,
  } = config;

  // Interpolate variables into prompts
  const interpolatedSystemPrompt = systemPrompt
    ? interpolateVariables(systemPrompt, variables)
    : undefined;
  const interpolatedUserMessage = interpolateVariables(userMessage, variables);

  if (provider === "openai") {
    const openai = createOpenAIClient(apiKey);

    // Note: Temperature intentionally omitted for consistent outputs
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        ...(interpolatedSystemPrompt
          ? [{ role: "system" as const, content: interpolatedSystemPrompt }]
          : []),
        { role: "user" as const, content: interpolatedUserMessage },
      ],
      // Force valid JSON when jsonMode is enabled
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    });

    return {
      text: completion.choices[0]?.message?.content || "",
      usage: {
        completionTokens: completion.usage?.completion_tokens,
        promptTokens: completion.usage?.prompt_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    };
  } else {
    // Anthropic
    const anthropic = createAnthropicClient(apiKey);
    // Note: Temperature intentionally omitted for consistent outputs
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens || 4096,
      system: interpolatedSystemPrompt,
      messages: [{ role: "user", content: interpolatedUserMessage }],
    });

    return {
      text: message.content[0]?.type === "text" ? message.content[0].text : "",
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  }
}
