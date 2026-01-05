import { describe, it, expect } from "vitest";
import {
  validateOAuthMetadata,
  sanitizeOAuthMetadata,
  canLinkAccounts,
  validateCallbackParams,
} from "@/lib/auth/oauth-validation";

/**
 * OAuth Validation Unit Tests
 *
 * Tests for OAuth metadata validation, sanitization, and account linking.
 * These tests cover security requirements for OAuth authentication.
 */

describe("validateOAuthMetadata", () => {
  describe("Google provider", () => {
    it("should pass valid Google metadata", () => {
      const metadata = {
        email: "alice@example.com",
        email_verified: true,
        full_name: "Alice Smith",
        avatar_url: "https://lh3.googleusercontent.com/a/123",
      };

      const result = validateOAuthMetadata(metadata, "google");

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should pass metadata without optional fields", () => {
      const metadata = {
        email: "alice@example.com",
        email_verified: true,
      };

      const result = validateOAuthMetadata(metadata, "google");

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject missing email", () => {
      const metadata = {
        email_verified: true,
      };

      const result = validateOAuthMetadata(metadata, "google");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Email is required from OAuth provider");
    });

    it("should reject null email", () => {
      const metadata = {
        email: null,
        email_verified: true,
      };

      const result = validateOAuthMetadata(metadata, "google");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Email is required from OAuth provider");
    });

    it("should reject invalid email format", () => {
      const metadata = {
        email: "not-an-email",
        email_verified: true,
      };

      const result = validateOAuthMetadata(metadata, "google");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Invalid email format received from OAuth provider",
      );
    });

    it("should reject unverified email for Google", () => {
      const metadata = {
        email: "alice@example.com",
        email_verified: false,
      };

      const result = validateOAuthMetadata(metadata, "google");

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("not verified"))).toBe(true);
    });

    it("should reject email exceeding max length", () => {
      const metadata = {
        email: "a".repeat(250) + "@example.com",
        email_verified: true,
      };

      const result = validateOAuthMetadata(metadata, "google");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Email address exceeds maximum length");
    });

    it("should warn about HTTP avatar URL", () => {
      const metadata = {
        email: "alice@example.com",
        email_verified: true,
        avatar_url: "http://example.com/avatar.jpg",
      };

      const result = validateOAuthMetadata(metadata, "google");

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes("HTTPS"))).toBe(true);
    });
  });

  describe("GitHub provider", () => {
    it("should pass valid GitHub metadata", () => {
      const metadata = {
        email: "alice@example.com",
        email_verified: true,
        full_name: "Alice Smith",
        avatar_url: "https://avatars.githubusercontent.com/u/123",
        preferred_username: "alice",
      };

      const result = validateOAuthMetadata(metadata, "github");

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject unverified GitHub email", () => {
      const metadata = {
        email: "alice@example.com",
        email_verified: false,
      };

      const result = validateOAuthMetadata(metadata, "github");

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("GitHub email not verified")),
      ).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle null metadata", () => {
      const result = validateOAuthMetadata(null, "google");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "No metadata received from OAuth provider",
      );
    });

    it("should handle undefined metadata", () => {
      const result = validateOAuthMetadata(undefined, "google");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "No metadata received from OAuth provider",
      );
    });

    it("should handle empty object", () => {
      const result = validateOAuthMetadata({}, "google");

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should warn about very long name", () => {
      const metadata = {
        email: "alice@example.com",
        email_verified: true,
        full_name: "a".repeat(250),
      };

      const result = validateOAuthMetadata(metadata, "google");

      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes("truncating"))).toBe(true);
    });
  });
});

