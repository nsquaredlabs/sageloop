"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  signInWithGoogle,
  signInWithGithub,
  getOAuthErrorMessage,
} from "@/lib/auth/oauth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  GoogleIcon,
  GitHubIcon,
  SpinnerIcon,
} from "@/components/icons/providers";

type LoadingState = "google" | "github" | "email" | null;

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingState>(null);

  // Check for OAuth error from callback
  const oauthError = searchParams.get("error");

  const handleGoogleSignup = async () => {
    setLoading("google");
    setError(null);
    try {
      await signInWithGoogle();
      // User will be redirected to Google OAuth
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign in with Google",
      );
      setLoading(null);
    }
  };

  const handleGithubSignup = async () => {
    setLoading("github");
    setError(null);
    try {
      await signInWithGithub();
      // User will be redirected to GitHub OAuth
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign in with GitHub",
      );
      setLoading(null);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading("email");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(null);
    } else {
      // Redirect new users to onboarding instead of projects
      router.push("/onboarding");
      router.refresh();
    }
  };

  const displayError =
    error || (oauthError ? getOAuthErrorMessage(oauthError) : null);

  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-4 pt-6">
        <h1 className="text-2xl font-semibold text-center">
          Create your account
        </h1>

        {displayError && (
          <div
            className="bg-destructive/10 text-destructive text-sm p-3 rounded-md"
            role="alert"
            aria-live="polite"
          >
            {displayError}
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 h-11"
            onClick={handleGoogleSignup}
            disabled={loading !== null}
            aria-label="Continue with Google"
          >
            {loading === "google" ? (
              <SpinnerIcon className="w-5 h-5 animate-spin" />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            <span>
              {loading === "google" ? "Connecting..." : "Continue with Google"}
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2 h-11"
            onClick={handleGithubSignup}
            disabled={loading !== null}
            aria-label="Continue with GitHub"
          >
            {loading === "github" ? (
              <SpinnerIcon className="w-5 h-5 animate-spin" />
            ) : (
              <GitHubIcon className="w-5 h-5" />
            )}
            <span>
              {loading === "github" ? "Connecting..." : "Continue with GitHub"}
            </span>
          </Button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading !== null}
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              minLength={6}
              required
              disabled={loading !== null}
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 6 characters
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading !== null}>
            {loading === "email" ? (
              <>
                <SpinnerIcon className="w-4 h-4 mr-2 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
