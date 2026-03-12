# Sageloop Product Specification (v2.0)

**Last Updated:** December 11, 2025
**Status:** Active Development - Post-MVP Enhancements
**Previous Version:** [product-spec.md](product-spec.md) (Original MVP spec)

---

## Vision

Sageloop is a behavioral design tool for AI products that enables Product Managers to define "good" AI behavior through examples and ratings, rather than code. Think of it as **"Figma for AI Evals"** - creating a shared artifact between PMs and engineers for AI quality.

### The Core Insight

Through real-world usage, we discovered the actual value proposition:

**The value isn't just the AI clustering or suggested fixes. It's the simple UX of seeing 20-30 outputs at once instead of one at a time.**

When PMs can see patterns across multiple outputs simultaneously:

- ✅ Scenario 1: Works
- ❌ Scenario 2: Wrong year (2022)
- ✅ Scenario 3: Works
- ❌ Scenario 4: Wrong year (2022)

**The pattern jumps out immediately.** You don't need AI to tell you "4 failures, same issue" - you SEE it.

This makes Sageloop fundamentally different from other eval tools:

- **Other tools**: Built for ML engineers running automated tests
- **Sageloop**: Built for PMs doing rapid manual evaluation at scale
- **Engineers want**: Automation and metrics
- **PMs want**: Rapid visual pattern recognition

---

## Pricing Tiers & Model Access

**IMPORTANT**: Sageloop provides AI models to users in all standard tiers. Users do NOT bring their own API keys unless they're on Enterprise tier.

### Tier Structure

| Tier           | Price       | Standard Outputs | Premium Outputs | Models                                 | API Keys                 |
| -------------- | ----------- | ---------------- | --------------- | -------------------------------------- | ------------------------ |
| **Free**       | $0/month    | 100/month        | -               | GPT-5-nano                             | Sageloop-provided        |
| **Pro**        | $20/month   | 1,000/month      | 200/month       | GPT-5-mini, GPT-5.1, Claude Sonnet 4.5 | Sageloop-provided        |
| **Team**       | $49/month   | 3,000/month      | 750/month       | GPT-5-mini, GPT-5.1, Claude Sonnet 4.5 | Sageloop-provided        |
| **Enterprise** | $199+/month | 10,000/month     | 2,500/month     | All models + BYOK                      | User-provided (optional) |

### Key Principles

1. **Free, Pro, Team tiers**: All use Sageloop's predefined AI models
   - **No user API key setup required** - This is critical for onboarding UX
   - Usage limits and quotas managed by Sageloop
   - Simplified pricing (users pay for value, not API costs)
   - Users select from predefined models: GPT-5-nano (Free), GPT-5-mini (Pro+), GPT-5.1, Claude Sonnet 4.5 (Pro+ premium outputs)

2. **Enterprise tier only**: Supports bring-your-own-key (BYOK)
   - Optional BYOK for unlimited outputs with custom usage limits
   - Access to all models including GPT-5.2, Claude Opus 4.5, o3, etc.
   - Custom model configurations and fine-tuned models

### Why This Approach?

**User Experience**:

- ✅ Removes friction from onboarding (no API key complexity)
- ✅ Simplified pricing (predictable monthly cost)
- ✅ Consistent experience across all users

**Business Model**:

- ✅ Sageloop manages AI costs and passes value to users
- ✅ Predictable revenue per tier
- ✅ Easier cost management and optimization

### Implementation Note

Current codebase has `workbench_api_keys` table and provider resolution logic from earlier BYOK-first architecture. This infrastructure remains but is **only used for Enterprise tier**. For Free/Pro/Team tiers, the system uses Sageloop's centralized API keys (managed via environment variables, not exposed to users).

**See**: `/Users/nishal/projects/sageloop-project/sageloop-marketing/docs/marketing-site-prd.md` (lines 363-454) for full pricing details.

---

## What's Been Built (Current State)

### ✅ Fully Implemented Features

#### 1. Authentication & Multi-User Support

**Status:** Complete (December 2025)

- Email/password authentication via Supabase Auth
- Session management with HTTP-only cookies
- Protected routes via Next.js middleware
- Automatic personal workbench creation on signup
- Row Level Security (RLS) for data isolation

**Implementation Details:**

- File: `lib/supabase/client.ts`, `lib/supabase/server.ts`
- Migration: `20250108000000_add_workbench_api_keys.sql`
- Auth pages: `app/(auth)/login/page.tsx`, `app/(auth)/signup/page.tsx`

#### 2. Workbench System (Team Workspaces)

**Status:** Complete (December 2025)

- **Workbenches**: Team workspace concept for collaboration
- **Multi-workbench support**: Users can belong to multiple workbenches
- **API Key Management**: Per-workbench OpenAI and Anthropic API keys (**Enterprise tier only**)
- **RLS Policies**: Automatic filtering by user's workbench membership

**Database Schema:**

```sql
workbenches (id, name, created_at, updated_at)
user_workbenches (user_id, workbench_id, role)
workbench_api_keys (workbench_id, openai_key, anthropic_key)  -- Enterprise only
projects (workbench_id, created_by, ...)
```

**Why "Workbench"?**
Evokes a place where you craft and iterate - aligns with Sageloop's mission of helping PMs build better AI products.

**Note on API Keys:**

- **Free/Pro/Team tiers**: Users do NOT manage API keys. Sageloop provides models via system credentials.
- **Enterprise tier**: Optional BYOK support via `workbench_api_keys` table for unlimited usage with custom models.

