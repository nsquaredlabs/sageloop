# Technical Debt & Code Structure Review

**Date**: December 9, 2025
**Reviewer**: Claude Code
**Scope**: Comprehensive codebase analysis

---

## Executive Summary

The Tellah codebase demonstrates solid architectural foundations with good separation of concerns and modern Next.js 14 patterns. However, several areas require attention ranging from **critical security issues** to **code maintainability improvements**. This document provides a prioritized roadmap for addressing technical debt.

**Key Findings**:

- 🔴 **1 Critical Security Issue**: Admin client bypassing RLS in pages
- 🔴 **2 Critical Data Issues**: Query anti-patterns and hardcoded clients
- 🟡 **~150+ lines of duplicated code** in AI provider logic
- 🟡 **Type safety gaps** with excessive `as any` casts
- 🟢 **Several opportunities** for code organization improvements

---

## 🧪 Testing Strategy (New Addition)

**Priority**: 🔴 **Critical - Do This First**

Before making any changes from this review, establish a testing foundation to prevent regressions. This is especially important given the critical security fixes needed.

### Recommended Open-Source Test Suite

**Stack**: Vitest + Testing Library + Playwright + MSW

| Tool                          | Purpose                  | Why This Choice                                                  |
| ----------------------------- | ------------------------ | ---------------------------------------------------------------- |
| **Vitest**                    | Unit & Integration tests | 10x faster than Jest, native ESM support, perfect for Next.js 14 |
| **React Testing Library**     | Component tests          | Industry standard, focuses on user behavior                      |
| **Playwright**                | E2E tests                | Fast, reliable, multi-browser, great debugging                   |
| **MSW (Mock Service Worker)** | API mocking              | Intercept network requests, test in isolation                    |
| **Supabase Test Helpers**     | Database mocking         | Official Supabase test utilities                                 |

### Quick Setup (30 minutes)

```bash
# Install test dependencies
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# Install Playwright
npm install -D @playwright/test
npx playwright install

# Install MSW for API mocking
npm install -D msw

# Install Supabase test helpers
npm install -D @supabase/supabase-js
```

**Add to package.json**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### Test Configuration Files

**vitest.config.ts**:

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

**tests/setup.ts**:

```typescript
import "@testing-library/jest-dom";
import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54321";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
```

**playwright.config.ts**:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### Priority Tests (Write These First)

#### 1. Critical Security Tests (Sprint 0 - Before any refactoring)

**tests/security/rls.test.ts**:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createServerClient } from "@/lib/supabase/server";

describe("Row Level Security", () => {
  it("should NOT allow access to projects from other workbenches", async () => {
    // This test will FAIL currently - that's the bug we're fixing!
    const supabase = await createServerClient();

    // Try to access a project that doesn't belong to the user
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", 999999); // Project that doesn't exist or belongs to another user

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it("should allow access to user own workbench projects", async () => {
    // Test that RLS correctly allows access to authorized data
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .limit(1);

    expect(error).toBeNull();
  });
});
```

#### 2. Provider Resolution Tests (For Issue #4)

**tests/unit/ai/provider-resolver.test.ts**:

```typescript
import { describe, it, expect } from "vitest";
import { resolveProvider } from "@/lib/ai/provider-resolver";

describe("Provider Resolver", () => {
  it("should use requested model when user has correct API key", () => {
    const result = resolveProvider("gpt-4", { openai: "sk-test" });

    expect(result.provider).toBe("openai");
    expect(result.modelName).toBe("gpt-4");
    expect(result.apiKey).toBe("sk-test");
    expect(result.usingFallback).toBe(false);
  });

  it("should fallback to gpt-3.5-turbo when no API keys configured", () => {
    const result = resolveProvider("claude-opus-4", null);

    expect(result.provider).toBe("openai");
    expect(result.modelName).toBe("gpt-3.5-turbo");
    expect(result.apiKey).toBeUndefined();
    expect(result.usingFallback).toBe(true);
  });

  it("should fallback when requested provider key missing", () => {
    const result = resolveProvider("claude-opus-4", { openai: "sk-test" });

    expect(result.provider).toBe("openai");
    expect(result.modelName).toBe("gpt-3.5-turbo");
    expect(result.usingFallback).toBe(true);
  });
});
```

#### 3. API Route Tests with MSW

**tests/api/projects.test.ts**:

```typescript
import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("POST /api/projects", () => {
  it("should create a project with valid data", async () => {
    // Mock Supabase response
    server.use(
      http.post("*/rest/v1/projects", () => {
        return HttpResponse.json({
          id: 1,
          name: "Test Project",
          model_config: { model: "gpt-4" },
        });
      }),
    );

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Project",
        model_config: { model: "gpt-4" },
      }),
    });

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.data.name).toBe("Test Project");
  });

  it("should return 400 when name is missing", async () => {
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model_config: { model: "gpt-4" },
      }),
    });

    expect(response.status).toBe(400);
  });
});
```

#### 4. Component Tests

**tests/components/generate-outputs-button.test.tsx**:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GenerateOutputsButton } from '@/components/generate-outputs-button';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('GenerateOutputsButton', () => {
  it('should render with scenario count', () => {
    render(<GenerateOutputsButton projectId="1" scenarioCount={5} />);

    expect(screen.getByText(/Generate Outputs/i)).toBeInTheDocument();
    expect(screen.getByText(/5 scenarios/i)).toBeInTheDocument();
  });

  it('should show loading state when clicked', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ success: true }),
      } as Response)
    );

    render(<GenerateOutputsButton projectId="1" scenarioCount={5} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Generating outputs/i)).toBeInTheDocument();
    });
  });
});
```

#### 5. E2E Critical Path Test

**tests/e2e/project-creation.spec.ts**:

```typescript
import { test, expect } from "@playwright/test";

test("user can create project and generate outputs", async ({ page }) => {
  // Login (assuming you have auth)
  await page.goto("/login");
  await page.fill('input[type="email"]', "test@example.com");
  await page.fill('input[type="password"]', "password");
  await page.click('button[type="submit"]');

  // Create new project
  await page.goto("/projects/new");
  await page.fill('input[name="name"]', "E2E Test Project");
  await page.selectOption('select[name="model"]', "gpt-3.5-turbo");
  await page.click('button[type="submit"]');

  // Add scenario
  await expect(page).toHaveURL(/\/projects\/\d+/);
  await page.click('button:has-text("Add Scenario")');
  await page.fill("textarea", "Test input scenario");
  await page.click('button:has-text("Save")');

  // Generate outputs
  await page.click('button:has-text("Generate Outputs")');
  await expect(page).toHaveURL(/\/projects\/\d+\/outputs/);

  // Verify output was created
  await expect(page.locator("text=Test input scenario")).toBeVisible();
});
```

