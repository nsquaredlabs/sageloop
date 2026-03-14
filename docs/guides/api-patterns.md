# API Patterns Guide

This guide covers API route patterns, error handling, request validation, and the type-safe API client.

## Overview

Sageloop uses Next.js API routes with standardized patterns for:

- Error handling with custom error classes
- Request validation with Zod schemas
- Type-safe frontend API client
- Consistent response formats

## API Route Structure

### Basic Pattern

```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { handleApiError, UnauthorizedError } from "@/lib/api/errors";

export async function POST(request: Request) {
  try {
    // 1. Authentication
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    // 2. Parse and validate request
    const body = await request.json();
    // ... validation ...

    // 3. Business logic
    const result = await doSomething(body);

    // 4. Return success response
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Error Handling

### Standardized Error Classes

Use custom error classes for consistent API responses:

```typescript
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  handleApiError,
} from "@/lib/api/errors";

// 401 - Not authenticated
throw new UnauthorizedError();

// 403 - Authenticated but not authorized
throw new ForbiddenError("Project");

// 404 - Resource not found
throw new NotFoundError("Project");

// 400 - Invalid input
throw new ValidationError("Invalid request data", zodError.errors);

// 429 - Too many requests
throw new RateLimitError(60); // Retry after 60 seconds
```

### Error Handler

Always wrap API routes with try-catch and use `handleApiError()`:

```typescript
export async function POST(request: Request) {
  try {
    // ... your logic ...
  } catch (error) {
    return handleApiError(error);
  }
}
```

The `handleApiError()` function:

- Converts error classes to appropriate HTTP responses
- Logs errors for debugging
- Sanitizes error messages (doesn't expose internal details)
- Returns consistent JSON format

### Complete Example

```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import {
  handleApiError,
  UnauthorizedError,
  NotFoundError,
} from "@/lib/api/errors";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!project) {
      throw new NotFoundError("Project");
    }

    return NextResponse.json({ data: project });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Error Response Format

All errors return consistent JSON:

```typescript
{
  error: string;        // Human-readable error message
  code?: string;        // Error code (e.g., 'RATE_LIMIT_EXCEEDED')
  details?: any;        // Additional error details (validation errors, etc.)
  retryAfter?: number;  // For rate limit errors
}
```

## Request Validation

### Zod Schemas

Always validate request bodies with Zod schemas:

```typescript
import { createProjectSchema } from "@/lib/validation/schemas";
import { ValidationError } from "@/lib/api/errors";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate with Zod
    const validatedData = createProjectSchema.parse(body);

    // validatedData is now type-safe and validated
    const { name, model_config } = validatedData;

    // ... continue with logic ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid request data", error.errors);
    }
    throw error;
  }
}
```

### Available Schemas

Located in `lib/validation/schemas.ts`:

- `createProjectSchema` - Project creation/update
- `createScenarioSchema` - Scenario creation
- `createRatingSchema` - Rating creation with feedback
- `generateOutputsSchema` - Output generation request
- `extractPatternsSchema` - Pattern extraction request

### Schema Example

```typescript
// lib/validation/schemas.ts
export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  model_config: z.object({
    model: z.string(),
    temperature: z.number().min(0).max(2),
    system_prompt: z.string().max(10000),
  }),
});
```

### Validation Limits

To prevent resource exhaustion (CWE-400):

| Field Type     | Limit        | Purpose                    |
| -------------- | ------------ | -------------------------- |
| Scenario input | 10,000 chars | Prevent excessive AI costs |
| Feedback text  | 5,000 chars  | Reasonable feedback length |
| Tag array      | 10 tags      | Prevent abuse              |
| Tag length     | 50 chars     | Reasonable tag size        |
| Project name   | 100 chars    | UI constraint              |
| System prompt  | 10,000 chars | AI context window          |

### Custom Validation

For complex validation logic:

```typescript
const body = await request.json();
const validatedData = createProjectSchema.parse(body);

// Additional business logic validation
if (
  validatedData.model_config.temperature > 1.5 &&
  validatedData.model_config.model === "gpt-4"
) {
  throw new ValidationError("Temperature above 1.5 not recommended for GPT-4");
}
```

## Type-Safe API Client

### Frontend API Usage

Use the type-safe API client in frontend components:

```typescript
import { projectApi, scenarioApi } from "@/lib/api/client";

// Create project
const project = await projectApi.create({
  name: "My Project",
  model_config: {
    model: "gpt-4",
    temperature: 0.7,
    system_prompt: "You are helpful.",
  },
});

// Update project
const updated = await projectApi.update(project.id, {
  name: "Updated Name",
});

// Generate outputs
const result = await projectApi.generateOutputs(project.id, {
  scenarioIds: [1, 2, 3],
});

// Retest with new prompt
const retest = await projectApi.retest(project.id, {
  scenarioIds: [1, 2, 3],
  newSystemPrompt: "Updated prompt",
  improvementNote: "Fixed issue X",
});
```

### API Client Benefits

1. **Type Safety** - Full TypeScript support for requests and responses
2. **Error Handling** - Automatically throws on non-2xx responses
3. **Consistent Interface** - Same patterns across all endpoints
4. **Auto-Refresh** - Built-in router refresh after mutations

### API Client Structure

```typescript
// lib/api/client.ts

export const projectApi = {
  create: async (data: CreateProjectData) => {
    /* ... */
  },
  update: async (id: number, data: UpdateProjectData) => {
    /* ... */
  },
  delete: async (id: number) => {
    /* ... */
  },
  generateOutputs: async (id: number, data: GenerateData) => {
    /* ... */
  },
  retest: async (id: number, data: RetestData) => {
    /* ... */
  },
  extract: async (id: number) => {
    /* ... */
  },
  integrateFixes: async (id: number, data: IntegrateFixesData) => {
    /* ... */
  },
};

export const scenarioApi = {
  create: async (projectId: number, data: CreateScenarioData) => {
    /* ... */
  },
  update: async (id: number, data: UpdateScenarioData) => {
    /* ... */
  },
  delete: async (id: number) => {
    /* ... */
  },
};

export const ratingApi = {
  create: async (outputId: number, data: CreateRatingData) => {
    /* ... */
  },
  update: async (id: number, data: UpdateRatingData) => {
    /* ... */
  },
};
```

### Adding New Endpoints

When adding a new API endpoint:

1. **Create the API route** with validation and error handling
2. **Define types** in `types/api.ts`
3. **Add to API client** in `lib/api/client.ts`

Example:

```typescript
// types/api.ts
export interface CreateCommentData {
  projectId: number;
  text: string;
}

export interface Comment {
  id: number;
  projectId: number;
  text: string;
  createdAt: string;
}

// lib/api/client.ts
export const commentApi = {
  create: async (data: CreateCommentData): Promise<Comment> => {
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create comment");
    }

    const result = await response.json();
    return result.data;
  },
};
```

## Response Formats

### Success Response

```typescript
return NextResponse.json({
  success: true,
  data: result,
});
```

### Success Response with Metadata

```typescript
return NextResponse.json({
  success: true,
  data: results,
  metadata: {
    total: 42,
    page: 1,
    pageSize: 10,
  },
});
```

### Error Response

```typescript
return NextResponse.json(
  {
    error: "Resource not found",
    code: "NOT_FOUND",
    details: { resourceType: "Project", resourceId: 123 },
  },
  { status: 404 },
);
```

## Rate Limiting

### Apply Rate Limits

Use the `withRateLimit` HOC for all API routes:

