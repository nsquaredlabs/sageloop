import OpenAI from "openai";
import { getConfig } from "@/lib/config";

export function createOpenAIClient(apiKey?: string): OpenAI {
  const config = getConfig();
  return new OpenAI({
    apiKey: apiKey || config.openai_api_key,
  });
}