#### 3. Project Management

**Status:** Complete

- Create projects with name, description
- Configure AI model (GPT-3.5, GPT-4, Claude models)
- Set system prompt and temperature
- Edit project settings
- Delete projects
- Project versioning for prompt iterations

**Features:**

- Model config stored as JSONB
- Support for OpenAI and Anthropic models
- Provider resolution logic:
  - **Free/Pro/Team tiers**: Uses Sageloop system credentials (no user API keys)
  - **Enterprise tier**: Optional BYOK via `workbench_api_keys` table
- Prompt version tracking

**Files:**

- Page: `app/projects/page.tsx`, `app/projects/[id]/page.tsx`
- API: `app/api/projects/route.ts`, `app/api/projects/[id]/route.ts`

#### 4. Scenario Management

**Status:** Complete

- Add test scenarios (user inputs) individually
- Bulk import via textarea (one per line)
- Edit scenario text
- Delete scenarios
- Reorder scenarios
- Organize by project

**Database:**

```sql
scenarios (id, project_id, input_text, order, created_at)
```

**Files:**

- Component: `components/scenarios/scenario-input.tsx`
- API: `app/api/projects/[id]/scenarios/route.ts`

#### 5. AI Output Generation

**Status:** Complete with Multi-Provider Support

- Generate AI outputs for all scenarios in a project
- Support for multiple AI providers:
  - OpenAI (GPT-5-nano, GPT-5-mini, GPT-5.1, GPT-5.2)
  - Anthropic (Claude Sonnet 4.5, Claude Opus 4.5)
- Provider resolution:
  - **Free/Pro/Team tiers**: Uses Sageloop system API keys (managed via environment variables)
  - **Enterprise tier**: Optional BYOK via workbench API keys for custom/unlimited usage
- Parallel generation for speed
- Error handling and retry logic
- Usage tracking (tokens, cost estimation, quota management)

**Architecture:**

