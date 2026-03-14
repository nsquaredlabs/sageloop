# Code Organization Guide

This guide covers directory structure, file organization, and code best practices in Sageloop.

## Overview

Sageloop follows a modular architecture with clear separation of concerns:

- **app/** - Next.js App Router pages and API routes
- **components/** - React components
- **lib/** - Core business logic and utilities
- **types/** - TypeScript type definitions
- **tests/** - Test files

## Directory Structure

```
sageloop/
├── app/                           # Next.js App Router
│   ├── (auth)/                    # Auth route group
│   │   ├── login/
│   │   └── signup/
│   ├── projects/                  # Projects pages
│   │   ├── [id]/                  # Dynamic project routes
│   │   │   ├── page.tsx
│   │   │   ├── outputs/
│   │   │   └── scenarios/
│   │   └── page.tsx
│   ├── api/                       # API routes
│   │   ├── projects/
│   │   │   ├── route.ts           # /api/projects
│   │   │   └── [id]/
│   │   │       ├── route.ts       # /api/projects/[id]
│   │   │       ├── generate/
│   │   │       └── extract/
│   │   └── scenarios/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   └── globals.css                # Global styles
├── components/
│   ├── ui/                        # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── logo.tsx
│   │   └── ...
│   ├── async-action-button.tsx   # Generic components
│   └── [feature]/                 # Feature-specific components
├── lib/
│   ├── ai/
│   │   ├── provider-resolver.ts   # AI provider selection
│   │   ├── generation.ts          # AI generation service
│   │   ├── system-model-config.ts # System model config
│   │   └── types.ts
│   ├── api/
│   │   ├── errors.ts              # Error classes
│   │   └── client.ts              # Frontend API client
│   ├── security/
│   │   ├── sanitize.ts            # Content sanitization
│   │   ├── rate-limit.ts          # Rate limiting
│   │   └── prompt-validation.ts   # Prompt injection defense
│   ├── supabase/
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client
│   │   └── admin.ts               # Admin client
│   ├── utils/
│   │   ├── string-similarity.ts   # Utility functions
│   │   └── metrics.ts
│   ├── validation/
│   │   └── schemas.ts             # Zod schemas
│   └── env.ts                     # Type-safe env module
├── types/
│   ├── api.ts                     # API contracts
│   ├── database.ts                # JSONB types
│   └── supabase.ts                # Generated Supabase types
├── tests/
│   ├── unit/
│   ├── components/
│   ├── api/
│   ├── security/
│   └── e2e/
├── docs/
│   ├── guides/                    # THIS GUIDE and others
│   ├── security/
│   ├── product-spec.md
│   └── DESIGN_SYSTEM.md
├── public/                        # Static assets
├── supabase/                      # Supabase migrations
└── package.json
```

## File Naming Conventions

### Components

- **PascalCase** for component files: `AsyncActionButton.tsx`
- **kebab-case** for CSS modules: `async-action-button.module.css`
- **Feature-based organization**: Group related components

### Non-Components

- **kebab-case** for utilities: `string-similarity.ts`
- **kebab-case** for API routes: `[id]/generate/route.ts`
- **SCREAMING_SNAKE_CASE** for constants: `SYSTEM_MODEL_CONFIG`

## Code Organization Principles

### 1. Separation of Concerns

Each module has a single responsibility:

```typescript
// ❌ Bad: Mixed concerns
// api/projects/route.ts
export async function POST(request: Request) {
  // Auth logic
  // Validation logic
  // Database logic
  // AI generation logic
  // All mixed together
}

// ✅ Good: Separated concerns
// api/projects/route.ts
export async function POST(request: Request) {
  const user = await requireAuth(request); // lib/auth
  const data = validateProjectCreate(body); // lib/validation
  const project = await createProject(data, user); // lib/database
  return NextResponse.json({ data: project });
}
```

### 2. Extract Reusable Logic

Move reusable code to `lib/`:

```typescript
// ❌ Bad: Duplicated logic in routes
// api/projects/route.ts
const similarity = levenshteinDistance(a, b) / Math.max(a.length, b.length);

// api/scenarios/route.ts
const similarity = levenshteinDistance(a, b) / Math.max(a.length, b.length);

// ✅ Good: Extracted to utility
// lib/utils/string-similarity.ts
export function calculateSimilarity(a: string, b: string): number {
  return levenshteinDistance(a, b) / Math.max(a.length, b.length);
}

// Usage in multiple places
import { calculateSimilarity } from "@/lib/utils/string-similarity";
```

### 3. Type Safety First

Define types before implementing:

```typescript
// 1. Define types
interface CreateProjectData {
  name: string;
  model_config: ModelConfig;
}

interface Project {
  id: number;
  name: string;
  model_config: ModelConfig;
  created_at: string;
}

// 2. Implement with types
async function createProject(data: CreateProjectData): Promise<Project> {
  // Implementation is type-safe
}
```

### 4. Avoid Over-Engineering

Keep it simple:

```typescript
// ❌ Bad: Over-engineered for one-off use
class ProjectService {
  constructor(private supabase: SupabaseClient) {}
  async create(data: CreateProjectData) {
    /* ... */
  }
  async update(id: number, data: UpdateProjectData) {
    /* ... */
  }
  async delete(id: number) {
    /* ... */
  }
}

