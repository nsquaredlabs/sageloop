/**
 * Security Headers Tests
 *
 * Tests for:
 * - Content Security Policy (CSP)
 * - X-Frame-Options (Clickjacking prevention)
 * - X-Content-Type-Options (MIME sniffing prevention)
 * - Strict-Transport-Security (HSTS)
 *
 * Based on OWASP Secure Headers Project
 */

import { describe, it, expect } from "vitest";
import {
  buildCSPHeader,
  contentSecurityPolicy,
  devContentSecurityPolicy,
  getSecurityHeaders,
} from "@/lib/security/headers";

describe("Content Security Policy", () => {
  describe("buildCSPHeader", () => {
    it("should build valid CSP header string", () => {
      const csp = buildCSPHeader(contentSecurityPolicy);

      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("frame-ancestors");
      expect(csp).toContain("upgrade-insecure-requests");
    });

    it("should include script-src with inline allowed", () => {
      const csp = buildCSPHeader(contentSecurityPolicy);

      expect(csp).toContain("script-src");
      expect(csp).toContain("'unsafe-inline'"); // Required for Next.js
    });

    it("should restrict frame-ancestors to prevent clickjacking", () => {
      const csp = buildCSPHeader(contentSecurityPolicy);

      expect(csp).toContain("frame-ancestors 'none'");
    });

    it("should disallow object-src (plugins)", () => {
      const csp = buildCSPHeader(contentSecurityPolicy);

      expect(csp).toContain("object-src 'none'");
    });

    it("should allow connections to AI API endpoints", () => {
      const csp = buildCSPHeader(contentSecurityPolicy);

      expect(csp).toContain("connect-src");
      expect(csp).toContain("https://api.openai.com");
      expect(csp).toContain("https://api.anthropic.com");
    });
  });

  describe("Development CSP", () => {
    it("should allow unsafe-eval for development", () => {
      const csp = buildCSPHeader(devContentSecurityPolicy);

      expect(csp).toContain("'unsafe-eval'");
    });

    it("should allow WebSocket connections for hot reload", () => {
      const csp = buildCSPHeader(devContentSecurityPolicy);

      expect(csp).toContain("ws:");
      expect(csp).toContain("wss:");
    });
  });
});

describe("Security Headers", () => {
  describe("getSecurityHeaders", () => {
    it("should include all required security headers", () => {
      const headers = getSecurityHeaders(false);

      const headerKeys = headers.map((h) => h.key);

      expect(headerKeys).toContain("Content-Security-Policy");
      expect(headerKeys).toContain("X-Frame-Options");
      expect(headerKeys).toContain("X-Content-Type-Options");
      expect(headerKeys).toContain("Referrer-Policy");
      expect(headerKeys).toContain("Permissions-Policy");
      expect(headerKeys).toContain("Strict-Transport-Security");
    });

    it("should set X-Frame-Options to DENY", () => {
      const headers = getSecurityHeaders(false);
      const xFrameOptions = headers.find((h) => h.key === "X-Frame-Options");

      expect(xFrameOptions?.value).toBe("DENY");
    });

    it("should set X-Content-Type-Options to nosniff", () => {
      const headers = getSecurityHeaders(false);
      const xContentType = headers.find(
        (h) => h.key === "X-Content-Type-Options",
      );

      expect(xContentType?.value).toBe("nosniff");
    });

    it("should set Referrer-Policy to strict-origin-when-cross-origin", () => {
      const headers = getSecurityHeaders(false);
      const referrerPolicy = headers.find((h) => h.key === "Referrer-Policy");

      expect(referrerPolicy?.value).toBe("strict-origin-when-cross-origin");
    });

    it("should include HSTS with max-age", () => {
      const headers = getSecurityHeaders(false);
      const hsts = headers.find((h) => h.key === "Strict-Transport-Security");

      expect(hsts?.value).toContain("max-age=31536000");
      expect(hsts?.value).toContain("includeSubDomains");
    });

    it("should disable dangerous permissions", () => {
      const headers = getSecurityHeaders(false);
      const permissions = headers.find((h) => h.key === "Permissions-Policy");

      expect(permissions?.value).toContain("camera=()");
      expect(permissions?.value).toContain("microphone=()");
      expect(permissions?.value).toContain("geolocation=()");
    });

    it("should use production CSP in production mode", () => {
      const headers = getSecurityHeaders(false);
      const csp = headers.find((h) => h.key === "Content-Security-Policy");

      expect(csp?.value).not.toContain("ws:");
    });

    it("should use development CSP in development mode", () => {
      const headers = getSecurityHeaders(true);
      const csp = headers.find((h) => h.key === "Content-Security-Policy");

      expect(csp?.value).toContain("'unsafe-eval'");
      expect(csp?.value).toContain("ws:");
    });
  });
});

describe("CSP Directive Coverage", () => {
  it("should have default-src as fallback", () => {
    expect(contentSecurityPolicy["default-src"]).toEqual(["'self'"]);
  });

  it("should restrict form actions to same origin", () => {
    expect(contentSecurityPolicy["form-action"]).toEqual(["'self'"]);
  });

  it("should restrict base-uri to prevent base tag injection", () => {
    expect(contentSecurityPolicy["base-uri"]).toEqual(["'self'"]);
  });

  it("should include upgrade-insecure-requests", () => {
    expect(contentSecurityPolicy["upgrade-insecure-requests"]).toEqual([]);
  });

  it("should allow data: URIs for images (common use case)", () => {
    expect(contentSecurityPolicy["img-src"]).toContain("data:");
  });

  it("should allow fonts from self and data URIs", () => {
    expect(contentSecurityPolicy["font-src"]).toContain("'self'");
    expect(contentSecurityPolicy["font-src"]).toContain("data:");
  });
});

describe("Header Security Best Practices", () => {
  it("should provide defense-in-depth with X-Frame-Options + CSP", () => {
    const headers = getSecurityHeaders(false);

    // Both should prevent framing
    const xFrameOptions = headers.find((h) => h.key === "X-Frame-Options");
    const csp = headers.find((h) => h.key === "Content-Security-Policy");

    expect(xFrameOptions?.value).toBe("DENY");
    expect(csp?.value).toContain("frame-ancestors 'none'");
  });

  it("should not leak URLs to external sites", () => {
    const headers = getSecurityHeaders(false);
    const referrerPolicy = headers.find((h) => h.key === "Referrer-Policy");

    // strict-origin-when-cross-origin is recommended
    expect(referrerPolicy?.value).toBe("strict-origin-when-cross-origin");
  });

  it("should prevent MIME confusion attacks", () => {
    const headers = getSecurityHeaders(false);
    const xContentType = headers.find(
      (h) => h.key === "X-Content-Type-Options",
    );

    expect(xContentType?.value).toBe("nosniff");
  });
});