- **Provider Resolver**: `lib/ai/provider-resolver.ts`
  - Resolves which provider to use based on:
    - User's tier (Free → GPT-5-nano only, Pro+ → multiple models)
    - Model selected by user (from tier's available models)
    - For Enterprise: Optional user-provided API keys from `workbench_api_keys`
  - For standard tiers: Returns Sageloop system credentials (not exposed to user)
  - For Enterprise BYOK: Returns user's workbench API key

- **Generation Service**: `lib/ai/generation.ts`
  - Unified interface for all AI providers
  - Streaming support (future)
  - Usage tracking and cost calculation
  - Error handling with detailed messages

- **System Model Config**: `lib/ai/system-model-config.ts`
  - Centralized configuration for system operations
  - Used for: pattern extraction, failure analysis, prompt suggestions
  - Easy to change model across all system operations

**Database:**

```sql
outputs (
  id,
  scenario_id,
  output_text,
  model_snapshot JSONB,  -- Stores model, temp, prompt used
  generated_at,
  usage_data JSONB       -- Tokens, cost, provider info
)
```

**Files:**

- API: `app/api/projects/[id]/generate/route.ts`
- Component: `components/outputs/output-display.tsx`
- Page: `app/projects/[id]/outputs/page.tsx`

#### 6. Rating Interface

**Status:** Complete with Smart Features

- 5-star rating system
- Written feedback (why rated this way)
- Tag common issues (length, tone, accuracy, formatting, etc.)
- **Smart Rating Carry-Forward**:
  - Automatically carries forward ratings for similar outputs (>90% similarity)
  - Uses Levenshtein distance for similarity detection
  - Saves PM time when outputs barely change across iterations
- Keyboard shortcuts for rapid rating
- Inline editing of outputs before rating
- Delete ratings

**Implementation:**

- Similarity algorithm: `lib/utils/string-similarity.ts`
- Uses Levenshtein distance with configurable threshold (default 90%)
- Only carries forward if output text is highly similar
- PM can always override carried-forward ratings

**Database:**

```sql
ratings (
  id,
  output_id,
  stars (1-5),
  feedback_text,
  tags JSONB,
  extraction_version INTEGER,  -- Links rating to extraction
  created_at
)
```

**Files:**

- Component: `components/ratings/rating-interface.tsx`
- API: `app/api/outputs/[id]/rate/route.ts`
- Utility: `lib/utils/string-similarity.ts`

#### 7. Pattern Extraction & Failure Analysis

**Status:** Complete - AI-Powered

**Key Innovation:** Instead of generic quality criteria, Sageloop performs **intelligent failure clustering**:

**Before (Generic Patterns):**

```json
{
  "recommendations": [
    "Implement length checks",
    "Maintain balance between conciseness and completeness"
  ]
}
```

**After (Actionable Clusters):**

```json
{
  "failure_analysis": {
    "total_failures": 4,
    "clusters": [
      {
        "name": "year_defaulting",
        "count": 4,
        "pattern": "All outputs defaulted to 2022 for current year",
        "root_cause": "LLM has no access to current date",
        "suggested_fix": "Add 'Current date: {{current_date}}' to system prompt",
        "example_inputs": ["meeting tomorrow at 2pm", "schedule next week"],
        "scenario_ids": [1, 3, 5, 7],
        "severity": "high"
      }
    ]
  }
}
```

**How It Works:**

1. PM rates outputs (some get ≤2 stars = failures)
2. System sends all low-rated outputs + PM feedback to LLM
3. LLM clusters failures by root cause (not symptoms)
4. For each cluster: identifies pattern, root cause, and concrete fix
5. Returns copy-pasteable prompt improvements

**Real-World Validation:**

- ✅ Found the "2022 year bug" across 4/10 scenarios
- ✅ Suggested specific fix (add current date to system prompt)
- ✅ Generic quality criteria would have missed this entirely

**Database:**

```sql
extractions (
  id,
  project_id,
  criteria JSONB,           -- Contains failure_analysis
  confidence_score NUMERIC,
  created_at
)
```

**Files:**

- API: `app/api/projects/[id]/extract/route.ts`
- Page: `app/projects/[id]/insights/page.tsx`
- Component: `components/insights/pattern-display.tsx`

#### 8. Prompt Iteration & Retest Workflow

**Status:** Complete - Full Iterative Loop

**The Complete Flow:**

```
1. PM rates 20 outputs
2. Pattern extraction finds "4/10 failed - year defaulting to 2022"
3. Insights page shows:
   - Failure cluster with root cause
   - Suggested fix: "Add current date to system prompt"
   - [Apply Fix & Retest] button
4. PM clicks button:
   - Dialog shows before/after prompt
   - PM can edit further
   - Click "Update & Retest"
5. System:
   - Saves prompt as v2
   - Regenerates ONLY the 4 failed outputs
   - Shows: "3/4 now pass ✅ | 1 still fails ❌"
6. PM rates new outputs
7. Next extraction shows improvement
```

**Key Features:**

- **Selective Retest**: Only regenerates failed scenarios (not all 100)
- **Version Tracking**: Each prompt iteration is saved with version number
- **Before/After Comparison**: Side-by-side prompt diff
- **Success Rate Tracking**: Shows improvement per version
- **Improvement Notes**: PM can annotate what each version fixed

**Database Schema:**

```sql
-- Prompt versioning
ALTER TABLE projects ADD COLUMN prompt_version INTEGER DEFAULT 1;

-- Track prompt iterations
CREATE TABLE prompt_iterations (
  id BIGINT PRIMARY KEY,
  project_id BIGINT,
  version INTEGER,
  system_prompt TEXT,
  parent_version INTEGER,
  improvement_note TEXT,
  success_rate_before NUMERIC,
  success_rate_after NUMERIC,
  created_at TIMESTAMP
);
```

**API Endpoints:**

- `POST /api/projects/[id]/retest` - Apply fix and regenerate failed outputs
- `GET /api/projects/[id]/versions` - Get prompt version history

**Files:**

- Component: `components/apply-fix-button.tsx`
- API: `app/api/projects/[id]/retest/route.ts`
- Migration: `supabase/migrations/20251208000000_add_prompt_versioning.sql`

#### 9. Success Metrics Dashboard

**Status:** Complete

- Real-time success rate: "73% of outputs meet your standards"
- Breakdown by star rating distribution
- Criteria-based metrics (future enhancement)
- Historical tracking over time
- Trend visualization

**Database:**

```sql
metrics (
  id,
  project_id,
  extraction_id,
  success_rate NUMERIC,
  criteria_breakdown JSONB,
  snapshot_time TIMESTAMP
)
```

**Files:**

- Component: `components/metrics/metrics-dashboard.tsx`
- API: `app/api/projects/[id]/metrics/route.ts`

#### 10. Export & CI/CD Integration

**Status:** Complete - Production Ready

**Export Formats:**

1. **JSON Test Suite** (for CI/CD)

```json
{
  "project": {
    "name": "Date Parser",
    "exported_at": "2025-12-11T..."
  },
  "model_config": {
    "model": "gpt-4",
    "temperature": 0.7,
    "system_prompt": "You are a date parser..."
  },
  "golden_examples": [
    {
      "input": "meeting tomorrow at 2pm",
      "output": "2025-12-12T14:00:00Z",
      "rating": 5,
      "feedback": "Perfect date parsing",
      "tags": ["accurate", "formatted"]
    }
  ],
  "negative_examples": [
    {
      "input": "schedule next week",
      "output": "2022-12-19T...",
      "rating": 1,
      "why_failed": "Wrong year - defaulting to 2022",
      "suggested_fix": "Add current date to system prompt",
      "failure_cluster": "year_defaulting"
    }
  ],
  "failure_analysis": {
    "total_failures": 4,
    "clusters": [...]
  }
}
```

2. **Markdown Quality Spec** (for documentation)

```markdown
# Date Parser - Quality Specification

**Exported**: December 11, 2025

## Model Configuration

- **Model**: gpt-4
- **Temperature**: 0.7

### System Prompt
```

You are a date parser...

```

## Failure Analysis
**Total Failures**: 4 outputs rated ≤2 stars

### 1. Year Defaulting (4 outputs)
**Pattern**: All outputs defaulted to 2022 for current year
**Root Cause**: LLM has no access to current date
**Suggested Fix**:
```

Add 'Current date: {{current_date}}' to system prompt

```

## Golden Examples
[High-rated outputs with explanations]

## What to Avoid
[Low-rated outputs with fixes]
```

**What Got Cut (The Fluff):**

- ❌ `quality_criteria` section (vague patterns like "concise yet complete")
- ❌ `test_cases` section (duplicated golden examples)
- ❌ `implementation_recommendations` section (generic advice)

**What Stayed (100% Actionable):**

- ✅ Model config (actual prompt being tested)
- ✅ Golden examples (regression tests)
- ✅ Negative examples (what failed and why)
- ✅ Failure analysis (concrete fixes)

**Files:**

- API: `app/api/projects/[id]/export/route.ts`
- Download formats: `?format=json` or `?format=markdown`

#### 11. Extraction History

**Status:** Complete

- View all past extractions for a project
- See how criteria evolved over time
- Compare success rates across versions
- Link extractions to metrics snapshots

**Pages:**

- Current insights: `app/projects/[id]/insights/page.tsx`
- History view: `app/projects/[id]/insights/history/page.tsx`

**API:**

- `GET /api/projects/[id]/extractions` - Get all extractions
- `GET /api/projects/[id]/extractions/[extractionId]` - Get specific extraction

---

## Technical Architecture (Current)

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Type Safety**: Supabase CLI auto-generated types
- **AI Providers**:
  - OpenAI (GPT-3.5, GPT-4 series)
  - Anthropic (Claude 3 series)
  - System operations use centralized model config
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui (Radix primitives)
- **Deployment**: Vercel
- **Testing**: Vitest (unit), Playwright (E2E)

### Key Architectural Patterns

#### 1. Multi-Provider AI Support

**Problem Solved**: Support multiple AI providers while maintaining simple UX for standard users.

**Solution**: Tiered provider resolution system:

**For Free/Pro/Team tiers:**

- User selects from predefined models (GPT-5-nano, GPT-5-mini, GPT-5.1, Claude Sonnet 4.5)
- System uses Sageloop's centralized API keys (managed via environment variables)
- No user API key setup required - zero friction

**For Enterprise tier:**

- Optional BYOK (bring your own keys) for unlimited usage
- Access to all models including enterprise-only models (GPT-5.2, Claude Opus 4.5)
- Falls back to Sageloop keys if user doesn't provide their own

**Files**:

- `lib/ai/provider-resolver.ts` - Tier-aware provider selection logic
- `lib/ai/generation.ts` - Unified generation service
- `lib/ai/system-model-config.ts` - System model configuration
- `lib/ai/types.ts` - AI-related TypeScript types
- `lib/env.ts` - Sageloop system API keys (for Free/Pro/Team tiers)

**Example**:

```typescript
// User wants GPT-4 but only has Anthropic API key
const { provider, modelName, apiKey, usingFallback } = resolveProvider(
  "gpt-4",
  { openai: null, anthropic: "sk-ant-..." },
);
// Returns: { provider: 'anthropic', modelName: 'claude-3-opus', usingFallback: true }
```

#### 2. Type-Safe API Client

**Problem Solved**: Frontend needs type-safe way to call backend APIs.

**Solution**: Centralized API client with full TypeScript types.

**Files**:

- `lib/api/client.ts` - Type-safe frontend API client
- `lib/api/errors.ts` - Standardized error classes
- `types/api.ts` - API request/response contracts

**Example**:

```typescript
import { projectApi } from "@/lib/api/client";

// Fully typed - TypeScript knows the shape
const result = await projectApi.retest(projectId, {
  scenarioIds: [1, 2, 3],
  newSystemPrompt: "Updated prompt",
  improvementNote: "Fixed date handling",
});
// result.version is typed as number
```

#### 3. Request Validation with Zod

**Problem Solved**: Need to validate API inputs at runtime.

**Solution**: Zod schemas for all API requests.

**Files**:

- `lib/validation/schemas.ts` - Zod validation schemas

**Example**:

```typescript
import { createProjectSchema } from "@/lib/validation/schemas";

const validatedData = createProjectSchema.parse(body);
// Throws ValidationError if invalid
```

#### 4. Row Level Security (RLS)

**Problem Solved**: Multi-user data isolation and security.

**Solution**: Supabase RLS policies automatically filter all queries.

**How It Works**:

1. User signs up → Auto-creates personal workbench
2. Projects belong to workbenches
3. Users access projects through workbench membership
4. RLS policies automatically filter all queries by user's workbenches

**Data Flow**:

```
auth.users (Supabase managed)
    ↓ many-to-many
workbenches
    ↓ one-to-many
projects → scenarios → outputs → ratings
projects → extractions → metrics
```

**Client Types**:

- `createClient()` - Browser client (client components)
- `createServerClient()` - Server client (Server Components/API routes)
- `supabaseAdmin` - **ONLY for system operations** (migrations, admin tasks)

**Files**:

- `lib/supabase/client.ts` - Browser client
- `lib/supabase/server.ts` - Server client
- `lib/supabase/admin.ts` - Admin client
- Migration: `20250101000000_initial_schema.sql` (RLS policies)

#### 5. Supabase Query Patterns

**Problem Solved**: Supabase doesn't support filtering on nested relations.

**Pattern**: Always fetch parent IDs first, then filter children.

**Example**:

```typescript
// ❌ DON'T: This fails silently
const { data } = await supabase
  .from("outputs")
  .select("*, ratings(*)")
  .eq("scenario.project_id", projectId); // ❌ Fails

// ✅ DO: Fetch parent IDs first
const { data: scenarios } = await supabase
  .from("scenarios")
  .select("id")
  .eq("project_id", projectId);

const scenarioIds = scenarios?.map((s) => s.id) || [];

const { data: outputs } = await supabase
  .from("outputs")
  .select("*, ratings(*)")
  .in("scenario_id", scenarioIds); // ✅ Works
```

#### 6. Environment Variable Management

**Problem Solved**: Type-safe access to environment variables.

**Solution**: Centralized `env` module with validation.

**Files**:

- `lib/env.ts` - Type-safe environment variables

**Example**:

```typescript
// ❌ DON'T
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ✅ DO
import { env } from "@/lib/env";
const url = env.supabase.url;
```

**Benefits**:

- Type-safe access
- Validation on startup (fails fast if missing)
- Clear warnings for missing optional variables
- Centralized configuration

#### 7. String Similarity for Rating Carry-Forward

**Problem Solved**: PMs waste time re-rating nearly identical outputs.

**Solution**: Levenshtein distance algorithm with configurable threshold.

**Files**:

- `lib/utils/string-similarity.ts`

**Algorithm**:

```typescript
calculateSimilarity(oldOutput, newOutput); // Returns 0.0-1.0
areSimilar(oldOutput, newOutput, 0.9); // True if >90% similar
```

**Use Case**:

- Prompt changes slightly, outputs barely change
- System auto-carries forward rating if similarity >90%
- PM can always override

### Database Schema (Current)

**Full Schema**:

```sql
-- Authentication (Supabase managed)
auth.users (id, email, created_at)

-- Workbenches (Team workspaces)
workbenches (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- User-Workbench Membership
user_workbenches (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  workbench_id UUID REFERENCES workbenches,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP,
  UNIQUE(user_id, workbench_id)
)

-- Workbench API Keys
workbench_api_keys (
  id UUID PRIMARY KEY,
  workbench_id UUID REFERENCES workbenches,
  openai_key TEXT,
  anthropic_key TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Projects
projects (
  id BIGINT PRIMARY KEY,
  workbench_id UUID REFERENCES workbenches,
  created_by UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  description TEXT,
  model_config JSONB NOT NULL,  -- { model, temperature, system_prompt }
  prompt_version INTEGER DEFAULT 1,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

-- Scenarios (Test inputs)
scenarios (
  id BIGINT PRIMARY KEY,
  project_id BIGINT REFERENCES projects,
  input_text TEXT NOT NULL,
  order INTEGER,
  created_at TIMESTAMP
)

-- Outputs (AI responses)
outputs (
  id BIGINT PRIMARY KEY,
  scenario_id BIGINT REFERENCES scenarios,
  output_text TEXT NOT NULL,
  model_snapshot JSONB,  -- Stores model config used
  usage_data JSONB,      -- Tokens, cost, provider
  generated_at TIMESTAMP
)

-- Ratings (PM feedback)
ratings (
  id BIGINT PRIMARY KEY,
  output_id BIGINT REFERENCES outputs,
  stars INTEGER CHECK (stars BETWEEN 1 AND 5),
  feedback_text TEXT,
  tags JSONB,  -- ['length', 'tone', 'accuracy']
  extraction_version INTEGER,
  created_at TIMESTAMP
)

-- Extractions (Pattern analysis)
extractions (
  id BIGINT PRIMARY KEY,
  project_id BIGINT REFERENCES projects,
  criteria JSONB,  -- Contains failure_analysis
  confidence_score NUMERIC,
  created_at TIMESTAMP
)

-- Metrics (Success tracking)
metrics (
  id BIGINT PRIMARY KEY,
  project_id BIGINT REFERENCES projects,
  extraction_id BIGINT REFERENCES extractions,
  success_rate NUMERIC,
  criteria_breakdown JSONB,
  snapshot_time TIMESTAMP
)

-- Prompt Iterations (Version history)
prompt_iterations (
  id BIGINT PRIMARY KEY,
  project_id BIGINT REFERENCES projects,
  version INTEGER,
  system_prompt TEXT,
  parent_version INTEGER,
  improvement_note TEXT,
  success_rate_before NUMERIC,
  success_rate_after NUMERIC,
  created_at TIMESTAMP
)
```

### API Endpoints (Current)

**Projects**:

- `GET /api/projects` - List all projects (filtered by workbench)
- `POST /api/projects` - Create project
- `GET /api/projects/[id]` - Get project details
- `PATCH /api/projects/[id]` - Update project
- `DELETE /api/projects/[id]` - Delete project
- `POST /api/projects/[id]/retest` - Apply fix and retest

**Scenarios**:

- `POST /api/projects/[id]/scenarios` - Add scenarios (single or bulk)
- `PATCH /api/scenarios/[id]` - Update scenario
- `DELETE /api/scenarios/[id]` - Delete scenario

**Outputs**:

- `POST /api/projects/[id]/generate` - Generate AI outputs for all scenarios
- `GET /api/projects/[id]/outputs` - Get all outputs for project

**Ratings**:

- `POST /api/outputs/[id]/rate` - Rate an output
- `PATCH /api/ratings/[id]` - Update rating
- `DELETE /api/ratings/[id]` - Delete rating

**Extractions**:

- `POST /api/projects/[id]/extract` - Run pattern extraction
- `GET /api/projects/[id]/extractions` - Get extraction history
- `GET /api/projects/[id]/extractions/[extractionId]` - Get specific extraction

**Metrics**:

- `GET /api/projects/[id]/metrics` - Get current success metrics

**Export**:

- `GET /api/projects/[id]/export?format=json` - Export JSON test suite
- `GET /api/projects/[id]/export?format=markdown` - Export Markdown spec

**Versions**:

- `GET /api/projects/[id]/versions` - Get prompt version history

**Workbench**:

- `GET /api/workbenches/[id]/api-keys` - Get workbench API keys
- `PATCH /api/workbenches/[id]/api-keys` - Update API keys

### File Structure (Current)

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── projects/
│   │   ├── page.tsx                    # Projects list
│   │   ├── new/page.tsx                # Create project
│   │   └── [id]/
│   │       ├── page.tsx                # Project scenarios
│   │       ├── outputs/page.tsx        # Rate outputs
│   │       ├── insights/
│   │       │   ├── page.tsx            # Latest extraction
│   │       │   └── history/page.tsx    # Extraction history
│   │       └── layout.tsx
│   ├── settings/
│   │   └── [workbenchId]/page.tsx      # Workbench settings
│   ├── api/
│   │   ├── projects/
│   │   │   ├── route.ts                # List/create projects
│   │   │   └── [id]/
│   │   │       ├── route.ts            # Get/update/delete
│   │   │       ├── scenarios/route.ts  # Add scenarios
│   │   │       ├── generate/route.ts   # Generate outputs
│   │   │       ├── extract/route.ts    # Run extraction
│   │   │       ├── retest/route.ts     # Apply fix & retest
│   │   │       ├── export/route.ts     # Export test suite
│   │   │       ├── versions/route.ts   # Prompt versions
│   │   │       ├── extractions/
│   │   │       │   ├── route.ts        # List extractions
│   │   │       │   └── [extractionId]/route.ts
│   │   │       └── metrics/route.ts    # Get metrics
│   │   ├── scenarios/[id]/route.ts     # Update/delete scenario
│   │   ├── outputs/
│   │   │   └── [id]/
│   │   │       └── rate/route.ts       # Rate output
│   │   ├── ratings/[id]/route.ts       # Update/delete rating
│   │   └── workbenches/
│   │       └── [id]/
│   │           └── api-keys/route.ts   # Manage API keys
│   ├── layout.tsx                      # Root layout (nav)
│   └── page.tsx                        # Landing page
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   ├── signup-form.tsx
│   │   └── user-menu.tsx
│   ├── projects/
│   │   └── project-card.tsx
│   ├── scenarios/
│   │   ├── scenario-input.tsx
│   │   └── scenario-list.tsx
│   ├── outputs/
│   │   ├── output-display.tsx
│   │   └── output-card.tsx
│   ├── ratings/
│   │   └── rating-interface.tsx
│   ├── insights/
│   │   ├── pattern-display.tsx
│   │   └── failure-cluster.tsx
│   ├── metrics/
│   │   └── metrics-dashboard.tsx
│   ├── apply-fix-button.tsx            # Apply suggested fix
│   ├── async-action-button.tsx         # Generic async button
│   └── ui/                             # Shadcn components
├── lib/
│   ├── ai/
│   │   ├── provider-resolver.ts        # AI provider selection
│   │   ├── generation.ts               # Unified generation
│   │   ├── system-model-config.ts      # System model config
│   │   └── types.ts
│   ├── api/
│   │   ├── client.ts                   # Type-safe API client
│   │   └── errors.ts                   # API error classes
│   ├── supabase/
│   │   ├── client.ts                   # Browser client
│   │   ├── server.ts                   # Server client
│   │   └── admin.ts                    # Admin client
│   ├── validation/
│   │   └── schemas.ts                  # Zod schemas
│   ├── utils/
│   │   ├── string-similarity.ts        # Levenshtein distance
│   │   └── metrics.ts                  # Metrics calculations
│   └── env.ts                          # Type-safe env vars
├── types/
│   ├── api.ts                          # API contracts
│   ├── database.ts                     # JSONB types
│   └── supabase.ts                     # Auto-generated types
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20250101000000_initial_schema.sql
│   │   ├── 20250108000000_add_workbench_api_keys.sql
│   │   └── 20251208000000_add_prompt_versioning.sql
│   └── seed.sql
├── tests/
│   ├── setup.ts
│   ├── security/
│   │   └── rls.test.ts
│   ├── unit/
│   │   ├── ai/
│   │   │   └── provider-resolver.test.ts
│   │   └── utils/
│   │       └── string-similarity.test.ts
│   ├── api/
│   │   └── projects.test.ts
│   └── e2e/
│       └── project-workflow.spec.ts
└── docs/
    ├── CLAUDE.md                       # Development guidelines
    ├── README.md                       # Getting started
    ├── product-spec.md                 # Original MVP spec
    ├── product-spec-v2.md              # This document
    ├── marketing-site-prd.md           # Marketing site PRD
    └── [various implementation docs]
```

---

## What's NOT Built Yet (Roadmap)

### Near-Term Enhancements (Next 2-4 Weeks)

#### 1. Workbench Management UI

**Status:** Database ready, UI needed

**Features**:

- Create new workbenches
- Rename/delete workbenches
- Workbench switcher dropdown
- Invite team members (send links)
- Accept invitations
- Manage team members
- Role-based access control enforcement

**Why It Matters**: Currently users are locked into their auto-created personal workbench.

#### 2. Better Export Formats

**Status:** JSON/Markdown exist, need executable formats

**Formats to Add**:

- Python pytest test suite
- JavaScript/TypeScript test suite
- CSV for spreadsheet analysis
- Integration with popular testing frameworks

**Why It Matters**: Engineers want copy-paste-runnable tests, not JSON.

#### 3. Prompt Diff Visualization

**Status:** Version history exists, need visual diff

**Features**:

- Side-by-side prompt comparison
- Highlighted changes (added/removed text)
- Link to success rate before/after
- Show which scenarios improved/regressed

**Why It Matters**: Hard to see what changed between v1 and v5 of a prompt.

#### 4. Advanced Filtering & Search

**Status:** Basic lists exist, need filtering

**Features**:

- Filter outputs by rating (show only 1-2 star)
- Search across scenario inputs
- Filter by tags
- Saved filters
- Sort by various criteria

**Why It Matters**: Hard to find specific scenarios in a 100-scenario project.

### Medium-Term Features (1-3 Months)

#### 5. Collaborative Rating

**Status:** Single-user rating exists

**Features**:

- Multiple users can rate same output
- Aggregate ratings (average, consensus)
- See who rated what
- Disagreement tracking ("PM gave 5 stars, engineer gave 2")
- Discussion threads on outputs

**Why It Matters**: Teams need to align on quality standards.

#### 6. Custom Tag Management

**Status:** Hardcoded tags exist

**Features**:

- Create custom tags per project
- Tag taxonomies
- Tag suggestions based on feedback text
- Tag analytics (most common issues)

**Why It Matters**: Every project has unique failure modes.

#### 7. Scenario Templates & Libraries

**Status:** Manual scenario creation only

**Features**:

- Save scenario sets as templates
- Library of common test scenarios (dates, names, edge cases)
- Import from template library
- Share templates across workbench
- Industry-specific scenario packs

**Why It Matters**: PMs spend hours writing test scenarios.

#### 8. Success Rate Trends

**Status:** Point-in-time metrics exist

**Features**:

- Line charts showing success rate over time
- Version comparison charts
- Criteria improvement tracking
- Regression detection alerts
- Export trend data

**Why It Matters**: Hard to see if iterations are actually improving quality.

#### 9. LLM Auto-Rating (Experimental)

**Status:** Not implemented

**Features**:

- LLM rates outputs based on extraction criteria
- Confidence scores for auto-ratings
- Only suggests ratings, PM must confirm
- Learn from PM's rating patterns
- Flag outputs that need human review

**Why It Matters**: Rating 100+ outputs is tedious, but auto-rating is risky.

**Approach**:

- Post-extraction only (need criteria first)
- High confidence threshold (>90%)
- PM can always override
- Start with obvious cases (5-star and 1-star)

### Long-Term Vision (3-6 Months)

#### 10. CI/CD Integration

**Status:** Export exists, need integration

**Features**:

- GitHub Actions integration
- Webhook for automated testing
- Regression alerts on PR
- Automatic test suite updates
- Badge for prompt quality

**Why It Matters**: Engineers want eval as part of their workflow.

#### 11. Multi-Model Comparison

**Status:** One model per project

**Features**:

- Run same scenarios on multiple models
- Side-by-side output comparison
- Cost vs quality analysis
- Model recommendation engine
- A/B testing support

**Why It Matters**: Teams want to optimize for cost/quality tradeoff.

#### 12. Scenario Generation from Logs

**Status:** Not implemented

**Features**:

- Import production logs
- Auto-generate test scenarios from real usage
- Cluster user inputs by topic
- Prioritize high-volume scenarios
- Privacy-safe anonymization

**Why It Matters**: Best test scenarios come from real users.

#### 13. Advanced Analytics

**Status:** Basic metrics exist

**Features**:

- Cohort analysis (scenarios added in sprint 1 vs sprint 2)
- Failure mode correlation (which scenarios always fail together)
- Time-to-quality metrics (how long to reach 80% success)
- PM productivity tracking (ratings per hour)
- Cost analysis (tokens/$ per project)

**Why It Matters**: Teams need to justify investment in quality.

---

## Success Metrics (Updated)

### Product Usage (Current Targets)

**Engagement**:

- ✅ Average session duration: 15+ minutes
- ✅ Scenarios per project: 15-30 (sweet spot)
- ✅ Ratings per session: 20-40
- 🎯 Weekly active users: 50+ by end of Q1 2025
- 🎯 Projects created per user: 3+ (indicates value)

**Quality**:

- ✅ Pattern extraction accuracy: 85%+ (validated with real usage)
- ✅ Suggested fix success rate: 70%+ (fixes actually improve output)
- 🎯 Rating carry-forward accuracy: 95%+ (similar outputs get same rating)

**Performance**:

- ✅ Page load time: <2s
- ✅ AI generation time: <5s per output
- ✅ Pattern extraction time: <10s for 20 rated outputs

### Business Metrics

**Adoption**:

- 🎯 Signups per month: 100+ by March 2025
- 🎯 Active workbenches: 50+ by March 2025
- 🎯 Conversion rate (visitor → signup): 10%+

**Retention**:

- 🎯 Day 7 retention: 40%+
- 🎯 Day 30 retention: 20%+
- 🎯 Projects with >10 scenarios: 60%+ (indicates serious usage)

**Word of Mouth**:

- 🎯 NPS Score: 40+
- 🎯 Referral rate: 20%+
- 🎯 User testimonials: 5+ detailed case studies

---

## Key Learnings & Insights

### What We Got Right

1. **Batch Evaluation UX**
   - Seeing 20-30 outputs at once is the killer feature
   - Visual pattern recognition > AI analysis
   - This is the moat - no other tool optimizes for this

2. **Failure Clustering**
   - Real-world validation: Found the "2022 year bug"
   - Concrete fixes > generic recommendations
   - Root cause analysis > symptom patterns

3. **Selective Retest**
   - Only regenerating failed scenarios saves time and money
   - Version tracking shows clear improvement
   - Apply fix → retest loop is intuitive

4. **Rating Carry-Forward**
   - Saves PMs tons of time
   - 90% similarity threshold is right balance
   - Works great for prompt iteration

5. **Multi-Provider Support**
   - Different teams use different AI providers
   - Fallback logic handles missing API keys gracefully
   - Centralized system model config is clean

### What We Learned

1. **PMs Don't Want Fancy AI Features**
   - They want to SEE patterns, not be TOLD patterns
   - Simple UX > complex analysis
   - Speed > sophistication

2. **Export Needs to Be Actionable**
   - Cut 60% of export content (generic fluff)
   - Engineers want copy-paste fixes, not philosophy
   - Negative examples are more valuable than positive

3. **The Iterative Loop Is Key**
   - Rate → Extract → Fix → Retest must be <5 minutes
   - If it's slow, PMs will give up
   - Version history creates confidence

4. **Workbenches Over "Teams"**
   - Name matters - "workbench" evokes craftsmanship
   - Auto-create personal workbench removes onboarding friction
   - API keys per workbench, not per user, is cleaner

### What We'd Do Differently

1. **Start with Mobile-Friendly Rating**
   - PMs want to rate on phone/tablet
   - Touch-friendly UI from day 1
   - Keyboard shortcuts are great but not enough

2. **More Visual Feedback**
   - Need better progress indicators
   - Success rate trends should be prominent
   - Visual prompt diff is essential

3. **Faster Extraction**
   - 10s is too slow for 20 outputs
   - Consider client-side clustering + LLM refinement
   - Streaming results would feel faster

4. **Template Library Earlier**
   - PMs waste time writing scenarios
   - Should ship with 20+ common scenario templates
   - Industry-specific packs (support, writing, code, etc.)

---

## Development Priorities (Next Sprint)

### P0 (Must Have - This Week)

1. ✅ Fix any critical bugs from testing
2. ✅ Polish rating UX (keyboard shortcuts, visual feedback)
3. ✅ Improve export format (make truly actionable)
4. 🎯 Add basic workbench switcher UI
5. 🎯 Mobile-friendly rating interface

### P1 (Should Have - Next 2 Weeks)

1. Scenario template library (10+ templates)
2. Prompt diff visualization
3. Better filtering (by rating, tags, text search)
4. Collaborative rating (multiple users per output)
5. Success rate trend charts

### P2 (Nice to Have - Next 4 Weeks)

1. Custom tag management
2. Pytest/Jest export formats
3. Advanced analytics dashboard
4. LLM auto-rating (experimental, gated)
5. Scenario import from CSV

### P3 (Future)

1. CI/CD integration (GitHub Actions)
2. Multi-model comparison
3. Production log import
4. Real-time collaboration
5. API for programmatic access

---

## Technical Debt & Improvements

### High Priority

1. **Performance Optimization**
   - Current: Outputs page loads all data at once
   - Needed: Pagination or virtualization for 100+ outputs
   - Impact: Page becomes unusable with large projects

2. **Error Handling**
   - Current: Generic error messages
   - Needed: Specific, actionable error messages
   - Impact: Poor UX when things fail

3. **Testing Coverage**
   - Current: ~60% coverage
   - Needed: 80%+ for critical paths
   - Impact: Risk of regressions

### Medium Priority

4. **API Response Caching**
   - Current: Every page load hits database
   - Needed: Cache frequently accessed data
   - Impact: Slower page loads

5. **Type Safety Gaps**
   - Current: Some `any` types remain
   - Needed: Full type coverage
   - Impact: Runtime errors possible

6. **Mobile Responsiveness**
   - Current: Desktop-first design
   - Needed: True mobile-first approach
   - Impact: Poor mobile experience

### Low Priority

7. **Code Organization**
   - Current: Some large components (>300 lines)
   - Needed: Break into smaller pieces
   - Impact: Harder to maintain

8. **Documentation**
   - Current: Code comments sparse
   - Needed: JSDoc for all exported functions
   - Impact: Slower onboarding

---

## Appendix: Migration from Original Spec

### What Changed from MVP Spec

**Original MVP Spec** ([product-spec.md](product-spec.md)):

- Single-user mode
- OpenAI only
- Generic pattern extraction
- Basic export

**Current Implementation**:

- ✅ Multi-user with workbenches
- ✅ Multi-provider (OpenAI + Anthropic)
- ✅ Intelligent failure clustering
- ✅ Actionable export (cut the fluff)
- ✅ Iterative retest workflow
- ✅ Rating carry-forward
- ✅ Prompt versioning
- ✅ Type-safe architecture

### Features Added Beyond MVP

1. **Workbench System** - Not in original spec
2. **Multi-Provider AI** - OpenAI only in original
3. **Failure Clustering** - "Pattern extraction" was vague
4. **Retest Workflow** - Not in original spec
5. **Rating Carry-Forward** - Not in original spec
6. **Prompt Versioning** - Not in original spec
7. **Type-Safe API Client** - Not in original spec
8. **RLS Security** - Not in original spec

### What's Still From Original MVP

- ✅ Core user flow (scenarios → outputs → ratings → extraction)
- ✅ 5-star rating system
- ✅ Tags and feedback
- ✅ Success metrics dashboard
- ✅ Export functionality (improved)
- ✅ Next.js + Supabase stack

---

## Conclusion

Sageloop has evolved significantly from the original MVP spec. The core insight - **batch evaluation UX beats AI analysis** - has shaped every decision.

**Current State**: Production-ready, multi-user, multi-provider eval tool for PMs

**Next Steps**:

1. Polish mobile experience
2. Add workbench management UI
3. Build scenario template library
4. Improve visual feedback and trends

**Long-Term Vision**: The go-to tool for PMs defining AI behavior quality - as essential as Figma is for UI design.

---

**Document Version**: 2.0
**Last Updated**: December 11, 2025
**Next Review**: January 15, 2025