// ✅ Good: Simple functions for current needs
export async function createProject(data: CreateProjectData) {
  /* ... */
}
export async function updateProject(id: number, data: UpdateProjectData) {
  /* ... */
}
```

Only create abstractions when you have 3+ similar use cases.

## Import Organization

### Import Order

```typescript
// 1. External packages
import { NextResponse } from "next/server";
import { z } from "zod";

// 2. Internal modules (using @/ alias)
import { createServerClient } from "@/lib/supabase";
import { handleApiError, NotFoundError } from "@/lib/api/errors";
import { validateProjectCreate } from "@/lib/validation/schemas";

// 3. Types
import type { Database } from "@/types/supabase";
import type { Project } from "@/types/api";

// 4. Relative imports (avoid if possible)
import { helperFunction } from "./helper";
```

### Use Path Aliases

Always use `@/` for imports:

```typescript
// ❌ Bad: Relative imports
import { createClient } from "../../../lib/supabase/client";

// ✅ Good: Absolute with alias
import { createClient } from "@/lib/supabase/client";
```

## API Route Organization

### Structure

```
api/
├── projects/
│   ├── route.ts                   # GET /api/projects, POST /api/projects
│   └── [id]/
│       ├── route.ts               # GET /api/projects/[id], PATCH, DELETE
│       ├── generate/
│       │   └── route.ts           # POST /api/projects/[id]/generate
│       ├── extract/
│       │   └── route.ts           # POST /api/projects/[id]/extract
│       └── integrate-fixes/
│           └── route.ts           # POST /api/projects/[id]/integrate-fixes
└── scenarios/
    ├── route.ts                   # POST /api/scenarios
    └── [id]/
        └── route.ts               # PATCH /api/scenarios/[id], DELETE
```

### Route Template

```typescript
// app/api/resource/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { handleApiError, UnauthorizedError } from "@/lib/api/errors";
import { withRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

async function handler(request: Request) {
  try {
    // 1. Auth
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new UnauthorizedError();

    // 2. Validate
    const body = await request.json();
    const validated = schema.parse(body);

    // 3. Business logic
    const result = await doSomething(validated);

    // 4. Response
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

// Apply rate limiting
export const POST = withRateLimit(handler, RATE_LIMITS.api);
```

## Component Organization

### UI Components

Located in `components/ui/` (shadcn/ui):

```typescript
// components/ui/button.tsx
export interface ButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  // ...
}

export function Button({ variant = "default", ...props }: ButtonProps) {
  // ...
}
```

### Feature Components

Group by feature:

```typescript
// components/project-card.tsx
export function ProjectCard({ project }: { project: Project }) {
  // ...
}

// components/scenario-list.tsx
export function ScenarioList({ scenarios }: { scenarios: Scenario[] }) {
  // ...
}
```

### Generic Components

Reusable across features:

```typescript
// components/async-action-button.tsx
export interface AsyncActionButtonProps {
  label: string;
  loadingLabel?: string;
  apiEndpoint: string;
  navigateTo?: string;
}

export function AsyncActionButton(props: AsyncActionButtonProps) {
  // Generic implementation
}
```

## Type Organization

### Database Types

Auto-generated from Supabase:

```bash
npm run supabase:gen-types
```

```typescript
// types/supabase.ts
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          /* ... */
        };
        Insert: {
          /* ... */
        };
        Update: {
          /* ... */
        };
      };
    };
  };
};
```

### API Types

Request/response contracts:

```typescript
// types/api.ts

