import Anthropic from "@anthropic-ai/sdk";
import { getConfig } from "@/lib/config";

export function createAnthropicClient(apiKey?: string): Anthropic {
  const config = getConfig();
  return new Anthropic({
    apiKey: apiKey || config.anthropic_api_key || process.env.ANTHROPIC_API_KEY,
  });
}
