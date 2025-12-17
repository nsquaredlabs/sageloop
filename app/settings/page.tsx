import { redirect } from 'next/navigation';

// Redirect /settings to /settings/subscription (default tab)
export default function SettingsPage() {
  redirect('/settings/subscription');
}
