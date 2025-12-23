# Sageloop Development Guide

**Quick reference for working with the Sageloop codebase**. For detailed documentation, see `docs/guides/`.

## Project Overview

**Sageloop** is a behavioral design tool for AI products - "Figma for AI Evals."

- **Tech Stack**: Next.js 14, React, TypeScript, Tailwind, Supabase
- **Database**: PostgreSQL with Row Level Security (RLS)
- **AI Providers**: OpenAI, Anthropic

**Key Documents**:
- [Product Spec](docs/product-spec.md) - MVP requirements
- [Design System](docs/DESIGN_SYSTEM.md) - UI/UX specifications
- [Security Checklist](docs/security/SECURITY_CHECKLIST.md) - Complete security review

## Quick Start

```bash
npm install
npm run dev              # Start dev server
npm test                 # Run tests
npm run security:all     # Security checks (159 tests)
```

## Essential Patterns

### Authentication

```typescript
import { createServerClient } from '@/lib/supabase';

const supabase = await createServerClient();
const { data: { user } } = await supabase.auth.getUser();

if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Critical**: Always use RLS-protected clients (`createServerClient()`, never `supabaseAdmin`) for user data.

👉 **Full Guide**: [docs/guides/authentication.md](docs/guides/authentication.md)

### API Routes

```typescript
import { handleApiError, NotFoundError } from '@/lib/api/errors';

