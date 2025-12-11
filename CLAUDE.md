# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Tellah

Tellah is a behavioral design tool for AI products - "Figma for AI Evals." It enables Product Managers to define what "good" AI behavior looks like through examples and ratings, rather than code.

### The Problem We Solve

In traditional product development, designers create mockups in Figma that serve as the spec. For AI products, there's no equivalent artifact that defines acceptable behavior for probabilistic outputs. PMs write vague requirements ("make it helpful"), engineers write prompts, and no one can agree on what "right" looks like.

### Our Solution

Tellah creates a shared artifact for AI behavior quality:
- PMs provide test scenarios and rate AI outputs
- The system extracts behavioral patterns from PM ratings (length, tone, structure, content)
- Both PM and engineer see real-time success metrics as prompts evolve
- Export golden examples and criteria as a test suite for CI/CD

Think of it as: PM taste → Behavioral spec → Test suite

### Tech Stack

- Frontend: Next.js 14 with React, TypeScript, Tailwind CSS
- Backend: Next.js API routes
- Database: Supabase (PostgreSQL + Auth + Storage + Real-time)
- Type Safety: Supabase CLI auto-generated types
- AI: OpenAI API for generation and pattern extraction
- Deployment: Vercel

## Getting Started

See [docs/product-spec.md](docs/product-spec.md) for detailed MVP requirements.

## Architecture

Full architecture documentation to be added as we build. Initial focus: simple web app with scenario management, AI output generation, rating interface, and pattern extraction.

## Database Query Patterns (Supabase)

**IMPORTANT**: Supabase has limitations when querying nested relations. Follow these patterns:

### ❌ DON'T: Filter on nested relation fields directly
```typescript
// This DOES NOT WORK - cannot filter on nested relations
const { data } = await supabase
  .from('outputs')
  .select('*, ratings(*)')
  .eq('scenario.project_id', projectId)  // ❌ Fails silently
  .gte('ratings.stars', 4);              // ❌ Fails silently
```

### ✅ DO: Fetch parent IDs first, then filter
```typescript
// Step 1: Get parent IDs
const { data: scenarios } = await supabase
  .from('scenarios')
  .select('id')
  .eq('project_id', projectId);

const scenarioIds = scenarios?.map(s => s.id) || [];

// Step 2: Filter using parent IDs
const { data: outputs } = await supabase
  .from('outputs')
  .select('*, ratings(*)')
  .in('scenario_id', scenarioIds);

// Step 3: Filter in application code
const filtered = outputs.filter(o =>
  o.ratings?.length > 0 && o.ratings[0].stars >= 4
);
```

### Common Patterns

**Pattern 1: Get data for a project through multiple relations**
```typescript
// projects → scenarios → outputs → ratings
const { data: scenarios } = await supabase
  .from('scenarios')
  .select('id')
  .eq('project_id', projectId);

const scenarioIds = scenarios?.map(s => s.id) || [];

const { data: outputs } = await supabase
  .from('outputs')
  .select('*, ratings(*), scenario:scenarios(id, input_text)')
  .in('scenario_id', scenarioIds);
```

**Pattern 2: Count records with filters**
```typescript
// Get count of rated outputs for a project
const { data: scenarios } = await supabase
  .from('scenarios')
  .select('id')
  .eq('project_id', projectId);

const scenarioIds = scenarios?.map(s => s.id) || [];

const { count } = await supabase
  .from('outputs')
  .select('*', { count: 'exact', head: true })
  .in('scenario_id', scenarioIds)
  .not('ratings', 'is', null);
```

**Why this matters**: Supabase PostgREST doesn't support filtering on nested embedded resources. Always fetch parent IDs first, then use `.in()` to filter children.

## Authentication & Authorization

Tellah uses Supabase Auth with Row Level Security (RLS) for data protection.

### Authentication Patterns

**Client Components (Browser)**
```typescript
'use client';

import { createClient } from '@/lib/supabase';

export function MyComponent() {
  const supabase = createClient();

  // Use supabase client for queries
  const { data } = await supabase.from('projects').select('*');
}
```

**Server Components & API Routes**
```typescript
import { createServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export async function MyPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // RLS automatically filters data by user's workbenches
  const { data: projects } = await supabase
    .from('projects')
    .select('*');
}
```

**API Routes - ALWAYS check auth**
```typescript
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Continue with authenticated logic
  // RLS ensures user can only access their data
}
```

### Row Level Security (RLS)

**CRITICAL**: All user-facing queries MUST use authenticated clients, never `supabaseAdmin`.

- `createClient()` - Browser client (client components)
- `createServerClient()` - Server client with cookie handling (Server Components/API routes)
- `supabaseAdmin` - **ONLY for system operations** (migrations, admin tasks)

**How RLS Works**
1. User signs up → Auto-creates personal workbench
2. Projects belong to workbenches
3. Users access projects through workbench membership
4. RLS policies automatically filter all queries by user's workbenches

