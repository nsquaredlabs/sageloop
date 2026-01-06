import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createOpenAIClient } from "@/lib/openai";
import { createAnthropicClient } from "@/lib/anthropic";

interface ModelInfo {
  id: string;
  name: string;
  provider: "openai" | "anthropic";
}

// GET - Fetch available models based on configured API keys
export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's workbench
    const { data: userWorkbenches } = await supabase
      .from("user_workbenches")
      .select("workbench_id")
      .limit(1)
      .single();

    const workbenchId = userWorkbenches?.workbench_id;

    if (!workbenchId) {
      return NextResponse.json({ models: [] });
    }

    // Get API keys
    const { data: apiKeys } = (await supabase.rpc("get_workbench_api_keys", {
      workbench_uuid: workbenchId,
    })) as {
      data: { openai?: string; anthropic?: string } | null;
    };

    const models: ModelInfo[] = [];

    // If no user keys are configured, show system fallback models
    if (!apiKeys?.openai && !apiKeys?.anthropic) {
      // Show GPT-5-nano as the free-tier option (matches model-tiers.ts)
      models.push({
        id: "gpt-5-nano",
        name: "GPT-5 Nano (Free Tier)",
        provider: "openai",
      });
      return NextResponse.json({ models });
    }

    // Fetch OpenAI models if key is configured
    if (apiKeys?.openai) {
      try {
        const openai = createOpenAIClient(apiKeys.openai);
        const response = await openai.models.list();

        // Filter for chat models: gpt-4*, gpt-3.5*, and fine-tuned models (ft:gpt-*)
        // Exclude embedding models, whisper, tts, dall-e, etc.
        const chatModels = response.data
          .filter(
            (model) =>
              model.id.startsWith("gpt-4") ||
              model.id.startsWith("gpt-3.5") ||
              model.id.startsWith("ft:gpt-"),
          )
          .sort((a, b) => {
            // Fine-tuned models first, then GPT-4, then GPT-3.5
            if (a.id.startsWith("ft:") && !b.id.startsWith("ft:")) return -1;
            if (!a.id.startsWith("ft:") && b.id.startsWith("ft:")) return 1;
            if (a.id.startsWith("gpt-4") && !b.id.startsWith("gpt-4"))
              return -1;
            if (!a.id.startsWith("gpt-4") && b.id.startsWith("gpt-4")) return 1;
            return a.id.localeCompare(b.id);
          })
          .map((model) => {
            // Better formatting for fine-tuned models
            let displayName = model.id;
            if (model.id.startsWith("ft:gpt-")) {
              // Format: ft:gpt-3.5-turbo:company::id -> Fine-tuned GPT-3.5 Turbo (company)
              const parts = model.id.split(":");
              const baseModel =
                parts[1]?.toUpperCase().replace(/-/g, " ") || "";
              const company = parts[2] || "";
              displayName = `Fine-tuned ${baseModel}${company ? ` (${company})` : ""}`;
            } else {
              displayName = model.id.toUpperCase().replace(/-/g, " ");
            }

            return {
              id: model.id,
              name: displayName,
              provider: "openai" as const,
            };
          });

        models.push(...chatModels);
      } catch (error) {
        console.error("Failed to fetch OpenAI models:", error);
        // Don't fail the entire request if one provider fails
      }
    }

    // Fetch Anthropic models if key is configured
    if (apiKeys?.anthropic) {
      try {
        const anthropic = createAnthropicClient(apiKeys.anthropic);
        const response = await anthropic.models.list();

        const anthropicModels: ModelInfo[] = [];
        for await (const model of response) {
          anthropicModels.push({
            id: model.id,
            name: model.display_name,
            provider: "anthropic",
          });
        }

        models.push(...anthropicModels);
      } catch (error) {
        console.error("Failed to fetch Anthropic models:", error);
        // Don't fail the entire request if one provider fails
      }
    }

    return NextResponse.json({ models });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
