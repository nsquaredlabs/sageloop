import OpenAI from 'openai';
import { env } from '@/lib/env';

// Factory function to create OpenAI client with custom API key
// Use this when working with user-provided API keys
export function createOpenAIClient(apiKey?: string): OpenAI {
  // Only allow browser usage in test environment
  const config: any = {
    apiKey: apiKey || env.openai.apiKey,
  };

  if (typeof window !== 'undefined' && env.isTest) {
    config.dangerouslyAllowBrowser = true;
  }

  return new OpenAI(config);
}

// Legacy singleton instance for backwards compatibility
// Lazy-loaded to avoid initialization errors in test environment
let _openai: OpenAI | null = null;
export const openai = new Proxy({} as OpenAI, {
  get(_target, prop) {
    if (!_openai) {
      _openai = createOpenAIClient();
    }
    return (_openai as any)[prop];
  }
});
