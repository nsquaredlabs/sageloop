# Database Queries Guide

This guide covers database query patterns using Supabase, including critical limitations and best practices.

## Overview

Sageloop uses Supabase (PostgreSQL) with auto-generated TypeScript types. Understanding Supabase's query limitations is critical for writing correct queries.

## Critical Limitation: Nested Relations

**IMPORTANT**: Supabase PostgREST cannot filter on nested relation fields. You must fetch parent IDs first, then filter children.

### ❌ DON'T: Filter on nested relations

This **DOES NOT WORK** - it fails silently:

```typescript
// ❌ This looks correct but doesn't work!
const { data } = await supabase
  .from("outputs")
  .select("*, ratings(*)")
  .eq("scenario.project_id", projectId) // ❌ Fails silently
  .gte("ratings.stars", 4); // ❌ Fails silently
```

The query will run without errors but **ignore the nested filters**.

### ✅ DO: Fetch parent IDs first, then filter

Always use this three-step pattern:

```typescript
// Step 1: Get parent IDs
const { data: scenarios } = await supabase
  .from("scenarios")
  .select("id")
  .eq("project_id", projectId);

const scenarioIds = scenarios?.map((s) => s.id) || [];

// Step 2: Filter using parent IDs
const { data: outputs } = await supabase
  .from("outputs")
  .select("*, ratings(*)")
  .in("scenario_id", scenarioIds);

// Step 3: Filter in application code (if needed)
const filtered =
  outputs?.filter(
    (o) => o.ratings && o.ratings.length > 0 && o.ratings[0].stars >= 4,
  ) || [];
```

## Common Query Patterns

### Pattern 1: Get data for a project through multiple relations

```typescript
// Data hierarchy: projects → scenarios → outputs → ratings

// Step 1: Get scenarios for project
const { data: scenarios } = await supabase
  .from("scenarios")
  .select("id")
  .eq("project_id", projectId);

const scenarioIds = scenarios?.map((s) => s.id) || [];

// Step 2: Get outputs with ratings for those scenarios
const { data: outputs } = await supabase
  .from("outputs")
  .select(
    `
    *,
    ratings(*),
    scenario:scenarios(id, input_text)
  `,
  )
  .in("scenario_id", scenarioIds);
```

### Pattern 2: Count records with filters

```typescript
// Get count of rated outputs for a project

// Step 1: Get scenario IDs
const { data: scenarios } = await supabase
  .from("scenarios")
  .select("id")
  .eq("project_id", projectId);

const scenarioIds = scenarios?.map((s) => s.id) || [];

// Step 2: Count outputs with ratings
const { count } = await supabase
  .from("outputs")
  .select("*", { count: "exact", head: true })
  .in("scenario_id", scenarioIds)
  .not("ratings", "is", null);
```

### Pattern 3: Get latest version

```typescript
const { data: outputs } = await supabase
  .from("outputs")
  .select("*")
  .eq("scenario_id", scenarioId)
  .order("version", { ascending: false })
  .limit(1);

const latestOutput = outputs?.[0];
```

### Pattern 4: Get all outputs with their latest ratings

```typescript
// Step 1: Get outputs
const { data: outputs } = await supabase
  .from("outputs")
  .select(
    `
    *,
    ratings(*)
  `,
  )
  .in("scenario_id", scenarioIds);

// Step 2: Filter to latest rating per output (in application code)
const outputsWithLatestRating = outputs?.map((output) => ({
  ...output,
  latestRating: output.ratings?.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0],
}));
```

## Basic Query Operations

### Select All

```typescript
const { data, error } = await supabase.from("projects").select("*");
```

### Select Specific Columns

```typescript
const { data } = await supabase.from("projects").select("id, name, created_at");
```

### Select with Relations

```typescript
const { data } = await supabase.from("projects").select(`
    *,
    scenarios(*)
  `);
```

### Filter by ID

```typescript
const { data } = await supabase
  .from("projects")
  .select("*")
  .eq("id", projectId)
  .single(); // Returns single object, not array
```

### Filter with Multiple Conditions

```typescript
const { data } = await supabase
  .from("outputs")
  .select("*")
  .eq("scenario_id", scenarioId)
  .gte("version", 2)
  .order("created_at", { ascending: false });
```

### Filter with IN clause

```typescript
const { data } = await supabase
  .from("outputs")
  .select("*")
  .in("scenario_id", [1, 2, 3, 4, 5]);
```

## Insert Operations

### Insert Single Record

```typescript
const { data, error } = await supabase
  .from("projects")
  .insert({
    name: "My Project",
    model_config: { model: "gpt-4", temperature: 0.7 },
    workbench_id: workbenchId,
    created_by: user.id,
  })
  .select()
  .single();
```