**Example: Creating a Project**
```typescript
// Get user's first workbench
const { data: userWorkbenches } = await supabase
  .from('user_workbenches')
  .select('workbench_id')
  .limit(1)
  .single();

// Create project in user's workbench
const { data: project } = await supabase
  .from('projects')
  .insert({
    name: 'My Project',
    model_config: { /* ... */ },
    workbench_id: userWorkbenches.workbench_id,
    created_by: user.id
  })
  .select()
  .single();
```

**Data Relationships with RLS**
```
auth.users (Supabase managed)
    ↓ many-to-many
workbenches
    ↓ one-to-many
projects → scenarios → outputs → ratings
projects → extractions → metrics
```

All child records inherit access from projects through RLS policies.

## Code Organization & Best Practices

### Directory Structure

```
lib/
├── ai/
│   ├── provider-resolver.ts   # AI provider selection logic
│   ├── generation.ts           # Unified AI generation service
│   ├── system-model-config.ts  # System model configuration (extractions, insights, fixes)
│   └── types.ts                # AI-related types
├── api/
│   ├── errors.ts               # Standardized API error classes
│   └── client.ts               # Type-safe frontend API client
├── validation/
│   └── schemas.ts              # Zod validation schemas
├── utils/
│   ├── string-similarity.ts    # Levenshtein distance utilities
│   └── metrics.ts              # Metrics calculations
├── supabase/
│   ├── client.ts               # Browser client
│   ├── server.ts               # Server client
│   └── admin.ts                # Admin client (use sparingly)
└── env.ts                      # Type-safe environment variables

types/
├── api.ts                      # API request/response contracts
├── database.ts                 # JSONB column types
└── supabase.ts                 # Augmented Supabase types

components/
├── ui/                         # shadcn components
├── async-action-button.tsx     # Generic async action button
└── [feature]/                  # Feature-specific components
```

### Environment Variables

**ALWAYS use the typed `env` module** instead of `process.env`:

```typescript
// ❌ DON'T
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const apiKey = process.env.OPENAI_API_KEY;

// ✅ DO
import { env } from '@/lib/env';

const url = env.supabase.url;
const apiKey = env.openai.apiKey;
```

**Benefits**:
- Type-safe access to all environment variables
- Validation on startup (fails fast if required vars missing)
- Clear warnings for missing optional variables
- Centralized configuration

### API Error Handling

Use standardized error classes for consistent API responses:

```typescript
import { handleApiError, UnauthorizedError, NotFoundError, ValidationError } from '@/lib/api/errors';

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (!project) {
      throw new NotFoundError('Project');
    }

    // ... rest of logic ...

    return NextResponse.json({ success: true, data });

  } catch (error) {
    return handleApiError(error);
  }
}
```

### Type-Safe API Client

For frontend components, use the type-safe API client:

```typescript
import { projectApi, scenarioApi } from '@/lib/api/client';

// Fully typed requests and responses
const result = await projectApi.retest(projectId, {
  scenarioIds: [1, 2, 3],
  newSystemPrompt: 'Updated prompt',
  improvementNote: 'Fixed date handling',
});

// TypeScript knows the shape of result!
console.log(`Created version ${result.version}`);
```

### Request Validation

Use Zod schemas for all API request validation:

```typescript
import { createProjectSchema } from '@/lib/validation/schemas';
import { ValidationError } from '@/lib/api/errors';
import { z } from 'zod';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // validatedData is now type-safe and validated
    const { name, model_config } = validatedData;

  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data', error.errors);
    }
    throw error;
  }
}
```

### AI Provider Selection

