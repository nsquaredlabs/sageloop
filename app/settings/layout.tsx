import { SettingsTabs } from "@/components/settings/settings-tabs";

export const metadata = {
  title: "Settings | Sageloop",
  description: "Manage your workspace settings",
};

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure your local Sageloop instance
          </p>
        </div>

        {/* Tabs Navigation */}
        <SettingsTabs />

        {/* Tab Content */}
        <div className="py-4">{children}</div>
      </div>
    </div>
  );
}
