# Tellah MVP Product Specification

## Vision

Behavioral design tool for AI products. PMs define "good" AI behavior through examples and ratings (like Figma for UI), not code. Creates shared artifact between PM and engineering.

## MVP Requirements

### Core User Flow

1. **Project Setup**
   - PM creates a new evaluation project
   - Configures AI model and system prompt to test
   - Defines project context/goals

2. **Scenario Management**
   - PM inputs 10-20 test scenarios (user questions, edge cases)
   - Can bulk import or add individually
   - Edit/delete scenarios as needed

3. **Output Generation**
   - System runs all scenarios against configured prompt/model
   - Displays outputs side-by-side with inputs
   - Re-run capability when prompt changes

4. **Rating Interface**
   - PM rates each output (1-5 stars)
   - Adds written feedback explaining rating
   - Tags issues (too long, wrong tone, missing info, etc.)

5. **Pattern Extraction**
   - System analyzes highly-rated vs low-rated outputs
   - Extracts patterns: length ranges, structural elements, tone, content requirements
   - Displays extracted criteria in plain English
   - View extraction history to track how criteria evolved over time

6. **Success Metrics**
   - Real-time success rate: "73% of outputs meet your standards"
   - Breakdown by criteria: "Length: 80%, Tone: 60%, Examples: 45%"
   - Historical tracking as prompt evolves

7. **Export**
   - Golden examples (5-star rated outputs)
   - Behavioral criteria (extracted patterns)
   - Test suite format for CI/CD integration
   - Version history

### Key Features for MVP

- Single-user mode (no auth initially)
- OpenAI model support (gpt-4, gpt-3.5-turbo)
- Simple prompt configuration (system message)
- Star ratings + text feedback
- AI-powered pattern extraction (use LLM to analyze what PM values)
- Extraction history view showing evolution of criteria over time
- Basic metrics dashboard
- JSON export for test suites

### Explicitly Out of Scope for MVP

- Multi-user/team collaboration
- Custom model endpoints
- Advanced prompt chaining
- A/B testing between prompts
- Integration with existing eval tools
- Custom evaluation criteria creation
- Automated regression testing

## Technical Architecture

### Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Type Safety**: Supabase CLI auto-generated types
- **AI**: OpenAI API (gpt-4 for generation, gpt-4 for pattern analysis)
- **Hosting**: Vercel (frontend + serverless functions)

### Key Design Decisions

1. **Monorepo**: Single Next.js app with API routes (simpler deployment)
2. **Supabase over Vercel Postgres**: Future-proofing for auth, real-time collaboration, storage for exports, better local dev experience
3. **No ORM (Supabase direct)**: Simpler stack, native Postgres features, auto-generated types via Supabase CLI, no duplication
4. **Server-side AI calls**: Keep API keys secure, easier rate limiting
5. **Optimistic UI**: Show immediate feedback, sync in background
6. **Streaming**: Stream AI responses for better UX
7. **Local-first**: Cache aggressively, work offline where possible

### Database Schema Requirements

#### Projects

- id, name, description, created_at, updated_at
- model_config (JSON: model, temperature, system_prompt)

#### Scenarios

- id, project_id, input_text, order, created_at
- Belongs to project

#### Outputs

- id, scenario_id, output_text, model_snapshot, generated_at
- Stores AI response + model config used
- Belongs to scenario

#### Ratings

- id, output_id, stars (1-5), feedback_text, tags (JSON array), created_at
- Belongs to output

#### Extractions

- id, project_id, criteria (JSON), confidence_score, created_at
- Stores extracted behavioral patterns
- Belongs to project
- Multiple extractions per project for history tracking

#### Metrics

- id, project_id, extraction_id, success_rate, criteria_breakdown (JSON), snapshot_time
- Point-in-time metrics for historical tracking
- Belongs to project and optionally linked to extraction
- One metric record created per extraction for trend analysis

### API Endpoints

- `POST /api/projects` - Create project
- `GET/PATCH /api/projects/[id]` - Get/update project
- `POST /api/projects/[id]/scenarios` - Add scenarios
- `POST /api/scenarios/[id]/generate` - Generate AI output
- `POST /api/outputs/[id]/rate` - Rate output
- `POST /api/projects/[id]/extract` - Run pattern extraction
- `GET /api/projects/[id]/extractions` - Get extraction history with metrics
- `GET /api/projects/[id]/extractions/[extractionId]` - Get specific extraction details
- `GET /api/projects/[id]/metrics` - Get current metrics
- `GET /api/projects/[id]/export` - Export test suite

### File Structure

```
/
├── app/
│   ├── (dashboard)/
│   │   ├── projects/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx          # Main eval interface
│   │   │   │   ├── scenarios/page.tsx
│   │   │   │   ├── insights/
│   │   │   │   │   ├── page.tsx      # Latest extraction (current)
│   │   │   │   │   └── history/page.tsx  # Extraction history list
│   │   │   │   └── metrics/page.tsx
│   │   │   └── page.tsx               # Projects list
│   │   └── layout.tsx
│   ├── api/
│   │   ├── projects/
│   │   ├── scenarios/
│   │   ├── outputs/
│   │   └── metrics/
│   └── layout.tsx
├── components/
│   ├── scenario-input.tsx
│   ├── output-display.tsx
│   ├── rating-interface.tsx
│   ├── metrics-dashboard.tsx
│   └── pattern-display.tsx
├── lib/
│   ├── supabase.ts                    # Supabase client + helpers
│   ├── openai.ts                      # OpenAI wrapper
│   ├── pattern-extractor.ts           # AI-powered analysis
│   └── metrics-calculator.ts
├── types/
│   └── supabase.ts                    # Auto-generated from schema
├── supabase/
│   ├── config.toml                    # Local Supabase config
│   ├── migrations/                    # SQL migrations
│   └── seed.sql                       # Sample data
└── docs/
    └── product-spec.md
```

## Success Metrics

MVP is successful if:

1. PM can define 20 scenarios, rate outputs, and see extracted criteria in < 30 minutes
2. Pattern extraction identifies at least 3 meaningful behavioral boundaries
3. Success rate metric accurately reflects PM satisfaction (>90% correlation)
4. One real PM uses it to spec an AI feature and says "this should exist"

## Open Questions

1. How sophisticated should pattern extraction be initially?
   - Start with simple heuristics (length, sentiment) or go full LLM analysis?

2. What test suite format to export?
   - JSON? Python pytest? JavaScript? Let user choose?

3. How to handle prompt iteration UX?
   - Inline editing? Separate config page? Version comparison view?

4. Rate limiting strategy for OpenAI API?
   - Per-project limits? User notification? Queue system?
