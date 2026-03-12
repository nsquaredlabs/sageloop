import { NextResponse } from "next/server";
import { SUPPORTED_MODELS } from "@/lib/ai/default-models";
import { getConfig } from "@/lib/config";

/**
 * GET /api/models - Fetch available models based on configured API keys
 *
 * Only returns models for providers the user has configured keys for.
 */
export async function GET() {
  const config = getConfig();
  const hasOpenai = !!config.openai_api_key;
  const hasAnthropic = !!config.anthropic_api_key;

  const models = SUPPORTED_MODELS.filter((m) => {
    if (m.provider === "openai") return hasOpenai;
    if (m.provider === "anthropic") return hasAnthropic;
    return false;
  }).map((m) => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
  }));

  return NextResponse.json({ models });
}
