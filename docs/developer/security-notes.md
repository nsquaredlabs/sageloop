# Security Notes

This document covers the security practices relevant to Sageloop's local-first architecture. It focuses on input validation, API security, prompt injection defense, and dependency hygiene.

---

## Input Validation & Sanitization

### Validate all inputs with Zod or inline checks

Every API route must validate its request body before touching the database or calling AI APIs.

```typescript
// Inline validation (simple cases)
const { name, model_config } = body;
if (!name || !model_config) {
  return NextResponse.json(
    { error: "Name and model_config are required" },
    { status: 400 },
  );
}

// Zod (complex schemas)
import { z } from "zod";

const schema = z.object({
  stars: z.number().int().min(1).max(5),
  feedback_text: z.string().max(5000).optional(),
});

const parsed = schema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid request", details: parsed.error.issues },
    { status: 400 },
  );
}
```

### Validation limits

These limits prevent resource exhaustion (CWE-400):

| Field          | Limit        |
| -------------- | ------------ |
| Scenario input | 10,000 chars |
| System prompt  | 10,000 chars |
| Feedback text  | 5,000 chars  |
| Tag array      | 10 items     |
| Tag length     | 50 chars     |
| Project name   | 100 chars    |
| Description    | 500 chars    |

### Sanitize user content before rendering

If rendering user-generated HTML, sanitize it first:

```typescript
import { sanitize } from "@/lib/security/sanitize";

const safeHtml = sanitize.userContent(userInput);
return <div dangerouslySetInnerHTML={{ __html: safeHtml }} />;
```

Do not render raw user input with `dangerouslySetInnerHTML`.

### Sanitize filenames

When using user-provided names as filenames (e.g., export):

```typescript
const safeFilename = sanitize.filename(project.name);
```

---

## API Security

### Standardized error handling

Use `handleApiError` or inline error returns. Never expose internal details:

```typescript
// Good
return NextResponse.json({ error: "Project not found" }, { status: 404 });

// Bad — exposes internal details
return NextResponse.json(
  { error: `SELECT * FROM projects WHERE id=${id} returned 0 rows` },
  { status: 404 },
);
```

### Error classes

```typescript
import {
  handleApiError,
  NotFoundError,
  ValidationError,
} from "@/lib/api/errors";

throw new NotFoundError("Project"); // → 404
throw new ValidationError("Bad input"); // → 400
```

### Security headers

Security headers are applied in `next.config.ts` via `lib/security/headers.ts`:

- Content-Security-Policy (XSS prevention)
- X-Frame-Options (clickjacking prevention)
- X-Content-Type-Options (MIME sniffing prevention)
- Referrer-Policy (URL leakage prevention)
- Strict-Transport-Security (HTTPS enforcement)

### External links

Always use `rel="noopener noreferrer"` on external links:

```tsx
<a href={externalUrl} target="_blank" rel="noopener noreferrer">
  External Link
</a>
```

---

## Prompt Injection Defense

User-provided system prompts are a critical attack surface. See [prompt-injection.md](prompt-injection.md) for the full analysis.

**Required for all routes that save or use system prompts**:

```typescript
import { validateSystemPrompt } from "@/lib/security/prompt-validation";

const validation = validateSystemPrompt(model_config.system_prompt);

if (!validation.isValid) {
  return NextResponse.json(
    {
      error: "System prompt failed security validation",
      details: validation.flags,
    },
    { status: 400 },
  );
}

if (validation.risk === "medium") {
  console.warn("[SECURITY] Medium-risk prompt:", { flags: validation.flags });
}
```

For extraction analysis, user content must be placed in the **user message** wrapped in XML delimiters — never embedded directly in the system prompt. See `app/api/projects/[id]/extract/route.ts`.

---

## Secrets Management

### Never hardcode API keys

```typescript
// Bad
const OPENAI_KEY = "sk-proj-abc123...";

// Good
import { getConfig } from "@/lib/config";
const config = getConfig();
const apiKey = config.openai_api_key;
```

### Never log full API keys

```typescript
// Bad
console.log("Using API key:", apiKey);

// Good
const masked = apiKey.slice(0, 7) + "..." + apiKey.slice(-4);
console.log("Using API key:", masked);
```

### Never return API keys to the client

```typescript
// Bad
return NextResponse.json({ openai_key: config.openai_api_key });

// Good — return boolean flags
return NextResponse.json({ openai: !!config.openai_api_key });
```

### gitignore

The following must be in `.gitignore`:

```
sageloop.config.yaml   # Contains API keys
sageloop.db            # Contains user data
sageloop.db-shm
sageloop.db-wal
.env*.local
```

---

## Frontend Security

### Avoid `localStorage` for sensitive data

Do not store API keys, tokens, or sensitive user data in `localStorage` or `sessionStorage`. Configuration lives in `sageloop.config.yaml` on the server.

### CSP and script injection

The Content-Security-Policy header restricts which scripts can run. Do not add inline `<script>` tags or `eval()` calls — they will be blocked by CSP or introduce vulnerabilities.

---

## Dependencies

Run these regularly:

```bash
# Check for known vulnerabilities
npm audit

# Automated fix (safe changes only)
npm audit fix
```

Review `npm audit` output weekly. Treat high and critical severity issues as bugs to fix promptly.

---

## Pull Request Checklist

Before merging:

- [ ] Input validation added for all new endpoint inputs
- [ ] System prompts validated with `validateSystemPrompt()` before save or use
- [ ] Error messages are generic (no internal details exposed)
- [ ] No hardcoded secrets
- [ ] `sageloop.config.yaml` not committed
- [ ] User content sanitized before rendering
- [ ] External links use `rel="noopener noreferrer"`
- [ ] Security tests pass (`npm test tests/security/`)
- [ ] `npm audit` shows no new high/critical issues

---

## Running Security Tests

```bash
# All security tests
cd /Users/nishal/projects/sageloop-project/sageloop && npm test tests/security/

# Specific file
cd /Users/nishal/projects/sageloop-project/sageloop && npm test tests/security/validation.test.ts

# Secrets scanning (requires gitleaks)
npm run security:secrets

# Dependency audit
npm run security:deps
```

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Top 10 for LLMs](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security)