```typescript
import { withRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";

// Authentication endpoints (strictest)
export const POST = withRateLimit(
  async (request: Request) => {
    // Handler logic
  },
  RATE_LIMITS.auth, // 5 per 15 min
);

// Generation endpoints (expensive operations)
export const POST = withRateLimit(
  async (request: Request) => {
    // Handler logic
  },
  RATE_LIMITS.generation, // 20 per hour
);

// General API endpoints
export const POST = withRateLimit(
  async (request: Request) => {
    // Handler logic
  },
  RATE_LIMITS.api, // 100 per hour
);
```

### Rate Limit Configurations

| Type                     | Max Requests | Window | Purpose                      |
| ------------------------ | ------------ | ------ | ---------------------------- |
| `RATE_LIMITS.auth`       | 5            | 15 min | Prevent brute force          |
| `RATE_LIMITS.generation` | 20           | 1 hour | Protect AI operations        |
| `RATE_LIMITS.export`     | 30           | 1 hour | Limit exports                |
| `RATE_LIMITS.api`        | 100          | 1 hour | General API abuse prevention |

See [Security Checklist](../security/SECURITY_CHECKLIST.md) for more details.

## Common Patterns

### Paginated Response

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("projects")
    .select("*", { count: "exact" })
    .range(from, to);

  return NextResponse.json({
    success: true,
    data,
    metadata: {
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  });
}
```

### File Upload

```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    throw new ValidationError("No file provided");
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new ValidationError("File must be an image");
  }

  // Validate file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new ValidationError("File too large (max 10MB)");
  }

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from("uploads")
    .upload(`${user.id}/${Date.now()}-${file.name}`, file);

  if (error) throw error;

  return NextResponse.json({ success: true, data });
}
```

### Streaming Response

```typescript
export async function POST(request: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      // Stream data in chunks
      for (let i = 0; i < 10; i++) {
        const chunk = `Chunk ${i}\n`;
        controller.enqueue(new TextEncoder().encode(chunk));
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain",
      "Transfer-Encoding": "chunked",
    },
  });
}
```

## Security Best Practices

### Always Check Authentication

```typescript
export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new UnauthorizedError();
  }

  // Continue...
}
```

### Validate All Inputs

```typescript
const validatedData = schema.parse(body);
```

### Sanitize User Content

```typescript
import { sanitize } from "@/lib/security/sanitize";

const safeContent = sanitize.userContent(userInput);
```

### Apply Rate Limiting

```typescript
export const POST = withRateLimit(handler, RATE_LIMITS.api);
```

### Use Type-Safe Errors

```typescript
throw new NotFoundError("Resource"); // Not throw new Error()
```

## Testing API Routes

### Unit Test Example

```typescript
import { POST } from "@/app/api/projects/route";
import { createMockRequest } from "@/tests/utils/mock-request";

describe("POST /api/projects", () => {
  it("should create a project", async () => {
    const request = createMockRequest({
      method: "POST",
      body: {
        name: "Test Project",
        model_config: {
          /* ... */
        },
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("Test Project");
  });

  it("should reject unauthenticated requests", async () => {
    // Mock unauthenticated user
    const request = createMockRequest({ method: "POST" });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toMatch(/unauthorized/i);
  });
});
```

## Troubleshooting

### "CORS error"

Next.js API routes don't have CORS issues when called from the same origin. If you see CORS errors:

- Check you're calling the correct URL
- Ensure you're not mixing HTTP/HTTPS
- Verify Vercel deployment settings

### "Body already used"

Can't call `request.json()` multiple times. Store the result:

```typescript
const body = await request.json(); // Do this once
const validatedData = schema.parse(body); // Use stored body
```

### "Route not found"

- Check file is in correct location (`app/api/...`)
- Verify file is named `route.ts` (not `route.tsx` or other)
- Check dynamic segment syntax: `[id]` not `{id}`

## Related Documentation

- [Authentication Guide](authentication.md) - Auth patterns for API routes
- [Database Queries Guide](database-queries.md) - Querying from API routes
- [Security Checklist](../security/SECURITY_CHECKLIST.md) - Security best practices
- [Environment Guide](environment.md) - Using API keys in routes
