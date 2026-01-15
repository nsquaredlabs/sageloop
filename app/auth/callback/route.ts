/**
 * OAuth Callback Route Handler
 *
 * Handles the OAuth callback from Google and GitHub.
 * Exchanges the authorization code for a session and validates the user.
 *
 * Security Features:
 * - Rate limiting (10 attempts per 15 minutes per IP)
 * - OAuth metadata validation
 * - Email verification enforcement
 * - Audit logging for all events
 * - Defense-in-depth origin validation
 */

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { isAllowedOrigin, type OAuthProvider } from "@/lib/auth/oauth";
import {
  validateOAuthMetadata,
  validateCallbackParams,
  canLinkAccounts,
} from "@/lib/auth/oauth-validation";
import { logOAuthSuccess, logOAuthFailure } from "@/lib/security/oauth-audit";
import { rateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp, getClientUserAgent } from "@/lib/security/audit-logging";

/**
 * Allowed redirect origins for OAuth callbacks.
 * Defense-in-depth - validates even though Supabase also validates.
 */
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://workbench.sageloop.app",
];

/**
 * GET /auth/callback
 *
 * Handles OAuth provider redirects after user authorization.
 */
export async function GET(request: Request): Promise<Response> {
  const requestUrl = new URL(request.url);
  const ipAddress = getClientIp(request);
  const userAgent = getClientUserAgent(request);

  // Defense-in-depth: Verify origin is in allowed list
  if (!ALLOWED_ORIGINS.includes(requestUrl.origin)) {
    console.error(
      "[OAuth Callback] Invalid redirect origin:",
      requestUrl.origin,
    );
    return new Response("Invalid redirect origin", { status: 400 });
  }

  // Rate limiting
  const rateLimitResult = await rateLimit(request, RATE_LIMITS.oauthCallback);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  // Initialize Supabase client
  const supabase = await createServerClient();

  // Validate callback parameters
  const params = validateCallbackParams(requestUrl.searchParams);

  if (!params.isValid) {
    // Log the failure
    const provider = (requestUrl.searchParams.get("provider") ||
      "unknown") as OAuthProvider;

    await logOAuthFailure(supabase, {
      provider,
      errorCode: params.error || "unknown_error",
      errorDescription: params.errorDescription,
      ipAddress,
      userAgent,
    });

    // Redirect to login with error
    const errorParam = encodeURIComponent(params.error || "unknown_error");
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${errorParam}`,
    );
  }

  try {
    // Exchange code for session
    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(params.code!);

    if (exchangeError) {
      console.error(
        "[OAuth Callback] Code exchange failed:",
        exchangeError.message,
      );

      // Determine provider from URL params (Supabase adds this)
      const provider = (requestUrl.searchParams.get("provider") ||
        "unknown") as OAuthProvider;

      await logOAuthFailure(supabase, {
        provider,
        errorCode: "exchange_failed",
        errorDescription: exchangeError.message,
        ipAddress,
        userAgent,
      });

      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=invalid_code`,
      );
    }

    // Get user details
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("[OAuth Callback] Failed to get user:", userError?.message);

      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=session_expired`,
      );
    }

    // Determine provider from user metadata
    const provider = (user.app_metadata?.provider ||
      "unknown") as OAuthProvider;

    // Validate OAuth metadata
    const validation = validateOAuthMetadata(user.user_metadata, provider);

    if (!validation.isValid) {
      console.error(
        "[OAuth Callback] Metadata validation failed:",
        validation.errors,
      );

      // Sign out the user since their data is invalid
      await supabase.auth.signOut();

      await logOAuthFailure(supabase, {
        provider,
        errorCode: "invalid_provider_data",
        errorDescription: validation.errors.join(", "),
        email: user.email,
        userId: user.id,
        ipAddress,
        userAgent,
      });

      // Check if this is an email verification issue
      if (validation.errors.some((e) => e.toLowerCase().includes("verified"))) {
        const errorCode =
          provider === "github"
            ? "github_email_not_verified"
            : "email_not_verified";
        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=${errorCode}`,
        );
      }

      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=invalid_provider_data`,
      );
    }

    // Log warnings (non-blocking)
    if (validation.warnings.length > 0) {
      console.warn("[OAuth Callback] Metadata warnings:", validation.warnings);
    }

    // Check if this is linking to an existing account with unverified email
    const identities = user.identities || [];
    const emailIdentity = identities.find((i) => i.provider === "email");

    if (emailIdentity) {
      // User has email/password - check if we can link
      const emailVerified =
        emailIdentity.identity_data?.email_verified === true;
      const oauthEmailVerified = user.user_metadata?.email_verified === true;

      const linkCheck = canLinkAccounts(emailVerified, oauthEmailVerified);

      if (!linkCheck.allowed) {
        console.warn(
          "[OAuth Callback] Account linking blocked:",
          linkCheck.reason,
        );

        // Sign out since we can't complete the link
        await supabase.auth.signOut();

        await logOAuthFailure(supabase, {
          provider,
          errorCode: "email_not_verified",
          errorDescription: linkCheck.reason,
          email: user.email,
          userId: user.id,
          ipAddress,
          userAgent,
        });

        return NextResponse.redirect(
          `${requestUrl.origin}/login?error=email_not_verified`,
        );
      }
    }

    // Determine if this is a new user or linking
    const isNewUser = identities.length === 1;
    const linkedToExisting = identities.length > 1 && !!emailIdentity;

    // Log successful OAuth
    await logOAuthSuccess(supabase, {
      userId: user.id,
      provider,
      email: user.email,
      ipAddress,
      userAgent,
      isNewUser,
      linkedToExisting,
    });

    // Check if user has completed onboarding
    const onboardingCompleted =
      user.user_metadata?.onboarding_completed === true;
    const onboardingSkipped = user.user_metadata?.onboarding_skipped === true;

    // New users go to onboarding, returning users go to projects
    if (isNewUser && !onboardingCompleted && !onboardingSkipped) {
      return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
    }

    // Redirect to projects page
    return NextResponse.redirect(`${requestUrl.origin}/projects`);
  } catch (error) {
    console.error("[OAuth Callback] Unexpected error:", error);

    // Log the failure
    const provider = (requestUrl.searchParams.get("provider") ||
      "unknown") as OAuthProvider;

    await logOAuthFailure(supabase, {
      provider,
      errorCode: "server_error",
      errorDescription:
        error instanceof Error ? error.message : "Unknown error",
      ipAddress,
      userAgent,
    });

    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=server_error`,
    );
  }
}
