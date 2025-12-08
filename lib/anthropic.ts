import Anthropic from '@anthropic-ai/sdk';

// Factory function to create Anthropic client with custom API key
// Use this when working with user-provided API keys
export function createAnthropicClient(apiKey?: string): Anthropic {
  return new Anthropic({
    apiKey: apiKey || process.env.ANTHROPIC_API_KEY,
  });
}
