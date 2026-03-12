# Sageloop — Agent Orientation

## What is Sageloop?

Sageloop is a behavioral design tool for AI products — "Figma for AI Evals." Product managers define test scenarios, run them against a configured AI model, rate the outputs, and extract behavioral patterns. Those patterns become a test suite that can be exported and run in CI/CD. It is a local-first, open-source tool with no authentication layer and no cloud dependency.

## Tech Stack

| Layer        | Technology                                 |
| ------------ | ------------------------------------------ |
| Framework    | Next.js 16 (App Router), React 19          |
| Language     | TypeScript (strict)                        |
| Database     | SQLite via `better-sqlite3`                |
| ORM          | Drizzle ORM                                |
| Styling      | Tailwind CSS, shadcn/ui (Radix primitives) |
| AI Providers | OpenAI SDK, Anthropic SDK                  |
| Validation   | Zod                                        |
| Testing      | Vitest, Playwright                         |

## Project Structure

```
sageloop/
├── app/
│   ├── api/                   # API route handlers
│   │   ├── projects/          # Project CRUD + nested resources
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── generate/  # AI output generation
│   │   │       ├── extract/   # Pattern extraction
│   │   │       ├── scenarios/
│   │   │       ├── versions/
│   │   │       └── export/
│   │   ├── outputs/
│   │   │   └── [outputId]/ratings/
│   │   ├── ratings/[id]/
│   │   ├── models/            # Available model list
│   │   ├── settings/config/   # Read/write sageloop.config.yaml
│   │   └── jobs/[jobId]/      # Background job polling
│   └── (pages)/               # Next.js page routes
├── components/                # React components (flat, no subdirs)
├── lib/
│   ├── db/
│   │   ├── schema.ts          # Drizzle table definitions
│   │   └── index.ts           # DB singleton + auto-migrate
│   ├── ai/                    # AI provider resolution + generation
│   ├── api/
│   │   └── errors.ts          # ApiError classes + handleApiError
│   ├── security/              # Input validation, prompt injection checks
│   ├── validation/            # Zod schemas
│   ├── queue/                 # p-queue background job runner
│   ├── config.ts              # sageloop.config.yaml loader
│   ├── env.ts                 # Environment variable access
│   └── utils.ts               # Shared utilities (parseId, etc.)
├── types/                     # TypeScript type definitions
├── drizzle/                   # Auto-generated SQL migrations
├── sageloop.db                # SQLite database file (gitignored)
└── sageloop.config.yaml       # User config file (gitignored)
```

## Dev Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm run type-check   # TypeScript check without emitting
npm test             # Run unit tests with Vitest
npm run test:e2e     # Run Playwright end-to-end tests
```

## Database

### Schema (lib/db/schema.ts)

Tables are defined with Drizzle's `sqliteTable`. JSON data is stored as `text` and parsed on read.

```typescript
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  model_config: text("model_config"), // JSON string — parse on read
  created_at: text("created_at").default(sql`(current_timestamp)`),
  updated_at: text("updated_at").default(sql`(current_timestamp)`),
});

export const ratings = sqliteTable("ratings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  output_id: integer("output_id")
    .notNull()
    .references(() => outputs.id, { onDelete: "cascade" }),
  stars: integer("stars"),
  tags: text("tags"), // JSON string
  metadata: text("metadata"), // JSON string
  created_at: text("created_at").default(sql`(current_timestamp)`),
});
```

### Getting the DB instance (lib/db/index.ts)

The DB is a singleton. Auto-migration runs on first access.

```typescript
import { getDb, schema } from "@/lib/db";

const db = getDb();

// Select
const rows = db
  .select()
  .from(schema.projects)
  .orderBy(desc(schema.projects.created_at))
  .all();

// Insert + return
const data = db
  .insert(schema.ratings)
  .values({ output_id: 1, stars: 4 })
  .returning()
  .get();

// Filter
const row = db
  .select()
  .from(schema.outputs)
  .where(eq(schema.outputs.id, outputId))
  .get();
