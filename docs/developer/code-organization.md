# Code Organization

## Directory Structure

```
sageloop/
├── app/                                  # Next.js App Router
│   ├── projects/                         # Project pages
│   │   ├── page.tsx                      # Projects list
│   │   └── [id]/                         # Project detail routes
│   │       ├── page.tsx
│   │       └── ...
│   ├── api/                              # API routes
│   │   ├── projects/
│   │   │   ├── route.ts                  # GET /api/projects, POST
│   │   │   └── [id]/
│   │   │       ├── route.ts              # PATCH, DELETE
│   │   │       ├── generate/route.ts
│   │   │       ├── extract/route.ts
│   │   │       ├── extractions/route.ts
│   │   │       ├── retest/route.ts
│   │   │       ├── integrate-fixes/route.ts
│   │   │       ├── export/route.ts
│   │   │       ├── versions/route.ts
│   │   │       └── scenarios/
│   │   │           ├── route.ts
│   │   │           ├── bulk/route.ts
│   │   │           └── [scenarioId]/route.ts
│   │   ├── outputs/
│   │   │   └── [outputId]/ratings/route.ts
│   │   ├── ratings/
│   │   │   └── [id]/route.ts
│   │   ├── jobs/
│   │   │   └── [jobId]/route.ts
│   │   ├── models/route.ts
│   │   └── settings/config/route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                               # shadcn/ui primitives
│   └── ...                              # Feature components
├── lib/
│   ├── ai/
│   │   ├── default-models.ts             # Model lists
│   │   ├── generation.ts                 # generateCompletion()
│   │   ├── provider-resolver.ts          # Model → provider mapping
│   │   └── system-model-config.ts        # System model constant
│   ├── analysis/
│   │   ├── analysis-helpers.ts
│   │   ├── fingerprint-generator.ts
│   │   └── pattern-detection.ts
│   ├── api/
│   │   ├── client.ts                     # Typed frontend fetch client
│   │   └── errors.ts                     # ApiError classes
│   ├── db/
│   │   ├── index.ts                      # getDb() singleton
│   │   └── schema.ts                     # Drizzle table definitions
│   ├── export/
│   │   ├── jest-template.ts
│   │   └── pytest-template.ts
│   ├── hooks/
│   │   ├── index.ts
│   │   ├── useApiPost.ts
│   │   ├── useAvailableModels.ts
│   │   └── useJobPolling.ts
│   ├── queue/
│   │   └── generation-queue.ts           # Async generation job queue
│   ├── security/
│   │   ├── headers.ts
│   │   ├── prompt-validation.ts          # Injection detection
│   │   ├── response-validation.ts        # AI response sanity checks
│   │   ├── sanitize.ts
│   │   └── sanitize-utils.ts
│   ├── validation/
│   │   ├── dimensional-analysis.ts       # Zod schema for extraction response
│   │   └── schemas.ts                    # General request schemas
│   ├── config.ts                         # sageloop.config.yaml reader
│   ├── env.ts                            # NODE_ENV helpers
│   ├── metrics.ts
│   ├── utils.ts                          # parseId and misc helpers
│   ├── openai.ts                         # OpenAI client factory
│   └── anthropic.ts                      # Anthropic client factory
├── types/
│   ├── api.ts                            # Request/response contracts
│   └── database.ts                       # JSON column type interfaces
├── drizzle/                              # SQL migration files (generated)
├── tests/
│   ├── unit/
│   ├── components/
│   ├── api/
│   ├── integration/
│   ├── security/
│   └── e2e/
├── docs/
│   ├── developer/                        # This guide and others
│   ├── product/
│   └── security/
├── public/
├── sageloop.config.yaml                  # API keys and model config (gitignored)
├── sageloop.db                           # SQLite database (gitignored)
└── package.json
```

## File Naming

- **Components**: PascalCase (`ProjectCard.tsx`)
- **Utilities and modules**: kebab-case (`string-similarity.ts`)
- **API routes**: always `route.ts`
- **Constants**: SCREAMING_SNAKE_CASE (`SYSTEM_MODEL_CONFIG`)

## Import Order

```typescript
// 1. External packages
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

// 2. Internal modules (use @/ alias, not relative paths)
import { getDb, schema } from "@/lib/db";
import { handleApiError, NotFoundError } from "@/lib/api/errors";
import { parseId } from "@/lib/utils";

// 3. Types
import type { ModelConfig } from "@/types/database";
```

Always use `@/` for imports. Relative paths (`../../lib/...`) are not allowed.

## Code Principles

### Separation of concerns

Route handlers should orchestrate; business logic lives in `lib/`:

```typescript
// Route handler (thin)
export async function POST(request: Request) {
  const body = await request.json();
  validate(body);
  const result = await doWork(body);
  return NextResponse.json({ data: result });
}

// lib/ (the actual logic)
async function doWork(data: WorkData) { ... }
```

### Extract reusable logic

When the same code appears in two or more routes, move it to `lib/`:

```typescript
// lib/utils/metrics.ts
export function calculateSuccessRate(ratings: Rating[]): number { ... }
```

### Type safety first

Define types before writing implementations:

```typescript
// types/database.ts
export interface ModelConfig {
  model: string;
  temperature: number;
  system_prompt: string;
}

// Use in route
const config = JSON.parse(project.model_config) as ModelConfig;
```

### Avoid over-engineering

Create abstractions only when you have three or more similar use cases. Simple inline code is better than a premature pattern.

### Early returns over nesting

```typescript
// Bad
if (row) {
  if (row.project_id === projectId) {
    // do the work
  }
}

// Good
if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
if (row.project_id !== projectId)
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
// do the work
```

## Type Organization

### `types/database.ts` — JSON column shapes

```typescript
export interface ModelConfig {
  model: string;
  temperature: number;
  system_prompt: string;
}

export interface ExtractionCriteria {
  name: string;
  description: string;
  weight: number;
}
```

### `types/api.ts` — Request/response contracts

```typescript
export interface CreateProjectRequest {
  name: string;
  model_config: ModelConfig;
  description?: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
  model_config: ModelConfig;
  created_at: string;
}
```

## Code Review Checklist

- [ ] All imports use `@/` alias
- [ ] No `any` types (use proper types or generics)
- [ ] JSON columns are parsed when read, stringified when written
- [ ] Error handling is complete (try/catch with 500 fallback)
- [ ] Functions are small and focused
- [ ] No magic numbers (use named constants)
- [ ] Tests exist for new logic
- [ ] No deep nesting (use early returns)
