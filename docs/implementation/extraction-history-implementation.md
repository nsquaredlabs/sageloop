# Extraction History Feature - Implementation Plan

## Overview

Add ability to view historical pattern extractions for a project, allowing PMs to track how quality criteria evolved as they refined prompts and rated more outputs.

## User Story

As a PM, I want to see how my quality criteria have evolved over time so I can understand how my understanding of "good" AI behavior has changed as I rated more outputs and refined my prompts.

## Feature Requirements

### What Gets Shown

Each extraction in history displays:

- **Timestamp**: When the analysis was run
- **Scenario Count**: Number of scenarios analyzed
- **Success Rate**: Percentage of outputs meeting quality standards
- **Confidence Score**: How confident the analysis is based on rating count

### User Flow

1. PM navigates to Insights page after running pattern extraction
2. PM sees "View History" button next to Export buttons
3. PM clicks "View History" to see list of all past extractions
4. Each extraction is shown as a card with key metrics
5. PM can click any extraction to see its full details

## Implementation Plan

### Phase 1: Database Schema (Migration)

**File**: `supabase/migrations/[timestamp]_add_extraction_id_to_metrics.sql`

```sql
-- Add extraction_id to metrics table to link each metric snapshot to its extraction
ALTER TABLE metrics
ADD COLUMN extraction_id BIGINT REFERENCES extractions(id);

-- Add index for faster queries
CREATE INDEX idx_metrics_extraction_id ON metrics(extraction_id);

-- Backfill existing metrics with their corresponding extraction
-- (This assumes metrics.snapshot_time matches extractions.created_at)
UPDATE metrics m
SET extraction_id = e.id
FROM extractions e
WHERE m.project_id = e.project_id
  AND m.extraction_id IS NULL
  AND ABS(EXTRACT(EPOCH FROM (m.snapshot_time - e.created_at))) < 60;
```

**Acceptance Criteria**:

- ✅ metrics table has extraction_id column
- ✅ Index exists on extraction_id
- ✅ Existing metrics are linked to extractions where possible

---

### Phase 2: Backend API Updates

#### Task 2.1: Update Extraction API Route

**File**: `app/api/projects/[id]/extract/route.ts`

**Changes**:

- After creating extraction, pass `extraction.id` when creating metric
- Link the metric record to the extraction

```typescript
// Current code creates extraction and metric separately
// Update to:
const { data: metric } = await supabaseAdmin
  .from('metrics')
  .insert({
    project_id: projectId,
    extraction_id: extraction.id,  // ADD THIS LINE
    success_rate: calculateSuccessRate(...),
    criteria_breakdown: {...},
    snapshot_time: new Date().toISOString(),
  })
  .select()
  .single();
```

**Acceptance Criteria**:

- ✅ New extractions create metrics with extraction_id set
- ✅ Metrics are correctly linked to their extraction

---

#### Task 2.2: Create Extractions List API

**File**: `app/api/projects/[id]/extractions/route.ts` (NEW)

**Implementation**:

```typescript
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { parseId } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: projectIdString } = await params;
    const projectId = parseId(projectIdString);

    // Fetch all extractions with their metrics
    const { data: extractions, error } = await supabaseAdmin
      .from("extractions")
      .select(
        `
        id,
        created_at,
        confidence_score,
        metrics (
          success_rate,
          snapshot_time
        )
      `,
      )
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch extractions" },
        { status: 500 },
      );
    }

    // Get scenario count for the project (constant across extractions)
    const { data: scenarios } = await supabaseAdmin
      .from("scenarios")
      .select("id")
      .eq("project_id", projectId);

    const scenarioCount = scenarios?.length || 0;

    // Format response
    const formattedExtractions =
      extractions?.map((extraction) => ({
        id: extraction.id,
        created_at: extraction.created_at,
        confidence_score: extraction.confidence_score,
        success_rate: extraction.metrics?.[0]?.success_rate || 0,
        scenario_count: scenarioCount,
      })) || [];

    return NextResponse.json({ data: formattedExtractions });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

**Acceptance Criteria**:

- ✅ Returns all extractions for a project
- ✅ Includes timestamp, confidence, success rate, scenario count
- ✅ Ordered by created_at descending (newest first)
- ✅ Handles errors gracefully

---

#### Task 2.3: Create Extraction Details API (Optional)

**File**: `app/api/projects/[id]/extractions/[extractionId]/route.ts` (NEW)

**Note**: This is optional if we modify the insights page to accept a query param. We can reuse the insights page logic by making it accept `?extractionId=X`.

**Alternative**: Modify insights page to check for `extractionId` query param and fetch that extraction instead of latest.

**Decision**: Skip this endpoint and modify insights page instead.

---

### Phase 3: Frontend UI

#### Task 3.1: Create History Page

**File**: `app/projects/[id]/insights/history/page.tsx` (NEW)

**Implementation**:

```typescript
import { supabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, History } from 'lucide-react';
import { interpretSuccessRate, interpretConfidence } from '@/lib/metrics';
import { parseId } from '@/lib/utils';