### Test Coverage Goals

| Layer                   | Coverage Target | Priority    |
| ----------------------- | --------------- | ----------- |
| Critical Security Paths | 100%            | 🔴 Required |
| API Routes              | 80%             | 🟡 High     |
| Utility Functions       | 90%             | 🟡 High     |
| Components              | 70%             | 🟢 Medium   |
| E2E Happy Paths         | 100%            | 🟡 High     |

### Testing Workflow

**Before any refactoring**:

1. ✅ Write failing test for the bug (e.g., RLS bypass)
2. ✅ Run test - it should FAIL (confirms bug exists)
3. ✅ Fix the bug
4. ✅ Run test - it should PASS
5. ✅ Commit with test + fix together

**Example Git Workflow**:

```bash
# Step 1: Write failing test
git checkout -b fix/rls-bypass
# ... write test that exposes the bug ...
npm test -- rls.test.ts  # Should FAIL

# Step 2: Fix the bug
# ... replace supabaseAdmin with createServerClient ...
npm test -- rls.test.ts  # Should PASS

# Step 3: Commit together
git add tests/security/rls.test.ts app/projects/[id]/page.tsx
git commit -m "fix: enforce RLS in project pages

- Add test for RLS enforcement
- Replace supabaseAdmin with createServerClient
- Test passes, confirming access control works"
```

### Integration with CI/CD

**Add to `.github/workflows/test.yml`**:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Run unit tests
        run: npm test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Estimated Time Investment

| Phase           | Time    | Description                          |
| --------------- | ------- | ------------------------------------ |
| Setup           | 1h      | Install deps, create config files    |
| Security Tests  | 2h      | RLS, auth, access control            |
| Unit Tests      | 4h      | Provider resolver, generation, utils |
| API Tests       | 4h      | Critical endpoints with MSW          |
| Component Tests | 3h      | Main user-facing components          |
| E2E Tests       | 3h      | Happy paths + critical flows         |
| **Total**       | **17h** | One-time investment                  |

### ROI: Why This Matters

**Without tests**:

- 😰 Fear of breaking things when refactoring
- ⏰ Hours debugging regressions
- 🐛 Bugs reach production
- 🚀 Slower development velocity over time

**With tests**:

- ✅ Confidence to refactor safely
- ⚡ Catch bugs in seconds, not hours
- 🛡️ Prevent regressions
- 🚀 Faster development velocity
- 📚 Tests serve as documentation

**The 150+ lines of duplicated code we need to refactor**? We can't safely do that without tests.

---

## 🔴 Critical Issues

### 1. Security Vulnerability: Unsafe Admin Client Usage

**Severity**: 🔴 Critical - Security Risk
**Files Affected**:

- `app/projects/[id]/page.tsx:22`
- `app/projects/[id]/insights/page.tsx:27`
- `app/projects/[id]/insights/history/page.tsx` (likely)
- `app/projects/[id]/outputs/page.tsx` (likely)

**Problem**:
Server components are using `supabaseAdmin` instead of `createServerClient()`, **completely bypassing Row Level Security (RLS)**. This violates the documented security pattern in `CLAUDE.md`.

```typescript
// ❌ CURRENT - Bypasses RLS, allows unauthorized access
const { data: project } = await supabaseAdmin
  .from("projects")
  .select("*")
  .eq("id", id)
  .single();
```

**Security Impact**:
Any authenticated user could potentially access any project by manipulating the URL parameter, regardless of their workbench membership. This breaks the fundamental security model of the application.

**Solution**:

```typescript
// ✅ CORRECT - Enforces RLS
const supabase = await createServerClient();
const { data: project } = await supabase
  .from("projects")
  .select("*")
  .eq("id", id)
  .single();

if (!project) {
  notFound(); // 404 if user doesn't have access
}
```

**Action Required**:

1. Search for all `supabaseAdmin` usage in `app/` directory
2. Replace with `createServerClient()` in all page components
3. Keep `supabaseAdmin` only in:
   - Database migrations/setup scripts
   - System-level operations (not user-facing queries)

**Estimated Effort**: 2 hours

---

### 2. Supabase Query Anti-Pattern

**Severity**: 🔴 Critical - Data Correctness
**File**: `app/api/projects/[id]/extract/route.ts:68`

**Problem**:
The code violates the documented Supabase query pattern from `CLAUDE.md`. Filtering on nested relations silently fails in PostgREST.

```typescript
// ❌ CURRENT - This silently fails to filter properly
const { data: outputs } = await supabase
  .from("outputs")
  .select(
    `
    *,
    ratings!inner (id, stars, feedback_text, tags, created_at),
    scenario:scenarios (id, input_text)
  `,
  )
  .eq("scenario.project_id", projectId) // ⚠️ Silently ignored!
  .eq("model_snapshot->>version", currentVersion.toString());
```

**Data Impact**:
The query may return outputs from scenarios belonging to other projects, causing incorrect pattern analysis and potential data leaks.

**Solution** (from CLAUDE.md):

```typescript
// ✅ CORRECT - Two-step pattern
// Step 1: Get scenario IDs for this project
const { data: scenarios } = await supabase
  .from("scenarios")
  .select("id")
  .eq("project_id", projectId);

const scenarioIds = scenarios?.map((s) => s.id) || [];

// Step 2: Filter outputs using scenario IDs
const { data: outputs } = await supabase
  .from("outputs")
  .select(
    `
    *,
    ratings!inner (id, stars, feedback_text, tags, created_at),
    scenario:scenarios (id, input_text)
  `,
  )
  .in("scenario_id", scenarioIds)
  .eq("model_snapshot->>version", currentVersion.toString());
```

**Action Required**:

1. Fix the extract route immediately
2. Search codebase for other instances of nested relation filters
3. Add integration tests to verify query correctness

**Estimated Effort**: 1 hour

---

### 3. Hardcoded OpenAI Clients Preventing BYOK

**Severity**: 🔴 Critical - Broken Feature
**Files**:

- `app/api/projects/[id]/extract/route.ts:6-8`
- `app/api/projects/[id]/integrate-fixes/route.ts:6-8`

**Problem**:
Routes create singleton OpenAI clients at module level instead of using the factory pattern from `lib/openai.ts`.

```typescript
// ❌ CURRENT - Hardcoded system API key only
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

**Business Impact**:

- Pattern extraction and fix integration **cannot use user-provided API keys**
- Forces all AI analysis operations to consume system credits
- Inconsistent with the BYOK (Bring Your Own Key) model used in generate/retest routes

**Solution**:

```typescript
// ✅ CORRECT - Use factory pattern
import { createOpenAIClient } from "@/lib/openai";

