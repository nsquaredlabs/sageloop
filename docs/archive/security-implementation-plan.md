# Security Implementation Plan for Sageloop

**Date**: December 17, 2025
**Status**: Planning
**Total Estimated Effort**: 28-40 hours across 5 sprints (~3-4 weeks)
**Based on**: "Is Vibe Coding Safe?" Research (SUSVIBES Benchmark)

## Executive Summary

This plan implements a comprehensive, multi-layered security approach for Sageloop based on research findings that **80%+ of functionally correct AI-generated code contains security vulnerabilities**.

### Key Research Findings

The SUSVIBES benchmark study found:

- Even when AI agents (Claude 4, GPT-4) produce functionally correct code, 80%+ have security vulnerabilities
- Simple prompting strategies ("write secure code", CWE hints) **don't work** - they reduce functionality by 6% while barely improving security
- Different models have different security blind spots across 77 CWE types
- Common vulnerabilities: CRLF injection, XSS, timing attacks, session handling, path traversal, SQL injection

### Our Approach: Defense-in-Depth

Instead of relying on AI to write secure code, we implement multiple security layers:

1. **Automated Detection** - Static analysis catches vulnerabilities during development
2. **Runtime Protection** - Security headers and sanitization prevent exploitation
3. **Process Integration** - Security checklists prevent vulnerable code from merging
4. **Continuous Testing** - Security test suite catches regressions
5. **Monitoring & Response** - Detect and respond to security incidents

### Key Deliverables

- ❌ Security testing infrastructure (SAST, dependency scanning)
- ❌ Runtime security headers (CSP, X-Frame-Options, etc.)
- ❌ Input validation and sanitization utilities
- ❌ Rate limiting for critical endpoints
- ❌ Enhanced secrets management
- ❌ Security code review checklist
- ❌ Updated CLAUDE.md with security patterns
- ❌ Incident response playbook

---

## Background

### Current Security Posture

**Strengths**:

- Row Level Security (RLS) policies on all tables
- Zod validation for API inputs
- Environment variable validation (`lib/env.ts`)
- Encrypted API key storage (pgcrypto)
- Type-safe API client
- Existing test infrastructure (Vitest, Playwright)

**Gaps Identified**:

- No automated security scanning (SAST/DAST)
- No runtime security headers (CSP, X-Frame-Options)
- No rate limiting beyond quota system
- Limited input sanitization testing
- No security-focused code review checklist
- Hardcoded encryption key in SQL (dev-only, but risky)

### Vulnerability Surface Areas

From SUSVIBES CWE analysis, our highest-risk areas:

1. **API Routes** (15+ routes): User input handling, authentication, file generation
2. **User Input Flows**: Scenarios, prompts, ratings, API keys
3. **AI Integration**: OpenAI/Anthropic calls with user-controlled prompts
4. **Session Management**: Supabase auth with cookie-based sessions
5. **Export/Download**: Markdown/JSON generation with user content

---

## Technical Approach

### Architecture Decisions

**Multi-layered Security Model**:

```
┌─────────────────────────────────────┐
│  Pre-commit Hooks (Secret Scan)     │
├─────────────────────────────────────┤
│  Static Analysis (ESLint Security)  │
├─────────────────────────────────────┤
│  Security Tests (CI/CD)             │
├─────────────────────────────────────┤
│  Code Review Checklist              │
├─────────────────────────────────────┤
│  Runtime Headers (CSP, etc.)        │
├─────────────────────────────────────┤
│  Input Validation (Zod + Security)  │
├─────────────────────────────────────┤
│  Sanitization (XSS, CRLF, Path)     │
├─────────────────────────────────────┤
│  Rate Limiting (DoS Prevention)     │
├─────────────────────────────────────┤
│  RLS Policies (Data Access Control) │
├─────────────────────────────────────┤
│  Security Logging & Monitoring      │
└─────────────────────────────────────┘
```

### Technology Choices

- **SAST**: ESLint security plugins (`eslint-plugin-security`, `eslint-plugin-no-secrets`)
- **Dependency Scanning**: npm audit, Snyk, GitHub Dependabot
- **Sanitization**: `dompurify`, `isomorphic-dompurify`
- **Rate Limiting**: `@upstash/ratelimit` with Redis
- **Secret Detection**: Gitleaks, git-secrets
- **Monitoring**: Security events table in Supabase