export async function POST(request: Request) {
  try {
    // 1. Check auth
    // 2. Validate input
    // 3. Business logic
    // 4. Return response
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
```

👉 **Full Guide**: [docs/guides/api-patterns.md](docs/guides/api-patterns.md)

### Database Queries

**Critical Limitation**: Supabase cannot filter on nested relations. Always fetch parent IDs first:

```typescript
// Step 1: Get parent IDs
const { data: scenarios } = await supabase
  .from('scenarios')
  .select('id')
  .eq('project_id', projectId);

const scenarioIds = scenarios?.map(s => s.id) || [];

// Step 2: Filter children
const { data: outputs } = await supabase
  .from('outputs')
  .select('*, ratings(*)')
  .in('scenario_id', scenarioIds);
```

👉 **Full Guide**: [docs/guides/database-queries.md](docs/guides/database-queries.md)

### AI Integration

**User-configured models** (generating outputs):

```typescript
import { resolveProvider } from '@/lib/ai/provider-resolver';
import { generateCompletion } from '@/lib/ai/generation';

const { provider, modelName, apiKey } = resolveProvider(
  modelConfig.model,
  userApiKeys
);

const { text, usage } = await generateCompletion({
  provider,
  model: modelName,
  temperature: modelConfig.temperature,
  systemPrompt: modelConfig.system_prompt,
  userMessage: scenario.input_text,
  apiKey,
});
```

**System operations** (extractions, insights):

```typescript
import { SYSTEM_MODEL_CONFIG } from '@/lib/ai/system-model-config';

const result = await generateCompletion({
  provider: SYSTEM_MODEL_CONFIG.provider,
  model: SYSTEM_MODEL_CONFIG.model,
  temperature: SYSTEM_MODEL_CONFIG.temperature,
  systemPrompt: 'You are an expert at...',
  userMessage: 'Analyze this data...',
});
```

👉 **Full Guide**: [docs/guides/ai-integration.md](docs/guides/ai-integration.md)

### Environment Variables

```typescript
import { env } from '@/lib/env';

const supabaseUrl = env.supabase.url;         // Type-safe, validated
const openaiKey = env.openai.apiKey;          // Optional, may be undefined
```

**Never use `process.env` directly** - always use the typed `env` module.

👉 **Full Guide**: [docs/guides/environment.md](docs/guides/environment.md)

## Security Checklist

Before implementing any feature:

- [ ] **Authentication**: Check auth in API routes (`createServerClient()`)
- [ ] **Authorization**: Use RLS-protected clients (never `supabaseAdmin` for user data)
- [ ] **Validation**: Validate inputs with Zod schemas
- [ ] **Sanitization**: Sanitize user content before rendering
- [ ] **Rate Limiting**: Apply rate limits to endpoints
- [ ] **Secrets**: Use `env` module, never hardcode keys
- [ ] **Testing**: Run security tests (`npm run security:all`)

👉 **Full Checklist**: [docs/security/SECURITY_CHECKLIST.md](docs/security/SECURITY_CHECKLIST.md)

## Design System

Use semantic color tokens, not hardcoded colors:

```tsx
// Primary actions
<Button>Save Changes</Button>              {/* bg-primary (indigo) */}

// Semantic tokens
<div className="bg-background">             {/* White/black (auto dark mode) */}
<p className="text-foreground">             {/* Almost black/white */}
<p className="text-muted-foreground">       {/* Gray-500/400 */}

// Logo component
<Logo size="lg" />                          {/* Triangle + wordmark */}
```

**Colors**: Indigo primary (#6366f1), monochrome base, high contrast

👉 **Full Specs**: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)

## Testing

```bash
npm test                 # All unit/integration tests
npm run test:e2e         # Playwright E2E tests
npm test -- --coverage   # Coverage report
npm run security:all     # All security checks (159 tests)
```

**When to write tests**:
- ✅ New utility functions
- ✅ API route handlers
- ✅ Reusable components
- ✅ Bug fixes (write failing test first)
- ✅ Security features

👉 **Full Guide**: [docs/guides/testing.md](docs/guides/testing.md)

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run type-check       # TypeScript check

# Testing
npm test                 # Unit tests
npm run test:e2e         # E2E tests
npm run test:coverage    # Coverage report

# Security
npm run security:all     # All security checks
npm run security:scan    # ESLint security rules
npm run security:secrets # Scan for secrets

# Database
supabase start           # Start local Supabase
npm run supabase:gen-types # Generate types from schema
```

## Code Organization

```
lib/
├── ai/                  # AI provider resolution, generation
├── api/                 # Error handling, API client
├── security/            # Sanitization, rate limiting
├── supabase/            # Database clients
├── utils/               # Pure utilities
├── validation/          # Zod schemas
└── env.ts               # Type-safe environment

types/
├── api.ts               # API request/response contracts
├── database.ts          # JSONB column types
└── supabase.ts          # Generated Supabase types
```

👉 **Full Guide**: [docs/guides/code-organization.md](docs/guides/code-organization.md)

## Documentation Structure

```
docs/
├── guides/                           # Detailed topic guides
│   ├── authentication.md             # Auth & RLS patterns
│   ├── api-patterns.md               # Error handling, validation
│   ├── database-queries.md           # Supabase query patterns
│   ├── ai-integration.md             # AI providers, generation
│   ├── testing.md                    # Testing patterns
│   ├── environment.md                # Environment variables
│   └── code-organization.md          # Directory structure
├── security/
│   ├── SECURITY_CHECKLIST.md         # Complete security review
│   ├── PROMPT_INJECTION_ANALYSIS.md  # Prompt injection defense
│   └── sprint-*.md                   # Security sprint summaries
├── product-spec.md                   # MVP requirements
└── DESIGN_SYSTEM.md                  # UI/UX specifications
```

## Getting Help

**Authentication issues?** → [docs/guides/authentication.md](docs/guides/authentication.md)

**Database query not working?** → [docs/guides/database-queries.md](docs/guides/database-queries.md)

**API route patterns?** → [docs/guides/api-patterns.md](docs/guides/api-patterns.md)

**AI integration?** → [docs/guides/ai-integration.md](docs/guides/ai-integration.md)

**Security question?** → [docs/security/SECURITY_CHECKLIST.md](docs/security/SECURITY_CHECKLIST.md)

**Design system clarification?** → [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)

**Testing patterns?** → [docs/guides/testing.md](docs/guides/testing.md)

**Environment variables?** → [docs/guides/environment.md](docs/guides/environment.md)

**Code organization?** → [docs/guides/code-organization.md](docs/guides/code-organization.md)

## Development Workflow

### Adding New Features

1. **Plan**: Break down into small tasks (use TodoWrite tool)
2. **Types First**: Define TypeScript types
3. **Write Tests**: Create tests for expected behavior
4. **Implement**: Build with type safety
5. **Test**: Verify all tests pass
6. **Security**: Run security checks
7. **Document**: Update docs if patterns change

### Refactoring Safely

1. **Tests First**: Ensure existing tests cover code
2. **Small Steps**: Make incremental changes
3. **Run Tests**: After each change
4. **Type Check**: `npm run build`
5. **Commit Often**: Small commits

### Code Review Checklist

- [ ] Tests pass (`npm test`)
- [ ] Type check passes (`npm run build`)
- [ ] Security tests pass (`npm run security:all`)
- [ ] No `any` types (except truly necessary)
- [ ] Error handling comprehensive
- [ ] RLS enforced (no `supabaseAdmin` for user data)
- [ ] Environment variables use `env` module
- [ ] API routes use standardized error handling
- [ ] Complex logic has tests
- [ ] Code follows patterns in this guide

## Key Principles

1. **Type Safety First** - Use TypeScript strictly, avoid `any`
2. **Security by Default** - Always check auth, validate inputs, sanitize outputs
3. **Test Critical Paths** - 100% coverage for security, high coverage for utilities
4. **Avoid Over-Engineering** - Keep it simple, add abstractions only when needed
5. **Documentation** - Update docs when patterns change

## Resources

- **Product**: [docs/product-spec.md](docs/product-spec.md)
- **Design**: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)
- **Security**: [docs/security/SECURITY_CHECKLIST.md](docs/security/SECURITY_CHECKLIST.md)
- **Guides**: [docs/guides/](docs/guides/) (8 detailed topic guides)
