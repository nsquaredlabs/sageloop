/**
 * OAuth Authentication Helpers
 *
 * Provides functions for initiating OAuth flows with Google and GitHub.
 * Uses Supabase Auth's built-in OAuth support.
 *
 * Security Features:
 * - State parameter for CSRF protection (handled by Supabase)
 * - Minimal OAuth scopes (openid, email, profile)
 * - HttpOnly cookie-based token storage
 */

import { createClient } from "@/lib/supabase/client";

export type OAuthProvider = "google" | "github";

/**
 * Allowed redirect origins for OAuth callbacks.
 * Defense-in-depth - validates even though Supabase also validates.
 */
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://workbench.sageloop.app",
];

/**
 * Get the callback URL for OAuth redirects
 * @returns The OAuth callback URL for the current environment
 */
function getCallbackUrl(): string {
  if (typeof window === "undefined") {
    // Server-side - use environment variable or default
    return process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      : "http://localhost:3000/auth/callback";
  }
  return `${window.location.origin}/auth/callback`;
}

/**
 * Validates that the current origin is in the allowed list
 * @returns true if origin is allowed, false otherwise
 */
export function isAllowedOrigin(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin);
}

/**
 * Initiates Google OAuth flow
 *
 * Requests minimal scopes:
 * - openid: Required for OIDC
 * - email: User's email address (verified by Google)
 * - profile: User's name and profile picture
 *
 * @throws Error if OAuth initiation fails
 */
export async function signInWithGoogle(): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getCallbackUrl(),
      queryParams: {
        access_type: "offline", // Get refresh token for long-lived sessions
        prompt: "consent", // Always show consent screen for transparency
      },
      scopes: "openid email profile",
    },
  });

  if (error) {
    console.error("[OAuth] Google sign-in initiation failed:", error.message);
    throw new Error("Failed to initiate Google sign-in. Please try again.");
  }
}

/**
 * Initiates GitHub OAuth flow
 *
 * Requests minimal scopes:
 * - user:email: Access user's email addresses
 * - read:user: Read user's public profile information
 *
 * @throws Error if OAuth initiation fails
 */
export async function signInWithGithub(): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: getCallbackUrl(),
      scopes: "user:email read:user",
    },
  });

  if (error) {
    console.error("[OAuth] GitHub sign-in initiation failed:", error.message);
    throw new Error("Failed to initiate GitHub sign-in. Please try again.");
  }
}

/**
 * Generic OAuth sign-in function
 *
 * @param provider - The OAuth provider to use ('google' or 'github')
 * @throws Error if OAuth initiation fails
 */
export async function signInWithOAuth(provider: OAuthProvider): Promise<void> {
  switch (provider) {
    case "google":
      return signInWithGoogle();
    case "github":
      return signInWithGithub();
    default:
      throw new Error(`Unsupported OAuth provider: ${provider}`);
  }
}

/**
 * Disconnects an OAuth provider from the current user's account
 *
 * Note: User must have at least one authentication method remaining.
 * This check should be performed before calling this function.
 *
 * @param provider - The OAuth provider to disconnect
 * @throws Error if disconnection fails
 */
export async function disconnectOAuthProvider(
  provider: OAuthProvider,
): Promise<void> {
  const supabase = createClient();

  // Get current user identities
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to disconnect an account.");
  }

  // Find the identity for this provider
  const identities = user.identities || [];
  const identity = identities.find((i) => i.provider === provider);

  if (!identity) {
    throw new Error(`No ${provider} account is connected.`);
  }

  // Check if this is the last authentication method
  if (identities.length <= 1) {
    throw new Error(
      "You cannot disconnect your only sign-in method. Please add another method first.",
    );
  }

  // Unlink the identity
  const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);

  if (unlinkError) {
    console.error(
      `[OAuth] Failed to disconnect ${provider}:`,
      unlinkError.message,
    );
    throw new Error(`Failed to disconnect ${provider}. Please try again.`);
  }
}

/**
 * Gets the list of connected OAuth providers for the current user
 *
 * @returns Array of connected provider information
 */
export async function getConnectedProviders(): Promise<
  Array<{
    provider: OAuthProvider | "email";
    email?: string;
    connected: boolean;
    identityId?: string;
  }>
> {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return [
      { provider: "google", connected: false },
      { provider: "github", connected: false },
      { provider: "email", connected: false },
    ];
  }

  const identities = user.identities || [];

  const googleIdentity = identities.find((i) => i.provider === "google");
  const githubIdentity = identities.find((i) => i.provider === "github");
  const emailIdentity = identities.find((i) => i.provider === "email");

  return [
    {
      provider: "google",
      email: googleIdentity?.identity_data?.email as string | undefined,
      connected: !!googleIdentity,
      identityId: googleIdentity?.id,
    },
    {
      provider: "github",
      email: githubIdentity?.identity_data?.email as string | undefined,
      connected: !!githubIdentity,
      identityId: githubIdentity?.id,
    },
    {
      provider: "email",
      email: emailIdentity?.identity_data?.email as string | undefined,
      connected: !!emailIdentity,
      identityId: emailIdentity?.id,
    },
  ];
}

/**
 * Checks if the user can disconnect a provider
 * (must have at least one other method)
 *
 * @param provider - The provider to check
 * @returns true if the provider can be disconnected
 */
export async function canDisconnectProvider(
  provider: OAuthProvider,
): Promise<boolean> {
  const connected = await getConnectedProviders();
  const connectedCount = connected.filter((p) => p.connected).length;
  const isConnected = connected.find((p) => p.provider === provider)?.connected;

  // Can disconnect if provider is connected AND there's at least one other method
  return !!isConnected && connectedCount > 1;
}

/**
 * OAuth error codes and their user-friendly messages
 */
export const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You need to grant permissions to sign in. Please try again.",
  invalid_request: "The sign-in request was invalid. Please try again.",
  server_error:
    "The authentication server encountered an error. Please try again later.",
  temporarily_unavailable:
    "Sign-in is temporarily unavailable. Please try again later.",
  email_not_verified:
    "Please verify your email address before linking this account.",
  github_email_not_verified:
    "Your GitHub email is not verified. Please verify it in your GitHub settings.",
  invalid_code: "The sign-in session expired. Please try again.",
  session_expired: "Your session expired. Please sign in again.",
  provider_error:
    "The sign-in provider encountered an error. Please try again.",
  account_exists:
    "An account with this email already exists. Sign in with your existing account to link.",
  invalid_provider_data:
    "We could not verify your account information. Please try again.",
};

/**
 * Gets a user-friendly error message for an OAuth error
 *
 * @param errorCode - The error code from the OAuth callback
 * @returns User-friendly error message
 */
export function getOAuthErrorMessage(errorCode: string): string {
  return (
    OAUTH_ERROR_MESSAGES[errorCode] ||
    "An unexpected error occurred during sign-in. Please try again."
  );
}
