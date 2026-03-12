# OAuth Authentication Implementation Specification

**Created**: January 1, 2026
**Status**: Planning
**Priority**: P1
**Effort Estimate**: 2-3 weeks (1 engineer)
**Owner**: Product Team

---

## Table of Contents

1. [Feature Overview](#feature-overview)
2. [User Value & Business Goals](#user-value--business-goals)
3. [Technical Requirements](#technical-requirements)
4. [User Flows](#user-flows)
5. [Critical Security Requirements](#critical-security-requirements)
6. [Acceptance Criteria](#acceptance-criteria)
7. [Database Schema](#database-schema)
8. [UI/UX Requirements](#uiux-requirements)
9. [Edge Cases & Error Handling](#edge-cases--error-handling)
10. [Migration Considerations](#migration-considerations)
11. [Testing Requirements](#testing-requirements)
12. [Implementation Plan](#implementation-plan)
13. [Success Metrics](#success-metrics)
14. [Risks & Mitigations](#risks--mitigations)

---

## Feature Overview

### What We're Building

Add Google and GitHub OAuth authentication as alternative sign-up/sign-in methods for Sageloop, leveraging Supabase Auth's built-in OAuth provider support.

**Current State**: Email/password authentication only
**Future State**: Email/password + Google OAuth + GitHub OAuth

### Why This Matters

**PM Pain Point**: "I had to create yet another password for this tool. Why can't I just use my Google account?"

**Real-World Impact**:

- Reduces sign-up friction from ~45 seconds to ~5 seconds
- Eliminates "forgot password" flow for OAuth users (30% of support tickets)
- Increases trust through familiar auth providers
- Enables faster onboarding for product teams

**Competitive Context**: PromptLayer, Humanloop, and other AI tools offer OAuth. We need parity.

---

## User Value & Business Goals

### User Benefits

1. **Faster Sign-Up**: One-click authentication vs. form filling + email verification
2. **No Password Management**: No need to remember/store another password
3. **Familiar & Trusted**: Users already trust Google/GitHub
4. **Professional Workflows**: Use work Google account for seamless org integration
5. **Developer-Friendly**: GitHub auth natural for technical users

### Business Goals

1. **Increase Conversion**: Reduce sign-up abandonment from 40% to <20%
2. **Reduce Support Load**: Eliminate password reset requests for OAuth users
3. **Enterprise Readiness**: Foundation for SSO/SAML in future
4. **Data Quality**: Get verified email addresses from providers
5. **Market Parity**: Match competitor feature set

### Success Metrics

- **Adoption Rate**: 60% of new users choose OAuth over email/password within 3 months
- **Sign-Up Completion**: OAuth sign-up completion rate >90% (vs. 60% email)
- **Support Tickets**: Password-related tickets drop by 40%
- **Time to First Project**: OAuth users create first project 2x faster

---

## Technical Requirements

### OAuth Providers

#### Google OAuth 2.0

- **Scopes Required**: `openid`, `email`, `profile`
- **User Data**: Email (verified), name, profile picture URL
- **Provider ID**: `google` (Supabase convention)
- **Redirect URI**: `https://<project-ref>.supabase.co/auth/v1/callback`

#### GitHub OAuth

- **Scopes Required**: `user:email`, `read:user`
- **User Data**: Email (verified), username, name, avatar URL
- **Provider ID**: `github` (Supabase convention)
- **Redirect URI**: `https://<project-ref>.supabase.co/auth/v1/callback`

### Supabase Auth Integration

Supabase Auth handles:

- OAuth flow (authorization code exchange)
- Token management (access + refresh tokens)
- User creation in `auth.users` table
- Session management
- Provider metadata storage

**No custom backend code needed** for OAuth flow itself - Supabase handles it.

### Environment Configuration

```bash
# .env.local additions
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Supabase Dashboard configuration (no env vars needed):
# - Google: OAuth Client ID + Client Secret
# - GitHub: OAuth App Client ID + Client Secret
```

### Client-Side Implementation

```typescript
// New functions in lib/supabase/client.ts or auth helpers

/**
 * Initiates Google OAuth flow
 */
export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Initiates GitHub OAuth flow
 */
export async function signInWithGithub() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}
```

### Callback Handling

```typescript
// app/auth/callback/route.ts (NEW FILE)
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    // Handle OAuth errors
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  if (code) {
    const supabase = await createServerClient();

    // Exchange code for session
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=${encodeURIComponent(exchangeError.message)}`,
      );
    }
  }

  // Successful auth - redirect to projects
  return NextResponse.redirect(`${requestUrl.origin}/projects`);
}
```

### Account Linking Strategy

**Email-Based Linking**: Supabase automatically links OAuth accounts to existing users if:

- Email addresses match
- Email is verified on both the OAuth provider and Supabase

**Example**:

1. User signs up with `alice@example.com` via email/password
2. User later clicks "Sign in with Google" using `alice@example.com`
3. Supabase links the Google identity to the existing user
4. User can now sign in with either method

**No custom linking logic needed** - Supabase handles this automatically.

---

## User Flows

### Flow 1: New User Sign-Up with OAuth

**Entry Point**: Landing page → "Get Started" → Sign Up page

**Steps**:

1. User lands on `/signup`
2. User sees three options:
   - "Continue with Google" button (with Google logo)
   - "Continue with GitHub" button (with GitHub logo)
   - Email/password form (existing)
3. User clicks "Continue with Google"
4. Redirected to Google OAuth consent screen
5. User approves permissions (email, profile)
6. Redirected back to `/auth/callback?code=...`
7. Backend exchanges code for session
8. User redirected to `/projects` (onboarding complete)
9. **Auto-workbench creation** triggered by `handle_new_user()` function (existing)

**Success Criteria**:

- User authenticated in <10 seconds
- No email verification step required
- Workbench created automatically
- Session persists across page reloads

**Error Scenarios**:

- User denies permissions → Redirect to `/signup?error=access_denied`
- Network error during OAuth → Show error toast, allow retry
- Email already exists with different provider → Show account linking message

---

### Flow 2: Existing User Sign-In with OAuth

**Entry Point**: Any page (unauthenticated) → "Sign In"

**Steps**:

1. User lands on `/login`
2. User sees OAuth buttons + email/password form
3. User clicks "Continue with Google"
4. If previously authorized: Instant redirect (no consent screen)
5. If not previously authorized: Consent screen → approve
6. Redirected to `/auth/callback?code=...`
7. Backend exchanges code for session
8. User redirected to `/projects`

**Success Criteria**:

- Return user: <3 seconds to authenticated state
- New OAuth user (existing email): Account linked automatically
- No password required

---

### Flow 3: Account Linking (Same Email, Different Provider)

**Scenario**: User has email/password account, wants to add Google OAuth

**Automatic Linking** (Supabase default):

1. User signs up with `alice@example.com` + password
2. User later clicks "Sign in with Google" using `alice@example.com`
3. Supabase detects matching email
4. If email is verified on both: **Automatically links** accounts
5. User can now sign in with either method

**Manual Linking** (if automatic fails):

1. Show UI message: "This email is already registered. Sign in with your password to link accounts."
2. User signs in with password
3. User navigates to Settings → Connected Accounts
4. User clicks "Connect Google" → OAuth flow
5. Google identity added to user's account

**Success Criteria**:

- Automatic linking works for verified emails (90% of cases)
- Manual linking available in Settings for edge cases
- Clear messaging when linking is required
- No duplicate accounts created

---

### Flow 4: OAuth Sign-In for Existing Email/Password User

**Scenario**: User has `alice@example.com` password account, forgot password, tries OAuth

**Steps**:

1. User clicks "Continue with Google"
2. Selects `alice@example.com` in Google consent screen
3. Supabase checks: Email exists and is verified
4. **Auto-link**: Google identity added to existing user
5. User redirected to `/projects` (signed in)
6. User sees success message: "Google account connected"

**Alternative (Email Not Verified)**:

1. User clicks "Continue with Google"
2. Email exists but NOT verified in Supabase
3. Supabase rejects linking (security measure)
4. User sees error: "Please verify your email first, then link Google account in Settings"

**Success Criteria**:

- Seamless linking for verified accounts
- Security check prevents hijacking unverified accounts
- Clear error messaging for edge cases

---

### Flow 5: Error Recovery

**OAuth Denied by User**:

- User clicks "Continue with Google" → Denies permissions
- Redirect to `/signup?error=access_denied`
- Show message: "You need to grant permissions to sign in with Google. Try again or use email/password."

**Provider Error (Network, Server Down)**:

- OAuth flow fails with provider error
- Redirect to `/signup?error=provider_error`
- Show message: "Google sign-in is temporarily unavailable. Please try again or use email/password."

**Email Conflict (Different Provider)**:

- User signed up with Google, tries GitHub with same email
- Supabase auto-links (if both verified)
- If not auto-linked: Show "Email already registered. Sign in to link accounts."

**Session Expired During OAuth**:

- User starts OAuth, but session expires before completion
- Redirect to `/login?error=session_expired`
- Show message: "Your session expired. Please try again."

---

## Critical Security Requirements

### Overview

OAuth authentication introduces new security considerations beyond email/password auth. Every OAuth flow must enforce these requirements.

---

### 1. State Parameter & CSRF Protection

**Requirement**: All OAuth flows MUST use state parameter to prevent CSRF attacks.

**Implementation**:

- Supabase Auth automatically generates and validates `state` parameter
- No custom implementation needed
- State is single-use and expires after 5 minutes

**Validation**:

```typescript
// Supabase handles this automatically
// State mismatch → Error returned to callback handler
// Our job: Handle the error gracefully
```

**Acceptance Criteria**:

- [ ] State parameter present in all OAuth redirect URLs
- [ ] State validated before creating session
- [ ] Invalid state → Error message, no session created
- [ ] Test: Replay attack with old state parameter fails

---

### 2. Email Verification Enforcement

**Requirement**: Only link OAuth accounts to existing users if email is verified.

**Why**: Prevents account takeover via unverified email addresses.

**Attack Scenario Without Verification**:

1. Attacker signs up with `victim@example.com` (doesn't verify email)
2. Victim later clicks "Sign in with Google" using `victim@example.com`
3. Without check: Attacker's account gets Google access
4. Attacker now owns victim's Google-linked account

**Implementation**:

```typescript
// app/auth/callback/route.ts
export async function GET(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if this is an OAuth link to existing email/password account
    const { data: identities } = await supabase.auth.getUserIdentities();

    const hasEmailIdentity = identities?.identities.some(
      (i) =>
        i.provider === "email" && i.identity_data?.email_verified === false,
    );

    if (hasEmailIdentity) {
      // Block linking until email verified
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=email_not_verified`,
      );
    }
  }

  // Continue with successful auth...
}
```

**Acceptance Criteria**:

- [ ] OAuth linking blocked for unverified email accounts
- [ ] Error message explains verification requirement
- [ ] User can verify email, then link OAuth
- [ ] Test: Attempt to link OAuth to unverified account → Fails
- [ ] Test: Verify email, then link OAuth → Succeeds

---

### 3. Redirect URI Validation

**Requirement**: Only allow OAuth redirects to whitelisted URIs.

**Why**: Prevents open redirect attacks and token theft.

**Supabase Configuration** (in dashboard):

```
Allowed Redirect URLs:
- http://localhost:3000/auth/callback (development)
- https://app.sageloop.com/auth/callback (production)
- https://staging.sageloop.com/auth/callback (staging)
```

**Additional Validation** (defense-in-depth):

```typescript
// app/auth/callback/route.ts
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://app.sageloop.com",
  "https://staging.sageloop.com",
];

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  // Verify origin matches allowed list
  if (!ALLOWED_ORIGINS.includes(requestUrl.origin)) {
    console.error("Invalid redirect origin:", requestUrl.origin);
    return new Response("Invalid redirect", { status: 400 });
  }

  // Continue with OAuth callback...
}
```

**Acceptance Criteria**:

- [ ] Redirect URIs configured in Supabase dashboard
- [ ] Only whitelisted URIs allowed in OAuth flow
- [ ] Unauthorized redirect attempt → 400 error
- [ ] Test: Redirect to `evil.com` → Blocked
- [ ] Test: Redirect to production domain → Allowed

---

### 4. Token Storage & Handling

**Requirement**: Store OAuth tokens securely, never expose to client-side JavaScript.

**Supabase Implementation**:

- Access tokens: HttpOnly cookie (server-side only)
- Refresh tokens: HttpOnly cookie (server-side only)
- Session managed via `createServerClient()` and `createClient()`

**What We DON'T Do**:

```typescript
// ❌ NEVER store tokens in localStorage
localStorage.setItem("access_token", token);

// ❌ NEVER expose tokens in client components
const token = await supabase.auth.getSession();
console.log(token.access_token); // Logged to browser console!

// ❌ NEVER send tokens to client in API responses
return NextResponse.json({ token: user.access_token });
```

**What We DO**:

```typescript
// ✅ Use server-side client for token operations
const supabase = await createServerClient();
const {
  data: { user },
} = await supabase.auth.getUser();

// ✅ Tokens stay in HttpOnly cookies
// No client-side JavaScript can access them

// ✅ Return boolean flags, not actual tokens
return NextResponse.json({ hasGoogleAccount: !!user?.app_metadata.provider });
```

**Acceptance Criteria**:

- [ ] Tokens stored in HttpOnly cookies only
- [ ] No tokens exposed in browser DevTools
- [ ] No tokens in localStorage or sessionStorage
- [ ] No tokens in API responses to client
- [ ] Test: Inspect cookies → `httpOnly: true`
- [ ] Test: Inspect localStorage → No tokens

---

### 5. Provider Metadata Validation

**Requirement**: Validate OAuth provider responses before trusting data.

**Why**: Malicious OAuth providers or MITM attacks could send invalid data.

**Implementation**:

```typescript
// lib/auth/oauth-validation.ts (NEW FILE)

interface OAuthUserMetadata {
  email: string;
  email_verified: boolean;
  full_name?: string;
  avatar_url?: string;
  provider: "google" | "github";
}

/**
 * Validates OAuth provider metadata
 */
export function validateOAuthMetadata(
  metadata: any,
  provider: "google" | "github",
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Email is required
  if (!metadata.email || typeof metadata.email !== "string") {
    errors.push("Email is required");
  }

  // Email must be verified
  if (metadata.email_verified !== true) {
    errors.push("Email must be verified by provider");
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (metadata.email && !emailRegex.test(metadata.email)) {
    errors.push("Invalid email format");
  }

  // Provider-specific checks
  if (provider === "google") {
    // Google should always provide verified email
    if (!metadata.email_verified) {
      errors.push("Google email not verified");
    }
  }

  if (provider === "github") {
    // GitHub emails can be unverified - we need to check
    if (!metadata.email_verified) {
      errors.push(
        "GitHub email not verified. Please verify in GitHub settings.",
      );
    }
  }

  // Avatar URL must be HTTPS (if provided)
  if (metadata.avatar_url && !metadata.avatar_url.startsWith("https://")) {
    errors.push("Avatar URL must use HTTPS");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

**Usage in Callback**:

```typescript
// app/auth/callback/route.ts
import { validateOAuthMetadata } from "@/lib/auth/oauth-validation";

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata?.provider) {
    const validation = validateOAuthMetadata(
      user.user_metadata,
      user.app_metadata.provider,
    );

    if (!validation.isValid) {
      console.error("OAuth metadata validation failed:", validation.errors);
      await supabase.auth.signOut();
      return NextResponse.redirect(
        `${requestUrl.origin}/login?error=invalid_provider_data`,
      );
    }
  }

  // Continue...
}
```

**Acceptance Criteria**:

- [ ] Email validation on all OAuth sign-ins
- [ ] Email verification check enforced
- [ ] Invalid provider data → Sign-in rejected
- [ ] Validation errors logged for monitoring
- [ ] Test: Mock OAuth with unverified email → Rejected
- [ ] Test: Mock OAuth with invalid email format → Rejected

---

### 6. Rate Limiting OAuth Attempts

**Requirement**: Limit OAuth sign-in attempts to prevent abuse.

**Why**: Attackers could spam OAuth endpoints to:

- Enumerate registered emails
- Cause DoS via provider API limits
- Brute-force state parameters

**Implementation**:

```typescript
// app/auth/callback/route.ts
import { withRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

export const GET = withRateLimit(
  async (request: Request) => {
    // OAuth callback handling...
  },
  RATE_LIMITS.auth, // 5 requests per 15 minutes
);
```

**Separate Rate Limits**:

```typescript
// lib/security/rate-limit.ts (UPDATE)

export const RATE_LIMITS = {
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  oauthCallback: {
    maxRequests: 10,
    windowMs: 15 * 60 * 1000, // 10 callbacks per 15 min (allows retries)
  },
};
```

**Acceptance Criteria**:

- [ ] OAuth callback rate limited to 10 per 15 minutes
- [ ] Rate limit applies per IP address
- [ ] Exceeded rate limit → 429 error with retry-after header
- [ ] Legitimate retries (user clicks back, tries again) allowed
- [ ] Test: 11 OAuth attempts in 15 min → 11th blocked
- [ ] Test: Wait 15 min → Rate limit resets

---

### 7. Audit Logging for OAuth Events

**Requirement**: Log all OAuth authentication events for security monitoring.

**What to Log**:

- OAuth initiation (provider, timestamp, IP)
- OAuth callback success/failure
- Account linking events
- Provider metadata received
- Validation failures

**Implementation**:

```typescript
// lib/security/oauth-audit.ts (NEW FILE)

interface OAuthAuditLog {
  user_id?: string;
  event_type:
    | "oauth_initiated"
    | "oauth_success"
    | "oauth_failed"
    | "account_linked";
  provider: "google" | "github";
  email?: string;
  ip_address?: string;
  error_message?: string;
  metadata?: Record<string, any>;
}

/**
 * Logs OAuth events to security audit table
 */
export async function logOAuthEvent(
  supabase: any,
  log: OAuthAuditLog,
): Promise<void> {
  await supabase.from("security_audit_logs").insert({
    user_id: log.user_id,
    event_type: log.event_type,
    metadata: {
      provider: log.provider,
      email: log.email,
      error: log.error_message,
      ...log.metadata,
    },
    ip_address: log.ip_address,
    created_at: new Date().toISOString(),
  });

  // Also log to application logs
  console.info(`[OAUTH] ${log.event_type}`, {
    provider: log.provider,
    user_id: log.user_id,
    email: log.email,
  });
}
```

**Usage**:

```typescript
// app/auth/callback/route.ts
import { logOAuthEvent } from "@/lib/security/oauth-audit";

export async function GET(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Log successful OAuth
    await logOAuthEvent(supabase, {
      user_id: user.id,
      event_type: "oauth_success",
      provider: user.app_metadata.provider,
      email: user.email,
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
    });
  } else {
    // Log OAuth failure
    await logOAuthEvent(supabase, {
      event_type: "oauth_failed",
      provider: requestUrl.searchParams.get("provider") || "unknown",
      error_message: error?.message,
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
    });
  }

  // Continue...
}
```

**Acceptance Criteria**:

- [ ] All OAuth events logged to `security_audit_logs` table
- [ ] Logs include: user_id, provider, timestamp, IP
- [ ] Failed attempts logged with error details
- [ ] Logs queryable for security investigation
- [ ] Test: OAuth sign-in → Check audit log entry created
- [ ] Test: OAuth failure → Check error logged

---

### 8. Account Takeover Prevention

**Requirement**: Prevent attackers from hijacking accounts via OAuth.

**Attack Vectors**:

**Vector 1: Email Squatting**

- Attacker creates account with `victim@example.com` (doesn't verify)
- Victim tries OAuth with `victim@example.com`
- Without protection: Attacker's account gets victim's OAuth access

**Mitigation**: Email verification check (Requirement #2)

**Vector 2: Social Engineering**

- Attacker tricks victim into authorizing malicious OAuth app
- App impersonates Sageloop
- Victim grants permissions, attacker gets access token

**Mitigation**:

```typescript
// Verify OAuth app client ID matches our registered apps
const ALLOWED_OAUTH_CLIENTS = {
  google: process.env.GOOGLE_OAUTH_CLIENT_ID,
  github: process.env.GITHUB_OAUTH_CLIENT_ID,
};

// Supabase handles this validation automatically
// Our client IDs are configured in Supabase dashboard
// Only tokens from our apps are accepted
```

**Vector 3: Session Fixation**

- Attacker starts OAuth flow, gets state parameter
- Attacker tricks victim into completing OAuth with attacker's state
- Attacker hijacks victim's session

**Mitigation**: State parameter is single-use and tied to IP/session (Supabase handles this)

**Acceptance Criteria**:

- [ ] Email verification prevents account squatting
- [ ] OAuth client ID validation enforced
- [ ] State parameter prevents session fixation
- [ ] Test: Create unverified account → OAuth link blocked
- [ ] Test: Invalid client ID → OAuth rejected
- [ ] Test: Reuse state parameter → Rejected

---

### 9. Data Privacy & GDPR Compliance

**Requirement**: Handle OAuth user data in compliance with privacy regulations.

**What Data We Collect from OAuth**:

- Email address (required)
- Full name (optional, for display)
- Profile picture URL (optional, for avatar)
- Provider ID (google/github)

**What We DON'T Collect**:

- Contact lists
- Calendar data
- File access
- Any other non-essential data

**Privacy Implementation**:

```typescript
// Only request minimal OAuth scopes
const { data } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    scopes: "openid email profile", // Minimal scopes only
    queryParams: {
      access_type: "offline", // For refresh tokens
      prompt: "consent", // Always show consent screen
    },
  },
});
```

**User Rights**:

- Right to disconnect OAuth account (Settings → Connected Accounts → Disconnect)
- Right to export data (existing export feature)
- Right to delete account (existing delete feature)

**Data Retention**:

- OAuth tokens: Deleted immediately on sign-out or disconnect
- Profile data: Retained in `auth.users` until account deletion
- Audit logs: Retained for 90 days, then purged

**Acceptance Criteria**:

- [ ] Only minimal OAuth scopes requested
- [ ] User can disconnect OAuth account in Settings
- [ ] Disconnecting OAuth deletes provider tokens
- [ ] Privacy policy updated to mention OAuth data collection
- [ ] Test: Disconnect Google → Tokens removed from database
- [ ] Test: Delete account → All OAuth data purged

---

### 10. Provider-Specific Security Considerations

#### Google OAuth Security

**Considerations**:

- Google accounts are generally well-secured (2FA common)
- Email verification is guaranteed by Google
- Profile pictures hosted on Google CDN (safe to use)

**Configuration**:

```typescript
// Google OAuth with security best practices
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    scopes: "openid email profile",
    queryParams: {
      access_type: "offline", // Refresh tokens for long sessions
      prompt: "consent", // Always show consent (don't assume previous consent)
      hd: "example.com", // Optional: Restrict to specific Google Workspace domain
    },
  },
});
```

**Google Workspace Restriction** (Future Enhancement):

```typescript
// For enterprise customers, restrict to their domain
queryParams: {
  hd: 'acme-corp.com', // Only allow @acme-corp.com emails
}
```

#### GitHub OAuth Security

**Considerations**:

- GitHub emails may not be verified (user must verify in GitHub settings)
- GitHub allows multiple emails per account (primary email preferred)
- Username is public, but email can be private

**Configuration**:

```typescript
// GitHub OAuth with security checks
await supabase.auth.signInWithOAuth({
  provider: "github",
  options: {
    scopes: "user:email read:user", // Email + basic profile only
  },
});

// Additional validation on callback
const {
  data: { user },
} = await supabase.auth.getUser();

if (user?.app_metadata.provider === "github") {
  // Verify GitHub provided a verified email
  if (!user.email_verified) {
    throw new Error(
      "GitHub email not verified. Please verify in GitHub settings.",
    );
  }

  // Prefer primary email from GitHub
  const githubMetadata = user.user_metadata;
  if (githubMetadata.primary_email) {
    // Use primary email
  }
}
```

**Acceptance Criteria (Google)**:

- [ ] Google OAuth uses `prompt=consent` for transparency
- [ ] Email verification guaranteed by Google
- [ ] Optional: Domain restriction for enterprise customers

**Acceptance Criteria (GitHub)**:

- [ ] GitHub OAuth checks email verification status
- [ ] Unverified GitHub emails rejected with helpful message
- [ ] Primary email preferred when multiple emails exist
- [ ] Test: GitHub account with unverified email → Sign-in blocked

---

### Security Testing Requirements

**Unit Tests**:

```typescript
// tests/security/oauth.test.ts (NEW FILE)

describe("OAuth Security", () => {
  it("should reject OAuth link to unverified email account", async () => {
    // Create unverified email account
    // Attempt OAuth with same email
    // Expect: Rejected with email_not_verified error
  });

  it("should validate OAuth metadata", async () => {
    // Mock OAuth response with invalid email
    // Expect: Validation fails
  });

  it("should enforce redirect URI whitelist", async () => {
    // Attempt OAuth with evil.com redirect
    // Expect: Rejected
  });
});
```

**Integration Tests**:

```typescript
// tests/api/oauth-integration.test.ts (NEW FILE)

describe("OAuth Flow Integration", () => {
  it("should complete full OAuth flow", async () => {
    // Mock OAuth provider response
    // Initiate OAuth
    // Complete callback
    // Verify user authenticated
  });

  it("should rate limit OAuth attempts", async () => {
    // Attempt 11 OAuth callbacks in 15 minutes
    // Expect: 11th attempt rate limited
  });
});
```

**Manual Security Testing**:

- [ ] Test with expired OAuth state parameter
- [ ] Test with tampered OAuth state parameter
- [ ] Test account linking with verified vs. unverified emails
- [ ] Test disconnecting OAuth account
- [ ] Test privacy: Verify minimal scopes requested
- [ ] Test audit logging: All events captured
- [ ] Test rate limiting: Excessive attempts blocked

---

## Acceptance Criteria

### Functional Requirements

#### Sign-Up Flow

- [ ] **As a new user**, I can click "Continue with Google" and complete sign-up in <10 seconds
- [ ] **As a new user**, I can click "Continue with GitHub" and complete sign-up in <10 seconds
- [ ] **As a new user**, my workbench is auto-created after OAuth sign-up (same as email/password)
- [ ] **As a new user**, I am redirected to `/projects` after successful OAuth
- [ ] **As a new user**, I see my name and profile picture from OAuth provider

#### Sign-In Flow

- [ ] **As a returning user**, I can sign in with Google in <3 seconds (no consent screen if previously authorized)
- [ ] **As a returning user**, I can sign in with GitHub in <3 seconds
- [ ] **As a returning user**, my session persists across page reloads
- [ ] **As a returning user**, I am redirected to `/projects` after sign-in

#### Account Linking

- [ ] **As a user with email/password account**, I can link my Google account automatically if emails match and are verified
- [ ] **As a user with email/password account**, I can link my GitHub account automatically if emails match and are verified
- [ ] **As a user with OAuth account**, I can link a different OAuth provider (e.g., have both Google and GitHub)
- [ ] **As a user with unverified email**, I cannot link OAuth until I verify my email (security requirement)

#### Settings & Account Management

- [ ] **As a user**, I can see which OAuth providers are connected in Settings → Connected Accounts
- [ ] **As a user**, I can disconnect an OAuth provider from my account
- [ ] **As a user**, I can reconnect an OAuth provider after disconnecting
- [ ] **As a user**, if I disconnect my only authentication method, I see a warning to set a password first

#### Error Handling

- [ ] **As a user**, if I deny OAuth permissions, I see a clear error and can retry or use email/password
- [ ] **As a user**, if OAuth fails due to provider error, I see a helpful error message
- [ ] **As a user**, if my email is already registered with a different provider, I see instructions on how to link accounts
- [ ] **As a user**, if the OAuth callback times out, I see an error and can retry

---

### Security Requirements

#### Authentication & Authorization

- [ ] OAuth state parameter generated and validated on every flow (CSRF protection)
- [ ] Redirect URIs whitelisted in Supabase dashboard (only production/staging/localhost allowed)
- [ ] OAuth tokens stored in HttpOnly cookies (never accessible to client-side JavaScript)
- [ ] No OAuth tokens in localStorage, sessionStorage, or API responses
- [ ] Email verification enforced before linking OAuth to existing account (prevent account takeover)

#### Input Validation & Sanitization

- [ ] OAuth provider metadata validated (email, email_verified, name, avatar_url)
- [ ] Email format validated before creating user
- [ ] Email must be verified by OAuth provider
- [ ] Avatar URLs must use HTTPS
- [ ] Invalid provider data → Sign-in rejected, user notified

#### Rate Limiting

- [ ] OAuth callback endpoint rate limited to 10 attempts per 15 minutes per IP
- [ ] Rate limit applies to both Google and GitHub callbacks
- [ ] Exceeded rate limit → 429 error with retry-after header
- [ ] Legitimate retries (user clicks back) allowed within limit

#### Audit Logging

- [ ] All OAuth events logged to `security_audit_logs` table
- [ ] Logs include: user_id, provider, event_type, timestamp, IP address
- [ ] Events logged: oauth_initiated, oauth_success, oauth_failed, account_linked, account_unlinked
- [ ] Failed OAuth attempts logged with error details
- [ ] Logs queryable for security investigations

#### Privacy & Compliance

- [ ] Only minimal OAuth scopes requested (openid, email, profile for Google; user:email, read:user for GitHub)
- [ ] No access to contacts, calendar, files, or other non-essential data
- [ ] User can disconnect OAuth account in Settings
- [ ] Disconnecting OAuth deletes provider tokens immediately
- [ ] Privacy policy updated to mention OAuth data collection
- [ ] GDPR-compliant data retention (tokens deleted on sign-out, audit logs purged after 90 days)

---

### Test Coverage Requirements

#### Unit Tests

- [ ] OAuth metadata validation function (valid/invalid emails, verified/unverified)
- [ ] Redirect URI validation function (allowed/blocked domains)
- [ ] Account linking logic (same email, different emails, verified/unverified)
- [ ] Error handling for common OAuth errors (access_denied, invalid_request, server_error)
- [ ] Audit logging functions (correct event types, metadata structure)

**Target Coverage**: >90% for new OAuth utilities

#### Integration Tests

- [ ] Complete OAuth sign-up flow (mock Google response, verify user created, workbench created)
- [ ] Complete OAuth sign-in flow (existing user, session created)
- [ ] Account linking flow (email/password + Google, both verified)
- [ ] Account linking blocked (email/password unverified, OAuth attempted)
- [ ] OAuth callback error handling (invalid code, expired state, provider error)
- [ ] Rate limiting (11 attempts in 15 min, 11th blocked)
- [ ] Disconnect OAuth account (tokens removed, user can still sign in with password)

**Target Coverage**: 100% of OAuth API routes

#### Security Tests

- [ ] CSRF protection: Invalid state parameter rejected
- [ ] CSRF protection: Reused state parameter rejected
- [ ] Account takeover prevention: Unverified email blocking
- [ ] Redirect URI validation: evil.com redirect blocked
- [ ] Token security: No tokens in client-side JavaScript
- [ ] Rate limiting: Excessive attempts blocked
- [ ] Audit logging: All events captured correctly

**Target Coverage**: 100% of security-critical paths

#### E2E Tests (Playwright)

- [ ] User completes Google OAuth sign-up, lands on projects page
- [ ] User completes GitHub OAuth sign-up, lands on projects page
- [ ] User with email/password account links Google account
- [ ] User disconnects Google account, can still sign in with password
- [ ] User denies OAuth permissions, sees error, can retry
- [ ] OAuth error handling (timeout, provider error)

**Target Coverage**: Critical user flows (sign-up, sign-in, linking)

---

### Performance Requirements

#### OAuth Flow Speed

- [ ] New user OAuth sign-up: <10 seconds from click to authenticated state
- [ ] Returning user OAuth sign-in: <3 seconds (no consent screen)
- [ ] Account linking: <5 seconds (automatic for verified emails)

#### API Response Times

- [ ] OAuth callback handler: <500ms processing time
- [ ] Account settings page (show connected accounts): <300ms load time
- [ ] Disconnect OAuth account: <200ms response time

#### Database Performance

- [ ] No N+1 queries when fetching user identities
- [ ] Index on `auth.identities` table for provider lookups
- [ ] Audit log inserts non-blocking (async if possible)

---

### Accessibility Requirements

#### WCAG 2.1 AA Compliance

- [ ] OAuth buttons have clear labels ("Continue with Google", not just Google logo)
- [ ] OAuth buttons keyboard navigable (Tab key)
- [ ] OAuth buttons have focus states (visible ring on focus)
- [ ] Error messages screen reader accessible (ARIA live regions)
- [ ] Color contrast ratio ≥ 4.5:1 for button text

#### Keyboard Navigation

- [ ] User can Tab to OAuth buttons
- [ ] User can activate OAuth buttons with Enter key
- [ ] User can navigate error messages with screen reader
- [ ] Settings → Connected Accounts accessible via keyboard

#### Screen Reader Support

- [ ] OAuth buttons announced as "Button, Continue with Google"
- [ ] Connected accounts list announced clearly
- [ ] Disconnect button announced with provider name
- [ ] Error messages announced when they appear

---

### Documentation Requirements

#### User-Facing Documentation

- [ ] Help doc: "How to sign up with Google/GitHub"
- [ ] Help doc: "How to link multiple accounts"
- [ ] Help doc: "How to disconnect an OAuth account"
- [ ] FAQ: "What data does Sageloop access from my Google/GitHub account?"
- [ ] Privacy policy: Updated to mention OAuth data collection

#### Developer Documentation

- [ ] README: OAuth setup instructions for local development
- [ ] README: Environment variable configuration
- [ ] README: Supabase dashboard OAuth configuration
- [ ] Code comments: OAuth validation logic
- [ ] Code comments: Security considerations for OAuth

#### API Documentation

- [ ] OAuth callback endpoint documented
- [ ] Account linking API documented
- [ ] Disconnect OAuth API documented
- [ ] Error codes and messages documented

---

## Database Schema

### Existing Tables (No Changes Needed)

Supabase Auth handles OAuth identities automatically. No custom tables required.

**auth.users** (Supabase managed):

```sql
-- Existing columns we use:
id                  uuid primary key
email               text unique
email_verified      boolean
created_at          timestamp
updated_at          timestamp
raw_user_meta_data  jsonb  -- Profile data from OAuth provider
raw_app_meta_data   jsonb  -- Provider name, OAuth IDs
```

**auth.identities** (Supabase managed):

```sql
-- Stores multiple identities per user (email, google, github)
id                  uuid primary key
user_id             uuid references auth.users(id)
provider            text  -- 'email', 'google', 'github'
identity_data       jsonb -- Provider-specific data
created_at          timestamp
updated_at          timestamp
```

**Example Data**:

```json
// User with email + Google
{
  "user": {
    "id": "uuid-123",
    "email": "alice@example.com",
    "email_verified": true,
    "raw_user_meta_data": {
      "full_name": "Alice Smith",
      "avatar_url": "https://lh3.googleusercontent.com/..."
    },
    "raw_app_meta_data": {
      "provider": "google",
      "providers": ["email", "google"]
    }
  },
  "identities": [
    {
      "provider": "email",
      "identity_data": {
        "email": "alice@example.com",
        "email_verified": true
      }
    },
    {
      "provider": "google",
      "identity_data": {
        "email": "alice@example.com",
        "email_verified": true,
        "full_name": "Alice Smith",
        "avatar_url": "https://lh3.googleusercontent.com/...",
        "provider_id": "google-oauth2|123456789"
      }
    }
  ]
}
```

---

### New Table: security_audit_logs (OAuth Events)

**Purpose**: Log OAuth events for security monitoring and compliance.

```sql
-- Already exists from Sprint 3 (secrets management)
-- Adding new event types for OAuth

create table if not exists security_audit_logs (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id),
  event_type          text not null,  -- 'oauth_initiated', 'oauth_success', 'oauth_failed', etc.
  metadata            jsonb,          -- Provider, email, error details
  ip_address          text,
  created_at          timestamp with time zone default now()
);

-- Index for querying by user
create index if not exists security_audit_logs_user_id_idx on security_audit_logs(user_id);

-- Index for querying by event type
create index if not exists security_audit_logs_event_type_idx on security_audit_logs(event_type);

-- Index for querying by timestamp (for purging old logs)
create index if not exists security_audit_logs_created_at_idx on security_audit_logs(created_at);
```

**New Event Types**:

- `oauth_initiated`: User clicked OAuth button
- `oauth_success`: OAuth flow completed successfully
- `oauth_failed`: OAuth flow failed (user denied, provider error, validation error)
- `account_linked`: OAuth account linked to existing user
- `account_unlinked`: User disconnected OAuth account

**Example Audit Log**:

```json
{
  "id": "uuid-456",
  "user_id": "uuid-123",
  "event_type": "oauth_success",
  "metadata": {
    "provider": "google",
    "email": "alice@example.com",
    "linked_to_existing_account": true
  },
  "ip_address": "203.0.113.1",
  "created_at": "2026-01-15T10:30:00Z"
}
```

---

### Database Migration

**Migration File**: `supabase/migrations/20260101000000_add_oauth_support.sql`

```sql
-- =====================================================
-- Migration: Add OAuth support
-- =====================================================

-- NOTE: No changes to auth.users or auth.identities needed.
-- Supabase manages these automatically.

-- 1. Add OAuth event types to security_audit_logs (if not already present)
-- This migration is idempotent - safe to run multiple times.

-- security_audit_logs table should already exist from Sprint 3
-- We're just adding new event types (no schema changes)

-- 2. Add index on auth.identities for faster lookups (Supabase may have this already)
-- This is a performance optimization, not required for functionality.
create index if not exists identities_user_id_provider_idx
  on auth.identities(user_id, provider);

-- 3. Comment documenting OAuth event types
comment on table security_audit_logs is
  'Security audit log for authentication events.
   OAuth event types:
   - oauth_initiated: User clicked OAuth button
   - oauth_success: OAuth flow completed
   - oauth_failed: OAuth flow failed
   - account_linked: OAuth linked to existing account
   - account_unlinked: OAuth disconnected';

-- =====================================================
-- Data Retention Policy for Audit Logs
-- =====================================================

-- Auto-delete audit logs older than 90 days (GDPR compliance)
create or replace function cleanup_old_audit_logs()
returns void as $$
begin
  delete from security_audit_logs
  where created_at < now() - interval '90 days';
end;
$$ language plpgsql security definer;

-- Schedule cleanup to run daily (requires pg_cron extension)
-- Or run manually/via cron job
-- select cron.schedule('cleanup-audit-logs', '0 2 * * *', 'select cleanup_old_audit_logs()');
```

---

### RLS Policies (No Changes Needed)

**Why No Changes**: OAuth users go through the same `handle_new_user()` trigger as email/password users. The trigger creates a workbench and adds the user as owner. All existing RLS policies work as-is.

**Verification**:

```sql
-- Test: OAuth user can access their own projects
select * from projects; -- RLS filters by user's workbenches

-- Test: OAuth user cannot access other users' projects
-- (RLS blocks cross-user access automatically)
```

---

## UI/UX Requirements

### Design Principles

1. **Familiar**: Use standard OAuth button patterns (logo + "Continue with [Provider]")
2. **Clear**: User knows exactly what will happen ("Continue with Google" not "Sign in")
3. **Trustworthy**: Show provider logos, use provider brand colors
4. **Accessible**: High contrast, keyboard navigable, screen reader friendly
5. **Responsive**: Works on mobile (320px) to desktop (1920px)

---

### Sign-Up Page (`/signup`)

**Layout**:

```
┌─────────────────────────────────────┐
│            Sageloop Logo             │
│                                      │
│      Sign up for Sageloop           │
│                                      │
│  ┌─────────────────────────────┐   │
│  │   [G]  Continue with Google  │   │  ← Google button
│  └─────────────────────────────┘   │
│                                      │
│  ┌─────────────────────────────┐   │
│  │   [f]  Continue with GitHub  │   │  ← GitHub button
│  └─────────────────────────────┘   │
│                                      │
│  ──────────── or ────────────      │
│                                      │
│  Email                              │
│  ┌─────────────────────────────┐   │
│  │ you@example.com             │   │
│  └─────────────────────────────┘   │
│                                      │
│  Password                           │
│  ┌─────────────────────────────┐   │
│  │ ••••••••                    │   │
│  └─────────────────────────────┘   │
│                                      │
│  ┌─────────────────────────────┐   │
│  │     Sign up with email       │   │
│  └─────────────────────────────┘   │
│                                      │
│  Already have an account? Sign in   │
└─────────────────────────────────────┘
```

**Component**: `components/auth/signup-form.tsx` (UPDATE)

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { signInWithGoogle, signInWithGithub } from "@/lib/auth/oauth";
import { GoogleIcon, GitHubIcon } from "@/components/icons/providers";

export function SignupForm() {
  const [loading, setLoading] = useState<"google" | "github" | "email" | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignup = async () => {
    setLoading("google");
    setError(null);
    try {
      await signInWithGoogle();
      // User will be redirected to Google OAuth
    } catch (err) {
      setError(err.message);
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
      setError(err.message);
      setLoading(null);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-4 pt-6">
        <h1 className="text-2xl font-semibold text-center">
          Sign up for Sageloop
        </h1>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignup}
            disabled={!!loading}
          >
            <GoogleIcon className="w-5 h-5" />
            {loading === "google" ? "Connecting..." : "Continue with Google"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGithubSignup}
            disabled={!!loading}
          >
            <GitHubIcon className="w-5 h-5" />
            {loading === "github" ? "Connecting..." : "Continue with GitHub"}
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

        {/* Email/Password Form (existing) */}
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
              disabled={!!loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={!!loading}
            />
          </div>
          <Button type="submit" className="w-full" disabled={!!loading}>
            {loading === "email" ? "Creating account..." : "Sign up with email"}
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
```

**Design Tokens** (from Design System):

```css
/* OAuth Button Styles */
.oauth-button-google {
  background: white;
  border: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
}

.oauth-button-google:hover {
  background: hsl(var(--secondary));
}

.oauth-button-github {
  background: white;
  border: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
}

.oauth-button-github:hover {
  background: hsl(var(--secondary));
}
```

---

### Login Page (`/login`)

**Layout**: Same as sign-up page, but with "Sign in to Sageloop" header

**Component**: `components/auth/login-form.tsx` (UPDATE)

Add OAuth buttons above email/password form (same code as signup).

---

### OAuth Callback Page (`/auth/callback`)

**Purpose**: Landing page after OAuth redirect (not visible to user, just processing)

**Layout**:

```
┌─────────────────────────────────────┐
│                                      │
│        [Sageloop Logo]              │
│                                      │
│     Completing sign-in...           │
│                                      │
│        [Spinner animation]           │
│                                      │
└─────────────────────────────────────┘
```

**Component**: `app/auth/callback/page.tsx` (NEW)

```tsx
export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-muted-foreground">Completing sign-in...</p>
      </div>
    </div>
  );
}
```

**Note**: This page only shows for 1-2 seconds while OAuth callback is processed.

---

### Settings → Connected Accounts (NEW PAGE)

**Purpose**: Show which OAuth providers are connected, allow disconnect

**Route**: `/settings/connected-accounts`

**Layout**:

```
┌─────────────────────────────────────┐
│  Settings                            │
│                                      │
│  Connected Accounts                  │
│  ─────────────────────────          │
│                                      │
│  Manage how you sign in to Sageloop │
│                                      │
│  ┌─────────────────────────────┐   │
│  │ [G] Google                   │   │
│  │ alice@example.com            │   │
│  │                              │   │
│  │            [Disconnect]      │   │  ← Disconnect button
│  └─────────────────────────────┘   │
│                                      │
│  ┌─────────────────────────────┐   │
│  │ [f] GitHub                   │   │
│  │ Not connected                │   │
│  │                              │   │
│  │            [Connect]         │   │  ← Connect button
│  └─────────────────────────────┘   │
│                                      │
│  ┌─────────────────────────────┐   │
│  │ Email/Password               │   │
│  │ alice@example.com            │   │
│  │                              │   │
│  │         [Change password]    │   │
│  └─────────────────────────────┘   │
│                                      │
│  ⚠️  You must have at least one     │
│      sign-in method enabled.        │
└─────────────────────────────────────┘
```

**Component**: `app/settings/connected-accounts/page.tsx` (NEW)

```tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  GoogleIcon,
  GitHubIcon,
  EmailIcon,
} from "@/components/icons/providers";
import { createClient } from "@/lib/supabase/client";
import {
  signInWithGoogle,
  signInWithGithub,
  disconnectOAuthProvider,
} from "@/lib/auth/oauth";

interface ConnectedAccount {
  provider: "google" | "github" | "email";
  email?: string;
  connected: boolean;
}

export default function ConnectedAccountsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAccounts() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const identities = user.identities || [];

        setAccounts([
          {
            provider: "google",
            email: identities.find((i) => i.provider === "google")
              ?.identity_data?.email,
            connected: identities.some((i) => i.provider === "google"),
          },
          {
            provider: "github",
            email: identities.find((i) => i.provider === "github")
              ?.identity_data?.email,
            connected: identities.some((i) => i.provider === "github"),
          },
          {
            provider: "email",
            email: user.email,
            connected: identities.some((i) => i.provider === "email"),
          },
        ]);
      }
    }

    fetchAccounts();
  }, []);

  const handleDisconnect = async (provider: "google" | "github") => {
    if (accounts.filter((a) => a.connected).length === 1) {
      alert("You must have at least one sign-in method enabled.");
      return;
    }

    setLoading(provider);
    try {
      await disconnectOAuthProvider(provider);
      // Refresh accounts
      setAccounts((prev) =>
        prev.map((a) =>
          a.provider === provider
            ? { ...a, connected: false, email: undefined }
            : a,
        ),
      );
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-3xl font-semibold mb-2">Connected Accounts</h1>
      <p className="text-muted-foreground mb-8">
        Manage how you sign in to Sageloop
      </p>

      <div className="space-y-4">
        {/* Google */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GoogleIcon className="w-6 h-6" />
              <div>
                <p className="font-medium">Google</p>
                <p className="text-sm text-muted-foreground">
                  {accounts.find((a) => a.provider === "google")?.connected
                    ? accounts.find((a) => a.provider === "google")?.email
                    : "Not connected"}
                </p>
              </div>
            </div>
            <div>
              {accounts.find((a) => a.provider === "google")?.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect("google")}
                  disabled={!!loading}
                >
                  {loading === "google" ? "Disconnecting..." : "Disconnect"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signInWithGoogle()}
                  disabled={!!loading}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* GitHub */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <GitHubIcon className="w-6 h-6" />
              <div>
                <p className="font-medium">GitHub</p>
                <p className="text-sm text-muted-foreground">
                  {accounts.find((a) => a.provider === "github")?.connected
                    ? accounts.find((a) => a.provider === "github")?.email
                    : "Not connected"}
                </p>
              </div>
            </div>
            <div>
              {accounts.find((a) => a.provider === "github")?.connected ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDisconnect("github")}
                  disabled={!!loading}
                >
                  {loading === "github" ? "Disconnecting..." : "Disconnect"}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signInWithGithub()}
                  disabled={!!loading}
                >
                  Connect
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Email/Password */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EmailIcon className="w-6 h-6" />
              <div>
                <p className="font-medium">Email/Password</p>
                <p className="text-sm text-muted-foreground">
                  {accounts.find((a) => a.provider === "email")?.email ||
                    "Not set"}
                </p>
              </div>
            </div>
            <div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/settings/password">Change password</Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-6 p-4 bg-muted rounded-md flex items-start gap-2">
        <span className="text-lg">⚠️</span>
        <p className="text-sm text-muted-foreground">
          You must have at least one sign-in method enabled.
        </p>
      </div>
    </div>
  );
}
```

---

### Error States

#### OAuth Denied

```
┌─────────────────────────────────────┐
│  ⚠️  Sign-in cancelled               │
│                                      │
│  You need to grant permissions to   │
│  sign in with Google. Try again or  │
│  use email/password instead.        │
│                                      │
│  [Try again]  [Use email/password]  │
└─────────────────────────────────────┘
```

#### Provider Error

```
┌─────────────────────────────────────┐
│  ⚠️  Sign-in error                   │
│                                      │
│  Google sign-in is temporarily      │
│  unavailable. Please try again or   │
│  use email/password instead.        │
│                                      │
│  [Try again]  [Use email/password]  │
└─────────────────────────────────────┘
```

#### Email Already Registered

```
┌─────────────────────────────────────┐
│  ⚠️  Email already registered        │
│                                      │
│  This email is already registered.  │
│  Sign in with your password to link │
│  your Google account.               │
│                                      │
│  [Sign in with password]            │
└─────────────────────────────────────┘
```

---

### Mobile Responsive Design

**Breakpoints** (from Design System):

- Mobile: 320px - 640px
- Tablet: 640px - 1024px
- Desktop: 1024px+

**Mobile Adaptations**:

- OAuth buttons: Full width, larger tap targets (48px height)
- Font sizes: 16px minimum (prevent zoom on iOS)
- Spacing: Reduced padding (16px vs. 24px on desktop)
- Card width: 100% with 16px gutters

---

### Accessibility (WCAG 2.1 AA)

#### Color Contrast

- [ ] OAuth button text: ≥ 4.5:1 contrast ratio
- [ ] Error messages: ≥ 4.5:1 contrast ratio
- [ ] Focus states: ≥ 3:1 contrast ratio

#### Keyboard Navigation

- [ ] OAuth buttons: Tabbable and activatable with Enter/Space
- [ ] Focus ring visible on all interactive elements
- [ ] Tab order logical: OAuth buttons → Email field → Password field → Submit

#### Screen Reader Support

- [ ] OAuth buttons: "Button, Continue with Google"
- [ ] Error messages: Announced via aria-live region
- [ ] Loading states: "Connecting to Google..."
- [ ] Connected accounts: "Google account connected: alice@example.com"

#### Focus Management

- [ ] After OAuth error: Focus returns to error message
- [ ] After successful OAuth: Focus on "Create New Project" button
- [ ] After disconnect: Focus on "Connect" button

---

## Edge Cases & Error Handling

### Edge Case 1: User Has Multiple Emails on GitHub

**Scenario**: GitHub user has 3 emails, only one is verified

**Behavior**:

- Supabase uses the **primary** email from GitHub
- If primary email is not verified → Sign-in rejected
- Error message: "Please verify your GitHub email in your GitHub settings"

**Implementation**:

```typescript
// app/auth/callback/route.ts
const {
  data: { user },
} = await supabase.auth.getUser();

if (user?.app_metadata.provider === "github") {
  const githubEmail = user.email;
  const emailVerified = user.email_verified;

  if (!emailVerified) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      `${origin}/login?error=github_email_not_verified`,
    );
  }
}
```

---

### Edge Case 2: User Changes Email on OAuth Provider

**Scenario**: User signs up with `alice@gmail.com`, later changes Google account email to `alice@work.com`

**Behavior**:

- Next Google sign-in uses `alice@work.com`
- Supabase creates a **new user** (different email)
- Original account with `alice@gmail.com` still exists

**User Impact**: User has 2 accounts, needs to manually migrate data

**Mitigation** (Future):

- Add email change detection
- Show warning: "Your Google email changed. Link accounts in Settings?"
- Allow manual account merging

**Acceptance Criteria**:

- [ ] Email change creates new account (expected behavior)
- [ ] User can link both emails to one account via Settings
- [ ] Documentation explains this edge case

---

### Edge Case 3: User Disconnects All Auth Methods

**Scenario**: User has only Google connected, tries to disconnect Google

**Behavior**:

- Disconnect button shows warning modal
- Modal: "You must have at least one sign-in method. Set a password first."
- Button: "Set Password" → Redirect to `/settings/password`

**Implementation**:

```typescript
const handleDisconnect = async (provider: string) => {
  const connectedCount = accounts.filter((a) => a.connected).length;

  if (connectedCount === 1) {
    // Show modal or alert
    alert(
      "You must have at least one sign-in method enabled. Please set a password first.",
    );
    return;
  }

  // Proceed with disconnect...
};
```

**Acceptance Criteria**:

- [ ] Cannot disconnect last auth method
- [ ] Warning shown before disconnect
- [ ] User can set password, then disconnect OAuth

---

### Edge Case 4: OAuth Provider Downtime

**Scenario**: Google OAuth servers are down, user clicks "Continue with Google"

**Behavior**:

- OAuth redirect fails with provider error
- User redirected to `/signup?error=provider_error`
- Error message: "Google sign-in is temporarily unavailable. Try again later or use email/password."

**Retry Logic**:

- User can click "Try again" → Retry OAuth
- User can click "Use email/password" → Switch to email form

**Acceptance Criteria**:

- [ ] Provider downtime handled gracefully
- [ ] Clear error message
- [ ] User can retry or switch methods

---

### Edge Case 5: Session Expires During OAuth Flow

**Scenario**: User starts OAuth, gets distracted, comes back 30 minutes later, completes OAuth

**Behavior**:

- OAuth state parameter expired (Supabase default: 5 minutes)
- Callback returns error: `invalid_request` or `state_mismatch`
- User redirected to `/login?error=session_expired`
- Message: "Your session expired. Please sign in again."

**Acceptance Criteria**:

- [ ] Expired state handled
- [ ] User redirected to login with error
- [ ] User can restart OAuth flow

---

### Edge Case 6: User Denies OAuth Permissions

**Scenario**: User clicks "Continue with Google" → Denies email permission

**Behavior**:

- Google redirects to callback with `error=access_denied`
- User redirected to `/signup?error=access_denied`
- Message: "You need to grant email permissions to sign in with Google."

**Retry Logic**:

- User can click "Try again" → Restart OAuth (Google will ask for permissions again)

**Acceptance Criteria**:

- [ ] Access denied handled
- [ ] User can retry
- [ ] Error message explains what permissions are needed

---

### Edge Case 7: OAuth Email Differs from Entered Email

**Scenario**: User types `alice@example.com` in email field, then clicks "Continue with Google", selects `alice@gmail.com`

**Behavior**:

- OAuth uses `alice@gmail.com` (ignores typed email)
- User is signed up/in with `alice@gmail.com`
- No conflict (typed email is discarded)

**Acceptance Criteria**:

- [ ] OAuth email takes precedence over typed email
- [ ] No error or warning (expected behavior)

---

### Edge Case 8: Account Linking Fails (Email Mismatch)

**Scenario**: User has account with `alice@example.com`, clicks "Continue with Google", selects `alice@gmail.com`

**Behavior**:

- Emails don't match → No automatic linking
- New account created with `alice@gmail.com`
- User has 2 accounts

**Future Enhancement**: Detect similar emails, suggest manual linking

**Acceptance Criteria**:

- [ ] Different emails → Separate accounts
- [ ] User can manually merge accounts in Settings (future feature)

---

### Edge Case 9: User Clicks OAuth Button Twice (Rapid Fire)

**Scenario**: User clicks "Continue with Google" twice quickly

**Behavior**:

- First click: OAuth redirect initiated
- Second click: Rate limit check
- If <10 attempts in 15 min: Allow (user might have clicked back)
- If >10 attempts: Block with rate limit error

**Acceptance Criteria**:

- [ ] Accidental double-click allowed
- [ ] Excessive attempts rate limited
- [ ] Rate limit: 10 OAuth initiations per 15 min

---

### Edge Case 10: OAuth Callback with Invalid Code

**Scenario**: Attacker manually crafts callback URL with invalid code

**Behavior**:

- Supabase `exchangeCodeForSession()` fails
- Error logged to audit log
- User redirected to `/login?error=invalid_code`
- Message: "Sign-in failed. Please try again."

**Security**: Invalid codes don't create sessions (Supabase validates)

**Acceptance Criteria**:

- [ ] Invalid code rejected
- [ ] Error logged
- [ ] User redirected to login

---

## Migration Considerations

### Existing Users (Email/Password)

**Goal**: Seamlessly allow existing users to link OAuth accounts

**Strategy**: Automatic linking if emails match and are verified

**Steps**:

1. Existing user navigates to `/login`
2. User clicks "Continue with Google" (same email as their account)
3. Google OAuth completes, returns verified email
4. Supabase detects email match → Auto-links Google identity to existing user
5. User can now sign in with either email/password or Google

**No Migration Script Needed**: Supabase handles linking automatically

---

### Unverified Email Users

**Risk**: Users who signed up but didn't verify email

**Strategy**: Block OAuth linking until email verified (Security Requirement #2)

**Migration Plan**:

1. Query for unverified users: `SELECT * FROM auth.users WHERE email_verified = false`
2. Send email: "Verify your email to link Google/GitHub accounts"
3. On OAuth attempt: Show error "Please verify your email first"

**SQL Query**:

```sql
-- Find unverified users (no migration needed, just monitoring)
SELECT id, email, created_at
FROM auth.users
WHERE email_verified = false
  AND created_at > now() - interval '30 days' -- Recent sign-ups
ORDER BY created_at DESC;
```

---

### Database Schema Migration

**Migration File**: `supabase/migrations/20260101000000_add_oauth_support.sql` (see Database Schema section)

**Migration Steps**:

1. Add index on `auth.identities` for faster provider lookups (performance optimization)
2. Add OAuth event types comment to `security_audit_logs` table (documentation)
3. Add audit log cleanup function (GDPR compliance)

**No Data Migration Needed**: Existing users continue working as-is

---

### Environment Variables

**New Variables**: None (OAuth config in Supabase dashboard)

**Existing Variables**: No changes

**Configuration Checklist**:

- [ ] Supabase dashboard: Enable Google OAuth provider
- [ ] Supabase dashboard: Enable GitHub OAuth provider
- [ ] Supabase dashboard: Add redirect URIs (production, staging, localhost)
- [ ] Google Cloud Console: Create OAuth 2.0 credentials
- [ ] GitHub: Create OAuth App
- [ ] Test OAuth flows in development environment
- [ ] Test OAuth flows in staging environment
- [ ] Deploy to production

---

### Rollback Plan

**If OAuth has critical bugs**:

1. **Disable OAuth in Supabase Dashboard** (immediate rollback)
   - Go to Authentication → Providers → Disable Google/GitHub
   - Existing OAuth users can still sign in (identities preserved)
   - New OAuth sign-ups blocked

2. **Hide OAuth Buttons in UI** (code rollback)

   ```tsx
   // Feature flag
   const OAUTH_ENABLED = false;

   {
     OAUTH_ENABLED && (
       <>
         <Button onClick={signInWithGoogle}>Continue with Google</Button>
         <Button onClick={signInWithGithub}>Continue with GitHub</Button>
       </>
     );
   }
   ```

3. **Rollback Database Migration** (if needed)

   ```sql
   -- Rollback audit log cleanup function
   DROP FUNCTION IF EXISTS cleanup_old_audit_logs();

   -- Remove index (optional, doesn't break anything)
   DROP INDEX IF EXISTS identities_user_id_provider_idx;
   ```

**Data Preservation**: All existing user accounts (email/password and OAuth) remain intact during rollback

---

## Testing Requirements

### Unit Tests

**File**: `tests/lib/auth/oauth.test.ts` (NEW)

```typescript
import { validateOAuthMetadata } from "@/lib/auth/oauth-validation";

describe("OAuth Validation", () => {
  describe("validateOAuthMetadata", () => {
    it("should pass valid Google metadata", () => {
      const metadata = {
        email: "alice@example.com",
        email_verified: true,
        full_name: "Alice Smith",
        avatar_url: "https://lh3.googleusercontent.com/...",
      };

      const result = validateOAuthMetadata(metadata, "google");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject unverified email", () => {
      const metadata = {
        email: "alice@example.com",
        email_verified: false,
      };

      const result = validateOAuthMetadata(metadata, "google");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/verified/i));
    });

    it("should reject invalid email format", () => {
      const metadata = {
        email: "not-an-email",
        email_verified: true,
      };

      const result = validateOAuthMetadata(metadata, "google");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/invalid email/i));
    });

    it("should reject missing email", () => {
      const metadata = {
        email_verified: true,
      };

      const result = validateOAuthMetadata(metadata, "google");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        expect.stringMatching(/email.*required/i),
      );
    });

    it("should reject HTTP avatar URL", () => {
      const metadata = {
        email: "alice@example.com",
        email_verified: true,
        avatar_url: "http://example.com/avatar.jpg", // HTTP, not HTTPS
      };

      const result = validateOAuthMetadata(metadata, "google");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(expect.stringMatching(/HTTPS/i));
    });

    it("should pass metadata without optional fields", () => {
      const metadata = {
        email: "alice@example.com",
        email_verified: true,
        // No full_name or avatar_url
      };

      const result = validateOAuthMetadata(metadata, "google");
      expect(result.isValid).toBe(true);
    });
  });
});
```

**Target Coverage**: >90%

---

### Integration Tests

**File**: `tests/api/oauth-integration.test.ts` (NEW)

```typescript
import { createServerClient } from "@/lib/supabase/server";

describe("OAuth Integration", () => {
  it("should handle OAuth callback successfully", async () => {
    // Mock Supabase OAuth response
    const mockUser = {
      id: "user-123",
      email: "alice@example.com",
      email_verified: true,
      app_metadata: {
        provider: "google",
        providers: ["google"],
      },
      user_metadata: {
        full_name: "Alice Smith",
        avatar_url: "https://example.com/avatar.jpg",
      },
    };

    // Simulate OAuth callback
    const response = await fetch("/auth/callback?code=mock-code", {
      method: "GET",
    });

    // Verify redirect to projects page
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/projects");

    // Verify user authenticated
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    expect(user?.email).toBe("alice@example.com");
  });

  it("should reject OAuth callback with invalid code", async () => {
    const response = await fetch("/auth/callback?code=invalid-code", {
      method: "GET",
    });

    // Verify error redirect
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toContain("/login?error=");
  });

  it("should rate limit OAuth callback attempts", async () => {
    // Make 10 OAuth callback requests
    const promises = Array.from({ length: 11 }, (_, i) =>
      fetch(`/auth/callback?code=code-${i}`, { method: "GET" }),
    );

    const responses = await Promise.all(promises);

    // 11th request should be rate limited
    const rateLimited = responses.find((r) => r.status === 429);
    expect(rateLimited).toBeDefined();
  });

  it("should auto-link OAuth to existing verified email account", async () => {
    // Create email/password user
    const supabase = await createServerClient();
    await supabase.auth.signUp({
      email: "alice@example.com",
      password: "password123",
    });

    // Verify email
    // (Mock email verification in test)

    // Simulate OAuth with same email
    const response = await fetch("/auth/callback?code=google-code", {
      method: "GET",
    });

    // Verify account linked
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const identities = user?.identities || [];

    expect(identities.some((i) => i.provider === "email")).toBe(true);
    expect(identities.some((i) => i.provider === "google")).toBe(true);
  });

  it("should block OAuth link to unverified email account", async () => {
    // Create UNVERIFIED email/password user
    const supabase = await createServerClient();
    await supabase.auth.signUp({
      email: "alice@example.com",
      password: "password123",
    });
    // Don't verify email

    // Simulate OAuth with same email
    const response = await fetch("/auth/callback?code=google-code", {
      method: "GET",
    });

    // Verify linking blocked
    expect(response.headers.get("location")).toContain(
      "error=email_not_verified",
    );
  });
});
```

**Target Coverage**: 100% of OAuth callback route

---

### Security Tests

**File**: `tests/security/oauth.test.ts` (NEW)

```typescript
describe("OAuth Security", () => {
  describe("CSRF Protection", () => {
    it("should reject OAuth callback with invalid state", async () => {
      const response = await fetch(
        "/auth/callback?code=valid-code&state=invalid-state",
        {
          method: "GET",
        },
      );

      expect(response.headers.get("location")).toContain("error=");
    });

    it("should reject OAuth callback with reused state", async () => {
      // First request with state
      const response1 = await fetch("/auth/callback?code=code1&state=state1", {
        method: "GET",
      });

      // Retry with same state
      const response2 = await fetch("/auth/callback?code=code2&state=state1", {
        method: "GET",
      });

      expect(response2.headers.get("location")).toContain("error=");
    });
  });

  describe("Redirect URI Validation", () => {
    it("should allow whitelisted redirect URIs", async () => {
      const response = await fetch(
        "/auth/callback?code=code&redirect_to=/projects",
        {
          method: "GET",
        },
      );

      expect(response.status).not.toBe(400);
    });

    it("should block non-whitelisted redirect URIs", async () => {
      const response = await fetch(
        "/auth/callback?code=code&redirect_to=https://evil.com",
        {
          method: "GET",
        },
      );

      expect(response.status).toBe(400);
    });
  });

  describe("Token Security", () => {
    it("should store tokens in HttpOnly cookies", async () => {
      const response = await fetch("/auth/callback?code=valid-code", {
        method: "GET",
      });

      const cookies = response.headers.get("set-cookie");
      expect(cookies).toContain("HttpOnly");
    });

    it("should not expose tokens in API responses", async () => {
      const response = await fetch("/api/user", {
        method: "GET",
      });

      const data = await response.json();
      expect(data).not.toHaveProperty("access_token");
      expect(data).not.toHaveProperty("refresh_token");
    });
  });

  describe("Email Verification", () => {
    it("should block OAuth link to unverified account", async () => {
      // Covered in integration tests
    });

    it("should allow OAuth link to verified account", async () => {
      // Covered in integration tests
    });
  });

  describe("Audit Logging", () => {
    it("should log successful OAuth event", async () => {
      await fetch("/auth/callback?code=valid-code", { method: "GET" });

      const supabase = await createServerClient();
      const { data: logs } = await supabase
        .from("security_audit_logs")
        .select("*")
        .eq("event_type", "oauth_success")
        .order("created_at", { ascending: false })
        .limit(1);

      expect(logs).toHaveLength(1);
      expect(logs[0].metadata.provider).toBe("google");
    });

    it("should log failed OAuth event", async () => {
      await fetch("/auth/callback?code=invalid-code", { method: "GET" });

      const supabase = await createServerClient();
      const { data: logs } = await supabase
        .from("security_audit_logs")
        .select("*")
        .eq("event_type", "oauth_failed")
        .order("created_at", { ascending: false })
        .limit(1);

      expect(logs).toHaveLength(1);
      expect(logs[0].metadata.error).toBeDefined();
    });
  });
});
```

**Target Coverage**: 100% of security-critical paths

---

### E2E Tests (Playwright)

**File**: `tests/e2e/oauth.spec.ts` (NEW)

```typescript
import { test, expect } from "@playwright/test";

test.describe("OAuth Flows", () => {
  test("user can sign up with Google", async ({ page }) => {
    // Navigate to sign-up page
    await page.goto("/signup");

    // Click "Continue with Google"
    await page.click("text=Continue with Google");

    // Mock Google OAuth consent screen (in test environment)
    // In real E2E, this would redirect to actual Google
    // For tests, we mock the callback

    // Simulate OAuth callback
    await page.goto("/auth/callback?code=mock-google-code");

    // Verify redirected to projects page
    await expect(page).toHaveURL("/projects");

    // Verify user is authenticated
    await expect(page.locator("text=New Project")).toBeVisible();
  });

  test("user can sign in with GitHub", async ({ page }) => {
    // Similar to Google test
    await page.goto("/login");
    await page.click("text=Continue with GitHub");
    await page.goto("/auth/callback?code=mock-github-code");
    await expect(page).toHaveURL("/projects");
  });

  test("user can link Google account in settings", async ({
    page,
    context,
  }) => {
    // Sign up with email/password first
    await page.goto("/signup");
    await page.fill('input[type="email"]', "alice@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click("text=Sign up with email");

    // Navigate to connected accounts
    await page.goto("/settings/connected-accounts");

    // Click "Connect" on Google
    await page.click("text=Connect", { force: true }); // Near Google section

    // Mock OAuth
    await page.goto("/auth/callback?code=mock-google-code");

    // Verify redirected back to settings
    await expect(page).toHaveURL("/settings/connected-accounts");

    // Verify Google is now connected
    await expect(page.locator("text=Disconnect")).toBeVisible(); // Near Google
  });

  test("user sees error when denying OAuth permissions", async ({ page }) => {
    await page.goto("/signup");
    await page.click("text=Continue with Google");

    // Simulate access_denied error
    await page.goto("/signup?error=access_denied");

    // Verify error message
    await expect(
      page.locator("text=You need to grant permissions"),
    ).toBeVisible();
  });

  test("user cannot disconnect last auth method", async ({ page }) => {
    // Sign up with Google only
    await page.goto("/signup");
    await page.click("text=Continue with Google");
    await page.goto("/auth/callback?code=mock-google-code");

    // Navigate to settings
    await page.goto("/settings/connected-accounts");

    // Try to disconnect Google
    await page.click("text=Disconnect");

    // Verify warning/alert
    await expect(
      page.locator("text=at least one sign-in method"),
    ).toBeVisible();
  });
});
```

**Target Coverage**: Critical flows (sign-up, sign-in, linking, errors)

---

### Manual Testing Checklist

#### Pre-Launch Testing

- [ ] Sign up with Google on desktop (Chrome, Firefox, Safari)
- [ ] Sign up with GitHub on desktop
- [ ] Sign up with Google on mobile (iOS Safari, Android Chrome)
- [ ] Sign up with GitHub on mobile
- [ ] Sign in with Google (existing user)
- [ ] Sign in with GitHub (existing user)
- [ ] Link Google to email/password account
- [ ] Link GitHub to email/password account
- [ ] Disconnect Google account
- [ ] Disconnect GitHub account
- [ ] Try to disconnect last auth method (should block)
- [ ] Deny OAuth permissions (error handling)
- [ ] OAuth with unverified GitHub email (should block)
- [ ] OAuth callback timeout (error handling)
- [ ] Rate limiting (11 attempts in 15 min)
- [ ] Audit log entries created for all events
- [ ] Privacy: Verify only minimal scopes requested
- [ ] Accessibility: Tab navigation works
- [ ] Accessibility: Screen reader announces buttons correctly
- [ ] Performance: OAuth sign-up <10 seconds
- [ ] Performance: OAuth sign-in <3 seconds

---

## Implementation Plan

### Phase 1: Setup & Configuration (2 days)

**Tasks**:

1. Create OAuth apps in Google Cloud Console and GitHub
2. Configure OAuth providers in Supabase dashboard
3. Add redirect URIs for all environments
4. Test basic OAuth flow in development
5. Update `.env.example` with documentation (no new vars needed)

**Deliverables**:

- [ ] Google OAuth app created
- [ ] GitHub OAuth app created
- [ ] Supabase OAuth configured
- [ ] Test OAuth flow works in localhost

**Owner**: Backend Engineer

---

### Phase 2: Backend Implementation (3 days)

**Tasks**:

1. Create OAuth helper functions (`lib/auth/oauth.ts`)
2. Create OAuth callback route (`app/auth/callback/route.ts`)
3. Implement OAuth metadata validation (`lib/auth/oauth-validation.ts`)
4. Implement audit logging for OAuth events
5. Add rate limiting to OAuth callback
6. Write unit tests for validation logic
7. Write integration tests for callback route

**Deliverables**:

- [ ] OAuth callback handler complete
- [ ] Validation logic implemented
- [ ] Audit logging working
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass (100% coverage)

**Owner**: Backend Engineer

**Security Review**: Principal Engineer reviews security implementation

---

### Phase 3: Frontend Implementation (3 days)

**Tasks**:

1. Create OAuth button components
2. Update sign-up page with OAuth buttons
3. Update login page with OAuth buttons
4. Create OAuth callback loading page
5. Create Settings → Connected Accounts page
6. Implement disconnect OAuth functionality
7. Add error handling and user messaging
8. Write E2E tests (Playwright)

**Deliverables**:

- [ ] Sign-up page with OAuth buttons
- [ ] Login page with OAuth buttons
- [ ] Settings page for connected accounts
- [ ] Error states implemented
- [ ] E2E tests pass

**Owner**: Frontend Engineer

**Design Review**: Product Manager reviews UI/UX

---

### Phase 4: Testing & QA (2 days)

**Tasks**:

1. Run all unit tests
2. Run all integration tests
3. Run all security tests
4. Run all E2E tests
5. Manual testing on desktop (Chrome, Firefox, Safari)
6. Manual testing on mobile (iOS, Android)
7. Accessibility audit (keyboard nav, screen reader)
8. Performance testing (measure OAuth flow times)
9. Security review (Principal Engineer)

**Deliverables**:

- [ ] All automated tests pass
- [ ] Manual testing complete
- [ ] Accessibility audit pass
- [ ] Performance targets met
- [ ] Security review approved

**Owner**: QA + Principal Engineer

---

### Phase 5: Documentation & Launch Prep (1 day)

**Tasks**:

1. Write user-facing help docs
2. Update privacy policy
3. Write developer documentation
4. Create launch announcement draft
5. Prepare rollback plan
6. Configure monitoring/alerts

**Deliverables**:

- [ ] Help docs published
- [ ] Privacy policy updated
- [ ] Developer docs complete
- [ ] Launch plan ready
- [ ] Rollback plan documented

**Owner**: Product Manager + Technical Writer

---

### Phase 6: Staging Deployment (1 day)

**Tasks**:

1. Deploy to staging environment
2. Configure OAuth apps for staging
3. Test full OAuth flows on staging
4. Verify audit logging works
5. Verify rate limiting works
6. Final security review

**Deliverables**:

- [ ] Staging deployment successful
- [ ] All flows tested on staging
- [ ] No critical issues found

**Owner**: DevOps + Backend Engineer

---

### Phase 7: Production Deployment (1 day)

**Tasks**:

1. Deploy to production
2. Configure OAuth apps for production
3. Smoke test OAuth flows
4. Monitor error rates for 24 hours
5. Monitor audit logs for suspicious activity
6. Send launch announcement

**Deliverables**:

- [ ] Production deployment successful
- [ ] OAuth working for real users
- [ ] No critical errors
- [ ] Users adopting OAuth (monitor metrics)

**Owner**: DevOps + Product Manager

---

### Total Timeline: 2-3 weeks

**Week 1**: Setup + Backend (Days 1-5)
**Week 2**: Frontend + Testing (Days 6-10)
**Week 3**: Documentation + Deployment (Days 11-13)

**Effort**: 1 Backend Engineer (full-time), 1 Frontend Engineer (full-time), Product Manager (part-time)

---

## Success Metrics

### Adoption Metrics

**Target (3 months post-launch)**:

- [ ] 60% of new users choose OAuth over email/password
- [ ] OAuth sign-up completion rate >90% (vs. 60% email)
- [ ] 40% of existing users link OAuth accounts

**Measurement**:

```sql
-- OAuth adoption rate
SELECT
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE raw_app_meta_data->>'provider' IN ('google', 'github')) as oauth_signups,
  COUNT(*) FILTER (WHERE raw_app_meta_data->>'provider' = 'email') as email_signups,
  ROUND(
    COUNT(*) FILTER (WHERE raw_app_meta_data->>'provider' IN ('google', 'github'))::numeric /
    COUNT(*)::numeric * 100,
    2
  ) as oauth_adoption_rate
FROM auth.users
WHERE created_at > now() - interval '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

### User Experience Metrics

**Target**:

- [ ] Time to first project: OAuth users 2x faster than email users
- [ ] Sign-up abandonment: <20% (vs. 40% email/password)
- [ ] Password reset requests: Drop by 40%

**Measurement**:

```sql
-- Time to first project (OAuth vs email)
SELECT
  u.raw_app_meta_data->>'provider' as auth_provider,
  AVG(EXTRACT(EPOCH FROM (p.created_at - u.created_at))) / 60 as avg_minutes_to_first_project
FROM auth.users u
JOIN projects p ON p.created_by = u.id
WHERE u.created_at > now() - interval '30 days'
  AND p.created_at = (
    SELECT MIN(created_at)
    FROM projects
    WHERE created_by = u.id
  )
GROUP BY auth_provider;
```

---

### Security Metrics

**Target**:

- [ ] 0 account takeover incidents
- [ ] <1% OAuth validation failures (due to unverified emails)
- [ ] <0.1% OAuth fraud attempts (logged in audit)

**Measurement**:

```sql
-- OAuth security incidents
SELECT
  event_type,
  COUNT(*) as incidents,
  COUNT(DISTINCT user_id) as unique_users
FROM security_audit_logs
WHERE event_type IN ('oauth_failed', 'account_linked', 'oauth_success')
  AND created_at > now() - interval '30 days'
GROUP BY event_type;
```

---

### Performance Metrics

**Target**:

- [ ] OAuth sign-up: <10 seconds (p95)
- [ ] OAuth sign-in: <3 seconds (p95)
- [ ] Callback handler: <500ms (p95)

**Measurement**: Vercel Analytics + Supabase logs

---

### Support Metrics

**Target**:

- [ ] Password-related support tickets: Drop by 40%
- [ ] OAuth-related support tickets: <5% of total tickets
- [ ] Average resolution time for OAuth issues: <2 hours

**Measurement**: Support ticket system (Zendesk, Intercom, etc.)

---

## Risks & Mitigations

### Risk 1: OAuth Provider Downtime

**Likelihood**: Medium
**Impact**: High (users can't sign in)

**Mitigation**:

- Always offer email/password as fallback
- Monitor provider status pages (Google, GitHub)
- Show clear error messages when provider is down
- Cache OAuth provider status, show warning if down

**Acceptance Criteria**:

- [ ] Email/password always available as backup
- [ ] Provider downtime detected and messaged to users

---

### Risk 2: Account Takeover via OAuth

**Likelihood**: Low
**Impact**: Critical

**Mitigation**:

- Email verification enforcement (Security Requirement #2)
- Audit logging for all OAuth events
- Rate limiting on OAuth attempts
- CSRF protection via state parameter
- Redirect URI whitelist

**Acceptance Criteria**:

- [ ] All security requirements implemented and tested
- [ ] Penetration testing passed
- [ ] Security review approved

---

### Risk 3: Low OAuth Adoption

**Likelihood**: Medium
**Impact**: Medium (feature doesn't provide ROI)

**Mitigation**:

- Prominent placement of OAuth buttons (above email/password)
- A/B test button copy ("Continue with Google" vs. "Sign up with Google")
- User research to understand barriers
- Consider incentives (faster onboarding, profile pictures)

**Acceptance Criteria**:

- [ ] 60% adoption target met within 3 months
- [ ] If not met: Conduct user interviews, iterate on UI

---

### Risk 4: Email Linking Confusion

**Likelihood**: Medium
**Impact**: Low (user frustration, support tickets)

**Mitigation**:

- Clear messaging when automatic linking succeeds
- Help docs explaining account linking
- Manual linking option in Settings
- Proactive emails when accounts are linked

**Acceptance Criteria**:

- [ ] <10 support tickets per month about linking
- [ ] Clear UI messaging tested with users

---

### Risk 5: Privacy Concerns

**Likelihood**: Low
**Impact**: Medium (user trust, GDPR compliance)

**Mitigation**:

- Only request minimal OAuth scopes
- Clear privacy policy explaining data usage
- User control (disconnect OAuth anytime)
- GDPR-compliant data retention

**Acceptance Criteria**:

- [ ] Privacy policy approved by legal
- [ ] GDPR compliance verified
- [ ] User control tested (disconnect works)

---

### Risk 6: Performance Degradation

**Likelihood**: Low
**Impact**: Medium (slow sign-up hurts conversion)

**Mitigation**:

- Monitor OAuth flow times with analytics
- Set performance budgets (<10s sign-up, <3s sign-in)
- Optimize callback handler (non-blocking audit logging)
- Use CDN for OAuth button icons

**Acceptance Criteria**:

- [ ] Performance targets met (p95 times)
- [ ] No regression in page load times

---

### Risk 7: Breaking Changes from Supabase

**Likelihood**: Low
**Impact**: High (OAuth stops working)

**Mitigation**:

- Pin Supabase client version (don't auto-upgrade)
- Subscribe to Supabase changelog
- Test OAuth flows in staging before production updates
- Have rollback plan ready

**Acceptance Criteria**:

- [ ] Supabase version pinned in package.json
- [ ] Changelog monitoring process established
- [ ] Rollback plan documented and tested

---

## Open Questions

1. **Should we support more OAuth providers?**
   - Microsoft (for enterprise customers)?
   - Apple Sign-In (for iOS users)?
   - Decision: Start with Google/GitHub, add others based on user demand

2. **Should we allow multiple OAuth accounts of same provider?**
   - Example: User has 2 Google accounts, wants both linked
   - Supabase: Only one identity per provider per user
   - Decision: Not supported initially, revisit if requested

3. **Should we auto-migrate existing users to OAuth?**
   - Send email: "Link your Google account for faster sign-in"
   - Decision: Passive approach (show in-app banner), don't force

4. **Should we show profile pictures from OAuth?**
   - Pro: Personalized UI, users expect it
   - Con: Privacy concern (some users prefer anonymity)
   - Decision: Yes, but allow users to upload custom avatar (override OAuth)

5. **Should we restrict OAuth to specific email domains for enterprise?**
   - Example: Only allow @acme-corp.com for Acme Corp workspace
   - Decision: Future enhancement for enterprise plan

---

## Summary

**What We're Building**: Google and GitHub OAuth authentication for faster, password-free sign-up/sign-in

**Why It Matters**: Reduces sign-up friction, improves conversion, matches competitor feature set

**How We'll Build It**: Leverage Supabase Auth's built-in OAuth support, focus on security and UX

**Timeline**: 2-3 weeks (1 backend engineer, 1 frontend engineer)

**Success Metrics**: 60% OAuth adoption, <10s sign-up time, 40% reduction in password-related support tickets

**Security**: Defense-in-depth with email verification, CSRF protection, rate limiting, audit logging

**Launch Readiness**: Comprehensive testing (unit, integration, E2E, security), rollback plan, monitoring

---

**Next Steps**:

1. Review this spec with engineering team
2. Create GitHub issues for each implementation phase
3. Set up OAuth apps in Google/GitHub consoles
4. Begin Phase 1: Setup & Configuration

**Questions or Feedback**: Contact Product Team or submit issues to project repository
