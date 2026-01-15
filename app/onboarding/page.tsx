import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./components/OnboardingWizard";
import type { SubscriptionPlan } from "@/lib/ai/default-models";

export const metadata = {
  title: "Get Started | Sageloop",
  description: "Set up your first Sageloop project in minutes",
};

export default async function OnboardingPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login");
  }

  // Check if user has already completed or skipped onboarding
  const metadata = user.user_metadata || {};
  const onboardingCompleted = metadata.onboarding_completed === true;
  const onboardingSkipped = metadata.onboarding_skipped === true;

  // Redirect to projects if already completed or skipped
  if (onboardingCompleted || onboardingSkipped) {
    redirect("/projects");
  }

  // Fetch user's subscription to determine available models
  let userPlan: SubscriptionPlan = "free"; // Default to free tier

  const { data: userWorkbenches } = await supabase
    .from("user_workbenches")
    .select("workbench_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (userWorkbenches?.workbench_id) {
    const { data: subscription } = await supabase.rpc(
      "get_workbench_subscription",
      {
        workbench_uuid: userWorkbenches.workbench_id as string,
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

  return <OnboardingWizard userPlan={userPlan} />;
}
