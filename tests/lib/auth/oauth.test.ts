import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isAllowedOrigin,
  getOAuthErrorMessage,
  OAUTH_ERROR_MESSAGES,
} from "@/lib/auth/oauth";

/**
 * OAuth Helper Function Tests
 *
 * Tests for OAuth utility functions.
 */

describe("isAllowedOrigin", () => {
  it("should allow http://localhost:3000", () => {
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
  });

  it("should allow https://workbench.sageloop.app", () => {
    expect(isAllowedOrigin("https://workbench.sageloop.app")).toBe(true);
  });

  it("should reject unknown origins", () => {
    expect(isAllowedOrigin("https://unknown.com")).toBe(false);
    expect(isAllowedOrigin("https://example.com")).toBe(false);
  });

  it("should reject similar-looking origins", () => {
    // Typosquatting prevention
    expect(isAllowedOrigin("https://workbench.sageloop.com")).toBe(false);
    expect(isAllowedOrigin("https://sageloop.app")).toBe(false);
    expect(isAllowedOrigin("https://app.sageloop.app")).toBe(false);
  });

  it("should reject localhost with wrong port", () => {
    expect(isAllowedOrigin("http://localhost:3001")).toBe(false);
    expect(isAllowedOrigin("http://localhost:8080")).toBe(false);
  });

  it("should reject localhost with https", () => {
    expect(isAllowedOrigin("https://localhost:3000")).toBe(false);
  });

  it("should be case-sensitive for origins", () => {
    // URLs are case-sensitive for security
    expect(isAllowedOrigin("HTTP://LOCALHOST:3000")).toBe(false);
  });
});

describe("getOAuthErrorMessage", () => {
  it("should return message for known error codes", () => {
    expect(getOAuthErrorMessage("access_denied")).toBe(
      OAUTH_ERROR_MESSAGES.access_denied,
    );
    expect(getOAuthErrorMessage("invalid_request")).toBe(
      OAUTH_ERROR_MESSAGES.invalid_request,
    );
    expect(getOAuthErrorMessage("server_error")).toBe(
      OAUTH_ERROR_MESSAGES.server_error,
    );
  });

  it("should return default message for unknown codes", () => {
    const message = getOAuthErrorMessage("unknown_error_xyz");

    expect(message).toContain("unexpected error");
    expect(message).not.toContain("unknown_error_xyz");
  });

  it("should have user-friendly messages", () => {
    // All error messages should be helpful to users
    Object.entries(OAUTH_ERROR_MESSAGES).forEach(([code, message]) => {
      expect(message.length).toBeGreaterThan(10);
      expect(message).not.toContain(code); // Should not expose internal code
    });
  });
});

describe("OAUTH_ERROR_MESSAGES", () => {
  it("should have all expected error codes", () => {
    const expectedCodes = [
      "access_denied",
      "invalid_request",
      "server_error",
      "temporarily_unavailable",
      "email_not_verified",
      "github_email_not_verified",
      "invalid_code",
      "session_expired",
      "provider_error",
      "account_exists",
      "invalid_provider_data",
    ];

    for (const code of expectedCodes) {
      expect(OAUTH_ERROR_MESSAGES[code]).toBeDefined();
      expect(typeof OAUTH_ERROR_MESSAGES[code]).toBe("string");
    }
  });

  it("should have actionable messages", () => {
    // Messages should tell users what to do
    const actionablePatterns = [
      "try again",
      "verify",
      "sign in",
      "later",
      "grant",
    ];

    Object.values(OAUTH_ERROR_MESSAGES).forEach((message) => {
      const hasAction = actionablePatterns.some((pattern) =>
        message.toLowerCase().includes(pattern),
      );
      expect(hasAction).toBe(true);
    });
  });
});
