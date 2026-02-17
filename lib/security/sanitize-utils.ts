/**
 * Pure sanitization utilities that do NOT depend on DOMPurify/jsdom.
 *
 * Import from this module in server-only contexts (API routes, serverless functions)
 * to avoid pulling in jsdom which has ESM compatibility issues in Next.js.
 *
 * For HTML sanitization (DOMPurify), use '@/lib/security/sanitize' instead.
 */

/**
 * Sanitize filename for safe file operations
 *
 * Prevents:
 * - CWE-22: Path Traversal (../, ..\)
 * - Invalid filename characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "untitled";

  return (
    filename
      .replace(/\.\./g, "")
      .replace(/[/\\]/g, "-")
      .replace(/[<>:"|?*\x00-\x1f\s!]/g, "-")
      .replace(/^[.\s-]+|[.\s-]+$/g, "")
      .replace(/-+/g, "-")
      .slice(0, 255) || "untitled"
  );
}

/**
 * Prevent CRLF injection in headers
 */
export function sanitizeCRLF(input: string): string {
  if (!input) return "";
  return input.replace(/\r/g, "").replace(/\n/g, "");
}

/**
 * Sanitize URL to prevent XSS via javascript: protocol
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
  if (dangerousProtocols.test(trimmed)) {
    return "";
  }
  return trimmed;
}

/**
 * Escape special regex characters in user input
 */
export function escapeRegex(input: string): string {
  if (!input) return "";
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Sanitize for CSV export - prevents formula injection
 */
export function sanitizeCsvCell(cell: string): string {
  if (!cell) return "";
  const str = String(cell);
  const formulaStarts = ["=", "+", "-", "@", "\t", "\r"];
  if (formulaStarts.some((char) => str.startsWith(char))) {
    return `'${str}`;
  }
  return str;
}

/**
 * Truncate string to max length with ellipsis
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
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/**
 * Sanitize JSON for safe output
 */
export function sanitizeJson(obj: unknown): string {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === "string") {
      return value
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026");
    }
    return value;
  });
}
