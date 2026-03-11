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
    output_model: config.output_model || "gpt-4o-mini",
    system_model: config.system_model || "claude-haiku-4-5-20251001",
    has_openai: !!config.openai_api_key,
    has_anthropic: !!config.anthropic_api_key,
  });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { openai_api_key, anthropic_api_key, output_model, system_model } =
    body;

  const config = getConfig();
  saveConfig({
    openai_api_key: openai_api_key || config.openai_api_key,
    anthropic_api_key: anthropic_api_key || config.anthropic_api_key,
    output_model: output_model || config.output_model,
    system_model: system_model || config.system_model,
  });

  return NextResponse.json({ success: true });
}
