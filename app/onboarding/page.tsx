import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./components/OnboardingWizard";

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

  return <OnboardingWizard />;
}
