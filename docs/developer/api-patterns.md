# API Patterns

Sageloop uses Next.js App Router API routes (`app/api/**\/route.ts`). There is no authentication middleware — the app is local-first, single-user.

## Basic Route Structure

```typescript
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { parseId } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: idString } = await params;
    const id = parseId(idString);

    const db = getDb();
    const row = db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, id))
      .get();

    if (!row) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ data: row });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

Every handler follows this shape:

1. Parse and validate the request.
2. Call `getDb()` and run the query.
3. Return `NextResponse.json()`.
4. Wrap everything in try/catch; return 500 on unexpected errors.

## Parsing Route Params

Route params arrive as strings. Use `parseId` to convert to a number and throw if invalid:

```typescript
import { parseId } from "@/lib/utils";

const id = parseId(idString); // throws if NaN
```

In Next.js 15+, `params` is a `Promise` — always `await` it:

```typescript
const { id } = await params;
```

## Input Validation

Validate request bodies inline. Keep it simple — check required fields and basic types before touching the database.

```typescript
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

    if (!model_config.model) {
      return NextResponse.json(
        { error: "model_config.model is required" },
        { status: 400 },
      );
    }

    // ... continue
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

For complex schemas, Zod is available. Use it when the shape has many optional fields or nested constraints:

```typescript
import { z } from "zod";

const bodySchema = z.object({
  stars: z.number().int().min(1).max(5),
  feedback_text: z.string().max(5000).optional(),
});

const parsed = bodySchema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json(
    { error: "Invalid request", details: parsed.error.issues },
    { status: 400 },
  );
}
```

### Validation limits

| Field          | Limit        |
| -------------- | ------------ |
| Scenario input | 10,000 chars |
| System prompt  | 10,000 chars |
| Feedback text  | 5,000 chars  |
| Tag array      | 10 items     |
| Tag length     | 50 chars     |
| Project name   | 100 chars    |

These limits exist to prevent resource exhaustion and excessive AI costs, not to enforce business rules.

## Error Handling

The `lib/api/errors.ts` module provides typed error classes that map to HTTP status codes:

```typescript
import {
  handleApiError,
  NotFoundError,
  ValidationError,
} from "@/lib/api/errors";

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const row = db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.id, parseId(id)))
      .get();

    if (!row) throw new NotFoundError("Project");

    return NextResponse.json({ data: row });
  } catch (error) {
    return handleApiError(error);
  }
}
```

`handleApiError` converts `ApiError` subclasses to their HTTP status codes and returns generic 500 for anything else.

### Available error classes

```typescript
throw new NotFoundError("Project"); // 404 { error: "Project not found", code: "NOT_FOUND" }
throw new ValidationError("Bad input"); // 400 { error: "Bad input", code: "VALIDATION_ERROR" }
throw new UnauthorizedError(); // 401 (reserved; not used in local-first mode)
```

### Error response format

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": {}
}
```

If you prefer not to use `handleApiError`, inline error returns are fine for simple cases (as most routes do):

```typescript
return NextResponse.json({ error: "Project not found" }, { status: 404 });
```

## Success Response Format

Return a `data` key for single objects and lists:

```typescript
// Single object
return NextResponse.json({ data: project });

// List
return NextResponse.json({ data: projects });

// Created resource
return NextResponse.json({ data: project }, { status: 201 });

// No data (e.g. delete)
return NextResponse.json({ success: true });
```

## Real Example: POST /api/projects

From `app/api/projects/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { validateSystemPrompt } from "@/lib/security/prompt-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, model_config } = body;

    if (!name || !model_config) {
      return NextResponse.json(
        { error: "Name and model_config are required" },
        { status: 400 },
      );
    }

    if (!model_config.model) {
      return NextResponse.json(
        { error: "model_config.model is required" },
        { status: 400 },
      );
    }

    if (model_config.system_prompt) {
      const validation = validateSystemPrompt(model_config.system_prompt);
      if (!validation.isValid) {
        return NextResponse.json(
          {
            error: "System prompt failed security validation",
            details: validation.flags,
            risk: validation.risk,
          },
          { status: 400 },
        );
      }
    }

    const db = getDb();
    const data = db
      .insert(schema.projects)
      .values({
        name,
        description: description || null,
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

## Real Example: PATCH /api/ratings/[id]

From `app/api/ratings/[id]/route.ts`:

```typescript
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id: idString } = await params;
    const id = parseId(idString);
    const body = await request.json();
    const { stars, feedback_text, metadata } = body;

    if (!stars || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: "Valid star rating (1-5) is required" },
        { status: 400 },
      );
    }

    const db = getDb();
    const data = db
      .update(schema.ratings)
      .set({
        stars,
        feedback_text: feedback_text ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      })
      .where(eq(schema.ratings.id, id))
      .returning()
      .get();

    if (!data) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        ...data,
        tags: data.tags ? JSON.parse(data.tags) : null,
        metadata: data.metadata ? JSON.parse(data.metadata) : null,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## Frontend API Client

`lib/api/client.ts` provides typed fetch wrappers for use in React components:

```typescript
import { projectApi, scenarioApi, ratingApi } from "@/lib/api/client";

// Create
const project = await projectApi.create({ name, model_config });

// Update
await projectApi.update(id, { name, description, model_config });

// Generate outputs
await projectApi.generateOutputs(id, { scenarioIds: [1, 2, 3] });

// Rate an output
await ratingApi.create(outputId, { stars: 4, feedback_text: "Good" });
```

Each method throws on non-2xx responses. Catch errors in your component or let an error boundary handle them.

## Route Organization

```
app/api/
├── projects/
│   ├── route.ts                        # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts                    # PATCH (update), DELETE
│       ├── generate/route.ts           # POST — trigger output generation
│       ├── extract/route.ts            # POST — run pattern extraction
│       ├── extractions/route.ts        # GET — list extractions
│       ├── retest/route.ts             # POST — retest with new prompt
│       ├── integrate-fixes/route.ts    # POST — apply suggested fixes
│       ├── export/route.ts             # GET — export test suite
│       ├── versions/route.ts           # GET — list prompt versions
│       └── scenarios/
│           ├── route.ts                # GET (list), POST (create)
│           ├── bulk/route.ts           # POST — bulk create/replace
│           └── [scenarioId]/route.ts   # PATCH, DELETE
├── outputs/
│   └── [outputId]/
│       └── ratings/route.ts            # POST (create rating for output)
├── ratings/
│   └── [id]/route.ts                   # PATCH (update rating)
├── jobs/
│   └── [jobId]/route.ts                # GET (poll job status)
├── models/route.ts                     # GET (list available models)
└── settings/
    └── config/route.ts                 # GET, POST (read/write config)
```