export async function POST(request: Request, { params }: RouteParams) {
  // ... fetch workbench API keys like in generate route ...

  const apiKey = apiKeys?.openai ?? undefined;
  const openai = createOpenAIClient(apiKey); // Uses user key if available

  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    // ...
  });
}
```

**Action Required**:

1. Update extract route to fetch and use workbench API keys
2. Update integrate-fixes route similarly
3. Consider making pattern extraction work with Anthropic API too

**Estimated Effort**: 3 hours

---

## 🟡 High Priority Improvements

### 4. Massive Code Duplication: Provider Selection Logic

**Severity**: 🟡 High - Maintainability
**Files**:

- `app/api/projects/[id]/generate/route.ts:75-112`
- `app/api/projects/[id]/retest/route.ts:114-149`

**Problem**:
~40 lines of identical "provider selection and fallback" logic duplicated across multiple routes.

**Code Duplication**:

```typescript
// This exact pattern appears in 2+ files:
let modelName = modelConfig.model || "gpt-3.5-turbo";
let isClaudeModel = modelName.includes("claude");
let provider: "openai" | "anthropic" = isClaudeModel ? "anthropic" : "openai";
let usingFallback = false;

const hasUserKeys = apiKeys?.openai || apiKeys?.anthropic;

if (!hasUserKeys) {
  console.log("No user API keys configured, using system fallback");
  modelName = "gpt-3.5-turbo";
  provider = "openai";
  isClaudeModel = false;
  usingFallback = true;
} else if (!apiKeys[provider]) {
  if (apiKeys.openai) {
    console.log(`User requested ${provider} but only has OpenAI key...`);
    modelName = "gpt-3.5-turbo";
    provider = "openai";
    // ... more logic ...
  }
}

const apiKey = usingFallback ? undefined : (apiKeys?.[provider] ?? undefined);
```

**Solution**: Create a shared provider resolver

```typescript
// lib/ai/provider-resolver.ts

export interface ProviderConfig {
  provider: "openai" | "anthropic";
  modelName: string;
  apiKey: string | undefined;
  usingFallback: boolean;
}

export interface UserApiKeys {
  openai?: string;
  anthropic?: string;
}

/**
 * Resolves which AI provider and model to use based on:
 * 1. User's requested model
 * 2. Available API keys
 * 3. Fallback to free tier if needed
 */
export function resolveProvider(
  requestedModel: string,
  userKeys: UserApiKeys | null,
  options?: {
    defaultModel?: string;
    allowSystemFallback?: boolean;
  },
): ProviderConfig {
  const defaultModel = options?.defaultModel || "gpt-3.5-turbo";
  let modelName = requestedModel || defaultModel;
  let isClaudeModel = modelName.includes("claude");
  let provider: "openai" | "anthropic" = isClaudeModel ? "anthropic" : "openai";
  let usingFallback = false;

  // Check if user has any API keys configured
  const hasUserKeys = userKeys?.openai || userKeys?.anthropic;

  if (!hasUserKeys) {
    // No user keys - use system keys with inexpensive model
    if (options?.allowSystemFallback !== false) {
      console.log("No user API keys configured, using system fallback");
      modelName = "gpt-3.5-turbo";
      provider = "openai";
      usingFallback = true;
    } else {
      throw new Error(
        "No API keys configured. Please add your OpenAI or Anthropic API key.",
      );
    }
  } else if (!userKeys[provider]) {
    // User has keys but not for the requested provider
    // Fall back to whichever provider they have configured
    if (userKeys.openai) {
      console.log(
        `User requested ${provider} but only has OpenAI key, falling back to GPT-3.5 Turbo`,
      );
      modelName = "gpt-3.5-turbo";
      provider = "openai";
      usingFallback = true;
    } else if (userKeys.anthropic) {
      console.log(
        `User requested ${provider} but only has Anthropic key, falling back to Claude Haiku`,
      );
      modelName = "claude-haiku-4-5-20251001";
      provider = "anthropic";
      usingFallback = true;
    }
  }

  // Get the appropriate API key (user's or undefined for system key)
  const apiKey = usingFallback
    ? undefined
    : (userKeys?.[provider] ?? undefined);

  return {
    provider,
    modelName,
    apiKey,
    usingFallback,
  };
}
```

**Usage in routes**:

```typescript
import { resolveProvider } from "@/lib/ai/provider-resolver";

// In route handler:
const modelConfig = project.model_config as ModelConfig;

const { provider, modelName, apiKey, usingFallback } = resolveProvider(
  modelConfig.model,
  apiKeys,
);
```

**Impact**:

- Eliminates ~80 lines of duplicated code
- Single source of truth for provider logic
- Easier to add new providers or change fallback strategy
- Better testability

**Estimated Effort**: 4 hours

---

### 5. Massive Code Duplication: AI Generation Logic

**Severity**: 🟡 High - Maintainability
**Files**:

- `app/api/projects/[id]/generate/route.ts:119-159`
- `app/api/projects/[id]/retest/route.ts:234-270`

**Problem**:
Nearly identical OpenAI/Anthropic generation code appears in multiple places with minor variations.

**Duplicated Pattern**:

```typescript
// This pattern repeats in each route:
let outputText = "";
let usage = {};

if (provider === "openai") {
  const openai = createOpenAIClient(apiKey);
  const completion = await openai.chat.completions.create({
    model: modelName,
    temperature: modelConfig.temperature ?? 0.7,
    messages: [
      ...(systemPrompt
        ? [{ role: "system" as const, content: systemPrompt }]
        : []),
      { role: "user" as const, content: inputText },
    ],
  });
  outputText = completion.choices[0]?.message?.content || "";
  usage = {
    completion_tokens: completion.usage?.completion_tokens,
    prompt_tokens: completion.usage?.prompt_tokens,
    total_tokens: completion.usage?.total_tokens,
  };
} else {
  const anthropic = createAnthropicClient(apiKey);
  const message = await anthropic.messages.create({
    model: modelName,
    max_tokens: 4096,
    temperature: modelConfig.temperature ?? 0.7,
    system: systemPrompt,
    messages: [{ role: "user", content: inputText }],
  });
  outputText =
    message.content[0]?.type === "text" ? message.content[0].text : "";
  usage = {
    input_tokens: message.usage.input_tokens,
    output_tokens: message.usage.output_tokens,
  };
}
```

**Solution**: Create unified generation service

```typescript
// lib/ai/generation.ts

import { createOpenAIClient } from "@/lib/openai";
import { createAnthropicClient } from "@/lib/anthropic";