### Insert Multiple Records

```typescript
const { data, error } = await supabase
  .from("scenarios")
  .insert([
    { project_id: projectId, input_text: "Scenario 1" },
    { project_id: projectId, input_text: "Scenario 2" },
    { project_id: projectId, input_text: "Scenario 3" },
  ])
  .select();
```

### Insert with Returning

```typescript
const { data } = await supabase
  .from("outputs")
  .insert({ scenario_id: 1, output_text: "Result", version: 1 })
  .select("id, version") // Return only specific columns
  .single();
```

## Update Operations

### Update by ID

```typescript
const { data, error } = await supabase
  .from("projects")
  .update({ name: "Updated Name" })
  .eq("id", projectId)
  .select()
  .single();
```

### Update Multiple Records

```typescript
const { data } = await supabase
  .from("outputs")
  .update({ version: 2 })
  .in("scenario_id", scenarioIds)
  .select();
```

### Update with Conditions

```typescript
const { data } = await supabase
  .from("ratings")
  .update({ stars: 5 })
  .eq("output_id", outputId)
  .eq("created_by", user.id)
  .select();
```

### Upsert (Insert or Update)

```typescript
const { data } = await supabase
  .from("ratings")
  .upsert({
    output_id: outputId,
    created_by: user.id,
    stars: 4,
    feedback: "Good!",
  })
  .select();
```

## Delete Operations

### Delete by ID

```typescript
const { error } = await supabase.from("projects").delete().eq("id", projectId);
```

### Delete Multiple Records

```typescript
const { error } = await supabase
  .from("outputs")
  .delete()
  .in("scenario_id", scenarioIds);
```

### Delete with Conditions

```typescript
const { error } = await supabase
  .from("outputs")
  .delete()
  .eq("scenario_id", scenarioId)
  .lt("version", currentVersion);
```

## Counting Records

### Simple Count

```typescript
const { count } = await supabase
  .from("projects")
  .select("*", { count: "exact", head: true });
```

### Count with Filters

```typescript
const { count } = await supabase
  .from("outputs")
  .select("*", { count: "exact", head: true })
  .eq("scenario_id", scenarioId);
```

### Count Distinct

Use PostgreSQL functions via RPC:

```typescript
const { data } = await supabase.rpc("count_distinct_scenarios", {
  project_id: projectId,
});
```

## Ordering and Pagination

### Order By

```typescript
const { data } = await supabase
  .from("projects")
  .select("*")
  .order("created_at", { ascending: false });
```

### Multiple Order By

```typescript
const { data } = await supabase
  .from("outputs")
  .select("*")
  .order("scenario_id", { ascending: true })
  .order("version", { ascending: false });
```

### Pagination

```typescript
const page = 1;
const pageSize = 10;
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;

const { data, count } = await supabase
  .from("projects")
  .select("*", { count: "exact" })
  .range(from, to);
```

## Using RPC Functions

### Call Custom Function

```typescript
const { data, error } = await supabase.rpc("function_name", {
  param1: value1,
  param2: value2,
});
```

### Example: Get Workbench API Keys

```typescript
const { data: apiKeys } = await supabase.rpc("get_workbench_api_keys", {
  workbench_uuid: workbenchId,
});
```

### Example: Set Workbench API Keys

```typescript
await supabase.rpc("set_workbench_api_keys", {
  workbench_uuid: workbenchId,
  api_keys_json: {
    openai_key: "sk-...",
    anthropic_key: "sk-ant-...",
  },
});
```

## Working with JSONB Columns

### Query JSONB Fields

```typescript
// model_config is a JSONB column
const { data } = await supabase
  .from("projects")
  .select("*")
  .eq("model_config->model", "gpt-4");
```

### Update JSONB Fields

```typescript
// Update entire JSONB object
const { data } = await supabase
  .from("projects")
  .update({
    model_config: {
      model: "gpt-4",
      temperature: 0.7,
      system_prompt: "You are helpful.",
    },
  })
  .eq("id", projectId)
  .select();
```

### Partial JSONB Update

For partial updates, fetch first, then update:

```typescript
// Fetch current config
const { data: project } = await supabase
  .from("projects")
  .select("model_config")
  .eq("id", projectId)
  .single();

// Merge with new values
const updatedConfig = {
  ...project.model_config,
  temperature: 0.8, // Update only temperature
};

// Update
await supabase
  .from("projects")
  .update({ model_config: updatedConfig })
  .eq("id", projectId);
```

## Type Safety

### Using Generated Types

