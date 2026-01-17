import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  getModelsForPlan,
  getDefaultModelForPlan,
  type SubscriptionPlan,
} from "@/lib/ai/default-models";

/**
 * GET /api/models - Fetch available models based on user's subscription plan
 *
 * Returns models filtered by the user's subscription tier:
 * - Free: gpt-5-nano, gpt-4o-mini
 * - Pro/Team: Free + standard + premium models
 * - Enterprise: All models including enterprise-only
 *
 * Also returns the default model for the user's plan.
 */
export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's workbench to fetch subscription
    const { data: userWorkbenches } = await supabase
      .from("user_workbenches")
      .select("workbench_id")
      .limit(1)
      .single();

    const workbenchId = userWorkbenches?.workbench_id;

    // Default to free tier
    let userPlan: SubscriptionPlan = "free";

    if (workbenchId) {
      // Fetch subscription plan
      const { data: subscription } = await supabase.rpc(
        "get_workbench_subscription",
        {
          workbench_uuid: workbenchId as string,
        },
      );

      if (subscription && subscription.length > 0) {
        const planId = subscription[0].plan_id;
        // Ensure plan_id is a valid SubscriptionPlan type
        if (["free", "pro", "team", "enterprise"].includes(planId)) {
          userPlan = planId as SubscriptionPlan;
        }
      }
    }

    // Get models available for user's plan
    const models = getModelsForPlan(userPlan).map((model) => ({
      id: model.id,
      name: model.name,
      provider: model.provider,
      tier: model.tier,
    }));

    // Get the default model for this plan
    const defaultModel = getDefaultModelForPlan(userPlan);

    return NextResponse.json({
      models,
      defaultModel,
      userPlan,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