**For user-configured models** (generating outputs based on user's project settings):

Use the provider resolver for consistent AI model selection:

```typescript
import { resolveProvider } from '@/lib/ai/provider-resolver';
import { generateCompletion } from '@/lib/ai/generation';

// Get user's API keys from workbench
const { data: apiKeys } = await supabase
  .from('workbench_api_keys')
  .select('openai_key, anthropic_key')
  .eq('workbench_id', workbenchId)
  .single();

// Resolve which provider to use
const { provider, modelName, apiKey, usingFallback } = resolveProvider(
  modelConfig.model,
  {
    openai: apiKeys?.openai_key,
    anthropic: apiKeys?.anthropic_key,
  }
);

// Generate completion
const { text, usage } = await generateCompletion({
  provider,
  model: modelName,
  temperature: modelConfig.temperature,
  systemPrompt: modelConfig.system_prompt,
  userMessage: scenario.input_text,
  apiKey,
});
```

**For system operations** (extractions, insights, applying fixes):

Use the centralized system model configuration:

```typescript
import { SYSTEM_MODEL_CONFIG } from '@/lib/ai/system-model-config';
import { generateCompletion } from '@/lib/ai/generation';

// All system operations use the same model/provider
const result = await generateCompletion({
  provider: SYSTEM_MODEL_CONFIG.provider,
  model: SYSTEM_MODEL_CONFIG.model,
  temperature: SYSTEM_MODEL_CONFIG.temperature,
  systemPrompt: 'You are an expert at...',
  userMessage: 'Analyze this data...',
  apiKey: undefined, // Uses system API key from env
});
```

**To change the system model**: Edit [lib/ai/system-model-config.ts](lib/ai/system-model-config.ts) once and it applies to all system operations (extractions, fix integration, future insights).

### Utility Functions

Extract reusable logic to utility modules:

```typescript
// For string similarity (used in rating carry-forward)
import { calculateSimilarity, areSimilar } from '@/lib/utils/string-similarity';

const similarity = calculateSimilarity(oldOutput, newOutput);
if (areSimilar(oldOutput, newOutput, 0.9)) {
  // Carry forward the rating
}
```

### Component Patterns

Use generic components to avoid duplication:

```typescript
import { AsyncActionButton } from '@/components/async-action-button';
import { Sparkles } from 'lucide-react';

// Instead of writing custom button logic, use the generic component
<AsyncActionButton
  label="Generate Outputs"
  loadingLabel="Generating outputs..."
  icon={Sparkles}
  apiEndpoint={`/api/projects/${projectId}/generate`}
  navigateTo={`/projects/${projectId}/outputs`}
  metadata={`${scenarioCount} scenarios`}
  refreshBeforeNavigate={true}
/>
```

## Testing Guidelines

### When to Write Tests

**ALWAYS write tests for**:
- New utility functions (pure logic)
- API route handlers (with mocked Supabase)
- Reusable components (especially generic ones)
- Bug fixes (write failing test first, then fix)

**Consider writing tests for**:
- Complex business logic
- Features with multiple edge cases
- Critical user flows (E2E tests)

**Don't write tests for**:
- Simple UI components that just render props
- One-off page layouts
- Configuration files

### Test Structure

```
tests/
├── unit/
│   ├── ai/                    # AI provider and generation tests
│   ├── api/                   # API client and error tests
│   └── utils/                 # Utility function tests
├── components/                # React component tests
├── api/                       # API route tests (with mocks)
├── integration/               # Integration tests
├── security/                  # RLS and auth tests
└── e2e/                       # Playwright end-to-end tests
```

### Running Tests

```bash
# All tests
npm test

# Specific file
npm test -- tests/unit/utils/string-similarity.test.ts

# Watch mode
npm test

# With coverage
npm test -- --coverage

# E2E tests only
npm run test:e2e
```

### Test Writing Workflow

**For bug fixes**:
1. Write a failing test that reproduces the bug
2. Run the test - it should FAIL
3. Fix the bug
4. Run the test - it should PASS
5. Commit test + fix together

**For new features**:
1. Write tests for the expected behavior
2. Implement the feature
3. Run tests to verify correctness
4. Refactor with confidence (tests prevent regressions)

### Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { calculateSimilarity } from '@/lib/utils/string-similarity';

describe('calculateSimilarity', () => {
  it('should return 1.0 for identical strings', () => {
    expect(calculateSimilarity('hello', 'hello')).toBe(1.0);
  });

  it('should return 0.0 for completely different strings', () => {
    expect(calculateSimilarity('abc', 'xyz')).toBe(0.0);
  });

  it('should handle the retest use case', () => {
    const oldOutput = 'The capital of France is Paris.';
    const newOutput = 'The capital of France is Paris!';

    const similarity = calculateSimilarity(oldOutput, newOutput);
    expect(similarity).toBeGreaterThan(0.9); // Very similar
  });
});
```

### Mocking in Tests

Tests use mocked environment variables and services:

```typescript
// Environment variables are auto-mocked in tests/setup.ts
import { env } from '@/lib/env';
// env.supabase.url is available in tests

// Mock fetch for API client tests
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ success: true }),
  } as Response)
);

// Mock Next.js router (already set up in tests/setup.ts)
// useRouter, usePathname, etc. are available
```

### Test Coverage Goals

| Layer | Coverage Target | Priority |
|-------|----------------|----------|
| Critical Security Paths | 100% | 🔴 Required |
| Utility Functions | 90% | 🟡 High |
| API Routes | 80% | 🟡 High |
| Components | 70% | 🟢 Medium |
| E2E Happy Paths | 100% | 🟡 High |

## Development Workflow

### Adding New Features

1. **Plan**: Break down the feature into small tasks
2. **Types First**: Define TypeScript types and interfaces
3. **Write Tests**: Create tests for expected behavior
4. **Implement**: Build the feature with type safety
5. **Test**: Verify all tests pass
6. **Review**: Check for code quality and best practices
7. **Document**: Update CLAUDE.md if patterns change

### Refactoring Safely

1. **Tests First**: Ensure existing tests cover the code
2. **Small Steps**: Make incremental changes
3. **Run Tests**: After each change, verify tests still pass
4. **Type Check**: Run `npm run build` to catch type errors
5. **Commit Often**: Small commits are easier to debug

### Code Review Checklist

Before considering code complete:

- [ ] All tests pass (`npm test`)
- [ ] Type check passes (`npm run build`)
- [ ] No `any` types (except where truly necessary)
- [ ] Error handling is comprehensive
- [ ] Security: RLS is enforced (no `supabaseAdmin` in pages)
- [ ] Environment variables use `env` module
- [ ] API routes use standardized error handling
- [ ] Complex logic has tests
- [ ] Code follows existing patterns in this document
