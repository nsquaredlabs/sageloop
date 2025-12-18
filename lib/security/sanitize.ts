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
 * Sanitize filename for safe file operations
 *
 * Prevents:
 * - CWE-22: Path Traversal (../, ..\)
 * - Invalid filename characters
 *
 * Examples:
 * - "../../../etc/passwd" → "etc-passwd"
 * - "my<script>file.txt" → "my-script-file.txt"
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "untitled";

  return (
    filename
      // Remove path traversal attempts
      .replace(/\.\./g, "")
      // Remove path separators
      .replace(/[/\\]/g, "-")
      // Remove dangerous characters (including spaces and exclamation marks)
      .replace(/[<>:"|?*\x00-\x1f\s!]/g, "-")
      // Remove leading/trailing dots and dashes
      .replace(/^[.\s-]+|[.\s-]+$/g, "")
      // Collapse multiple dashes
      .replace(/-+/g, "-")
      // Limit length
      .slice(0, 255) || "untitled"
  );
}

/**
 * Prevent CRLF injection in headers
 *
 * Prevents:
 * - CWE-93: CRLF Injection
 *
 * Use this for any user input that goes into HTTP headers
 * Examples: custom header values, redirect URLs
 */
export function sanitizeCRLF(input: string): string {
  if (!input) return "";

  return input
    .replace(/\r/g, "") // Remove carriage returns
    .replace(/\n/g, ""); // Remove line feeds
}

/**
 * Sanitize URL to prevent XSS via javascript: protocol
 *
 * Use this for user-provided URLs
 * Examples: link href attributes
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";

  // Strip whitespace
  const trimmed = url.trim();

  // Dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i;

  if (dangerousProtocols.test(trimmed)) {
    return ""; // Return empty string for dangerous URLs
  }

  return trimmed;
}

/**
 * Escape special regex characters in user input
 *
 * Use this when constructing regex from user input
 * Prevents: ReDoS (Regular Expression Denial of Service)
 */
export function escapeRegex(input: string): string {
  if (!input) return "";

  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sanitize for CSV export
 *
 * Prevents formula injection in Excel/Google Sheets
 * Examples: =cmd|'/c calc'!A1
 */
export function sanitizeCsvCell(cell: string): string {
  if (!cell) return "";

  // Convert to string
  const str = String(cell);

  // Characters that start formulas
  const formulaStarts = ["=", "+", "-", "@", "\t", "\r"];

  // If starts with formula character, prefix with single quote
  if (formulaStarts.some((char) => str.startsWith(char))) {
    return `'${str}`;
  }

  return str;
}

/**
 * Truncate string to max length with ellipsis
 *
 * Prevents resource exhaustion from excessive string storage
 */
export function truncate(str: string, maxLength: number): string {
  if (!str) return "";
  if (str.length <= maxLength) return str;

  return str.slice(0, maxLength - 3) + "...";
}

/**
 * Validate and sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null;

  const trimmed = email.trim().toLowerCase();

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(trimmed)) {
    return null;
  }

  return trimmed;
}

/**
 * Sanitize JSON for safe output
 *
 * Prevents XSS in JSON contexts by escaping dangerous characters
 */
export function sanitizeJson(obj: unknown): string {
  // Use JSON.stringify with safe replacer
  return JSON.stringify(obj, (key, value) => {
    // Convert potentially dangerous strings
    if (typeof value === "string") {
      return value
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026");
    }
    return value;
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