export interface GenerationConfig {
  provider: "openai" | "anthropic";
  model: string;
  temperature?: number;
  systemPrompt?: string;
  userMessage: string;
  apiKey?: string;
  maxTokens?: number;
}

export interface GenerationResult {
  text: string;
  usage: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    inputTokens?: number;
    outputTokens?: number;
  };
}

/**
 * Generates AI completion using OpenAI or Anthropic based on provider
 */
export async function generateCompletion(
  config: GenerationConfig,
): Promise<GenerationResult> {
  const {
    provider,
    model,
    temperature = 0.7,
    systemPrompt,
    userMessage,
    apiKey,
    maxTokens,
  } = config;

  if (provider === "openai") {
    const openai = createOpenAIClient(apiKey);
    const completion = await openai.chat.completions.create({
      model,
      temperature,
      messages: [
        ...(systemPrompt
          ? [{ role: "system" as const, content: systemPrompt }]
          : []),
        { role: "user" as const, content: userMessage },
      ],
    });

    return {
      text: completion.choices[0]?.message?.content || "",
      usage: {
        completionTokens: completion.usage?.completion_tokens,
        promptTokens: completion.usage?.prompt_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    };
  } else {
    // Anthropic
    const anthropic = createAnthropicClient(apiKey);
    const message = await anthropic.messages.create({
      model,
      max_tokens: maxTokens || 4096,
      temperature,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    return {
      text: message.content[0]?.type === "text" ? message.content[0].text : "",
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  }
}
```

**Usage in routes**:

```typescript
import { generateCompletion } from "@/lib/ai/generation";

// In loop over scenarios:
const { text, usage } = await generateCompletion({
  provider,
  model: modelName,
  temperature: modelConfig.temperature,
  systemPrompt: modelConfig.system_prompt,
  userMessage: scenario.input_text,
  apiKey,
});

// Save to database
const { data: output } = await supabase
  .from("outputs")
  .insert({
    scenario_id: scenario.id,
    output_text: text,
    model_snapshot: {
      model: modelName,
      temperature: modelConfig.temperature ?? 0.7,
      system_prompt: modelConfig.system_prompt,
      ...usage,
    },
  })
  .select()
  .single();
```

**Impact**:

- Eliminates ~60 lines of duplicated code
- Unified error handling for AI calls
- Easier to add retry logic, rate limiting, etc.
- Better testability with mocks

**Estimated Effort**: 3 hours

---

### 6. Inconsistent Error Handling

**Severity**: 🟡 High - User Experience & Debugging
**Files**: All API routes

**Problem**:
API routes have inconsistent error responses and handling patterns:

**Variations Found**:

```typescript
// Pattern 1: Generic error
return NextResponse.json({ error: "Internal server error" }, { status: 500 });

// Pattern 2: Specific error
return NextResponse.json({ error: "Project not found" }, { status: 404 });

// Pattern 3: Silent failure (logs but continues)
if (outputError) {
  console.error("Failed to save output:", outputError);
  continue; // ⚠️ No error reported to user
}

// Pattern 4: Detailed validation
if (!scenarioIds || !Array.isArray(scenarioIds) || scenarioIds.length === 0) {
  return NextResponse.json(
    { error: "scenarioIds array is required" },
    { status: 400 },
  );
}
```

**Solution**: Standardized error utilities

```typescript
// lib/api-errors.ts

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, message, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(404, `${resource} not found`, "NOT_FOUND");
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(401, message, "UNAUTHORIZED");
  }
}

/**
 * Standardized error handler for API routes
 * Returns consistent JSON error responses
 */
export function handleApiError(error: unknown): Response {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error.details && { details: error.details }),
      },
      { status: error.statusCode },
    );
  }

  // Unexpected errors
  return NextResponse.json(
    {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    { status: 500 },
  );
}
```

**Usage in routes**:

```typescript
import {
  handleApiError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from "@/lib/api-errors";

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    const body = await request.json();

    if (!body.scenarioIds || !Array.isArray(body.scenarioIds)) {
      throw new ValidationError("scenarioIds must be an array");
    }

    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (!project) {
      throw new NotFoundError("Project");
    }

    // ... rest of logic ...

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}
```

**Impact**:

- Consistent error responses for frontend
- Better error codes for debugging
- Centralized error logging
- Type-safe error creation

**Estimated Effort**: 4 hours

---

### 7. Missing Type Definitions for API Responses

**Severity**: 🟡 High - Type Safety
**Files**: All API routes

**Problem**:
API routes return untyped JSON, making it impossible to ensure frontend/backend consistency.

**Current State**:

```typescript
// Backend sends this (untyped):
return NextResponse.json({
  success: true,
  version: newVersion,
  outputs: newOutputs,
  scenarios_retested: scenarios.length,
  prompt_diff: { old: oldPrompt, new: newPrompt },
});

// Frontend receives any:
const response = await fetch("/api/projects/123/retest", {
  method: "POST",
  body: JSON.stringify(data),
});
const result = await response.json(); // Type: any
```

**Solution**: Define API contract types

```typescript
// types/api.ts

// ============================================================================
// Retest Endpoint
// ============================================================================

export interface RetestRequest {
  scenarioIds: number[];
  newSystemPrompt: string;
  improvementNote?: string;
}

export interface RetestResponse {
  success: boolean;
  version: number;
  outputs: Array<{
    scenario_id: number;
    output_id: number;
    input: string;
    output: string;
  }>;
  scenarios_retested: number;
  prompt_diff: {
    old: string;
    new: string;
  };
}

// ============================================================================
// Generate Endpoint
// ============================================================================

export interface GenerateResponse {
  success: boolean;
  generated: number;
  total: number;
  outputs: Array<{
    id: number;
    scenario_id: number;
    output_text: string;
    generated_at: string;
  }>;
  errors?: Array<{
    scenario_id: number;
    error: string;
  }>;
}

// ============================================================================
// Extract (Pattern Analysis) Endpoint
// ============================================================================

export interface ExtractResponse {
  success: boolean;
  extraction: {
    id: number;
    criteria: ExtractionCriteria;
    confidence_score: number;
    created_at: string;
  };
  metric: {
    id: number;
    success_rate: number;
    criteria_breakdown: Record<string, string>;
  };
  analyzed_outputs: number;
}

export interface ExtractionCriteria {
  summary?: string;
  failure_analysis?: FailureAnalysis;
  success_patterns?: string[];
  criteria?: QualityCriterion[];
  key_insights?: string[];
  recommendations?: string[];
}

export interface FailureAnalysis {
  total_failures: number;
  total_successes: number;
  clusters: FailureCluster[];
}

