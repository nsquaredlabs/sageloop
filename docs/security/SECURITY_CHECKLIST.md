# Security Review Checklist

This checklist should be reviewed for every pull request and new feature implementation. Use this as a guide for code reviews and security assessments.

## Table of Contents

- [General Security](#general-security)
- [Authentication & Authorization](#authentication--authorization)
- [Input Validation & Sanitization](#input-validation--sanitization)
- [API Security](#api-security)
- [Secrets Management](#secrets-management)
- [Database Security](#database-security)
- [Frontend Security](#frontend-security)
- [Dependencies](#dependencies)
- [Testing](#testing)
- [Common Pitfalls](#common-pitfalls)

---

## General Security

### Code Review Questions

- [ ] Are there any obvious security vulnerabilities (SQL injection, XSS, etc.)?
- [ ] Are error messages generic and not exposing sensitive information?
- [ ] Are security headers properly configured?
- [ ] Is HTTPS enforced for all external communications?
- [ ] Are security best practices followed for the technology stack?

### Best Practices

```typescript
// ✅ DO: Use generic error messages
return NextResponse.json({ error: "Invalid request" }, { status: 400 });

// ❌ DON'T: Expose internal details
return NextResponse.json(
  {
    error: "User with email john@example.com not found in database table users",
  },
  { status: 404 },
);
```

---

## Authentication & Authorization

### Code Review Questions

- [ ] Is authentication required for protected routes?
- [ ] Is the user's identity verified before sensitive operations?
- [ ] Are RLS (Row Level Security) policies enforced on all queries?
- [ ] Is `createServerClient()` used (never `supabaseAdmin`) for user-facing queries?
- [ ] Are session tokens handled securely?

### Best Practices

```typescript
// ✅ DO: Check authentication in API routes
export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Continue with authenticated logic
}

// ✅ DO: Use RLS-protected queries
const { data: projects } = await supabase.from("projects").select("*"); // RLS automatically filters by user's workbenches

// ❌ DON'T: Use admin client for user queries
const { data: projects } = await supabaseAdmin.from("projects").select("*"); // Bypasses RLS!
```

### Testing

- [ ] Authentication tests pass (`tests/security/authentication.test.ts`)
- [ ] RLS tests pass (`tests/security/rls.test.ts`)
- [ ] Middleware tests pass (`tests/security/middleware.test.ts`)

---

## Input Validation & Sanitization

### Code Review Questions

- [ ] Are all user inputs validated using Zod schemas?
- [ ] Are string lengths limited to prevent resource exhaustion?
- [ ] Are array sizes limited to prevent memory issues?
- [ ] Is user-generated HTML sanitized before rendering?
- [ ] Are filenames sanitized to prevent path traversal?

### Best Practices

```typescript
// ✅ DO: Validate all inputs with Zod
import { createProjectSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const validatedData = createProjectSchema.parse(body);
    // Use validatedData (type-safe and validated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }
  }
}

// ✅ DO: Sanitize user content before rendering
import { sanitize } from "@/lib/security/sanitize";

const safeHtml = sanitize.userContent(userInput);

// ✅ DO: Sanitize filenames
const safeFilename = sanitize.filename(project.name);
```

### Validation Limits

| Field Type     | Limit        | Rationale                   |
| -------------- | ------------ | --------------------------- |
| Scenario input | 10,000 chars | Prevent resource exhaustion |
| Feedback text  | 5,000 chars  | Prevent resource exhaustion |
| Tag array      | 10 tags      | Prevent memory issues       |
| Tag length     | 50 chars     | Prevent long strings        |
| Project name   | 100 chars    | Reasonable limit            |
| Description    | 500 chars    | Reasonable limit            |

### Testing

- [ ] Input validation tests pass (`tests/security/input-validation.test.ts`)
- [ ] Sanitization tests pass (`tests/security/sanitization.test.ts`)

---

## API Security

### Code Review Questions

- [ ] Are API routes protected with authentication?
- [ ] Is rate limiting applied to prevent abuse?
- [ ] Are appropriate rate limit configurations used?
- [ ] Are API responses sanitized (no sensitive data exposure)?
- [ ] Are API errors handled gracefully?

### Best Practices

```typescript
// ✅ DO: Apply rate limiting to API routes
import { withRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

export const POST = withRateLimit(
  async (request: Request) => {
    // Your handler logic
    return NextResponse.json({ success: true });
  },
  RATE_LIMITS.api, // or .auth, .generation, .export
);

// ✅ DO: Use standardized error handling
import { handleApiError, NotFoundError } from "@/lib/api/errors";

export async function GET(request: Request) {
  try {
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) {
      throw new NotFoundError("Project");
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Rate Limit Configurations

| Endpoint Type  | Max Requests | Time Window | Purpose                        |
| -------------- | ------------ | ----------- | ------------------------------ |
| Authentication | 5            | 15 minutes  | Prevent brute force            |
| API (General)  | 100          | 1 hour      | Prevent abuse                  |
| Generation     | 20           | 1 hour      | Protect expensive operations   |
| Export         | 30           | 1 hour      | Limit resource-intensive tasks |

### Testing

- [ ] Rate limit tests pass (`tests/security/rate-limit.test.ts`)
- [ ] API key tests pass (`tests/security/api-keys.test.ts`)

---

## Secrets Management

### Code Review Questions

- [ ] Are API keys and secrets accessed via the `env` module (not `process.env`)?
- [ ] Are no secrets hardcoded in source code?
- [ ] Are secrets never logged or exposed in error messages?
- [ ] Are API keys masked when displayed to users?
- [ ] Is `.env.example` updated with new environment variables?

### Best Practices

```typescript
// ✅ DO: Use env module for type-safe access
import { env } from "@/lib/env";

const apiKey = env.openai.apiKey;
const supabaseUrl = env.supabase.url;

// ❌ DON'T: Use process.env directly
const apiKey = process.env.OPENAI_API_KEY; // Not type-safe

// ✅ DO: Mask API keys in logs and errors
const maskApiKey = (key: string): string => {
  if (key.length < 10) return "***";
  return key.slice(0, 7) + "..." + key.slice(-4);
};

console.log("Using API key:", maskApiKey(apiKey));
// Output: "sk-proj...3456"

// ✅ DO: Return boolean flags, not actual keys
return NextResponse.json({
  openai: !!apiKeys.openai_key,
  anthropic: !!apiKeys.anthropic_key,
});

// ❌ DON'T: Return actual keys to client
return NextResponse.json({
  openai_key: apiKeys.openai_key, // Exposed!
});
```

### Environment Variables Checklist

- [ ] All secrets in `.env.local` are also documented in `.env.example`
- [ ] No secrets have `NEXT_PUBLIC_` prefix (except public keys)
- [ ] `.env.local` is in `.gitignore`
- [ ] Secrets scanning passes locally (`npm run security:secrets`)

### Testing

- [ ] Secrets management tests pass (`tests/security/secrets-management.test.ts`)
- [ ] Run `npm run security:secrets:all` before committing

---

## Database Security

### Code Review Questions

- [ ] Are all user-facing queries using RLS-protected client?
- [ ] Is `supabaseAdmin` only used for system operations (migrations, cleanup)?
- [ ] Are parameterized queries used (Supabase handles this)?
- [ ] Are sensitive fields encrypted at rest (API keys)?
- [ ] Are database functions using `security definer` appropriately?

### Best Practices

```typescript
// ✅ DO: Use RLS-protected queries for user data
const supabase = await createServerClient();
const { data: projects } = await supabase.from("projects").select("*"); // Automatically filtered by RLS

// ✅ DO: Verify user has access to workbench
const { data: membership } = await supabase
  .from("user_workbenches")
  .select("workbench_id")
  .eq("user_id", user.id)
  .eq("workbench_id", workbenchId)
  .single();

if (!membership) {
  throw new UnauthorizedError();
}

// ❌ DON'T: Use admin client for user queries
const { data: allProjects } = await supabaseAdmin.from("projects").select("*"); // Bypasses RLS - sees all users' data!
```

### Encrypted Fields

| Table       | Column             | Encryption Method    |
| ----------- | ------------------ | -------------------- |
| workbenches | encrypted_api_keys | pgcrypto (symmetric) |

### Testing

- [ ] RLS tests pass (`tests/security/rls.test.ts`)
- [ ] Database encryption tests pass (in `secrets-management.test.ts`)

---

## Frontend Security

### Code Review Questions

- [ ] Is user-generated content sanitized before rendering?
- [ ] Are external links using `rel="noopener noreferrer"`?
- [ ] Is CSP (Content Security Policy) configured correctly?
- [ ] Are client components using `createClient()` (not admin client)?
- [ ] Is sensitive data never stored in localStorage?

### Best Practices

```typescript
// ✅ DO: Sanitize user content before rendering
import { sanitize } from '@/lib/security/sanitize';

function UserContent({ htmlContent }: { htmlContent: string }) {
  const safeHtml = sanitize.userContent(htmlContent);
  return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}

// ✅ DO: Use rel attributes for external links
<a href={externalUrl} target="_blank" rel="noopener noreferrer">
  External Link
</a>

// ✅ DO: Use client-side Supabase client in browser
'use client';
import { createClient } from '@/lib/supabase';

export function MyComponent() {
  const supabase = createClient();
  // RLS automatically protects queries
}
```

### Security Headers

All security headers are automatically applied via `next.config.ts`:

- ✅ Content-Security-Policy (XSS prevention)
- ✅ X-Frame-Options (clickjacking prevention)
- ✅ X-Content-Type-Options (MIME sniffing prevention)
- ✅ Referrer-Policy (URL leakage prevention)
- ✅ Permissions-Policy (feature restriction)
- ✅ Strict-Transport-Security (HTTPS enforcement)

### Testing

- [ ] Sanitization tests pass (`tests/security/sanitization.test.ts`)
- [ ] Headers tests pass (`tests/security/headers.test.ts`)

---

## Dependencies

### Code Review Questions

- [ ] Are dependencies up to date?
- [ ] Are there any known vulnerabilities in dependencies?
- [ ] Are dependencies from trusted sources?
- [ ] Are dev dependencies not included in production builds?

### Best Practices

```bash
# Check for vulnerabilities
npm run security:deps

# Update dependencies
npm update

# Audit and fix
npm audit fix
```

### Regular Maintenance

- [ ] Run `npm audit` weekly
- [ ] Review dependabot alerts
- [ ] Update dependencies monthly
- [ ] Test after updates

---

## Testing

### Code Review Questions

- [ ] Are security tests added for new features?
- [ ] Do all security tests pass?
- [ ] Are edge cases tested (empty strings, null, very long inputs)?
- [ ] Are negative test cases included (unauthorized access, invalid input)?

### Test Coverage Requirements

| Test Category           | Coverage Target | Priority    |
| ----------------------- | --------------- | ----------- |
| Critical Security Paths | 100%            | 🔴 Required |
| Input Validation        | 90%             | 🟡 High     |
| Authentication          | 90%             | 🟡 High     |
| RLS                     | 90%             | 🟡 High     |
| Rate Limiting           | 90%             | 🟡 High     |

### Running Tests

```bash
# All security tests
npm test tests/security/

# Specific test file
npm test tests/security/input-validation.test.ts

# All tests with coverage
npm run test:coverage

# All security checks
npm run security:all
```

---

## Common Pitfalls

### 1. Using `supabaseAdmin` for User Queries

**Problem**: Bypasses Row Level Security, exposes all data

```typescript
// ❌ WRONG
const { data } = await supabaseAdmin.from("projects").select("*");
// Returns ALL projects, not just user's!

// ✅ CORRECT
const supabase = await createServerClient();
const { data } = await supabase.from("projects").select("*");
// Returns only user's accessible projects
```

### 2. Not Validating User Input

**Problem**: Resource exhaustion, injection attacks

```typescript
// ❌ WRONG
export async function POST(request: Request) {
  const { name } = await request.json();
  // No validation - could be 1MB string!
}

// ✅ CORRECT
export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = createProjectSchema.parse(body);
  // Validated and type-safe
}
```

### 3. Exposing Secrets in Logs/Errors

**Problem**: Credentials leak in logs, error messages

```typescript
// ❌ WRONG
console.log("API Key:", apiKey);
throw new Error(`Failed with key: ${apiKey}`);

// ✅ CORRECT
const masked = apiKey.slice(0, 7) + "..." + apiKey.slice(-4);
console.log("API Key:", masked);
throw new Error("Failed to authenticate with provider");
```

### 4. No Rate Limiting on Expensive Operations

**Problem**: DoS attacks, resource exhaustion

```typescript
// ❌ WRONG
export async function POST(request: Request) {
  // No rate limiting - can be abused!
  const result = await expensiveAiGeneration();
}

// ✅ CORRECT
export const POST = withRateLimit(async (request: Request) => {
  const result = await expensiveAiGeneration();
}, RATE_LIMITS.generation);
```

### 5. Not Sanitizing User Content

**Problem**: XSS attacks via user-generated content

```typescript
// ❌ WRONG
<div dangerouslySetInnerHTML={{ __html: userInput }} />
// XSS vulnerability!

// ✅ CORRECT
const safeHtml = sanitize.userContent(userInput);
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />
```

### 6. Using `process.env` Directly

**Problem**: Not type-safe, no validation

```typescript
// ❌ WRONG
const apiKey = process.env.OPENAI_API_KEY;
// Could be undefined, no type checking

// ✅ CORRECT
import { env } from "@/lib/env";
const apiKey = env.openai.apiKey;
// Type-safe, validated on startup
```

### 7. Hardcoding API Keys

**Problem**: Secrets exposed in git history

```typescript
// ❌ WRONG
const OPENAI_KEY = "sk-proj-abc123...";

// ✅ CORRECT
import { env } from "@/lib/env";
const apiKey = env.openai.apiKey;
```

### 8. Not Checking Authentication

**Problem**: Unauthorized access to protected resources

```typescript
// ❌ WRONG
export async function DELETE(request: Request) {
  // No auth check - anyone can delete!
  await supabase.from("projects").delete().eq("id", projectId);
}

// ✅ CORRECT
export async function DELETE(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RLS ensures user can only delete their projects
  await supabase.from("projects").delete().eq("id", projectId);
}
```

---

## Pull Request Checklist

Before approving a PR, ensure:

- [ ] All security tests pass
- [ ] No hardcoded secrets detected (`npm run security:secrets`)
- [ ] No new security vulnerabilities (`npm run security:deps`)
- [ ] Input validation added for new endpoints
- [ ] Rate limiting applied to new API routes
- [ ] Authentication checks for protected routes
- [ ] RLS policies enforce data access control
- [ ] User input sanitized before rendering
- [ ] Error messages don't expose sensitive information
- [ ] `.env.example` updated for new environment variables
- [ ] Security-relevant changes documented

---

## Resources

### Documentation

- [Sprint 0 Summary](./sprint-0-summary.md) - Initial security assessment
- [Sprint 1 Summary](./sprint-1-summary.md) - Headers & sanitization
- [Sprint 2 Summary](./sprint-2-summary.md) - Validation & rate limiting
- [Sprint 3 Summary](./sprint-3-summary.md) - Secrets management
- [CLAUDE.md](../../CLAUDE.md) - Development guidelines

### Tools

- **Gitleaks**: Secrets detection (`npm run security:secrets`)
- **ESLint Security Plugin**: Code analysis (`npm run security:scan`)
- **npm audit**: Dependency vulnerabilities (`npm run security:deps`)
- **Vitest**: Security testing (`npm test tests/security/`)

### Security Libraries

- **Zod**: Input validation (`lib/validation/schemas.ts`)
- **DOMPurify**: HTML sanitization (`lib/security/sanitize.ts`)
- **pgcrypto**: Database encryption (Supabase extension)

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE/SANS Top 25](https://cwe.mitre.org/top25/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)

---

**Last Updated**: December 18, 2025 (Sprint 4)
