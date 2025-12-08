import type { Metadata } from "next";
import "./globals.css";
import { createServerClient } from '@/lib/supabase';
import { UserMenu } from '@/components/auth/user-menu';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Tellah - Figma for AI Evals",
  description: "Behavioral design tool for AI products",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's workbench for settings link
  let workbenchId: string | undefined;
  if (user) {
    const { data: userWorkbenches } = await supabase
      .from('user_workbenches')
      .select('workbench_id')
      .limit(1)
      .single();

    workbenchId = userWorkbenches?.workbench_id ?? undefined;
  }

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {user && (
          <nav className="border-b bg-background sticky top-0 z-50">
            <div className="flex justify-between items-center h-16 px-6">
              <Link href="/projects" className="hover:opacity-80 transition-opacity">
                <h1 className="text-3xl font-bold tracking-tight">Tellah</h1>
              </Link>
              <UserMenu email={user.email!} workbenchId={workbenchId} />
            </div>
          </nav>
        )}
        {children}
      </body>
    </html>
  );
}