// Request types
export interface CreateProjectRequest {
  name: string;
  model_config: ModelConfig;
}

// Response types
export interface CreateProjectResponse {
  success: true;
  data: Project;
}

export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}
```

### Domain Types

Business logic types:

```typescript
// types/database.ts

// JSONB column types
export interface ModelConfig {
  model: string;
  temperature: number;
  system_prompt: string;
}

export interface ExtractionData {
  summary: string;
  failure_analysis: FailureAnalysis;
  success_patterns: string[];
}
```

## Utility Organization

### Pure Functions

No side effects, easy to test:

```typescript
// lib/utils/string-similarity.ts

export function calculateSimilarity(a: string, b: string): number {
  // Pure function: same inputs = same output
  const distance = levenshteinDistance(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}
```

### Service Functions

Interact with external services:

```typescript
// lib/ai/generation.ts

export async function generateCompletion(
  config: GenerationConfig,
): Promise<GenerationResult> {
  // Calls external AI API
}
```

## Best Practices

### 1. No Magic Numbers

```typescript
// ❌ Bad
if (text.length > 10000) {
  /* ... */
}

// ✅ Good
const MAX_PROMPT_LENGTH = 10000;
if (text.length > MAX_PROMPT_LENGTH) {
  /* ... */
}
```

### 2. Descriptive Names

```typescript
// ❌ Bad
function calc(a, b) {
  /* ... */
}

// ✅ Good
function calculateSimilarity(text1: string, text2: string) {
  /* ... */
}
```

### 3. Small Functions

```typescript
// ❌ Bad: 200-line function doing everything

// ✅ Good: Small, focused functions
async function createProject(data: CreateProjectData) {
  const workbench = await getDefaultWorkbench(user);
  const project = await insertProject(data, workbench);
  await initializeProjectDefaults(project);
  return project;
}
```

### 4. Avoid Deep Nesting

```typescript
// ❌ Bad: Nested conditionals
if (user) {
  if (project) {
    if (hasPermission) {
      // Do something
    }
  }
}

// ✅ Good: Early returns
if (!user) throw new UnauthorizedError();
if (!project) throw new NotFoundError("Project");
if (!hasPermission) throw new ForbiddenError("Project");

// Do something
```

### 5. Use TypeScript Features

```typescript
// ✅ Use strict types
type Status = "pending" | "in_progress" | "completed";

// ✅ Use optional chaining
const rating = output.ratings?.[0];

// ✅ Use nullish coalescing
const temperature = config.temperature ?? 0.7;

// ✅ Use type guards
if (typeof value === "string") {
  // TypeScript knows value is string here
}
```

## Avoiding Common Pitfalls

### 1. Don't Bypass Type Safety

```typescript
// ❌ Bad
const data = someData as any;

// ✅ Good
const data = someData as ExpectedType;
// Or even better, validate:
const data = schema.parse(someData);
```

### 2. Don't Skip Error Handling

```typescript
// ❌ Bad
const { data } = await supabase.from("projects").select("*");

// ✅ Good
const { data, error } = await supabase.from("projects").select("*");
if (error) throw error;
```

### 3. Don't Use `any` Types

```typescript
// ❌ Bad
function process(data: any) {
  /* ... */
}

// ✅ Good
function process(data: ProcessData) {
  /* ... */
}
// Or if truly generic:
function process<T>(data: T) {
  /* ... */
}
```

### 4. Don't Create Unnecessary Abstractions

```typescript
// ❌ Bad: Premature abstraction
class DatabaseRepository<T> {
  // Generic CRUD for all tables
}

// ✅ Good: Specific functions as needed
async function getProject(id: number) {
  /* ... */
}
async function createProject(data: CreateProjectData) {
  /* ... */
}
```

## Code Review Checklist

Before considering code complete:

- [ ] All imports use `@/` alias (not relative paths)
- [ ] No `any` types (use proper types or generics)
- [ ] Error handling is comprehensive
- [ ] Functions are small and focused
- [ ] No magic numbers (use constants)
- [ ] Tests are written for new logic
- [ ] Types are defined before implementation
- [ ] No deep nesting (use early returns)
- [ ] Code follows existing patterns
- [ ] Documentation is updated if needed

## Related Documentation

- [API Patterns Guide](api-patterns.md) - API route organization
- [Testing Guide](testing.md) - Test file organization
- [Design System](../DESIGN_SYSTEM.md) - Component design patterns