export interface FailureCluster {
  name: string;
  count: number;
  pattern: string;
  root_cause: string;
  suggested_fix: string;
  example_inputs: string[];
  scenario_ids: number[];
  severity: "high" | "medium" | "low";
}

export interface QualityCriterion {
  dimension: string;
  pattern: string;
  importance: "high" | "medium" | "low";
  good_example: string;
  bad_example: string;
}
```

**Usage in backend**:

```typescript
import type { RetestRequest, RetestResponse } from "@/types/api";

export async function POST(request: Request, { params }: RouteParams) {
  const body: RetestRequest = await request.json();

  // ... logic ...

  const response: RetestResponse = {
    success: true,
    version: newVersion,
    outputs: newOutputs,
    scenarios_retested: scenarios.length,
    prompt_diff: { old: oldPrompt, new: newPrompt },
  };

  return NextResponse.json(response);
}
```

**Usage in frontend**:

```typescript
import type { RetestRequest, RetestResponse } from "@/types/api";

async function retestScenarios(projectId: string, data: RetestRequest) {
  const response = await fetch(`/api/projects/${projectId}/retest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result: RetestResponse = await response.json();
  // TypeScript now knows the shape!
  console.log(`Created version ${result.version}`);
}
```

**Impact**:

- Compile-time type checking between frontend/backend
- Auto-completion in IDEs
- Prevents API contract drift
- Self-documenting API

**Estimated Effort**: 5 hours

---

### 8. Type Safety: Excessive `as any` Casts

**Severity**: 🟡 High - Type Safety
**Locations**: Throughout codebase

**Problem**:
JSONB columns from Supabase lose type safety, leading to `as any` casts everywhere.

**Examples**:

```typescript
// app/api/projects/[id]/retest/route.ts:94
const modelConfig = project.model_config as any;
const oldSystemPrompt = modelConfig.system_prompt || "";

// app/projects/[id]/insights/page.tsx:103
const criteria = extraction.criteria as any;
const clusters = criteria.failure_analysis?.clusters || [];
```

**Solution**: Define types for JSONB columns

```typescript
// types/database.ts

/**
 * Type definitions for JSONB columns in the database
 * These should match the structure stored in Supabase
 */

export interface ModelConfig {
  model: string;
  temperature?: number;
  system_prompt?: string;
}

export interface ModelSnapshot extends ModelConfig {
  version?: number;
  completion_tokens?: number;
  prompt_tokens?: number;
  total_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
}

export interface RatingMetadata {
  carried_forward?: boolean;
  previous_output_id?: number;
  similarity_score?: number;
  needs_review?: boolean;
}

// Re-export criteria types from api.ts
export type {
  ExtractionCriteria,
  FailureCluster,
  QualityCriterion,
} from "./api";
```

**Update Supabase types** (optional but recommended):

```typescript
// types/supabase.ts (generated file)
// After running supabase gen types, augment with JSONB types:

import type { Database as GeneratedDatabase } from "./supabase.generated";
import type {
  ModelConfig,
  ModelSnapshot,
  ExtractionCriteria,
  RatingMetadata,
} from "./database";

export type Database = GeneratedDatabase;

// Augment generated types with JSONB structure
export type Project = Database["public"]["Tables"]["projects"]["Row"] & {
  model_config: ModelConfig;
};

export type Output = Database["public"]["Tables"]["outputs"]["Row"] & {
  model_snapshot: ModelSnapshot;
};

export type Extraction = Database["public"]["Tables"]["extractions"]["Row"] & {
  criteria: ExtractionCriteria;
};

export type Rating = Database["public"]["Tables"]["ratings"]["Row"] & {
  metadata?: RatingMetadata;
};
```

**Usage**:

```typescript
import type { Project, ModelConfig } from "@/types/supabase";

// In route:
const { data: project } = await supabase
  .from("projects")
  .select("*")
  .eq("id", projectId)
  .single();

if (!project) {
  throw new NotFoundError("Project");
}

// ✅ Type-safe access to JSONB fields
const modelConfig: ModelConfig = project.model_config;
const systemPrompt = modelConfig.system_prompt || "";
const temperature = modelConfig.temperature ?? 0.7;
```

**Impact**:

- Eliminates most `as any` casts
- Autocomplete for JSONB fields
- Catches structural errors at compile time
- Documentation for data structures

**Estimated Effort**: 3 hours

---

## 🟢 Medium Priority Improvements

### 9. Component Duplication: Action Button Pattern

**Severity**: 🟢 Medium - Code Quality
**Files**:

- `components/generate-outputs-button.tsx`
- `components/analyze-patterns-button.tsx`

**Problem**:
Nearly identical components following the same pattern:

- State: `isLoading`, `error`
- Async fetch to API endpoint
- Router navigation on success
- Same UI structure with icon, label, metadata

**Comparison**:

```typescript
// Both components have this structure:
export function [Action]Button({ projectId, [metadata] }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle[Action] = async () => {
    setIsLoading(true);
    setError(null);

    const response = await fetch(`/api/projects/${projectId}/[endpoint]`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    // ... error handling ...

    router.push(`/projects/${projectId}/[destination]`);
  };

  return (
    <Button onClick={handle[Action]} disabled={isLoading}>
      {isLoading ? <Loader2 className="animate-spin" /> : <Icon />}
      {label}
      <span className="opacity-75">({metadata})</span>
    </Button>
  );
}
```

**Solution**: Create generic async action button

```typescript
// components/async-action-button.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, LucideIcon } from 'lucide-react';

interface AsyncActionButtonProps {
  label: string;
  loadingLabel: string;
  icon: LucideIcon;
  apiEndpoint: string;
  navigateTo?: string;
  metadata?: string;
  onSuccess?: () => void;
  requestBody?: Record<string, unknown>;
  variant?: 'default' | 'outline' | 'destructive';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function AsyncActionButton({
  label,
  loadingLabel,
  icon: Icon,
  apiEndpoint,
  navigateTo,
  metadata,
  onSuccess,
  requestBody,
  variant = 'default',
  size = 'lg',
  className,
}: AsyncActionButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(requestBody && { body: JSON.stringify(requestBody) }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
      }

      if (navigateTo) {
        router.push(navigateTo);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleAction}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          <>
            <Icon className="mr-2 h-4 w-4" />
            {label}
            {metadata && (
              <span className="ml-2 text-xs opacity-75">{metadata}</span>
            )}
          </>
        )}
      </Button>
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
```

**Usage**:

```typescript
// Replace generate-outputs-button.tsx with:
import { AsyncActionButton } from '@/components/async-action-button';
import { Sparkles } from 'lucide-react';

<AsyncActionButton
  label="Generate Outputs"
  loadingLabel="Generating outputs..."
  icon={Sparkles}
  apiEndpoint={`/api/projects/${projectId}/generate`}
  navigateTo={`/projects/${projectId}/outputs`}
  metadata={`${scenarioCount} scenario${scenarioCount !== 1 ? 's' : ''}`}
/>

// Replace analyze-patterns-button.tsx with:
<AsyncActionButton
  label="Analyze Patterns"
  loadingLabel="Analyzing patterns..."
  icon={Sparkles}
  apiEndpoint={`/api/projects/${projectId}/extract`}
  navigateTo={`/projects/${projectId}/insights`}
  metadata={`${ratedCount} rating${ratedCount !== 1 ? 's' : ''}`}
/>
```

**Impact**:

- Eliminates ~150 lines of duplicated code
- Consistent UX across all action buttons
- Easier to add new actions
- Centralized error handling

**Estimated Effort**: 2 hours

---

### 10. Inconsistent Validation Patterns

**Severity**: 🟢 Medium - Code Quality
**Files**: All API routes

**Problem**:
Some routes have thorough validation, others have minimal or none.

**Solution**: Add Zod validation schemas

```bash
npm install zod
```

```typescript
// lib/validation/schemas.ts

import { z } from "zod";

// Retest endpoint
export const retestSchema = z.object({
  scenarioIds: z.array(z.number()).min(1, "At least one scenario required"),
  newSystemPrompt: z.string().min(1, "System prompt is required"),
  improvementNote: z.string().optional(),
});

// Create project endpoint
export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional(),
  model_config: z.object({
    model: z.string().min(1, "Model is required"),
    temperature: z.number().min(0).max(2).optional(),
    system_prompt: z.string().optional(),
  }),
});

// Add scenario endpoint
export const addScenarioSchema = z.object({
  input_text: z.string().min(1, "Input text is required").max(5000),
  order: z.number().int().optional(),
});

// Rating endpoint
export const createRatingSchema = z.object({
  stars: z.number().int().min(1).max(5),
  feedback_text: z.string().max(2000).optional(),
  tags: z.array(z.string()).optional(),
});

// Helper function to validate and parse
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
```

**Usage in routes**:

```typescript
import { retestSchema } from "@/lib/validation/schemas";
import { ValidationError } from "@/lib/api-errors";

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();

    // Validates and throws ZodError if invalid
    const validatedData = retestSchema.parse(body);

    // Continue with validated data
    const { scenarioIds, newSystemPrompt } = validatedData;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError("Invalid request data", error.errors);
    }
    throw error;
  }
}
```

**Impact**:

- Consistent validation across all routes
- Better error messages for invalid input
- Type-safe validated data
- Runtime validation with TypeScript types

**Estimated Effort**: 3 hours

---

### 11. Database Performance: Missing Index Awareness

**Severity**: 🟢 Medium - Performance
**Observation**: Code frequently queries by foreign keys

**Recommendation**: Audit Supabase indexes

Common query patterns found:

```sql
-- These should have indexes:
WHERE project_id = ?          -- scenarios, extractions, metrics
WHERE scenario_id = ?         -- outputs
WHERE output_id = ?           -- ratings
WHERE workbench_id = ?        -- projects
WHERE extraction_id = ?       -- metrics
WHERE created_by = ?          -- projects

-- Composite indexes for common queries:
WHERE project_id = ? AND version = ?  -- prompt_iterations
WHERE scenario_id = ? ORDER BY generated_at DESC  -- outputs
```

**Action**: Review migration files in `supabase/migrations/` and ensure indexes exist:

```sql
-- Example indexes that should exist:
CREATE INDEX IF NOT EXISTS idx_scenarios_project_id ON scenarios(project_id);
CREATE INDEX IF NOT EXISTS idx_outputs_scenario_id ON outputs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_outputs_scenario_generated ON outputs(scenario_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_output_id ON ratings(output_id);
CREATE INDEX IF NOT EXISTS idx_extractions_project_id ON extractions(project_id);
CREATE INDEX IF NOT EXISTS idx_metrics_project_id ON metrics(project_id);
CREATE INDEX IF NOT EXISTS idx_metrics_extraction_id ON metrics(extraction_id);
CREATE INDEX IF NOT EXISTS idx_prompt_iterations_project_version ON prompt_iterations(project_id, version);
```

**Estimated Effort**: 1 hour

---

### 12. Utility Function Organization

**Severity**: 🟢 Medium - Code Organization
**File**: `app/api/projects/[id]/retest/route.ts:11-47`

**Problem**:
Complex utility function (Levenshtein distance, 37 lines) embedded in route handler.

**Solution**: Move to utility file

```typescript
// lib/utils/string-similarity.ts

/**
 * Calculates similarity between two strings using Levenshtein distance
 * @returns Number between 0 (completely different) and 1 (identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix with edit distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);

  // Convert distance to similarity (0 = different, 1 = identical)
  return 1 - distance / maxLen;
}

/**
 * Checks if two strings are similar enough to be considered the same
 * @param threshold - Similarity threshold (0-1), default 0.9
 */
export function areSimilar(
  str1: string,
  str2: string,
  threshold: number = 0.9,
): boolean {
  return calculateSimilarity(str1, str2) >= threshold;
}
```

**Impact**:

- Better code organization
- Reusable in other contexts
- Easier to test
- Cleaner route handlers

**Estimated Effort**: 30 minutes

---

### 13. Client-Side API Helper

**Severity**: 🟢 Medium - DX & Type Safety
**Problem**: Fetch calls duplicated across components

**Solution**: Type-safe API client

```typescript
// lib/api-client.ts

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: RequestInit,
  ): Promise<T> {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: "Request failed",
      }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient();

// Type-safe API methods
import type {
  RetestRequest,
  RetestResponse,
  GenerateResponse,
} from "@/types/api";

export const projectApi = {
  retest: (projectId: string, data: RetestRequest) =>
    api.post<RetestResponse>(`/api/projects/${projectId}/retest`, data),

  generate: (projectId: string) =>
    api.post<GenerateResponse>(`/api/projects/${projectId}/generate`),

  extract: (projectId: string) =>
    api.post(`/api/projects/${projectId}/extract`),
};
```

**Usage**:

```typescript
// Before:
const response = await fetch(`/api/projects/${projectId}/retest`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});
if (!response.ok) throw new Error("...");
const result = await response.json();

// After:
const result = await projectApi.retest(projectId, data);
// Fully typed!
```

**Estimated Effort**: 2 hours

---

## 🔵 Nice-to-Have Improvements

### 14. Environment Variable Validation

**Severity**: 🔵 Low - DX
**Problem**: No validation that required env vars are set

**Solution**: Startup validation

```typescript
// lib/env.ts

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const optionalEnvVars = ["OPENAI_API_KEY", "ANTHROPIC_API_KEY"] as const;

// Validate on module load
if (typeof window === "undefined") {
  // Server-side only
  const missing = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.join("\n")}\n\nCheck your .env.local file.`,
    );
  }

  const missingOptional = optionalEnvVars.filter(
    (varName) => !process.env[varName],
  );

  if (missingOptional.length > 0) {
    console.warn(
      `⚠️  Optional environment variables not set:\n${missingOptional.join("\n")}\nSome features may use system fallback keys.`,
    );
  }
}

