import { redirect } from "next/navigation";

// Redirect /settings to /settings/api-keys (default tab)
export default function SettingsPage() {
  redirect("/settings/api-keys");
}
