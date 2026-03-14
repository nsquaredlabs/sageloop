# Testing Guide

This guide covers testing patterns, frameworks, and workflows in Sageloop.

## Overview

Sageloop uses a comprehensive testing strategy:

- **Unit tests** - Pure logic and utilities (Vitest)
- **Component tests** - React components (Vitest + Testing Library)
- **API tests** - API routes with mocks (Vitest)
- **Integration tests** - Cross-module functionality (Vitest)
- **Security tests** - Auth, RLS, validation, rate limiting (Vitest)
- **E2E tests** - Full user workflows (Playwright)

**Test count**: 159 security tests + unit/integration tests

## Test Framework

### Vitest

Primary test runner for all non-E2E tests:

```bash
npm test                    # Run all tests
npm test -- --watch         # Watch mode
npm test -- path/to/test    # Specific file
npm test -- --coverage      # Coverage report
```

Configuration: `vitest.config.ts`

### Playwright

End-to-end testing framework:

```bash
npm run test:e2e           # Run E2E tests
npm run test:e2e:ui        # Interactive UI
```

Configuration: `playwright.config.ts`

## When to Write Tests

### ALWAYS write tests for:

✅ **New utility functions** - Pure logic
✅ **API route handlers** - With mocked Supabase
✅ **Reusable components** - Generic UI components
✅ **Bug fixes** - Write failing test first, then fix
✅ **Security features** - Auth, validation, sanitization

### Consider writing tests for:

🟡 **Complex business logic**
🟡 **Features with multiple edge cases**
🟡 **Critical user flows** - E2E tests

### Don't write tests for:

❌ **Simple UI components** - Just render props
❌ **One-off page layouts**
❌ **Configuration files**

## Test Structure

```
tests/
├── unit/
│   ├── ai/                    # AI provider and generation
│   │   ├── provider-resolver.test.ts
│   │   └── generation.test.ts
│   ├── api/                   # API client and errors
│   │   ├── client.test.ts
│   │   └── errors.test.ts
│   └── utils/                 # Utility functions
│       ├── string-similarity.test.ts
│       └── metrics.test.ts
├── components/                # React component tests
│   ├── async-action-button.test.tsx
│   └── ui/
├── api/                       # API route tests (with mocks)
│   ├── projects.test.ts
│   └── generate.test.ts
├── integration/               # Integration tests
│   └── project-workflow.test.ts
├── security/                  # Security tests (159 tests)
│   ├── auth.test.ts
│   ├── rls.test.ts
│   ├── validation.test.ts
│   ├── sanitization.test.ts
│   ├── rate-limit.test.ts
│   └── secrets.test.ts
└── e2e/                       # Playwright E2E tests
    ├── project-creation.spec.ts
    └── rating-workflow.spec.ts
```

## Unit Tests

### Example: Testing Utilities

```typescript
// tests/unit/utils/string-similarity.test.ts

import { describe, it, expect } from "vitest";
import { calculateSimilarity, areSimilar } from "@/lib/utils/string-similarity";

describe("calculateSimilarity", () => {
  it("should return 1.0 for identical strings", () => {
    expect(calculateSimilarity("hello", "hello")).toBe(1.0);
  });

  it("should return 0.0 for completely different strings", () => {
    expect(calculateSimilarity("abc", "xyz")).toBe(0.0);
  });

  it("should handle case sensitivity", () => {
    const similarity = calculateSimilarity("Hello", "hello");
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThan(1.0);
  });
});

describe("areSimilar", () => {
  it("should use threshold correctly", () => {
    expect(areSimilar("hello", "hello!", 0.9)).toBe(true);
    expect(areSimilar("hello", "goodbye", 0.9)).toBe(false);
  });
});
```

### Example: Testing AI Provider Resolution

