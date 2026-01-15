import type { Metadata } from "next";
import "./globals.css";
import { createServerClient } from "@/lib/supabase";
import { UserMenu } from "@/components/auth/user-menu";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Sageloop - Intelligent Prompt Engineering",
  description:
    "A platform built for PMs who need to rapidly build and test AI prompts",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {user && (
          <nav className="border-b bg-background sticky top-0 z-50">
            <div className="flex justify-between items-center h-16 px-6">
              <Link
                href="/projects"
                className="hover:opacity-80 transition-opacity"
              >
                <Logo size="lg" />
              </Link>
              <div className="flex items-center gap-4">
                <a
                  href="https://docs.sageloop.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Docs
                </a>
                <UserMenu email={user.email!} />
              </div>
            </div>
          </nav>
        )}
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