### Design Trade-offs

| Decision                                            | Why                                      | Alternative Considered         |
| --------------------------------------------------- | ---------------------------------------- | ------------------------------ |
| Multiple small utilities vs monolithic security lib | Easier to understand, test, and maintain | All-in-one security middleware |
| Redis-based rate limiting                           | Distributed, accurate sliding window     | In-memory (doesn't scale)      |
| Database security event log                         | Audit trail, queryable                   | External service (added cost)  |
| ESLint security rules                               | Catches issues at write-time             | Only runtime checks            |

---

## Sprint Plan

### Sprint 0: Security Testing Infrastructure (6-8 hours)

**Goal**: Establish automated security testing foundation before adding security controls

**Why First?** Testing infrastructure enables validation of all subsequent security improvements and catches regressions.

#### Tasks

**0.1 Static Application Security Testing (SAST) - 2 hours**

Install security-focused linting:

```bash
npm install -D eslint-plugin-security eslint-plugin-no-secrets
npm install -D @typescript-eslint/eslint-plugin
```

Create `.eslintrc.security.json`:

```json
{
  "plugins": ["security", "no-secrets"],
  "extends": ["plugin:security/recommended"],
  "rules": {
    "security/detect-object-injection": "error",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-non-literal-fs-filename": "warn",
    "security/detect-possible-timing-attacks": "warn",
    "security/detect-pseudoRandomBytes": "error",
    "no-secrets/no-secrets": "error"
  }
}
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "security:scan": "eslint . --config .eslintrc.security.json --ext .ts,.tsx",
    "security:secrets": "npm audit && git secrets --scan",
    "security:deps": "npm audit --audit-level=moderate",
    "security:all": "npm run security:scan && npm run security:deps"
  }
}
```

**Files**: `.eslintrc.security.json`, `package.json`

---

**0.2 Security-Focused Test Suite - 3 hours**

Create security test categories in `tests/security/`:

**`tests/security/input-validation.test.ts`**:

```typescript
/**
 * Input Validation Security Tests
 * Tests for CWE-20 (Improper Input Validation)
 */
describe("Input Validation Security", () => {
  describe("SQL Injection Prevention", () => {
    it("should reject SQL injection attempts in scenario input", async () => {
      const maliciousInputs = [
        "'; DROP TABLE scenarios; --",
        "1' OR '1'='1",
        "admin'--",
      ];

      for (const input of maliciousInputs) {
        const response = await fetch("/api/projects/1/scenarios", {
          method: "POST",
          body: JSON.stringify({ input_text: input }),
        });

        expect(response.status).not.toBe(500);
      }
    });
  });

  describe("XSS Prevention (CWE-79)", () => {
    it("should sanitize HTML in user inputs", async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        "<img src=x onerror=alert(1)>",
        "javascript:alert(1)",
      ];
      // Test outputs are escaped
    });
  });

  describe("Path Traversal Prevention (CWE-22)", () => {
    it("should reject path traversal in export filenames", async () => {
      const maliciousNames = [
        "../../../etc/passwd",
        "..\\..\\windows\\system32",
      ];
      // Test export endpoint
    });
  });
});
```

**`tests/security/authentication.test.ts`**:

```typescript
describe("Session Security (CWE-384)", () => {
  it("should invalidate sessions on logout");
  it("should reject expired tokens");
  it("should prevent session fixation attacks");
});

describe("Timing Attack Prevention (CWE-208)", () => {
  it("should have consistent response times for auth failures", async () => {
    const times = [];
    for (let i = 0; i < 10; i++) {
      const start = performance.now();
      await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "invalid@test.com", password: "wrong" }),
      });
      times.push(performance.now() - start);
    }
    const variance = calculateVariance(times);
    expect(variance).toBeLessThan(50); // <50ms variance
  });
});
```

**Files**: `tests/security/input-validation.test.ts`, `tests/security/authentication.test.ts`, `tests/security/api-keys.test.ts`

---

**0.3 Dependency Vulnerability Scanning - 1 hour**

Install and configure:

```bash
npm install -D snyk
npx snyk auth
```

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    labels:
      - "security"
      - "dependencies"
```

**Files**: `.github/dependabot.yml`

---

**0.4 Pre-commit Security Hooks - 1 hour**

```bash
npm install -D husky lint-staged
npx husky init
```

`.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
npm run security:secrets
```

`.lintstagedrc.json`:

```json
{
  "*.{ts,tsx}": [
    "eslint --config .eslintrc.security.json --fix",
    "vitest related --run"
  ]
}
```

**Files**: `.husky/pre-commit`, `.lintstagedrc.json`

---

**Total Sprint 0**: 6-8 hours

**Deliverables**:

- SAST tooling configured
- Security test suite with CWE coverage
- Dependency scanning automated
- Pre-commit hooks for secret detection

**Success Metrics**:

- [ ] `npm run security:all` passes
- [ ] Security tests run in CI/CD
- [ ] Pre-commit hooks block secrets

---

### Sprint 1: Runtime Security Headers & CSP (4-6 hours)

**Goal**: Add defense-in-depth through HTTP security headers

#### Tasks

**1.1 Security Headers Middleware - 2 hours**

Create `lib/security/headers.ts`:

```typescript
/**
 * Security Headers Configuration
 *
 * Prevents:
 * - XSS attacks (CWE-79)
 * - Clickjacking (CWE-1021)
 * - MIME sniffing attacks (CWE-16)
 */

export const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Content-Security-Policy",
    value: buildCSP(),
  },
];