```typescript
// tests/unit/ai/provider-resolver.test.ts

import { describe, it, expect } from "vitest";
import { resolveProvider } from "@/lib/ai/provider-resolver";

describe("resolveProvider", () => {
  it("should resolve OpenAI provider for GPT models", () => {
    const result = resolveProvider("gpt-4", {
      openai: "sk-test",
      anthropic: undefined,
    });

    expect(result.provider).toBe("openai");
    expect(result.modelName).toBe("gpt-4");
    expect(result.apiKey).toBe("sk-test");
    expect(result.usingFallback).toBe(false);
  });

  it("should fallback to system key when user key missing", () => {
    const result = resolveProvider("gpt-4", {
      openai: undefined,
      anthropic: undefined,
    });

    expect(result.usingFallback).toBe(true);
  });

  it("should resolve Anthropic provider for Claude models", () => {
    const result = resolveProvider("claude-3-opus-20240229", {
      openai: undefined,
      anthropic: "sk-ant-test",
    });

    expect(result.provider).toBe("anthropic");
    expect(result.modelName).toBe("claude-3-opus-20240229");
  });
});
```

## Component Tests

### Example: Testing React Components

```typescript
// tests/components/async-action-button.test.tsx

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AsyncActionButton } from '@/components/async-action-button';

describe('AsyncActionButton', () => {
  it('should render button with label', () => {
    render(
      <AsyncActionButton
        label="Click Me"
        apiEndpoint="/api/test"
      />
    );

    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('should show loading state when clicked', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
    );

    render(
      <AsyncActionButton
        label="Click Me"
        loadingLabel="Loading..."
        apiEndpoint="/api/test"
      />
    );

    const button = screen.getByText('Click Me');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  it('should handle errors gracefully', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: async () => ({ error: 'Test error' }),
      } as Response)
    );

    render(
      <AsyncActionButton
        label="Click Me"
        apiEndpoint="/api/test"
      />
    );

    const button = screen.getByText('Click Me');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

## API Route Tests

### Mocking Supabase

```typescript
// tests/api/projects.test.ts

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/projects/route";

// Mock Supabase
vi.mock("@/lib/supabase", () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: "test-user-id" } },
        error: null,
      })),
    },
    from: vi.fn(() => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn(() => ({
        data: { id: 1, name: "Test Project" },
        error: null,
      })),
    })),
  })),
}));

