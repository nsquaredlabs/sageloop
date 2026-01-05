/**
 * OAuth Provider Metadata Validation
 *
 * Validates OAuth provider responses before trusting data.
 * This provides defense-in-depth against malicious OAuth providers
 * or man-in-the-middle attacks.
 *
 * Security Requirements:
 * - Email must be present and verified
 * - Email format must be valid
 * - Avatar URLs must use HTTPS
 */

import type { OAuthProvider } from "./oauth";

/**
 * Validated OAuth user metadata
 */
export interface OAuthUserMetadata {
  email: string;
  email_verified: boolean;
  full_name?: string;
  avatar_url?: string;
  provider_id?: string;
}

/**
 * Validation result for OAuth metadata
 */
export interface OAuthValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Email validation regex
 * Basic email format validation (RFC 5322 simplified)
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * HTTPS URL validation regex
 */
const HTTPS_URL_REGEX = /^https:\/\/.+/;

/**
 * Validates OAuth provider metadata
 *
 * @param metadata - Raw metadata from OAuth provider
 * @param provider - The OAuth provider ('google' or 'github')
 * @returns Validation result with errors and warnings
 */
export function validateOAuthMetadata(
  metadata: Record<string, unknown> | null | undefined,
  provider: OAuthProvider,
): OAuthValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!metadata) {
    errors.push("No metadata received from OAuth provider");
    return { isValid: false, errors, warnings };
  }

  // Email is required
  const email = metadata.email;
  if (!email || typeof email !== "string") {
    errors.push("Email is required from OAuth provider");
  } else {
    // Validate email format
    if (!EMAIL_REGEX.test(email)) {
      errors.push("Invalid email format received from OAuth provider");
    }

    // Check email length (security measure)
    if (email.length > 254) {
      errors.push("Email address exceeds maximum length");
    }
  }

  // Email must be verified
  const emailVerified = metadata.email_verified;
  if (emailVerified !== true) {
    if (provider === "google") {
      // Google always provides verified emails
      errors.push("Google email not verified - this should not happen");
    } else if (provider === "github") {
      // GitHub users might not have verified their email
      errors.push(
        "GitHub email not verified. Please verify your email in GitHub settings.",
      );
    } else {
      errors.push("Email must be verified by the OAuth provider");
    }
  }

  // Validate avatar URL (if provided)
  const avatarUrl = metadata.avatar_url;
  if (avatarUrl !== undefined && avatarUrl !== null) {
    if (typeof avatarUrl !== "string") {
      warnings.push("Invalid avatar URL format - ignoring");
    } else if (avatarUrl.length > 0 && !HTTPS_URL_REGEX.test(avatarUrl)) {
      // Non-HTTPS avatar URLs are a security risk (can be used for tracking)
      warnings.push("Avatar URL must use HTTPS - ignoring insecure URL");
    }
  }

  // Validate full_name (if provided)
  const fullName = metadata.full_name;
  if (fullName !== undefined && fullName !== null) {
    if (typeof fullName !== "string") {
      warnings.push("Invalid name format - ignoring");
    } else if (fullName.length > 200) {
      warnings.push("Name too long - truncating");
    }
  }

  // Provider-specific validations
  if (provider === "github") {
    // GitHub can provide multiple emails - we should have the primary one
    const preferredUsername = metadata.preferred_username || metadata.user_name;
    if (preferredUsername && typeof preferredUsername === "string") {
      // GitHub username validation (alphanumeric and hyphens)
      if (!/^[a-zA-Z0-9-]+$/.test(preferredUsername)) {
        warnings.push("Invalid GitHub username format");
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitizes OAuth metadata for safe storage
 *
 * @param metadata - Raw metadata from OAuth provider
 * @returns Sanitized metadata safe for storage
 */
export function sanitizeOAuthMetadata(
  metadata: Record<string, unknown> | null | undefined,
): OAuthUserMetadata | null {
  if (!metadata) {
    return null;
  }

  const email = metadata.email;
  if (!email || typeof email !== "string") {
    return null;
  }

  // Build sanitized metadata
  const sanitized: OAuthUserMetadata = {
    email: email.toLowerCase().trim().slice(0, 254),
    email_verified: metadata.email_verified === true,
  };

  // Add optional fields if valid
  const fullName = metadata.full_name;
  if (fullName && typeof fullName === "string") {
    sanitized.full_name = fullName.trim().slice(0, 200);
  }

  const avatarUrl = metadata.avatar_url;
  if (
    avatarUrl &&
    typeof avatarUrl === "string" &&
    HTTPS_URL_REGEX.test(avatarUrl)
  ) {
    sanitized.avatar_url = avatarUrl.slice(0, 500);
  }

  const providerId = metadata.sub || metadata.provider_id;
  if (providerId && typeof providerId === "string") {
    sanitized.provider_id = providerId.slice(0, 100);
  }

  return sanitized;
}

/**
 * Checks if an existing email/password account can be linked with OAuth
 *
 * Security Requirement: Email must be verified before linking
 * to prevent account takeover attacks.
 *
 * @param existingEmailVerified - Whether the existing account's email is verified
 * @param oauthEmailVerified - Whether the OAuth email is verified
 * @returns Whether linking is allowed
 */
export function canLinkAccounts(
  existingEmailVerified: boolean,
  oauthEmailVerified: boolean,
): { allowed: boolean; reason?: string } {
  if (!existingEmailVerified) {
    return {
      allowed: false,
      reason:
        "Please verify your email address before linking an OAuth account.",
    };
  }

  if (!oauthEmailVerified) {
    return {
      allowed: false,
      reason: "The OAuth provider email must be verified before linking.",
    };
  }

  return { allowed: true };
}

/**
 * Validates OAuth callback parameters
 *
 * @param params - URL search params from callback
 * @returns Validation result with any error details
 */
export function validateCallbackParams(params: URLSearchParams): {
  isValid: boolean;
  code?: string;
  error?: string;
  errorDescription?: string;
} {
  // Check for OAuth error
  const error = params.get("error");
  if (error) {
    return {
      isValid: false,
      error,
      errorDescription: params.get("error_description") || undefined,
    };
  }

  // Check for authorization code
  const code = params.get("code");
  if (!code) {
    return {
      isValid: false,
      error: "invalid_request",
      errorDescription: "No authorization code received",
    };
  }

  // Validate code format (basic sanity check)
  if (code.length > 1000) {
    return {
      isValid: false,
      error: "invalid_request",
      errorDescription: "Authorization code too long",
    };
  }

  return {
    isValid: true,
    code,
  };
}