// Type-safe env access
export const env = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
  },
} as const;
```

**Usage**:

```typescript
import { env } from "@/lib/env";

// Instead of:
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Use:
const url = env.supabase.url;
```

**Estimated Effort**: 1 hour

---

### 15. Structured Logging

**Severity**: 🔵 Low - Observability
**Problem**: Using `console.log` and `console.error` everywhere

**Recommendation**: Consider structured logging for production

**Example with Pino** (optional):

```typescript
// lib/logger.ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(process.env.NODE_ENV === "development" && {
    transport: {
      target: "pino-pretty",
    },
  }),
});

// Usage:
logger.info({ projectId, scenarioCount }, "Generating outputs");
logger.error({ error, projectId }, "Failed to generate output");
```

**Estimated Effort**: 2 hours (if implementing)

---

### 16. Route Handler Type Helper

**Severity**: 🔵 Low - DX
**Problem**: `RouteParams` interface duplicated in every route file

**Solution**: Shared type helper

```typescript
// types/next.ts

export type RouteContext<
  T extends Record<string, string> = Record<string, never>,
> = {
  params: Promise<T>;
};

export type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>;
```

**Usage**:

```typescript
// Instead of defining in every file:
interface RouteParams {
  params: Promise<{ id: string }>;
}

// Use:
import type { RouteContext } from "@/types/next";