describe("POST /api/projects", () => {
  it("should create a project", async () => {
    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Project",
        model_config: {
          model: "gpt-4",
          temperature: 0.7,
          system_prompt: "You are helpful",
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("Test Project");
  });

  it("should require authentication", async () => {
    // Mock unauthenticated user
    vi.mocked(createServerClient).mockReturnValueOnce({
      auth: {
        getUser: vi.fn(() => ({
          data: { user: null },
          error: null,
        })),
      },
    } as any);

    const request = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "Test" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toMatch(/unauthorized/i);
  });
});
```

## Security Tests

### Example: Testing Authentication

```typescript
// tests/security/auth.test.ts

import { describe, it, expect } from "vitest";

describe("Authentication", () => {
  it("should block unauthenticated requests", async () => {
    const response = await fetch("/api/projects", {
      method: "GET",
      // No auth headers
    });

    expect(response.status).toBe(401);
  });

  it("should allow authenticated requests", async () => {
    const response = await fetch("/api/projects", {
      method: "GET",
      headers: {
        Authorization: "Bearer valid-token",
      },
    });

    expect(response.status).not.toBe(401);
  });
});
```

### Example: Testing RLS

```typescript
// tests/security/rls.test.ts

describe("Row Level Security", () => {
  it("should only return user's own projects", async () => {
    // Create project as User A
    const projectA = await createProject(userA);

    // Query as User B
    const supabaseB = await createClientForUser(userB);
    const { data } = await supabaseB
      .from("projects")
      .select("*")
      .eq("id", projectA.id);

    // User B should not see User A's project
    expect(data).toHaveLength(0);
  });
});
```

### Example: Testing Input Validation

```typescript
// tests/security/validation.test.ts

describe("Input Validation", () => {
  it("should reject oversized inputs", async () => {
    const response = await fetch("/api/scenarios", {
      method: "POST",
      body: JSON.stringify({
        input_text: "x".repeat(20000), // Exceeds 10,000 char limit
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/validation/i);
  });

  it("should sanitize HTML in feedback", async () => {
    const response = await fetch("/api/ratings", {
      method: "POST",
      body: JSON.stringify({
        feedback: '<script>alert("XSS")</script>Good output',
      }),
    });

    const data = await response.json();
    expect(data.data.feedback).not.toContain("<script>");
  });
});
```

## Integration Tests

### Example: Full Workflow Test

```typescript
// tests/integration/project-workflow.test.ts

describe("Project Workflow", () => {
  it("should complete full project workflow", async () => {
    // 1. Create project
    const project = await projectApi.create({
      name: "Integration Test",
      model_config: {
        /* ... */
      },
    });
    expect(project.id).toBeDefined();

    // 2. Add scenarios
    const scenario = await scenarioApi.create(project.id, {
      input_text: "Test scenario",
    });
    expect(scenario.id).toBeDefined();

    // 3. Generate outputs
    const result = await projectApi.generateOutputs(project.id, {
      scenarioIds: [scenario.id],
    });
    expect(result.success).toBe(true);

    // 4. Fetch outputs
    const { data: outputs } = await supabase
      .from("outputs")
      .select("*")
      .eq("scenario_id", scenario.id);
    expect(outputs).toHaveLength(1);

    // 5. Rate output
    const rating = await ratingApi.create(outputs[0].id, {
      stars: 5,
      feedback: "Great output!",
    });
    expect(rating.stars).toBe(5);
  });
});
```

## E2E Tests (Playwright)

### Example: User Flow Test

```typescript
// tests/e2e/project-creation.spec.ts

import { test, expect } from "@playwright/test";

test("should create and configure project", async ({ page }) => {
  // 1. Navigate to projects page
  await page.goto("/projects");

  // 2. Click "New Project" button
  await page.click("text=New Project");

  // 3. Fill in project form
  await page.fill('input[name="name"]', "E2E Test Project");
  await page.fill('textarea[name="system_prompt"]', "You are helpful");
  await page.selectOption('select[name="model"]', "gpt-4");

  // 4. Submit form
  await page.click('button[type="submit"]');

  // 5. Verify redirect to project page
  await expect(page).toHaveURL(/\/projects\/\d+/);

  // 6. Verify project name appears
  await expect(page.locator("h1")).toContainText("E2E Test Project");
});

test("should generate outputs for scenarios", async ({ page }) => {
  // Setup: Create project and scenario
  const projectId = await createTestProject();
  await createTestScenario(projectId);

  // Navigate to project
  await page.goto(`/projects/${projectId}`);

  // Click "Generate Outputs"
  await page.click("text=Generate Outputs");

  // Wait for generation to complete
  await expect(page.locator("text=Generation complete")).toBeVisible({
    timeout: 30000,
  });

  // Verify outputs appear
  await expect(page.locator('[data-testid="output"]')).toHaveCount(1);
});
```

## Test Workflow

### For Bug Fixes (Test-Driven)

1. **Write a failing test** that reproduces the bug

   ```typescript
   it("should handle edge case X", () => {
     const result = functionWithBug(edgeCaseInput);
     expect(result).toBe(expectedValue); // This fails
   });
   ```

2. **Run the test** - Verify it fails

   ```bash
   npm test -- path/to/test.ts
   ```

3. **Fix the bug** in the implementation

4. **Run the test again** - Verify it passes

5. **Commit test + fix together**
   ```bash
   git add tests/... lib/...
   git commit -m "fix: Handle edge case X in functionWithBug"
   ```

### For New Features

1. **Write tests for expected behavior**

   ```typescript
   describe("New Feature", () => {
     it("should do X", () => {
       /* ... */
     });
     it("should handle Y", () => {
       /* ... */
     });
   });
   ```

2. **Run tests** - They should fail (not implemented yet)

3. **Implement the feature**

4. **Run tests** - Verify they pass

5. **Refactor** - Tests give confidence to refactor safely

## Running Tests

### All Tests

```bash
npm test                      # All unit/integration/security tests
npm run test:e2e              # E2E tests only
```

### Specific Tests

```bash
npm test -- string-similarity              # Specific file
npm test -- tests/security/                # Directory
npm test -- --grep "should validate"       # Pattern match
```

### Watch Mode

```bash
npm test                      # Automatically watches
npm test -- --no-watch        # Disable watch
```

### Coverage

```bash
npm test -- --coverage        # Generate coverage report
```

Coverage reports are in `coverage/` directory.

### E2E Options

```bash
npm run test:e2e              # Headless
npm run test:e2e:ui           # Interactive UI
npm run test:e2e -- --debug   # Debug mode
```

## Test Coverage Goals

| Layer                   | Coverage Target | Priority    |
| ----------------------- | --------------- | ----------- |
| Critical Security Paths | 100%            | 🔴 Required |
| Utility Functions       | 90%             | 🟡 High     |
| API Routes              | 80%             | 🟡 High     |
| Components              | 70%             | 🟢 Medium   |
| E2E Happy Paths         | 100%            | 🟡 High     |

## Mocking

### Mock Environment Variables

Automatically mocked in `tests/setup.ts`:

```typescript
import { env } from "@/lib/env";

// env.supabase.url is available in tests
// env.openai.apiKey is available in tests
```

### Mock Fetch

```typescript
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ success: true }),
  } as Response),
);
```

### Mock Next.js Router

Already set up in `tests/setup.ts`:

```typescript
import { useRouter, usePathname } from "next/navigation";

