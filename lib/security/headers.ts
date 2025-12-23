/**
 * Security Headers Configuration
 *
 * Implements defense-in-depth security headers for:
 * - CWE-79: XSS Prevention (Content Security Policy)
 * - CWE-1021: Clickjacking (X-Frame-Options)
 * - CWE-16: Configuration (X-Content-Type-Options)
 * - CWE-693: Protection Mechanisms (HSTS)
 *
 * Based on OWASP Secure Headers Project
 */

/**
 * Content Security Policy (CSP)
 *
 * Restricts resource loading to prevent XSS attacks
 */
export const contentSecurityPolicy = {
  // Only allow scripts from same origin and specific trusted CDNs
  "default-src": ["'self'"],

  // Scripts: Allow self, inline scripts (for Next.js), and Vercel analytics
  "script-src": [
    "'self'",
    "'unsafe-inline'", // Required for Next.js inline scripts
    "'unsafe-eval'", // Required for Next.js development
    "https://vercel.live",
  ],

  // Styles: Allow self and inline styles (for Tailwind)
  "style-src": ["'self'", "'unsafe-inline'"],

  // Images: Allow self, data URLs (for inline images), and common CDNs
  "img-src": ["'self'", "data:", "https:"],

  // Fonts: Allow self and data URLs
  "font-src": ["'self'", "data:"],

  // Connections: API endpoints
  "connect-src": [
    "'self'",
    "https://*.supabase.co", // Supabase API
    "https://api.openai.com", // OpenAI API
    "https://api.anthropic.com", // Anthropic API
    "https://vercel.live", // Vercel Analytics
  ],

  // Frames: Only allow same origin (prevents clickjacking)
  "frame-src": ["'self'"],

  // Objects: Disallow plugins
  "object-src": ["'none'"],

  // Base URI: Restrict base tag
  "base-uri": ["'self'"],

  // Forms: Only allow same origin form submissions
  "form-action": ["'self'"],

  // Frame ancestors: Prevent embedding (clickjacking protection)
  "frame-ancestors": ["'none'"],

  // Upgrade insecure requests
  "upgrade-insecure-requests": [],
};

/**
 * Convert CSP object to header string
 */
export function buildCSPHeader(csp: typeof contentSecurityPolicy): string {
  return Object.entries(csp)
    .map(([key, values]) => {
      if (values.length === 0) return key;
      return `${key} ${values.join(" ")}`;
    })
    .join("; ");
}

/**
 * Security Headers for Next.js
 *
 * Applied to all responses via next.config.ts
 */
export const securityHeaders = [
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: buildCSPHeader(contentSecurityPolicy),
  },

  // Prevent clickjacking (redundant with CSP frame-ancestors, but defense-in-depth)
  {
    key: "X-Frame-Options",
    value: "DENY",
  },

  // Prevent MIME sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },

  // Referrer Policy (don't leak URLs to external sites)
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },

  // Permissions Policy (formerly Feature-Policy)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },

  // Strict-Transport-Security (HSTS) - enforce HTTPS
  // Only apply in production (Vercel handles this automatically)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },

  // X-DNS-Prefetch-Control
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

/**
 * Development CSP (more permissive for hot reload)
 */
export const devContentSecurityPolicy = {
  ...contentSecurityPolicy,
  "script-src": [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'", // Required for development
    "https://vercel.live",
  ],
  "connect-src": [
    ...contentSecurityPolicy["connect-src"],
    "http://127.0.0.1:54321", // Local Supabase
    "http://localhost:54321", // Local Supabase (localhost variant)
    "ws:", // WebSocket for hot reload
    "wss:", // Secure WebSocket
  ],
};

/**
 * Get security headers based on environment
 */
export function getSecurityHeaders(isDevelopment = false) {
  const csp = isDevelopment ? devContentSecurityPolicy : contentSecurityPolicy;

  return securityHeaders.map((header) => {
    if (header.key === "Content-Security-Policy") {
      return {
        ...header,
        value: buildCSPHeader(csp),
      };
    }
    return header;
  });
}
