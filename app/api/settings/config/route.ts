import { NextResponse } from "next/server";
import { getConfig, saveConfig } from "@/lib/config";

export async function GET() {
  const config = getConfig();
  return NextResponse.json({
    openai_api_key: config.openai_api_key
      ? "••••" + config.openai_api_key.slice(-4)
      : "",
    anthropic_api_key: config.anthropic_api_key
      ? "••••" + config.anthropic_api_key.slice(-4)
      : "",
    default_model: config.default_model || "gpt-4o-mini",
    has_openai: !!config.openai_api_key,
    has_anthropic: !!config.anthropic_api_key,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { openai_api_key, anthropic_api_key, default_model } = body;

  const config = getConfig();
  saveConfig({
    openai_api_key: openai_api_key || config.openai_api_key,
    anthropic_api_key: anthropic_api_key || config.anthropic_api_key,
    default_model: default_model || config.default_model,
  });

  return NextResponse.json({ success: true });
}