```

### JSON Column Pattern

JSON columns are declared as `text` in the schema. Serialize on write, parse on read:

```typescript
// Write
db.insert(schema.projects)
  .values({
    model_config: JSON.stringify(model_config),
  })
  .get();

// Read
const data = rows.map((p) => ({
  ...p,
  model_config: p.model_config ? JSON.parse(p.model_config) : null,
}));
```

## API Routes

No authentication middleware. All routes follow this structure:

1. Parse and validate request body
2. Call `getDb()` and run Drizzle query
3. Parse JSON columns before returning
4. Catch all errors and return a JSON error response

### Real example — POST /api/projects

```typescript
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { desc } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, model_config } = body;

    if (!name || !model_config) {
      return NextResponse.json(
        { error: "Name and model_config are required" },
        { status: 400 },
      );
    }

    const db = getDb();
    const data = db
      .insert(schema.projects)
      .values({
        name,
        model_config: JSON.stringify(model_config),
      })
      .returning()
      .get();

    return NextResponse.json(
      {
        data: {
          ...data,
          model_config: data.model_config
            ? JSON.parse(data.model_config)
            : null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### Dynamic route params

In Next.js App Router, params are a `Promise` and must be awaited:

```typescript
interface RouteParams {
  params: Promise<{ outputId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  const { outputId: outputIdString } = await params;
  const outputId = parseId(outputIdString); // lib/utils.ts helper
  // ...
}
```

### Error classes (lib/api/errors.ts)

```typescript
import {
  handleApiError,
  NotFoundError,
  ValidationError,
} from "@/lib/api/errors";

// Available error classes:
throw new ValidationError("Field is required", { field: "name" });
throw new NotFoundError("Project"); // → 404
throw new UnauthorizedError(); // → 401 (rare — no auth layer)

// In catch block:
return handleApiError(error); // returns NextResponse with correct status
```

## Config System

Users configure API keys and model selection via `sageloop.config.yaml` in the project root. The file is optional — the app works without it (keys can be set via the settings UI, which calls `POST /api/settings/config`).

```yaml
# sageloop.config.yaml
openai_api_key: sk-...
anthropic_api_key: sk-ant-...
output_model: gpt-4o-mini
system_model: claude-haiku-4-5-20251001
```

Load config in server code via `lib/config.ts`:

```typescript
import { getConfig, hasAnyApiKey } from "@/lib/config";

const config = getConfig();
// config.openai_api_key, config.anthropic_api_key, config.output_model, config.system_model

if (!hasAnyApiKey()) {
  // No keys configured — prompt user to set them
}
```

`getConfig()` caches after first read. `saveConfig()` writes the YAML and clears the cache.

## Key Conventions

- **Path alias**: Use `@/` for all internal imports (e.g., `@/lib/db`, `@/components/rating-form`).
- **JSON columns**: All complex data (arrays, objects) is stored as TEXT. Always `JSON.stringify` on write and `JSON.parse` on read. Guard with a null check: `value ? JSON.parse(value) : null`.
- **No auth layer**: There is no session, JWT, or user concept. All API routes are open. This is a local-first tool.
- **Zod for validation**: Use Zod schemas for request body validation on complex routes. Simple routes may do manual checks inline.
- **Drizzle query style**: Use `.get()` for single rows, `.all()` for arrays. Never use raw SQL unless unavoidable.
- **`parseId` utility**: Use `parseId(string)` from `@/lib/utils` to safely convert URL param strings to integers.
- **Error responses**: Return `{ error: "message" }` JSON with an appropriate HTTP status. Use `handleApiError` from `@/lib/api/errors` when using the error class hierarchy.

## Adding New Tables

1. Add the table definition to `lib/db/schema.ts` following the existing pattern.
2. Generate a migration:
   ```bash
   npx drizzle-kit generate
   ```
3. Apply it (or let the app auto-migrate on next startup):
   ```bash
   npx drizzle-kit migrate
   ```
   The `getDb()` singleton calls `migrate()` automatically on first use, so migrations in the `drizzle/` folder are applied at runtime.
