# Database Queries

Sageloop uses [Drizzle ORM](https://orm.drizzle.team) with a local SQLite database via `better-sqlite3`.

## Setup

`lib/db/index.ts` exports a singleton `getDb()` function. Call it at the start of any route handler.

```typescript
import { getDb, schema } from "@/lib/db";

const db = getDb();
```

`getDb()` initializes the database on first call: it opens `sageloop.db` in the project root, enables WAL mode and foreign key enforcement, and runs any pending migrations from the `drizzle/` folder. Subsequent calls return the cached instance.

## Schema Overview

Defined in `lib/db/schema.ts`. All primary keys are auto-increment integers. Timestamps are TEXT columns storing ISO strings (SQLite has no native timestamp type).

| Table             | Foreign keys                                           | JSON columns             |
| ----------------- | ------------------------------------------------------ | ------------------------ |
| `projects`        | —                                                      | `model_config`           |
| `scenarios`       | `project_id → projects`                                | —                        |
| `outputs`         | `scenario_id → scenarios`                              | `model_snapshot`         |
| `ratings`         | `output_id → outputs`                                  | `tags`, `metadata`       |
| `extractions`     | `project_id → projects`                                | `criteria`, `dimensions` |
| `metrics`         | `project_id → projects`, `extraction_id → extractions` | `criteria_breakdown`     |
| `prompt_versions` | `project_id → projects`                                | `model_config`           |

All foreign keys are declared with `onDelete: "cascade"`, so deleting a project removes all its scenarios, outputs, ratings, and extractions automatically.

## CRUD Patterns

### Select all rows

```typescript
const rows = db
  .select()
  .from(schema.projects)
  .orderBy(desc(schema.projects.created_at))
  .all();
```

`.all()` returns an array. Use it for multi-row results.

### Select a single row by ID

```typescript
import { eq } from "drizzle-orm";

const row = db
  .select()
  .from(schema.projects)
  .where(eq(schema.projects.id, projectId))
  .get();

if (!row) {
  return NextResponse.json({ error: "Project not found" }, { status: 404 });
}
```

`.get()` returns the first matching row or `undefined`.

### Select with multiple conditions

```typescript
import { eq, and, desc } from "drizzle-orm";

const rows = db
  .select()
  .from(schema.outputs)
  .where(and(eq(schema.outputs.scenario_id, scenarioId)))
  .orderBy(desc(schema.outputs.generated_at))
  .all();
```

### Select with IN clause

```typescript
import { inArray } from "drizzle-orm";

const rows = db
  .select()
  .from(schema.outputs)
  .where(inArray(schema.outputs.scenario_id, scenarioIds))
  .all();
```

### Insert a single row

```typescript
const row = db
  .insert(schema.projects)
  .values({
    name: "My Project",
    description: "Optional description",
    model_config: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.7 }),
  })
  .returning()
  .get();
```

`.returning().get()` returns the inserted row including the auto-generated `id` and `created_at`.

### Insert multiple rows

```typescript
const rows = db
  .insert(schema.scenarios)
  .values([
    { project_id: projectId, input_text: "Scenario 1", order: 0 },
    { project_id: projectId, input_text: "Scenario 2", order: 1 },
  ])
  .returning()
  .all();
```

### Update a row

```typescript
const row = db
  .update(schema.projects)
  .set({
    name: "Updated Name",
    updated_at: new Date().toISOString(),
  })
  .where(eq(schema.projects.id, projectId))
  .returning()
  .get();

if (!row) {
  return NextResponse.json({ error: "Project not found" }, { status: 404 });
}
```

### Delete a row

```typescript
db.delete(schema.projects).where(eq(schema.projects.id, projectId)).run();
```

`.run()` executes without returning data. Because of cascade deletes, this also removes all scenarios, outputs, and ratings for the project.

## JSON Column Handling

SQLite stores all JSON columns as TEXT. Drizzle does not automatically parse or stringify these — you must do it yourself.

### Writing JSON

Always `JSON.stringify` before inserting or updating:

```typescript
db.insert(schema.projects)
  .values({
    name: "My Project",
    model_config: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.7,
      system_prompt: "You are helpful.",
    }),
  })
  .run();
```

### Reading JSON

Always `JSON.parse` after reading:

```typescript
const row = db
  .select()
  .from(schema.projects)
  .where(eq(schema.projects.id, id))
  .get();

const project = {
  ...row,
  model_config: row.model_config ? JSON.parse(row.model_config) : null,
};
```

For lists, map over all rows:

```typescript
const rows = db.select().from(schema.projects).all();

const projects = rows.map((p) => ({
  ...p,
  model_config: p.model_config ? JSON.parse(p.model_config) : null,
}));
```

### Partial JSON updates

Fetch first, merge, then write back:

```typescript
const row = db
  .select({ model_config: schema.projects.model_config })
  .from(schema.projects)
  .where(eq(schema.projects.id, projectId))
  .get();

const existing = row?.model_config ? JSON.parse(row.model_config) : {};
const updated = { ...existing, temperature: 0.9 };

db.update(schema.projects)
  .set({ model_config: JSON.stringify(updated) })
  .where(eq(schema.projects.id, projectId))
  .run();
```

## Multi-Table Queries

SQLite and Drizzle support joins, but for the data hierarchy in Sageloop it is often simpler to run two queries and join in application code.

### Pattern: fetch child rows for a project

```typescript
// Step 1: get scenario IDs for the project
const scenarioRows = db
  .select({ id: schema.scenarios.id })
  .from(schema.scenarios)
  .where(eq(schema.scenarios.project_id, projectId))
  .all();

const scenarioIds = scenarioRows.map((s) => s.id);

// Step 2: fetch outputs for those scenarios
const outputs = scenarioIds.length
  ? db
      .select()
      .from(schema.outputs)
      .where(inArray(schema.outputs.scenario_id, scenarioIds))
      .all()
  : [];
```

Guard against an empty `scenarioIds` array — `inArray` with an empty array throws.

### Drizzle join (when you need it)

```typescript
import { eq } from "drizzle-orm";

const rows = db
  .select({
    output: schema.outputs,
    scenario: schema.scenarios,
  })
  .from(schema.outputs)
  .innerJoin(
    schema.scenarios,
    eq(schema.outputs.scenario_id, schema.scenarios.id),
  )
  .where(eq(schema.scenarios.project_id, projectId))
  .all();
```

## Migrations

Drizzle Kit generates SQL migration files. Migrations live in the `drizzle/` folder and are applied automatically when `getDb()` is first called.

### Workflow for schema changes

1. Edit `lib/db/schema.ts`.
2. Generate the migration:
   ```bash
   cd /Users/nishal/projects/sageloop-project/sageloop && npx drizzle-kit generate
   ```
3. Review the generated SQL file in `drizzle/`.
4. Restart the dev server — `getDb()` applies the migration on startup.

### Manual migration (if needed)

```bash
cd /Users/nishal/projects/sageloop-project/sageloop && npx drizzle-kit migrate
```

## Performance Notes

- SQLite is synchronous and single-writer. Drizzle's `better-sqlite3` adapter uses synchronous calls — there is no `await` needed for database operations.
- WAL mode (enabled by default in `lib/db/index.ts`) allows concurrent reads alongside a write.
- For large result sets, select only the columns you need rather than `select()` (which fetches all).
- Guard every `inArray()` call with a length check to avoid an empty-array error.