function buildCSP(): string {
  const cspDirectives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "https:"],
    "connect-src": [
      "'self'",
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      "https://api.openai.com",
      "https://api.anthropic.com",
    ],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(cspDirectives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}
```

Update `next.config.ts`:

```typescript
import { securityHeaders } from "./lib/security/headers";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  poweredByHeader: false,
};
```

**Files**: `lib/security/headers.ts`, `next.config.ts`

---

**1.2 Content Sanitization Library - 2 hours**

```bash
npm install dompurify isomorphic-dompurify
npm install -D @types/dompurify
```

Create `lib/security/sanitize.ts`:

```typescript
/**
 * Input Sanitization Utilities
 *
 * Prevents XSS (CWE-79), CRLF Injection (CWE-93), Path Traversal (CWE-22)
 */

import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href"],
  });
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
    "/": "&#x2F;",
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

export function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]/g, "");
}

export function sanitizeFilename(filename: string): string {
  let safe = filename.replace(/\.\./g, "");
  safe = safe.replace(/[\/\\]/g, "");
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, "_");
  if (safe.startsWith(".")) safe = safe.substring(1);
  return safe || "download";
}

export function sanitizeUrl(url: string, allowedDomains: string[]): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      throw new Error("Only HTTPS URLs allowed");
    }
    if (!allowedDomains.some((domain) => parsed.hostname.endsWith(domain))) {
      throw new Error("Domain not allowed");
    }
    return parsed.toString();
  } catch {
    return "/";
  }
}
```

**Files**: `lib/security/sanitize.ts`

---

**1.3 Update Export Route - 1 hour**

Update `app/api/projects/[id]/export/route.ts`:

```typescript
import { sanitizeFilename } from "@/lib/security/sanitize";

const sanitizedName = sanitizeFilename(project.name);

return new NextResponse(markdown, {
  headers: {
    "Content-Type": "text/markdown; charset=utf-8",
    "Content-Disposition": `attachment; filename="${sanitizedName}_quality_spec.md"`,
    "X-Content-Type-Options": "nosniff",
  },
});
```

**Files**: `app/api/projects/[id]/export/route.ts`

---

**Total Sprint 1**: 4-6 hours

**Deliverables**:

- Security headers on all routes
- Sanitization utilities for XSS, CRLF, path traversal
- Export endpoint secured

**Success Metrics**:

- [ ] Security headers present on all pages
- [ ] CSP configured and working
- [ ] Sanitization tests passing

---

### Sprint 2: Input Validation & Rate Limiting (6-8 hours)

**Goal**: Harden input validation and add rate limiting

#### Tasks

**2.1 Enhanced Zod Schemas - 2 hours**

Update `lib/validation/schemas.ts`:

```typescript
const MAX_SCENARIO_LENGTH = 10000;
const MAX_FEEDBACK_LENGTH = 5000;

