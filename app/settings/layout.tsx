import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export const metadata = {
  title: "Settings | Sageloop",
  description: "Manage your workspace settings",
};

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default async function SettingsLayout({
  children,
}: SettingsLayoutProps) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get user's workbench name and subscription for header
  const { data: userWorkbenches } = await supabase
    .from("user_workbenches")
    .select("workbench_id, workbenches(name)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  const workbenchName =
    (userWorkbenches?.workbenches as { name: string } | null)?.name ||
    "Your Workspace";

  // Get subscription to determine which tabs to show
  const { data: subscriptionData } = await supabase.rpc(
    "get_workbench_subscription",
    { workbench_uuid: userWorkbenches?.workbench_id as string },
  );

  const subscription = subscriptionData?.[0];

  // BYOK (Bring Your Own Keys) is only available for Enterprise plans
  const isEnterprise = subscription?.plan_id === "enterprise";

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">{workbenchName}</p>
        </div>

        {/* Tabs Navigation */}
        <SettingsTabs isEnterprise={isEnterprise} />

        {/* Tab Content */}
        <div className="py-4">{children}</div>
      </div>
    </div>
  );
}
