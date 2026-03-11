import { NextResponse } from "next/server";
import { SUPPORTED_MODELS } from "@/lib/ai/default-models";

/**
 * GET /api/models - Fetch all available models
 *
 * Returns all supported models without subscription filtering.
 * In the open-source local-first version, all models are available.
 */
export async function GET() {
  const models = SUPPORTED_MODELS.map((m) => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
  }));

  return NextResponse.json({
    models,
    defaultModel: "gpt-4o-mini",
  });
}