interface HistoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function ExtractionHistoryPage({ params }: HistoryPageProps) {
  const { id: idString } = await params;
  const id = parseId(idString);

  // Fetch project details
  const { data: project, error: projectError } = await supabaseAdmin
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Fetch all extractions with metrics
  const { data: extractions } = await supabaseAdmin
    .from('extractions')
    .select(`
      id,
      created_at,
      confidence_score,
      metrics (
        success_rate
      )
    `)
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  // Get scenario count
  const { data: scenarios } = await supabaseAdmin
    .from('scenarios')
    .select('id')
    .eq('project_id', id);

  const scenarioCount = scenarios?.length || 0;

  // Get rated output count (same as insights page)
  const scenarioIds = scenarios?.map(s => s.id) || [];
  const { data: ratedOutputs } = await supabaseAdmin
    .from('ratings')
    .select('output_id')
    .in('output_id',
      await supabaseAdmin
        .from('outputs')
        .select('id')
        .in('scenario_id', scenarioIds)
        .then(({ data }) => data?.map(o => o.id) || [])
    );
  const ratedCount = new Set(ratedOutputs?.map(r => r.output_id) || []).size;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/projects/${id}/insights`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Latest Insights
          </Link>
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8" />
            Extraction History
          </h1>
          <p className="text-muted-foreground mt-2">
            View how quality criteria evolved for <span className="font-medium">{project.name}</span>
          </p>
        </div>

        {!extractions || extractions.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <History className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No extraction history</h3>
              <p className="text-sm text-muted-foreground mb-6 text-center max-w-md">
                Run pattern extraction to create your first analysis snapshot.
              </p>
              <Button asChild>
                <Link href={`/projects/${id}/outputs`}>
                  Go to Outputs
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {extractions.map((extraction: any) => {
              const successRate = extraction.metrics?.[0]?.success_rate || 0;
              const confidenceScore = extraction.confidence_score || 0;
              const successInterpretation = interpretSuccessRate(successRate);
              const confidenceInterpretation = interpretConfidence(confidenceScore, ratedCount);

              return (
                <Link
                  key={extraction.id}
                  href={`/projects/${id}/insights?extractionId=${extraction.id}`}
                >
                  <Card className="hover:border-primary transition-colors cursor-pointer">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {new Date(extraction.created_at).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">Scenarios:</span>
                          <span className="text-foreground font-semibold">{scenarioCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">Success Rate:</span>
                          <span className="text-foreground font-semibold">
                            {(successRate * 100).toFixed(0)}%
                          </span>
                          <Badge variant={successInterpretation.variant}>
                            {successInterpretation.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-muted-foreground">Confidence:</span>
                          <span className="text-foreground font-semibold">
                            {(confidenceScore * 100).toFixed(0)}%
                          </span>
                          <Badge variant={confidenceInterpretation.variant}>
                            {confidenceInterpretation.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:

- ✅ Shows all extractions in descending order
- ✅ Displays timestamp, scenario count, success rate, confidence
- ✅ Uses interpretSuccessRate and interpretConfidence for badges
- ✅ Cards are clickable and link to insights page with extractionId
- ✅ Empty state when no extractions exist

---

#### Task 3.2: Update Insights Page

**File**: `app/projects/[id]/insights/page.tsx`

**Changes**:

1. Add "View History" button next to Export buttons
2. Optionally: Accept `extractionId` query param to view specific extraction

**Implementation**:

```typescript
// Add import
import { History } from 'lucide-react';

// In the component, check for extractionId query param
export default async function InsightsPage({ params, searchParams }: InsightsPageProps) {
  const { id: idString } = await params;
  const id = parseId(idString);

  // Add this line to get query params
  const queryParams = await searchParams;
  const extractionId = queryParams?.extractionId ? parseId(queryParams.extractionId) : null;

  // Modify extraction fetch to use extractionId if provided
  const { data: extraction } = await supabaseAdmin
    .from('extractions')
    .select('*')
    .eq('project_id', id)
    // If extractionId provided, fetch that specific extraction
    .eq(extractionId ? 'id' : 'project_id', extractionId || id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // ... rest of code

  // In the header section, add History button after Export buttons:
  <div className="flex gap-2">
    <Button variant="outline" asChild>
      <Link href={`/projects/${id}/insights/history`}>
        <History className="mr-2 h-4 w-4" />
        View History
      </Link>
    </Button>
    <Button variant="outline" asChild>
      <a href={`/api/projects/${id}/export?format=json`} download>
        <FileJson className="mr-2 h-4 w-4" />
        Export JSON
      </a>
    </Button>
    <Button variant="outline" asChild>
      <a href={`/api/projects/${id}/export?format=markdown`} download>
        <FileText className="mr-2 h-4 w-4" />
        Export Spec
      </a>
    </Button>
  </div>
```

**Acceptance Criteria**:

- ✅ "View History" button appears in insights header
- ✅ Button links to history page
- ✅ (Optional) Page accepts extractionId query param
- ✅ (Optional) Shows specific extraction when extractionId provided

---

### Phase 4: Testing

#### Manual Test Plan

1. **Setup**:
   - Start with existing project that has scenarios and outputs
   - Ensure at least 5 outputs are rated

2. **Test Extraction Creation**:
   - Run pattern extraction (click "Analyze Patterns")
   - Verify extraction is created
   - Verify metric is created with extraction_id
   - Check database: `SELECT * FROM metrics WHERE extraction_id IS NOT NULL`

3. **Test History List**:
   - Navigate to insights page
   - Click "View History" button
   - Verify redirects to `/projects/{id}/insights/history`
   - Verify all extractions are shown in list
   - Verify each shows: timestamp, scenario count, success rate, confidence

4. **Test Multiple Extractions**:
   - Rate 2-3 more outputs
   - Run extraction again
   - Navigate to history
   - Verify both extractions appear
   - Verify newer one is at the top

5. **Test Extraction Details**:
   - Click on an extraction card in history
   - Verify redirects to insights page
   - Verify shows the correct extraction details
   - Verify criteria, recommendations match that extraction

6. **Test Empty State**:
   - Create new project with no extractions
   - Navigate to history page
   - Verify empty state is shown with helpful message

**Acceptance Criteria**:

- ✅ All manual tests pass
- ✅ No console errors
- ✅ Navigation works correctly
- ✅ Data displays accurately

---

## Database Migration Command

```bash
# Generate types after migration
npm run supabase:gen-types

# Or if using Supabase CLI directly
supabase db push
supabase gen types typescript --local > types/supabase.ts
```

## Rollout Plan

1. **Database Migration** - Run migration on local dev, verify schema
2. **Backend Updates** - Update extract API and create extractions endpoint
3. **Frontend UI** - Build history page and update insights page
4. **Testing** - Manual testing of complete flow
5. **Deploy** - Push to production

## Success Metrics

Feature is successful if:

- ✅ PMs can view list of all past extractions
- ✅ Each extraction shows key metrics (timestamp, success rate, confidence)
- ✅ PMs can click into any extraction to see full details
- ✅ No performance degradation (history page loads in < 2s)
- ✅ Zero TypeScript errors
- ✅ All Supabase queries follow documented patterns

## Future Enhancements (Out of Scope)

- Diff view comparing two extractions side-by-side
- Chart showing success rate trend over time
- Ability to delete old extractions
- Export specific historical extraction
- Notes/annotations on extractions