```typescript
import { Database } from "@/types/supabase";

type Project = Database["public"]["Tables"]["projects"]["Row"];
type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
type ProjectUpdate = Database["public"]["Tables"]["projects"]["Update"];

// Typed insert
const newProject: ProjectInsert = {
  name: "Test",
  model_config: {
    /* ... */
  },
  workbench_id: 1,
  created_by: userId,
};

const { data } = await supabase.from("projects").insert(newProject).select();
```

### Augmenting Types for JSONB

```typescript
// types/database.ts
export interface ModelConfig {
  model: string;
  temperature: number;
  system_prompt: string;
}

// Use in queries
const { data } = await supabase.from("projects").select("*").single();

const modelConfig = data.model_config as ModelConfig;
```

## Error Handling

### Check for Errors

```typescript
const { data, error } = await supabase
  .from("projects")
  .select("*")
  .eq("id", projectId)
  .single();

if (error) {
  console.error("Database error:", error);
  throw new Error("Failed to fetch project");
}

if (!data) {
  throw new NotFoundError("Project");
}
```

### Handle No Results

```typescript
const { data } = await supabase
  .from("projects")
  .select("*")
  .eq("id", projectId)
  .single();

if (!data) {
  // Not found or no access (RLS blocked)
  throw new NotFoundError("Project");
}
```

### Distinguish Between Not Found and RLS

```typescript
// If using supabaseAdmin, not found = truly doesn't exist
// If using createServerClient, not found = doesn't exist OR user has no access
// For user-facing endpoints, both should return 404 (don't leak existence)
```

## Performance Best Practices

### 1. Select Only Needed Columns

```typescript
// ❌ Bad: Fetch everything
const { data } = await supabase.from("outputs").select("*");

// ✅ Good: Fetch only what you need
const { data } = await supabase
  .from("outputs")
  .select("id, output_text, version");
```

### 2. Use Indexes

Ensure frequently queried columns have indexes in PostgreSQL:

- `project_id` on scenarios
- `scenario_id` on outputs
- `output_id` on ratings
- `created_by` on most tables

### 3. Limit Results

```typescript
const { data } = await supabase.from("projects").select("*").limit(100); // Don't fetch thousands of records
```

### 4. Use Count Carefully

```typescript
// ❌ Expensive: Fetch all data just to count
const { data } = await supabase.from("projects").select("*");
const count = data?.length || 0;

// ✅ Efficient: Count without fetching data
const { count } = await supabase
  .from("projects")
  .select("*", { count: "exact", head: true });
```

### 5. Avoid N+1 Queries

```typescript
// ❌ Bad: N+1 query
const { data: projects } = await supabase.from("projects").select("*");
for (const project of projects) {
  const { data: scenarios } = await supabase
    .from("scenarios")
    .select("*")
    .eq("project_id", project.id);
}

// ✅ Good: Single query with join
const { data: projects } = await supabase.from("projects").select(`
    *,
    scenarios(*)
  `);
```

## Common Mistakes

### Mistake 1: Forgetting `.single()`

```typescript
// Returns array with one element
const { data } = await supabase
  .from("projects")
  .select("*")
  .eq("id", projectId);

console.log(data[0].name); // Need to access first element

// Returns single object
const { data } = await supabase
  .from("projects")
  .select("*")
  .eq("id", projectId)
  .single();

console.log(data.name); // Direct access
```

### Mistake 2: Not Checking Errors

```typescript
// ❌ Bad: Assume success
const { data } = await supabase.from("projects").select("*");
return data; // Might be null!

// ✅ Good: Check error
const { data, error } = await supabase.from("projects").select("*");
if (error) throw error;
return data || [];
```

### Mistake 3: Filtering on Nested Relations

See [Critical Limitation section](#critical-limitation-nested-relations) above.

### Mistake 4: Not Using RLS-Protected Clients

```typescript
// ❌ Bad: Using admin client for user data
import { supabaseAdmin } from "@/lib/supabase/admin";
const { data } = await supabaseAdmin.from("projects").select("*");

// ✅ Good: Using RLS-protected client
const supabase = await createServerClient();
const { data } = await supabase.from("projects").select("*");
```

## Testing Database Queries

### Mock Supabase in Tests

```typescript
import { vi } from "vitest";

const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { id: 1, name: "Test" },
      error: null,
    }),
  })),
};
```

### Integration Tests with Test Database

Use Supabase local development:

```bash
supabase start # Start local Supabase
npm test       # Run tests against local DB
supabase stop  # Stop local Supabase
```

## Related Documentation

- [Authentication Guide](authentication.md) - RLS and auth patterns
- [API Patterns Guide](api-patterns.md) - Using queries in API routes
- [Environment Guide](environment.md) - Database configuration
