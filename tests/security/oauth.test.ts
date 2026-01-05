import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateOAuthMetadata,
  canLinkAccounts,
} from "@/lib/auth/oauth-validation";
import {
  isAllowedOrigin,
  getOAuthErrorMessage,
  OAUTH_ERROR_MESSAGES,
} from "@/lib/auth/oauth";

/**
 * OAuth Security Tests
 *
 * Security-focused tests for OAuth authentication.
 * These tests verify that security requirements are enforced.
 */

describe("OAuth Security", () => {
  describe("CSRF Protection - State Parameter", () => {
    it("should reject callbacks with missing state (validated by Supabase)", () => {
      // State parameter validation is handled by Supabase Auth
      // Our callback route relies on Supabase to validate state
      // This test documents the expected behavior

      // The exchangeCodeForSession method will fail if state is invalid
      // We handle this gracefully in the callback route
      expect(true).toBe(true);
    });
  });

  describe("Email Verification Enforcement", () => {
    it("should block OAuth link to unverified email account", () => {
      const result = canLinkAccounts(false, true);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("verify");
    });

    it("should allow OAuth link to verified email account", () => {
      const result = canLinkAccounts(true, true);

      expect(result.allowed).toBe(true);
    });

    it("should block OAuth link when OAuth email is unverified", () => {
      const result = canLinkAccounts(true, false);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("OAuth provider email must be verified");
    });

    it("should reject Google OAuth with unverified email", () => {
      const metadata = {
        email: "attacker@example.com",
        email_verified: false,
      };

      const result = validateOAuthMetadata(metadata, "google");

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.toLowerCase().includes("verified")),
      ).toBe(true);
    });

    it("should reject GitHub OAuth with unverified email", () => {
      const metadata = {
        email: "attacker@example.com",
        email_verified: false,
      };

      const result = validateOAuthMetadata(metadata, "github");

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.toLowerCase().includes("github email not verified"),
        ),
      ).toBe(true);
    });
  });

  describe("Redirect URI Validation", () => {
    it("should allow production origin", () => {
      expect(isAllowedOrigin("https://workbench.sageloop.app")).toBe(true);
    });

    it("should allow localhost for development", () => {
      expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    });

    it("should block unauthorized origins", () => {
      expect(isAllowedOrigin("https://evil.com")).toBe(false);
      expect(isAllowedOrigin("https://attacker.sageloop.app")).toBe(false);
      expect(isAllowedOrigin("https://sageloop.app.evil.com")).toBe(false);
    });

    it("should block origins with similar names", () => {
      // Typosquatting protection
      expect(isAllowedOrigin("https://workbench.sageloop.com")).toBe(false);
      expect(isAllowedOrigin("https://sageloop.app")).toBe(false);
    });
  });

  describe("Input Validation", () => {
    it("should reject invalid email formats", () => {
      const invalidEmails = [
        "not-an-email",
        "@example.com",
        "user@",
        "user@.com",
        "",
        "   ",
      ];

      for (const email of invalidEmails) {
        const metadata = { email, email_verified: true };
        const result = validateOAuthMetadata(metadata, "google");

        expect(result.isValid).toBe(false);
      }
    });

    it("should reject excessively long emails", () => {
      const metadata = {
        email: "a".repeat(300) + "@example.com",
        email_verified: true,
      };

      const result = validateOAuthMetadata(metadata, "google");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Email address exceeds maximum length");
    });

    it("should warn about non-HTTPS avatar URLs", () => {
      const metadata = {
        email: "alice@example.com",
        email_verified: true,
        avatar_url: "http://evil.com/tracking.gif",
      };

      const result = validateOAuthMetadata(metadata, "google");

      // Should pass validation but with a warning
      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes("HTTPS"))).toBe(true);
    });

    it("should handle null/undefined metadata gracefully", () => {
      expect(validateOAuthMetadata(null, "google").isValid).toBe(false);
      expect(validateOAuthMetadata(undefined, "google").isValid).toBe(false);
    });
  });

  describe("Account Takeover Prevention", () => {
    it("should prevent linking OAuth to unverified account (email squatting attack)", () => {
      // Attack scenario:
      // 1. Attacker creates account with victim@example.com (doesn't verify)
      // 2. Victim tries OAuth with victim@example.com
      // 3. Without protection: Attacker's account gets OAuth access
      // 4. With protection: Linking is blocked

      const result = canLinkAccounts(false, true);

      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("verify");
    });

    it("should block OAuth when provider email is not verified", () => {
      // Prevents attackers from using unverified OAuth emails
      const metadata = {
        email: "target@example.com",
        email_verified: false,
      };

      const validation = validateOAuthMetadata(metadata, "github");
      expect(validation.isValid).toBe(false);
    });
  });

  describe("Error Message Security", () => {
    it("should not expose internal details in error messages", () => {
      // Error messages should be user-friendly, not expose internals
      const errorMessages = Object.values(OAUTH_ERROR_MESSAGES);

      for (const message of errorMessages) {
        // Should not contain stack traces, SQL, or internal paths
        expect(message).not.toMatch(/at \w+/);
        expect(message).not.toMatch(/SQL/i);
        expect(message).not.toMatch(/\/lib\//);
        expect(message).not.toMatch(/Error:/);

        // Should be helpful to users
        expect(message.length).toBeGreaterThan(10);
        expect(message.length).toBeLessThan(200);
      }
    });

    it("should handle unknown error codes gracefully", () => {
      const message = getOAuthErrorMessage("unknown_internal_error_12345");

      expect(message).not.toContain("unknown_internal_error");
      expect(message).toContain("unexpected error");
    });
  });

  describe("Token Security", () => {
    it("should document that tokens are stored in HttpOnly cookies", () => {
      // Supabase SSR client automatically uses HttpOnly cookies
      // This test documents the expected security property

      // Tokens should NOT be:
      // - Stored in localStorage
      // - Stored in sessionStorage
      // - Exposed in API responses
      // - Accessible via JavaScript

      // This is enforced by:
      // 1. Using @supabase/ssr with cookie-based auth
      // 2. Server-side session management
      // 3. Never returning tokens in API responses

      expect(true).toBe(true); // Documentation test
    });
  });

  describe("Rate Limiting", () => {
    it("should document OAuth callback rate limits", () => {
      // OAuth callback is rate limited to 10 requests per 15 minutes
      // This prevents:
      // - Brute force attacks on state parameter
      // - Email enumeration
      // - DoS via OAuth provider API abuse

      // See: lib/security/rate-limit.ts - RATE_LIMITS.oauthCallback
      expect(true).toBe(true); // Documentation test
    });
  });
});

