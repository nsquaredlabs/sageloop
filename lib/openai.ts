import OpenAI from 'openai';

// Legacy singleton instance for backwards compatibility
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Factory function to create OpenAI client with custom API key
// Use this when working with user-provided API keys
export function createOpenAIClient(apiKey?: string): OpenAI {
  return new OpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY,
  });
}
