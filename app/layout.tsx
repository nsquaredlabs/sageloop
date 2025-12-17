import type { Metadata } from "next";
import "./globals.css";
import { createServerClient } from '@/lib/supabase';
import { UserMenu } from '@/components/auth/user-menu';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: "Sageloop - Intelligent Prompt Engineering",
  description: "A platform built for PMs who need to rapidly build and test AI prompts",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {user && (
          <nav className="border-b bg-background sticky top-0 z-50">
            <div className="flex justify-between items-center h-16 px-6">
              <Link href="/projects" className="hover:opacity-80 transition-opacity">
                <Logo size="lg" />
              </Link>
              <UserMenu email={user.email!} />
            </div>
          </nav>
        )}
        {children}
        <Toaster />
      </body>
    </html>
  );
}