export async function POST(
  request: Request,
  { params }: RouteContext<{ id: string }>,
) {
  // ...
}
```

**Estimated Effort**: 30 minutes

---

## 📊 Recommended Directory Structure

Consider reorganizing for better domain separation:

```
lib/
├── ai/
│   ├── provider-resolver.ts   # Issue #4 solution
│   ├── generation.ts           # Issue #5 solution
│   ├── clients.ts              # Wrappers for OpenAI/Anthropic
│   └── types.ts                # AI-related types
├── database/
│   ├── queries.ts              # Common query patterns
│   └── helpers.ts              # Database utilities
├── validation/
│   └── schemas.ts              # Zod schemas (Issue #10)
├── api/
│   ├── errors.ts               # API error classes (Issue #6)
│   └── client.ts               # Frontend API client (Issue #13)
├── utils/
│   ├── string-similarity.ts    # Issue #12
│   └── metrics.ts              # Existing
└── env.ts                      # Issue #14

types/
├── api.ts                      # API contracts (Issue #7)
├── database.ts                 # JSONB types (Issue #8)
├── next.ts                     # Next.js helpers (Issue #16)
└── supabase.ts                 # Augmented Supabase types

components/
├── ui/                         # shadcn components
├── common/
│   └── async-action-button.tsx # Issue #9
└── [feature]/                  # Feature-specific components
```

---

## 🎯 Prioritized Implementation Plan

### Sprint 0: Testing Foundation (Week 0 - Do This First!)

**Goal**: Establish test infrastructure before any refactoring

**Why first?** You can't safely refactor without tests. This is insurance against breaking things.

1. ✅ **Setup test infrastructure** - 1h
   - Install Vitest, Playwright, MSW, Testing Library
   - Create config files (vitest.config.ts, playwright.config.ts, tests/setup.ts)
   - Add test scripts to package.json

2. ✅ **Write security tests** - 2h
   - Create `tests/security/rls.test.ts`
   - Test RLS enforcement (will FAIL initially - that's the bug!)
   - Test auth requirements

3. ✅ **Write critical API tests** - 2h
   - Test project creation endpoint
   - Test generate endpoint
   - Test retest endpoint with MSW mocks

4. ✅ **Write one E2E test** - 2h
   - Project creation → Add scenario → Generate outputs
   - This validates the happy path works

5. ✅ **Setup CI/CD** - 1h
   - Create `.github/workflows/test.yml`
   - Run tests on every PR
   - Block merges if tests fail

**Total**: 8 hours

**Deliverable**: Test suite that currently has some FAILING tests (exposing the bugs we're about to fix)

---

### Sprint 1: Critical Security & Data (Week 1)

**Goal**: Fix security holes and data correctness issues (with tests proving they're fixed)

1. ✅ **Fix RLS bypass** (Issue #1) - 2h
   - Replace `supabaseAdmin` with `createServerClient()` in all pages
   - Security tests should now PASS
   - Add more RLS tests for other pages

2. ✅ **Fix nested query** (Issue #2) - 1h
   - Write test that reproduces the bug
   - Update extract route with two-step pattern
   - Test passes, confirming correct filtering

3. ✅ **Fix hardcoded OpenAI** (Issue #3) - 3h
   - Write tests for BYOK functionality
   - Update extract route to use factory pattern
   - Update integrate-fixes route
   - Tests confirm user API keys work

**Total**: 6 hours

**Deliverable**: All critical security/data bugs fixed, with passing tests proving it

---

### Sprint 2: Code Deduplication (Week 2)

**Goal**: Eliminate major code duplication (safely, with tests)

4. ✅ **Extract provider logic** (Issue #4) - 6h
   - Write tests for provider resolver (2h)
   - Create `lib/ai/provider-resolver.ts` (2h)
   - Update generate and retest routes (2h)
   - All tests should pass

5. ✅ **Extract generation logic** (Issue #5) - 5h
   - Write tests for generation service (2h)
   - Create `lib/ai/generation.ts` (2h)
   - Update all routes using AI generation (1h)
   - All tests should pass

6. ✅ **Standardize errors** (Issue #6) - 5h
   - Write tests for error handling (2h)
   - Create `lib/api/errors.ts` (1h)
   - Update all API routes (2h)
   - Test error responses in API tests

**Total**: 16 hours

---

### Sprint 3: Type Safety (Week 3)

**Goal**: Improve type safety and developer experience

7. ✅ **Add API types** (Issue #7) - 5h
   - Create `types/api.ts` with all endpoints
   - Update routes to use types
   - Update frontend components
   - Type errors should guide any breaking changes

8. ✅ **Define JSONB types** (Issue #8) - 3h
   - Create `types/database.ts`
   - Augment Supabase types
   - Replace `as any` casts
   - Run `npm run type-check` - should pass

9. ✅ **Add Zod validation** (Issue #10) - 4h
   - Install Zod
   - Create validation schemas with tests (1h)
   - Update routes (2h)
   - Test validation errors work correctly (1h)

**Total**: 12 hours

---

### Sprint 4: Polish & Optimization (Week 4)

**Goal**: Improve code quality and maintainability

10. ✅ **Refactor buttons** (Issue #9) - 3h
    - Write component tests (1h)
    - Create AsyncActionButton component (1h)
    - Replace existing buttons (1h)

11. ✅ **Move utilities** (Issue #12) - 1h
    - Write tests for string similarity (0.5h)
    - Move to lib/utils/string-similarity.ts (0.5h)

12. ✅ **Add API client** (Issue #13) - 3h
    - Create type-safe client (1h)
    - Write tests (1h)
    - Update components to use it (1h)

13. ✅ **Review indexes** (Issue #11) - 1h
    - Audit query patterns
    - Add missing indexes

14. ✅ **Add env validation** (Issue #14) - 1h
    - Create lib/env.ts with validation
    - Update code to use typed env

**Total**: 9 hours

**Deliverable**: Polished codebase with comprehensive test coverage

---

## 📈 Impact Metrics

### Current State

- **Lines of Code**: ~7,444 (project files only)
- **Duplicated Code**: ~150+ lines
- **Type Safety**: ~10+ `as any` casts
- **Security Issues**: 2-4 files with RLS bypass
- **Test Coverage**: 0%
- **Files > 300 lines**: 4 files

### Expected After Refactoring

- **Lines of Code**: ~7,200 app code + ~1,200 test code (-3% app, +1,200 tests)
- **Duplicated Code**: <20 lines
- **Type Safety**: 0-2 `as any` casts (only where truly necessary)
- **Security Issues**: 0 (verified by tests)
- **Test Coverage**: ~80% overall (100% critical paths)
- **Files > 300 lines**: 2 files (complex pages are acceptable)

### Code Quality Improvements

- ✅ Single source of truth for AI provider logic
- ✅ Consistent error handling across all routes
- ✅ Type-safe API contracts
- ✅ Better separation of concerns
- ✅ Comprehensive test coverage
- ✅ CI/CD preventing regressions
- ✅ Confidence to refactor safely

### Time Investment Summary

| Sprint    | Focus                 | Hours   |
| --------- | --------------------- | ------- |
| Sprint 0  | Testing Foundation    | 8h      |
| Sprint 1  | Critical Fixes        | 6h      |
| Sprint 2  | Code Deduplication    | 16h     |
| Sprint 3  | Type Safety           | 12h     |
| Sprint 4  | Polish                | 9h      |
| **Total** | **Complete Refactor** | **51h** |

**ROI**: 51 hours invested upfront = hundreds of hours saved debugging, preventing regressions, and maintaining code long-term.

---

## 🎓 Strengths to Maintain

Your codebase demonstrates several **excellent practices**:

### Architecture

- ✅ Clean separation of client/server Supabase clients
- ✅ Proper use of Next.js 14 App Router patterns
- ✅ Row Level Security implementation (just needs enforcement)
- ✅ Good component organization with shadcn/ui

### Documentation

- ✅ Comprehensive `CLAUDE.md` with patterns and guidelines
- ✅ Clear product specification in docs
- ✅ Implementation summaries for major features

### Code Quality

- ✅ Type-safe database schema generation
- ✅ Consistent naming conventions
- ✅ Good use of TypeScript features
- ✅ Modern React patterns (hooks, server components)

### Product

- ✅ Well-defined domain model
- ✅ Clear separation of concerns (projects, scenarios, outputs, ratings)
- ✅ Thoughtful UX with pattern extraction and failure analysis

---

## 🚀 Next Steps

1. **Review this document** with the team
2. **Prioritize issues** based on your timeline
3. **Create GitHub issues** for tracking
4. **Start with Sprint 1** (critical security fixes)
5. **Set up tests** as you refactor (prevent regressions)
6. **Document changes** in CLAUDE.md as patterns evolve

---

## 📚 Additional Recommendations

### Testing Strategy

Consider adding:

- **Unit tests** for utility functions (string similarity, provider resolver)
- **Integration tests** for API routes (with mocked Supabase)
- **E2E tests** for critical user flows (Playwright/Cypress)

### Monitoring

For production:

- **Error tracking** (Sentry, Rollbar)
- **Performance monitoring** (Vercel Analytics)
- **Database query monitoring** (Supabase dashboard)

### Code Quality Tools

- **ESLint** with strict rules
- **Prettier** for consistent formatting
- **Husky** for pre-commit hooks
- **TypeScript strict mode** (already enabled ✅)

---

## 🚀 Quick Start Guide

**"I just want to start fixing things. What do I do first?"**

### Day 1: Setup Testing (2 hours)

```bash
# Install test dependencies
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
npm install -D @playwright/test && npx playwright install
npm install -D msw