describe("sanitizeOAuthMetadata", () => {
  it("should sanitize valid metadata", () => {
    const metadata = {
      email: "  ALICE@EXAMPLE.COM  ",
      email_verified: true,
      full_name: "Alice Smith",
      avatar_url: "https://example.com/avatar.jpg",
      sub: "provider-id-123",
    };

    const result = sanitizeOAuthMetadata(metadata);

    expect(result).not.toBeNull();
    expect(result!.email).toBe("alice@example.com"); // lowercase and trimmed
    expect(result!.email_verified).toBe(true);
    expect(result!.full_name).toBe("Alice Smith");
    expect(result!.avatar_url).toBe("https://example.com/avatar.jpg");
    expect(result!.provider_id).toBe("provider-id-123");
  });

  it("should return null for null metadata", () => {
    const result = sanitizeOAuthMetadata(null);
    expect(result).toBeNull();
  });

  it("should return null for missing email", () => {
    const metadata = {
      email_verified: true,
    };

    const result = sanitizeOAuthMetadata(metadata);
    expect(result).toBeNull();
  });

  it("should exclude non-HTTPS avatar URLs", () => {
    const metadata = {
      email: "alice@example.com",
      email_verified: true,
      avatar_url: "http://example.com/avatar.jpg",
    };

    const result = sanitizeOAuthMetadata(metadata);

    expect(result).not.toBeNull();
    expect(result!.avatar_url).toBeUndefined();
  });

  it("should truncate long email", () => {
    const metadata = {
      email: "a".repeat(300) + "@example.com",
      email_verified: true,
    };

    const result = sanitizeOAuthMetadata(metadata);

    expect(result).not.toBeNull();
    expect(result!.email.length).toBeLessThanOrEqual(254);
  });

  it("should truncate long name", () => {
    const metadata = {
      email: "alice@example.com",
      email_verified: true,
      full_name: "a".repeat(250),
    };

    const result = sanitizeOAuthMetadata(metadata);

    expect(result).not.toBeNull();
    expect(result!.full_name!.length).toBeLessThanOrEqual(200);
  });

  it("should handle email_verified as false", () => {
    const metadata = {
      email: "alice@example.com",
      email_verified: false,
    };

    const result = sanitizeOAuthMetadata(metadata);

    expect(result).not.toBeNull();
    expect(result!.email_verified).toBe(false);
  });

  it("should handle missing email_verified", () => {
    const metadata = {
      email: "alice@example.com",
    };

    const result = sanitizeOAuthMetadata(metadata);

    expect(result).not.toBeNull();
    expect(result!.email_verified).toBe(false);
  });
});

describe("canLinkAccounts", () => {
  it("should allow linking when both emails are verified", () => {
    const result = canLinkAccounts(true, true);

    expect(result.allowed).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("should block linking when existing email is not verified", () => {
    const result = canLinkAccounts(false, true);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("verify your email");
  });

  it("should block linking when OAuth email is not verified", () => {
    const result = canLinkAccounts(true, false);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("OAuth provider email must be verified");
  });

  it("should block linking when both emails are not verified", () => {
    const result = canLinkAccounts(false, false);

    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
  });
});

describe("validateCallbackParams", () => {
  it("should validate successful callback with code", () => {
    const params = new URLSearchParams("code=abc123");

    const result = validateCallbackParams(params);

    expect(result.isValid).toBe(true);
    expect(result.code).toBe("abc123");
    expect(result.error).toBeUndefined();
  });

  it("should handle OAuth error response", () => {
    const params = new URLSearchParams(
      "error=access_denied&error_description=User%20denied%20access",
    );

    const result = validateCallbackParams(params);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe("access_denied");
    expect(result.errorDescription).toBe("User denied access");
  });

  it("should handle missing code", () => {
    const params = new URLSearchParams("");

    const result = validateCallbackParams(params);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe("invalid_request");
    expect(result.errorDescription).toBe("No authorization code received");
  });

  it("should reject code that is too long", () => {
    const params = new URLSearchParams(`code=${"a".repeat(1001)}`);

    const result = validateCallbackParams(params);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe("invalid_request");
    expect(result.errorDescription).toBe("Authorization code too long");
  });

  it("should handle error without description", () => {
    const params = new URLSearchParams("error=server_error");

    const result = validateCallbackParams(params);

    expect(result.isValid).toBe(false);
    expect(result.error).toBe("server_error");
    expect(result.errorDescription).toBeUndefined();
  });
});
