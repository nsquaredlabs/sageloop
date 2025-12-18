# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: Sageloop

Sageloop is a behavioral design tool for AI products - "Figma for AI Evals." It enables Product Managers to define what "good" AI behavior looks like through examples and ratings, rather than code.

### The Problem We Solve

In traditional product development, designers create mockups in Figma that serve as the spec. For AI products, there's no equivalent artifact that defines acceptable behavior for probabilistic outputs. PMs write vague requirements ("make it helpful"), engineers write prompts, and no one can agree on what "right" looks like.

### Our Solution

Sageloop creates a shared artifact for AI behavior quality:
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

Sageloop uses Supabase Auth with Row Level Security (RLS) for data protection.

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

## Design System

Sageloop follows a modern design system inspired by Linear, Vercel, and Stripe. Full specifications are in `docs/DESIGN_SYSTEM.md`.

### Core Principles

1. **High Contrast** - Almost black (#0a0a0a) on pure white for readability
2. **Single Accent Color** - Indigo (#6366f1) for primary actions, used sparingly
3. **Monochrome Base** - True black/white, minimal grays
4. **Generous Spacing** - Let content breathe
5. **Clean Typography** - Regular (400) and Semibold (600) only

### Color Usage

**Always use semantic color tokens** - never hardcode colors.

#### Correct Usage ✅

```tsx
// Backgrounds
<div className="bg-background">            {/* White */}
<div className="bg-secondary">             {/* Light gray #f5f5f5 */}
<div className="bg-muted">                 {/* Light gray #f5f5f5 */}

// Text
<p className="text-foreground">            {/* Almost black #0a0a0a */}
<p className="text-muted-foreground">      {/* Gray-500 #6b7280 */}

// Primary Actions (Indigo)
<Button>Save</Button>                       {/* Uses bg-primary automatically */}
<Button variant="default">Save</Button>    {/* Explicit primary */}
<a className="text-primary">Link</a>       {/* Indigo link */}

// Secondary Actions
<Button variant="outline">Cancel</Button>  {/* Border with bg-background */}
<Button variant="secondary">Option</Button>{/* Light gray bg */}
<Button variant="ghost">Menu</Button>      {/* Transparent with hover */}

// Borders
<div className="border border-border">     {/* Gray-200 #e5e7eb */}
<Input />                                  {/* Uses border-input */}

// Focus States
<Input className="focus:ring-primary" />   {/* Indigo focus ring */}
```

#### Incorrect Usage ❌

```tsx
// Don't hardcode colors
<div className="bg-blue-600">              {/* ❌ Use bg-primary */}
<div className="bg-gray-50">               {/* ❌ Use bg-background or bg-secondary */}
<p className="text-gray-900">              {/* ❌ Use text-foreground */}
<button className="bg-indigo-500">         {/* ❌ Use bg-primary */}

// Don't use multiple accent colors
<Button className="bg-purple-600">         {/* ❌ Stick to indigo */}
<a className="text-blue-500">              {/* ❌ Use text-primary for indigo */}
```

### When to Use Each Color

| Token | Usage | Example |
|-------|-------|---------|
| `primary` | Primary CTA buttons, links, focus states | "Save", "Create", "Generate" buttons |
| `secondary` | Secondary backgrounds, less emphasis | Disabled states, secondary sections |
| `muted` | Backgrounds for less important content | Code blocks, secondary cards |
| `muted-foreground` | Secondary text, captions, metadata | Helper text, timestamps, labels |
| `border` | Dividers, card borders, input borders | Card outlines, section separators |
| `destructive` | Dangerous actions, errors | "Delete", "Remove" buttons |

### Logo Component

Use the Logo component for consistent branding:

```tsx
import { Logo } from '@/components/ui/logo';

// In navigation (large)
<Logo size="lg" />

// In auth pages (large, centered)
<div className="flex flex-col items-center">
  <Logo size="lg" />
</div>

// Icon only (no wordmark)
<Logo showWordmark={false} />

// Small size for secondary locations
<Logo size="sm" />
```

**Logo Specifications**:
- Triangle inside circle design
- Dark container (gray-900) with white logo
- Always paired with "Sageloop" wordmark by default
- Three sizes: sm (16px), md (24px), lg (32px)
- Automatically inverts colors in dark mode

### Utility Classes

The design system provides utility classes for common patterns:

```tsx
// Gradient accent (indigo to purple)
<div className="gradient-accent">
  {/* Indigo-purple gradient background */}
</div>

// Gradient text
<h1 className="gradient-text">
  {/* Text with indigo-purple gradient */}
</h1>

// Text balance (better headline wrapping)
<h1 className="text-balance">
  Long headline that wraps nicely
</h1>
```

### Typography Patterns

Use limited font weights for clean hierarchy:

```tsx
// Headlines - Semibold (600)
<h1 className="text-5xl font-bold">       {/* Large headlines */}
<h2 className="text-3xl font-bold">       {/* Section headlines */}
<h3 className="text-2xl font-semibold">   {/* Card titles */}

// Body - Regular (400)
<p className="text-base">                 {/* Default body text */}
<p className="text-sm text-muted-foreground"> {/* Captions */}

// Avoid
<p className="font-medium">               {/* ❌ Not part of design system */}
<p className="font-light">                {/* ❌ Not part of design system */}
```

### Button Patterns

Buttons automatically use the design system colors:

```tsx
// Primary action (indigo)
<Button>Save Changes</Button>

// Secondary action (outlined)
<Button variant="outline">Cancel</Button>

// Less emphasis (ghost)
<Button variant="ghost">Options</Button>

// Dangerous action (red)
<Button variant="destructive">Delete</Button>

// Secondary background
<Button variant="secondary">Alternative</Button>

// With hover states
<Button className="hover:bg-primary/90">
  {/* Primary with opacity on hover */}
</Button>
```

### Card Patterns

Cards use semantic tokens automatically:

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>                        {/* White bg, gray border */}
  <CardHeader>
    <CardTitle>Title</CardTitle>    {/* Foreground color */}
    <CardDescription>              {/* Muted foreground */}
      Description
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content with proper spacing */}
  </CardContent>
</Card>
```

### Spacing Patterns

Follow consistent spacing:

```tsx
// Section spacing
<section className="py-20">        {/* 80px vertical */}
<section className="py-24">        {/* 96px vertical */}

// Card spacing
<Card className="p-6">             {/* 24px padding */}
<Card className="p-8">             {/* 32px padding */}

// Element spacing
<div className="space-y-4">        {/* 16px between children */}
<div className="space-y-6">        {/* 24px between children */}
<div className="space-y-8">        {/* 32px between children */}

// Container padding
<div className="px-6 sm:px-8 lg:px-12">  {/* Responsive padding */}
```

### Border Radius

Use consistent border radius:

```tsx
<div className="rounded-lg">      {/* 8px - small elements */}
<div className="rounded-xl">      {/* 12px - medium elements */}
<div className="rounded-2xl">     {/* 16px - large cards */}
<div className="rounded-full">    {/* Full - avatars, badges */}
```

### Dark Mode

Dark mode is supported via the `.dark` class. Colors automatically invert:

```tsx
// These automatically work in dark mode
<div className="bg-background text-foreground">
  {/* White bg + black text → Black bg + white text */}
</div>

<Logo />  {/* Gray-900 → White container automatically */}

// Explicit dark mode variants (if needed)
<div className="bg-white dark:bg-gray-900">
  {/* Manual dark mode control */}
</div>
```

### Design System Checklist

When creating new components:

- [ ] Use semantic color tokens (no hardcoded colors)
- [ ] Use only font-weight 400 (regular) or 600 (semibold)
- [ ] Use consistent spacing (multiples of 4px)
- [ ] Use consistent border radius (lg, xl, 2xl)
- [ ] Test in both light and dark mode
- [ ] Use Logo component for branding
- [ ] Follow button/card patterns from examples

### Migration from Old Colors

If you encounter old color patterns:

| Old (Before) | New (Design System) |
|-------------|---------------------|
| `bg-blue-600` | `bg-primary` |
| `text-blue-600` | `text-primary` |
| `bg-gray-50` | `bg-background` or `bg-secondary` |
| `text-gray-900` | `text-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `border-gray-200` | `border-border` |
| Hardcoded "Sageloop" text | `<Logo size="lg" />` |

### Resources

- **Full Design System**: `docs/DESIGN_SYSTEM.md`
- **Implementation Notes**: Color HSL values, utilities
- **Sprint Summaries**: `docs/design-sprint-0-summary.md`, `docs/design-sprint-1-summary.md`
- **Color Variables**: `app/globals.css` (CSS variables)
- **Tailwind Config**: `tailwind.config.ts` (color tokens)

## Security Patterns

Sageloop follows security best practices based on OWASP guidelines and SUSVIBES research findings. All security patterns are documented in [docs/security/SECURITY_CHECKLIST.md](docs/security/SECURITY_CHECKLIST.md).

### Security Testing

**Always run security tests before committing**:
```bash
npm test tests/security/        # All security tests (159 tests)
npm run security:all            # All security checks
npm run security:secrets        # Scan for hardcoded secrets
```

**Test Coverage**: 159 security tests covering:
- Authentication & Authorization (10 tests)
- Row Level Security (6 tests)
- Input Validation (15 tests)
- Sanitization (40 tests)
- Security Headers (24 tests)
- Rate Limiting (19 tests)
- API Keys (13 tests)
- Middleware (14 tests)
- Secrets Management (18 tests)

### Authentication & Authorization

**ALWAYS check authentication in API routes**:

```typescript
// ✅ CORRECT: Check auth in every protected route
import { createServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Continue with authenticated logic
  // RLS automatically filters data by user's workbenches
}

// ❌ WRONG: No auth check
export async function POST(request: Request) {
  // Anyone can call this!
}
```

**NEVER use `supabaseAdmin` for user-facing queries**:

```typescript
// ❌ WRONG: Bypasses RLS, exposes all data
import { supabaseAdmin } from '@/lib/supabase/admin';

const { data } = await supabaseAdmin
  .from('projects')
  .select('*'); // Returns ALL projects from ALL users!

// ✅ CORRECT: Use RLS-protected client
import { createServerClient } from '@/lib/supabase';

const supabase = await createServerClient();
const { data } = await supabase
  .from('projects')
  .select('*'); // Returns only user's accessible projects
```

**RLS Pattern**: All user data is protected by Row Level Security:
```
User → Workbenches (via user_workbenches) → Projects → Scenarios → Outputs → Ratings
```

### Input Validation

**ALWAYS validate user input with Zod schemas**:

```typescript
// ✅ CORRECT: Validate all inputs
import { createProjectSchema } from '@/lib/validation/schemas';
import { z } from 'zod';

export async function POST(request: Request) {
  const body = await request.json();

  try {
    const validatedData = createProjectSchema.parse(body);
    // validatedData is now type-safe and validated
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
  }
}

// ❌ WRONG: No validation
export async function POST(request: Request) {
  const { name } = await request.json();
  // name could be 1MB string, cause resource exhaustion!
}
```

**Validation Limits** (prevents CWE-400 resource exhaustion):

| Field Type | Limit | Schema |
|-----------|-------|--------|
| Scenario input | 10,000 chars | `createScenarioSchema` |
| Feedback text | 5,000 chars | `createRatingSchema` |
| Tag array | 10 tags | `createRatingSchema` |
| Tag length | 50 chars | `createRatingSchema` |
| Project name | 100 chars | `createProjectSchema` |
| Description | 500 chars | `createProjectSchema` |

### Sanitization

**ALWAYS sanitize user content before rendering**:

```typescript
// ✅ CORRECT: Sanitize HTML
import { sanitize } from '@/lib/security/sanitize';

// HTML content (allows safe tags like <b>, <i>)
const safeHtml = sanitize.userContent(userInput);
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />

// Plain text (strips all HTML)
const safePlainText = sanitize.plainText(userInput);

// Filenames (prevents path traversal)
const safeFilename = sanitize.filename(project.name);

// URLs (blocks javascript:, data:, etc.)
const safeUrl = sanitize.url(userProvidedUrl);

// ❌ WRONG: No sanitization
<div dangerouslySetInnerHTML={{ __html: userInput }} />
// XSS vulnerability!
```

**Available sanitization functions**:
- `sanitize.userContent(html)` - Allow safe HTML tags
- `sanitize.plainText(html)` - Strip all HTML
- `sanitize.filename(name)` - Prevent path traversal (CWE-22)
- `sanitize.url(url)` - Block dangerous protocols
- `sanitize.csv(cell)` - Prevent CSV formula injection
- `sanitize.header(value)` - Prevent CRLF injection (CWE-93)
- `sanitize.email(email)` - Validate and normalize email
- `sanitize.truncate(text, maxLength)` - Limit string length

### Rate Limiting

**ALWAYS apply rate limiting to API routes**:

```typescript
// ✅ CORRECT: Use withRateLimit HOC
import { withRateLimit, RATE_LIMITS } from '@/lib/security/rate-limit';

// Authentication endpoints (strictest)
export const POST = withRateLimit(
  async (request: Request) => {
    // Handler logic
  },
  RATE_LIMITS.auth // 5 per 15 min
);

// Generation endpoints (expensive operations)
export const POST = withRateLimit(
  async (request: Request) => {
    // Handler logic
  },
  RATE_LIMITS.generation // 20 per hour
);

// General API endpoints
export const POST = withRateLimit(
  async (request: Request) => {
    // Handler logic
  },
  RATE_LIMITS.api // 100 per hour
);

// ❌ WRONG: No rate limiting
export async function POST(request: Request) {
  // Can be abused with unlimited requests!
}
```

**Rate Limit Configurations**:

| Type | Max Requests | Window | Purpose |
|------|--------------|--------|---------|
| `RATE_LIMITS.auth` | 5 | 15 min | Prevent brute force attacks (CWE-307) |
| `RATE_LIMITS.generation` | 20 | 1 hour | Protect expensive AI operations |
| `RATE_LIMITS.export` | 30 | 1 hour | Limit resource-intensive exports |
| `RATE_LIMITS.api` | 100 | 1 hour | Prevent general API abuse (CWE-400) |

**Custom Rate Limits**:

```typescript
// Custom configuration
export const POST = withRateLimit(
  async (request: Request) => {
    // Handler logic
  },
  {
    maxRequests: 50,
    windowMs: 30 * 60 * 1000, // 30 minutes
    message: 'Too many requests to this endpoint',
  }
);

// User-based rate limiting (instead of IP)
export const POST = withRateLimit(
  async (request: Request) => {
    // Handler logic
  },
  {
    maxRequests: 100,
    windowMs: 60 * 60 * 1000,
    keyGenerator: (req) => {
      const userId = req.headers.get('x-user-id');
      return userId || 'anonymous';
    },
  }
);
```

### Secrets Management

**ALWAYS use the `env` module for environment variables**:

```typescript
// ✅ CORRECT: Use typed env module
import { env } from '@/lib/env';

const openaiKey = env.openai.apiKey;       // Type-safe, validated
const supabaseUrl = env.supabase.url;       // Required, throws if missing
const anthropicKey = env.anthropic.apiKey;  // Optional, may be undefined

// ❌ WRONG: Use process.env directly
const openaiKey = process.env.OPENAI_API_KEY; // Not type-safe
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!; // No validation
```

**NEVER hardcode secrets**:

```typescript
// ❌ WRONG: Hardcoded API key
const OPENAI_KEY = 'sk-proj-abc123...';

// ❌ WRONG: Committed in .env file
// .env.local should NEVER be committed (in .gitignore)

// ✅ CORRECT: Use environment variables
import { env } from '@/lib/env';
const apiKey = env.openai.apiKey;
```

**ALWAYS mask API keys in logs and errors**:

```typescript
// ✅ CORRECT: Mask sensitive data
const maskApiKey = (key: string): string => {
  if (key.length < 10) return '***';
  return key.slice(0, 7) + '...' + key.slice(-4);
};

console.log('Using API key:', maskApiKey(apiKey));
// Output: "sk-proj...3456"

// ❌ WRONG: Log full API keys
console.log('API Key:', apiKey); // Exposed in logs!
```

**NEVER expose API keys in HTTP responses**:

```typescript
// ✅ CORRECT: Return boolean flags
return NextResponse.json({
  openai: !!apiKeys.openai_key,
  anthropic: !!apiKeys.anthropic_key,
});

// ❌ WRONG: Return actual keys
return NextResponse.json({
  openai_key: apiKeys.openai_key, // Exposed to client!
});
```

**Environment Variable Classification**:

| Prefix | Exposure | Usage |
|--------|----------|-------|
| `NEXT_PUBLIC_*` | ✅ Browser-safe | Public keys, URLs |
| No prefix | ❌ Server-only | API keys, secrets |

**Protected Secrets**:
- `SUPABASE_SERVICE_ROLE_KEY` - Full database access (server-only)
- `OPENAI_API_KEY` - AI generation (server-only, optional)
- `ANTHROPIC_API_KEY` - AI generation (server-only, optional)

**Public Keys** (safe to expose):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Limited via RLS

### Database Security

**API keys are encrypted at rest using pgcrypto**:

```typescript
// Store encrypted API keys (automatic encryption)
await supabase.rpc('set_workbench_api_keys', {
  workbench_uuid: workbenchId,
  api_keys_json: {
    openai_key: 'sk-proj-...',
    anthropic_key: 'sk-ant-...',
  },
});

// Retrieve encrypted API keys (automatic decryption)
const { data: apiKeys } = await supabase.rpc('get_workbench_api_keys', {
  workbench_uuid: workbenchId,
});

// Check if keys are configured (returns booleans, NOT keys)
const { data: keyStatus } = await supabase.rpc('check_workbench_api_keys', {
  workbench_uuid: workbenchId,
});
// Returns: { openai: true, anthropic: false }
```

**Encryption Implementation**:
- **Algorithm**: PostgreSQL `pgp_sym_encrypt` (symmetric encryption)
- **Storage**: `encrypted_api_keys` column (text)
- **Functions**: `set_workbench_api_keys`, `get_workbench_api_keys`, `check_workbench_api_keys`
- **Security**: Functions use `security definer` with RLS enforcement

### Security Headers

**Automatically applied to all routes** via `next.config.ts`:

| Header | Value | Protection |
|--------|-------|------------|
| Content-Security-Policy | Restrictive CSP | XSS (CWE-79) |
| X-Frame-Options | DENY | Clickjacking (CWE-1021) |
| X-Content-Type-Options | nosniff | MIME sniffing (CWE-16) |
| Strict-Transport-Security | max-age=31536000 | HTTPS enforcement (CWE-693) |
| Referrer-Policy | strict-origin-when-cross-origin | URL leakage |
| Permissions-Policy | Restrictive | Feature restriction |

**CSP Configuration**:
- `default-src 'self'` - Only same-origin resources
- `script-src 'self' 'unsafe-inline' 'unsafe-eval'` - Next.js compatibility
- `frame-ancestors 'none'` - Prevent embedding
- `object-src 'none'` - Disallow plugins
- `upgrade-insecure-requests` - Force HTTPS

### Error Handling

**Use standardized error classes**:

```typescript
// ✅ CORRECT: Use error classes
import { handleApiError, NotFoundError, UnauthorizedError } from '@/lib/api/errors';

export async function GET(request: Request) {
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

    return NextResponse.json({ data: project });
  } catch (error) {
    return handleApiError(error);
  }
}

// ❌ WRONG: Generic errors, expose details
export async function GET(request: Request) {
  throw new Error(`Project ${projectId} not found in database`);
  // Exposes internal details!
}
```

**Available Error Classes**:
- `UnauthorizedError()` - 401 (not authenticated)
- `ForbiddenError(resource)` - 403 (not authorized)
- `NotFoundError(resource)` - 404 (resource not found)
- `ValidationError(message, details)` - 400 (invalid input)
- `RateLimitError(retryAfter)` - 429 (too many requests)

### Security Checklist for New Features

Before implementing a new feature, review:

1. **Authentication**: Does it need auth? Add `user` check.
2. **Authorization**: Does RLS protect the data? Use `createServerClient()`.
3. **Validation**: Validate all inputs with Zod schemas.
4. **Sanitization**: Sanitize user content before rendering.
5. **Rate Limiting**: Apply rate limits to prevent abuse.
6. **Secrets**: Use `env` module, never hardcode keys.
7. **Testing**: Add security tests for new endpoints/features.

### Security Resources

**Documentation**:
- [Security Checklist](docs/security/SECURITY_CHECKLIST.md) - Complete review guide
- [Sprint 0 Summary](docs/security/sprint-0-summary.md) - Initial assessment
- [Sprint 1 Summary](docs/security/sprint-1-summary.md) - Headers & sanitization
- [Sprint 2 Summary](docs/security/sprint-2-summary.md) - Validation & rate limiting
- [Sprint 3 Summary](docs/security/sprint-3-summary.md) - Secrets management
- [Sprint 4 Summary](docs/security/sprint-4-summary.md) - Documentation

**Commands**:
```bash
# Run all security checks
npm run security:all

# Individual checks
npm run security:scan     # ESLint security rules
npm run security:deps     # Dependency vulnerabilities  
npm run security:secrets  # Secrets detection

# Security tests
npm test tests/security/  # All 159 security tests
```

**Libraries Used**:
- **Zod**: Input validation ([lib/validation/schemas.ts](lib/validation/schemas.ts))
- **DOMPurify**: HTML sanitization ([lib/security/sanitize.ts](lib/security/sanitize.ts))
- **pgcrypto**: Database encryption (Supabase extension)
- **Gitleaks**: Secrets detection ([.gitleaks.toml](.gitleaks.toml))

**External Resources**:
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)

### CWEs Addressed

Security implementation addresses these Common Weakness Enumerations:

| CWE | Vulnerability | Protection |
|-----|--------------|------------|
| CWE-79 | Cross-Site Scripting (XSS) | CSP + DOMPurify sanitization |
| CWE-89 | SQL Injection | Parameterized queries (Supabase) |
| CWE-22 | Path Traversal | Filename sanitization |
| CWE-93 | CRLF Injection | Header sanitization |
| CWE-200 | Information Exposure | Generic errors, key masking |
| CWE-307 | Brute Force | Auth rate limiting (5 per 15 min) |
| CWE-312 | Cleartext Storage | pgcrypto encryption |
| CWE-400 | Resource Exhaustion | Input limits + rate limiting |
| CWE-522 | Insufficiently Protected Credentials | Encrypted storage + access control |
| CWE-798 | Hard-coded Credentials | Gitleaks scanning, env validation |
| CWE-1021 | Clickjacking | X-Frame-Options + CSP |