# Create config files (copy from the Testing Strategy section above)
# - vitest.config.ts
# - tests/setup.ts
# - playwright.config.ts

# Add test scripts to package.json
npm run test  # Should work now!
```

### Day 2: Write First Tests (3 hours)

```bash
# Create test directories
mkdir -p tests/security tests/unit/ai tests/api tests/components tests/e2e

# Write the RLS security test (from Testing Strategy section)
# This test will FAIL - proving the security bug exists
npm test tests/security/rls.test.ts  # ❌ FAIL - good!
```

### Day 3: Fix First Bug (2 hours)

```bash
# Create a branch
git checkout -b fix/rls-bypass

# Fix the RLS bypass in app/projects/[id]/page.tsx
# Replace supabaseAdmin with createServerClient()

# Run tests
npm test tests/security/rls.test.ts  # ✅ PASS - bug fixed!

# Commit
git commit -m "fix: enforce RLS in project pages"
```

### Weeks 2-4: Continue with sprints 2-4

Follow the sprint plan above, always writing tests before/during refactoring.

---

## 📚 Reference Links

**Testing Tools**:

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

**Type Safety**:

- [Zod Documentation](https://zod.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

**Supabase**:

- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgREST Query Patterns](https://postgrest.org/en/stable/)

---

## 📞 Questions?

Add comments to this doc or create GitHub issues for discussion:

- Security concerns? → Tag as `security`
- Testing questions? → Tag as `testing`
- Refactoring ideas? → Tag as `refactor`

---

_This review was generated on December 9, 2025. Code evolves, so revisit periodically to identify new technical debt._
