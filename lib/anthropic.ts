import Anthropic from '@anthropic-ai/sdk';
import { env } from '@/lib/env';

// Factory function to create Anthropic client with custom API key
// Use this when working with user-provided API keys
export function createAnthropicClient(apiKey?: string): Anthropic {
  // Only allow browser usage in test environment
  const config: any = {
    apiKey: apiKey || env.anthropic.apiKey,
  };

  if (typeof window !== 'undefined' && env.isTest) {
    config.dangerouslyAllowBrowser = true;
  }

  return new Anthropic(config);
}
