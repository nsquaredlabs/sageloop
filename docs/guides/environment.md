# Environment Variables Guide

This guide covers environment variable configuration and the type-safe `env` module.

## Overview

Sageloop uses a type-safe environment module that:

- Validates required variables on startup
- Provides TypeScript types for all variables
- Warns about missing optional variables
- Prevents direct `process.env` access

## The `env` Module

### Usage

**ALWAYS use the typed `env` module** instead of `process.env`:

```typescript
// ❌ DON'T: Use process.env directly
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const apiKey = process.env.OPENAI_API_KEY;

// ✅ DO: Use the env module
import { env } from "@/lib/env";

const url = env.supabase.url;
const apiKey = env.openai.apiKey;
```

### Benefits

1. **Type Safety** - Full TypeScript support
2. **Validation** - Fails fast if required vars missing
3. **Clear Warnings** - Logs missing optional vars
4. **Centralized** - Single source of truth
5. **Auto-Complete** - IDE suggestions for all vars

## Available Variables

### Supabase (Required)

```typescript
env.supabase.url; // NEXT_PUBLIC_SUPABASE_URL
env.supabase.anonKey; // NEXT_PUBLIC_SUPABASE_ANON_KEY
env.supabase.serviceRoleKey; // SUPABASE_SERVICE_ROLE_KEY
```

### AI Providers (Optional)

```typescript
env.openai.apiKey; // OPENAI_API_KEY (optional)
env.anthropic.apiKey; // ANTHROPIC_API_KEY (optional)
```

These are optional because users can provide their own API keys. If not provided, users must configure keys in the app.

### Node Environment

```typescript
env.isDevelopment; // NODE_ENV === 'development'
env.isProduction; // NODE_ENV === 'production'
env.isTest; // NODE_ENV === 'test'
```

## Setup

### Local Development

Create `.env.local` file (never commit this):

```bash
# .env.local

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Providers (Optional)
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Environment Variable Prefixes

| Prefix          | Exposure        | Usage                    |
| --------------- | --------------- | ------------------------ |
| `NEXT_PUBLIC_*` | ✅ Browser-safe | Public URLs, public keys |
| No prefix       | ❌ Server-only  | API keys, secrets        |

### Required vs Optional

**Required variables** (app won't start without them):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Optional variables** (warnings logged but app still runs):

- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`

If optional variables are missing, users must provide their own API keys in the app.

## Environment Files

### `.env.local`

Local development environment variables (gitignored):

```bash
# Never commit this file!
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
```

### `.env.example`

Template for required environment variables (committed):

```bash
# Copy this to .env.local and fill in values

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional - If not provided, users must add their own API keys
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

### `.env.test.local`

Test-specific overrides (gitignored):

```bash
# Used during test runs
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
OPENAI_API_KEY=sk-test-...
```

## Adding New Variables

### 1. Add to `.env.local`

```bash
# .env.local
MY_NEW_API_KEY=secret-value
```

### 2. Update `lib/env.ts`

```typescript
// lib/env.ts

// Add validation
const myNewApiKey = process.env.MY_NEW_API_KEY;
if (!myNewApiKey) {
  console.warn("MY_NEW_API_KEY not set");
}

// Add to exports
export const env = {
  supabase: {
    /* ... */
  },
  openai: {
    /* ... */
  },
  anthropic: {
    /* ... */
  },
  myNewService: {
    apiKey: myNewApiKey,
  },
  // ...
};
```

### 3. Update TypeScript Types

```typescript
// lib/env.ts

export interface Env {
  supabase: {
    /* ... */
  };
  openai: {
    /* ... */
  };
  anthropic: {
    /* ... */
  };
  myNewService: {
    apiKey: string | undefined;
  };
  // ...
}
```

### 4. Use in Code

```typescript
import { env } from "@/lib/env";

const apiKey = env.myNewService.apiKey;
if (!apiKey) {
  throw new Error("MY_NEW_API_KEY not configured");
}
```

## Deployment

### Vercel

Add environment variables in Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add each variable for Production/Preview/Development
3. Redeploy to pick up changes

**Production variables**:

```
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
SUPABASE_SERVICE_ROLE_KEY=prod-key
OPENAI_API_KEY=prod-openai-key
```

**Preview variables** (optional, for PR previews):

```
NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co
SUPABASE_SERVICE_ROLE_KEY=staging-key
```

### Docker

Pass environment variables via `-e` flag or `.env` file:

```bash
docker run \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  -e OPENAI_API_KEY=... \
  your-image
```

Or use docker-compose:

```yaml
# docker-compose.yml
services:
  app:
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
      - OPENAI_API_KEY=${OPENAI_KEY}
```

## Security Best Practices

### 1. Never Commit Secrets

Ensure `.env.local` is in `.gitignore`:

```bash
# .gitignore
.env.local
.env*.local
```

### 2. Use Different Keys Per Environment

- **Development**: Test keys, local Supabase
- **Staging**: Staging keys, staging database
- **Production**: Production keys, production database

### 3. Rotate Keys Regularly

- Rotate API keys every 90 days
- Immediately rotate if compromised
- Use key rotation without downtime (add new key, update code, remove old key)

### 4. Limit Key Permissions

- Use least-privilege keys where possible
- OpenAI: Restrict to specific models/endpoints
- Supabase: Service role key has full access (use carefully)

### 5. Monitor Key Usage

- Set up billing alerts for AI API usage
- Monitor Supabase dashboard for anomalies
- Log and track expensive operations

## Troubleshooting

### "Environment variable not found"

Check that:

1. Variable is defined in `.env.local`
2. Variable name matches exactly (case-sensitive)
3. Variable is exported in `lib/env.ts`
4. You restarted the dev server after adding variable

### "Module not found: @/lib/env"

Check `tsconfig.json` has correct path alias:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Client-side access to server-only variables

```typescript
// ❌ This will be `undefined` in browser
const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ✅ Only use NEXT_PUBLIC_ vars in client components
const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
```

Server-only variables are not available in browser code by design.

### Environment variables not updating

1. Restart dev server: `npm run dev`
2. Clear Next.js cache: `rm -rf .next`
3. Rebuild: `npm run build`

## Testing

### Mock Environment in Tests

Environment variables are automatically mocked in `tests/setup.ts`:

```typescript
// tests/setup.ts
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
```

### Override in Specific Tests

```typescript
import { vi } from "vitest";

describe("My test", () => {
  it("should work with custom env", () => {
    // Temporarily override
    const originalKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = "test-key";

    // Test code

    // Restore
    process.env.OPENAI_API_KEY = originalKey;
  });
});
```

## Related Documentation

- [AI Integration Guide](ai-integration.md) - Using AI API keys
- [Authentication Guide](authentication.md) - Supabase configuration
- [Security Checklist](../security/SECURITY_CHECKLIST.md) - Secrets management