export const createScenarioSchema = z.object({
  input_text: z
    .string()
    .min(1, "Input text is required")
    .max(MAX_SCENARIO_LENGTH)
    .refine((text) => !containsSqlInjection(text), {
      message: "Input contains potentially unsafe content",
    }),
  order: z.number().int().nonnegative().optional(),
});

export const updateApiKeysSchema = z.object({
  openai_key: z
    .string()
    .max(200)
    .regex(/^sk-[A-Za-z0-9-_]+$/, "Invalid OpenAI API key format")
    .optional(),
  anthropic_key: z
    .string()
    .max(200)
    .regex(/^sk-ant-[A-Za-z0-9-_]+$/, "Invalid Anthropic API key format")
    .optional(),
});

function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\bDROP\b|\bDELETE\b|\bINSERT\b|\bUPDATE\b).*(\bTABLE\b|\bFROM\b)/i,
    /UNION.*SELECT/i,
    /;.*DROP/i,
  ];
  return sqlPatterns.some((pattern) => pattern.test(input));
}
```

**Files**: `lib/validation/schemas.ts`

---

**2.2 Rate Limiting Middleware - 3 hours**

```bash
npm install @upstash/ratelimit @upstash/redis
```

Create `lib/security/rate-limit.ts`:

```typescript
/**
 * Rate Limiting
 * Prevents DoS (CWE-400), brute force, API abuse
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimits = {
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "15 m"),
    analytics: true,
  }),

  generation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, "1 h"),
    analytics: true,
  }),

  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
  }),
};

export async function checkRateLimit(
  identifier: string,
  limitType: keyof typeof rateLimits,
): Promise<{ success: boolean; remaining?: number; reset?: number }> {
  const { success, remaining, reset } =
    await rateLimits[limitType].limit(identifier);
  return { success, remaining, reset };
}

export function withRateLimit(
  limitType: keyof typeof rateLimits,
  getIdentifier: (request: Request) => string,
) {
  return async function (
    request: Request,
    handler: () => Promise<Response>,
  ): Promise<Response> {
    const identifier = getIdentifier(request);
    const result = await checkRateLimit(identifier, limitType);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          code: "RATE_LIMIT_EXCEEDED",
        }),
        {
          status: 429,
          headers: {
            "Retry-After": String(result.reset),
          },
        },
      );
    }

    return handler();
  };
}
```

**Files**: `lib/security/rate-limit.ts`

---

**2.3 Apply Rate Limiting - 2 hours**

Update critical endpoints like `app/api/projects/[id]/generate/route.ts`:

```typescript
import { withRateLimit } from "@/lib/security/rate-limit";

export async function POST(request: Request, { params }: RouteParams) {
  return withRateLimit(
    "generation",
    (req) => req.headers.get("x-user-id") || "anonymous",
  )(request, async () => {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ... rest of handler
  });
}
```

**Files**: `app/api/projects/[id]/generate/route.ts`, other critical endpoints

---

**Total Sprint 2**: 6-8 hours

**Deliverables**:

- Enhanced input validation with security rules
- Rate limiting on auth and generation endpoints
- SQL injection detection

**Success Metrics**:

- [ ] Rate limiting works on critical endpoints
- [ ] Malicious inputs rejected
- [ ] Validation tests passing

---

### Sprint 3: Secrets Management & Encryption (4-6 hours)

**Goal**: Harden secrets management and encryption

#### Tasks

**3.1 Environment Variable Security - 1 hour**

Update `lib/env.ts`:

```typescript
// Production-only validation
if (process.env.NODE_ENV === "production") {
  const encKey = process.env.DATABASE_ENCRYPTION_KEY;
  if (encKey && encKey.length < 32) {
    throw new Error("DATABASE_ENCRYPTION_KEY must be at least 32 characters");
  }

  if (encKey?.includes("dev_only")) {
    throw new Error("SECURITY: Development encryption key in production!");
  }
}

export const env = {
  // ... existing env vars
  security: {
    encryptionKey: process.env.DATABASE_ENCRYPTION_KEY,
    redisUrl: process.env.UPSTASH_REDIS_REST_URL,
    redisToken: process.env.UPSTASH_REDIS_REST_TOKEN,
  },
};
```

**Files**: `lib/env.ts`

---

**3.2 Database Encryption Update - 2 hours**

Create migration `supabase/migrations/20251218000000_fix_encryption_key.sql`:

```sql
-- Use environment-based encryption key

CREATE OR REPLACE FUNCTION set_workbench_api_keys(
  workbench_uuid uuid,
  api_keys_json jsonb,
  encryption_key text
)
RETURNS void AS $$
BEGIN
  IF length(encryption_key) < 32 THEN
    RAISE EXCEPTION 'Encryption key must be at least 32 characters';
  END IF;

  UPDATE workbenches
  SET encrypted_api_keys = pgp_sym_encrypt(api_keys_json::text, encryption_key),
      updated_at = now()
  WHERE id = workbench_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Files**: `supabase/migrations/20251218000000_fix_encryption_key.sql`

---

**3.3 Secrets Scanning CI/CD - 1 hour**

Create `.github/workflows/security.yml`:

```yaml
name: Security Checks

on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2

      - name: Run npm audit
        run: npm audit --audit-level=moderate

      - name: Run security linter
        run: npm run security:scan
```

**Files**: `.github/workflows/security.yml`

---

**Total Sprint 3**: 4-6 hours

**Deliverables**:

- Production encryption key validation
- Database encryption hardened
- Automated secret scanning in CI/CD

**Success Metrics**:

- [ ] Encryption keys validated at startup
- [ ] No secrets in git history
- [ ] CI/CD catches hardcoded secrets

---

### Sprint 4: Security Review Checklist & Documentation (4-6 hours)

**Goal**: Encode security patterns into development workflow

#### Tasks

**4.1 Security Code Review Checklist - 2 hours**

Create `docs/SECURITY_CHECKLIST.md` with sections for:

- Authentication & Authorization
- Input Validation
- SQL Injection Prevention
- XSS Prevention
- CRLF Injection
- Secrets Management
- Rate Limiting
- Error Handling
- File Operations
- External API Calls

Each section has:

- Checklist items
- CWE reference
- Anti-pattern example (❌)
- Secure pattern example (✅)

**Files**: `docs/SECURITY_CHECKLIST.md`

---

**4.2 Pull Request Template - 1 hour**

Create `.github/PULL_REQUEST_TEMPLATE.md` with security checklist.

**Files**: `.github/PULL_REQUEST_TEMPLATE.md`

---

**4.3 Update CLAUDE.md - 2 hours**

Add new section **"Security Best Practices"** after "Code Organization & Best Practices":

**Key additions**:

1. Security-First Development Workflow (6-step process)
2. Critical Security Rules (5 never-break rules with examples)
3. Common Vulnerability Patterns (CWE table)
4. Security Testing Requirements
5. Pre-commit Security Checks

**Example content**:

````markdown
## Security Best Practices

### Critical Security Rules

#### 1. NEVER Use supabaseAdmin in User-Facing Code

**Why**: Bypasses Row Level Security

```typescript
// ❌ NEVER
import { supabaseAdmin } from "@/lib/supabase/admin";
const { data } = await supabaseAdmin.from("projects").select("*");

// ✅ ALWAYS
import { createServerClient } from "@/lib/supabase/server";
const supabase = await createServerClient();
const { data } = await supabase.from("projects").select("*");
```
````

#### 2. ALWAYS Validate User Input

```typescript
// ❌ DON'T
async function createScenario(input: string) {
  await supabase.from("scenarios").insert({ input_text: input });
}

// ✅ DO
import { createScenarioSchema } from "@/lib/validation/schemas";
async function createScenario(input: unknown) {
  const validated = createScenarioSchema.parse(input);
  await supabase.from("scenarios").insert(validated);
}
```

[... more rules ...]

````

**Files**: `CLAUDE.md`

---

**Total Sprint 4**: 4-6 hours

**Deliverables**:
- Security code review checklist
- PR template with security section
- CLAUDE.md updated with security patterns

**Success Metrics**:
- [ ] All PRs use security checklist
- [ ] CLAUDE.md security section complete
- [ ] Team trained on security patterns

---

### Sprint 5: Monitoring & Incident Response (4-6 hours)

**Goal**: Enable security monitoring and incident response

#### Tasks

**5.1 Security Logging - 2 hours**

Create `lib/security/logging.ts`:

```typescript
interface SecurityEvent {
  type: 'auth_failure' | 'authz_violation' | 'rate_limit' | 'suspicious';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  details: Record<string, unknown>;
}

export class SecurityLogger {
  logAuthFailure(details: Omit<SecurityEvent, 'type' | 'severity'>) {
    this.logEvent({ ...details, type: 'auth_failure', severity: 'medium' });
  }

  private logEvent(event: SecurityEvent) {
    if (env.isProduction) {
      console.error('[SECURITY]', JSON.stringify(event));
    }
    if (event.severity === 'critical' || event.severity === 'high') {
      this.persistEvent(event);
    }
  }
}
````

**Files**: `lib/security/logging.ts`

---

**5.2 Security Events Table - 1 hour**

Create migration `supabase/migrations/20251219000000_add_security_events.sql`:

```sql
CREATE TABLE security_events (
  id bigserial primary key,
  event_type text not null,
  severity text not null,
  user_id uuid references auth.users(id),
  ip_address inet,
  details jsonb,
  created_at timestamp with time zone default now()
);

CREATE INDEX security_events_user_id_idx ON security_events(user_id);
CREATE INDEX security_events_severity_idx ON security_events(severity);
```

**Files**: `supabase/migrations/20251219000000_add_security_events.sql`

---

**5.3 Incident Response Playbook - 2 hours**

Create `docs/INCIDENT_RESPONSE.md` with:

- Severity levels (P0-P3)
- Detection methods
- Triage process
- Investigation steps
- Remediation playbooks for common incidents
- Recovery checklist
- Postmortem template

**Files**: `docs/INCIDENT_RESPONSE.md`

---

**Total Sprint 5**: 4-6 hours

**Deliverables**:

- Security event logging
- Security events database table
- Incident response playbook

**Success Metrics**:

- [ ] Security events logged
- [ ] Incident response process documented
- [ ] Team trained on incident response

---

## Files Modified Summary

### New Files (18 files)

**Security Infrastructure**:

- `.eslintrc.security.json` - Security linting rules
- `lib/security/headers.ts` - Security headers configuration
- `lib/security/sanitize.ts` - Input/output sanitization utilities
- `lib/security/rate-limit.ts` - Rate limiting middleware
- `lib/security/logging.ts` - Security event logging

**Tests**:

- `tests/security/input-validation.test.ts` - Input validation security tests
- `tests/security/authentication.test.ts` - Auth security tests
- `tests/security/api-keys.test.ts` - API key security tests
- `tests/security/headers.test.ts` - Security headers tests
- `tests/security/comprehensive.test.ts` - Comprehensive CWE coverage

**Documentation**:

- `docs/SECURITY_CHECKLIST.md` - Code review security checklist
- `docs/INCIDENT_RESPONSE.md` - Incident response playbook
- `docs/SECURITY_METRICS.md` - Security metrics and KPIs

**Configuration**:

- `.github/dependabot.yml` - Dependency vulnerability scanning
- `.github/workflows/security.yml` - CI/CD security checks
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template with security section
- `.husky/pre-commit` - Pre-commit security hooks
- `.lintstagedrc.json` - Lint-staged configuration

### Modified Files (5 files)

- `CLAUDE.md` - Add "Security Best Practices" section
- `lib/env.ts` - Enhanced environment validation
- `lib/validation/schemas.ts` - Security-enhanced Zod schemas
- `next.config.ts` - Security headers configuration
- `app/api/projects/[id]/export/route.ts` - Filename sanitization

### Database Migrations (2 files)

- `supabase/migrations/20251218000000_fix_encryption_key.sql` - Environment-based encryption
- `supabase/migrations/20251219000000_add_security_events.sql` - Security events table

**Total**: 18 new + 5 modified + 2 migrations = **25 files**

---

## Risk & Mitigation

| Risk                                  | Impact | Probability | Mitigation                                  |
| ------------------------------------- | ------ | ----------- | ------------------------------------------- |
| Rate limiting breaks legitimate users | Medium | Low         | Start with generous limits, monitor metrics |
| CSP breaks external integrations      | High   | Medium      | Incremental rollout, test thoroughly        |
| False positives in security scans     | Low    | Medium      | Manual review process, tune rules           |
| Performance impact of sanitization    | Low    | Low         | Benchmark, optimize hot paths               |
| Team resistance to security checklist | Medium | Medium      | Training, automation, clear examples        |

---

## Success Metrics

### Sprint-Level Metrics

- **Sprint 0**: SAST tool runs without errors, security tests pass in CI/CD
- **Sprint 1**: All pages return security headers, CSP policy active
- **Sprint 2**: Rate limiting active on 3+ endpoints, malicious inputs rejected
- **Sprint 3**: Encryption key validated, no secrets in git history
- **Sprint 4**: 100% PRs use security checklist
- **Sprint 5**: Security events logged, incident playbook complete

### Overall Success Criteria

- [ ] All automated security scans passing
- [ ] Zero hardcoded secrets detected
- [ ] Security headers on all routes
- [ ] Rate limiting on critical endpoints
- [ ] Input validation on all user inputs
- [ ] Security tests in CI/CD
- [ ] CLAUDE.md security section complete
- [ ] Team trained on security practices

### Long-Term KPIs

| Metric                         | Target | Measurement           |
| ------------------------------ | ------ | --------------------- |
| Security test coverage         | >80%   | Code coverage report  |
| High/Critical vulnerabilities  | 0      | npm audit, Snyk       |
| Time to fix P1 vulnerabilities | <24h   | Incident tracking     |
| PRs with security issues       | <5%    | Code review analytics |
| False positive rate in scans   | <10%   | Manual review         |

---

## Timeline

| Sprint    | Focus                            | Estimated Time  | Dependencies         |
| --------- | -------------------------------- | --------------- | -------------------- |
| Sprint 0  | Testing Infrastructure           | 6-8h            | None                 |
| Sprint 1  | Security Headers                 | 4-6h            | Sprint 0 complete    |
| Sprint 2  | Input Validation & Rate Limiting | 6-8h            | Sprint 0 complete    |
| Sprint 3  | Secrets Management               | 4-6h            | Sprint 0 complete    |
| Sprint 4  | Documentation                    | 4-6h            | Sprints 1-3 complete |
| Sprint 5  | Monitoring                       | 4-6h            | Sprint 0 complete    |
| **Total** |                                  | **28-40 hours** | **~3-4 weeks**       |

**Recommended Order**: 0 → 1 → 2 → 3 → 4 → 5 (sequential for learning, but 1-3 can be parallel after Sprint 0)

---

## Next Steps

1. **Review this plan** - Discuss with team, adjust priorities
2. **Set up environment** - Create Upstash Redis account, configure keys
3. **Create GitHub issues** - One issue per sprint for tracking
4. **Begin Sprint 0** - Start with testing infrastructure
5. **Document learnings** - Create sprint summaries as we go

---

## References

- **Research Paper**: [Vibe Coding Safety Study](./Vibe%20Coding%20Safety%20Study.pdf)
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **CWE Top 25**: https://cwe.mitre.org/top25/
- **Supabase RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **Next.js Security Headers**: https://nextjs.org/docs/app/api-reference/next-config-js/headers

---

## Appendix: Why This Approach Works

The SUSVIBES research found that **simple prompting doesn't work**:

- "Write secure code" → 80% still vulnerable
- CWE-specific hints → Reduces functionality, barely improves security

**Our multi-layered approach addresses this**:

1. **Automated Detection** - Catches vulnerabilities AI generates (SAST, dependency scanning)
2. **Runtime Protection** - Blocks exploitation even if code is vulnerable (CSP, rate limiting, sanitization)
3. **Process Integration** - Prevents vulnerable code from merging (security checklist, PR template)
4. **Continuous Testing** - Catches regressions (security test suite, CI/CD)
5. **Defense in Depth** - Multiple layers compensate for single-layer failures

**Key Insight**: We don't rely on AI to write secure code. We build systems that make it hard to deploy insecure code, regardless of who (or what) wrote it.
