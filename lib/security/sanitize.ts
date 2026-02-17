/**
 * Input Sanitization & Output Encoding Utilities
 *
 * Prevents:
 * - CWE-79: Cross-Site Scripting (XSS)
 * - CWE-22: Path Traversal
 * - CWE-93: CRLF Injection
 *
 * Based on OWASP recommendations and SUSVIBES research findings
 */

import DOMPurify from "isomorphic-dompurify";

// Re-export pure utilities that don't depend on DOMPurify/jsdom.
// Server-only code (API routes) should import directly from
// '@/lib/security/sanitize-utils' to avoid pulling in jsdom.
import {
  sanitizeFilename,
  sanitizeCRLF,
  sanitizeUrl,
  escapeRegex,
  sanitizeCsvCell,
  truncate,
  sanitizeEmail,
  sanitizeJson,
} from "./sanitize-utils";

export {
  sanitizeFilename,
  sanitizeCRLF,
  sanitizeUrl,
  escapeRegex,
  sanitizeCsvCell,
  truncate,
  sanitizeEmail,
  sanitizeJson,
};

/**
 * Sanitize HTML to prevent XSS attacks
 *
 * Use this for user-generated content that may contain HTML
 * Examples: feedback text, scenario descriptions
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    // Allow safe HTML tags for rich text
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "a",
      "p",
      "br",
      "ul",
      "ol",
      "li",
      "code",
      "pre",
    ],

    // Allow safe attributes
    ALLOWED_ATTR: ["href", "title", "target"],

    // Don't allow data URIs in links
    ALLOW_DATA_ATTR: false,

    // Keep content safe for HTML contexts
    SAFE_FOR_TEMPLATES: true,
  });
}

/**
 * Strip all HTML tags (for plain text contexts)
 *
 * Use this when you need plain text only
 * Examples: export filenames, email subjects
 */
export function stripHtml(html: string): string {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [], // No tags allowed
    KEEP_CONTENT: true, // Keep the text content
  });
}

/**
 * Sanitization presets for common use cases
 */
export const sanitize = {
  // User-generated content (may contain HTML)
  userContent: (input: string) => sanitizeHtml(input),

  // Plain text (strip all HTML)
  plainText: (input: string) => stripHtml(input),

  // Filenames for export
  filename: (input: string) => sanitizeFilename(input),

  // HTTP headers
  header: (input: string) => sanitizeCRLF(input),

  // URLs
  url: (input: string) => sanitizeUrl(input),

  // CSV cells
  csv: (input: string) => sanitizeCsvCell(input),

  // Email addresses
  email: (input: string) => sanitizeEmail(input),

  // Truncate long strings
  truncate: (input: string, maxLength: number) => truncate(input, maxLength),
};