// These are mocked automatically
useRouter();
usePathname();
```

### Mock Supabase

```typescript
vi.mock("@/lib/supabase", () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: vi.fn(() => ({ data: { user: mockUser } })) },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(() => ({ data: mockData, error: null })),
    })),
  })),
}));
```

## Best Practices

### 1. Test Behavior, Not Implementation

```typescript
// ❌ Bad: Testing implementation details
expect(component.state.isLoading).toBe(true);

// ✅ Good: Testing user-visible behavior
expect(screen.getByText("Loading...")).toBeInTheDocument();
```

### 2. Use Descriptive Test Names

```typescript
// ❌ Bad
it("works", () => {
  /* ... */
});

// ✅ Good
it("should return 401 when user is not authenticated", () => {
  /* ... */
});
```

### 3. Arrange-Act-Assert Pattern

```typescript
it("should calculate similarity correctly", () => {
  // Arrange: Set up test data
  const string1 = "hello";
  const string2 = "hallo";

  // Act: Execute the function
  const result = calculateSimilarity(string1, string2);

  // Assert: Verify the result
  expect(result).toBeGreaterThan(0.5);
});
```

### 4. One Assertion Per Test (Generally)

```typescript
// ❌ Bad: Multiple unrelated assertions
it("should work", () => {
  expect(a).toBe(1);
  expect(b).toBe(2);
  expect(c).toBe(3);
});

// ✅ Good: Focused tests
it("should set a to 1", () => {
  expect(a).toBe(1);
});

it("should set b to 2", () => {
  expect(b).toBe(2);
});
```

### 5. Clean Up After Tests

```typescript
import { afterEach } from "vitest";

afterEach(() => {
  vi.clearAllMocks();
});
```

## Troubleshooting

### "Cannot find module"

Check `tsconfig.json` paths are correctly configured and imports use `@/` alias.

### "Timeout exceeded"

Increase timeout for slow tests:

```typescript
it("should complete slow operation", async () => {
  // Test code
}, 30000); // 30 second timeout
```

### "Module mock not working"

Ensure mock is defined before importing the module:

```typescript
vi.mock("@/lib/supabase"); // Must come first

import { createServerClient } from "@/lib/supabase"; // Then import
```

### E2E tests flaky

- Add explicit waits: `await expect(element).toBeVisible()`
- Increase timeout: `{ timeout: 30000 }`
- Use `waitFor` instead of fixed delays

## Related Documentation

- [Security Checklist](../security/SECURITY_CHECKLIST.md) - Security test requirements
- [API Patterns Guide](api-patterns.md) - Testing API routes
- [Authentication Guide](authentication.md) - Testing auth and RLS