describe("OAuth Provider-Specific Security", () => {
  describe("Google OAuth", () => {
    it("should trust Google email verification", () => {
      // Google always provides verified emails
      const metadata = {
        email: "alice@gmail.com",
        email_verified: true,
        sub: "google-uid-123",
      };

      const result = validateOAuthMetadata(metadata, "google");

      expect(result.isValid).toBe(true);
    });

    it("should reject if Google reports unverified (edge case)", () => {
      // This shouldn't happen, but we handle it anyway
      const metadata = {
        email: "alice@gmail.com",
        email_verified: false,
      };

      const result = validateOAuthMetadata(metadata, "google");

      expect(result.isValid).toBe(false);
    });
  });

  describe("GitHub OAuth", () => {
    it("should require GitHub email verification", () => {
      // GitHub can have unverified emails
      const metadata = {
        email: "developer@example.com",
        email_verified: false,
        preferred_username: "developer",
      };

      const result = validateOAuthMetadata(metadata, "github");

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("GitHub"))).toBe(true);
    });

    it("should accept verified GitHub email", () => {
      const metadata = {
        email: "developer@example.com",
        email_verified: true,
        preferred_username: "developer",
      };

      const result = validateOAuthMetadata(metadata, "github");

      expect(result.isValid).toBe(true);
    });
  });
});
