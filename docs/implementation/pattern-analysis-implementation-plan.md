# Pattern Analysis Implementation Plan

**Status**: Technical Review Complete
**Created**: 2025-12-30
**Author**: Principal Engineer

---

## Executive Summary

This document provides a technical implementation roadmap for the Pattern Analysis PRD ("The Aha Moment Machine"). After reviewing the current codebase, I've identified significant existing infrastructure we can build upon, and have developed a phased approach that prioritizes high-impact, achievable features first.

### Current State Assessment

**Existing Infrastructure (Strong Foundation)**:

- `extract/route.ts`: Full extraction pipeline with 5-dimensional analysis (length, tone, structure, content, errors)
- `dimensional-analysis.ts`: Zod schemas for AI response validation
- `DimensionCard` component: Side-by-side high/low rated pattern display
- `ApplyFixButton`: One-click fix integration with AI-powered prompt merging
- `insights/page.tsx`: Complete insights page with failure clusters, dimensional analysis, recommendations
- `insights/history/page.tsx`: Extraction history with version comparison
- Prompt versioning system: `prompt_iterations` table tracking versions, success rates
- Security infrastructure: Prompt validation, response sanitization, rate limiting

**Gap Analysis**:
| PRD Feature | Current State | Gap |
|-------------|---------------|-----|
| Visual Pattern Diff | Partial (DimensionCard shows side-by-side) | Needs visual polish, one-screen summary |
| Pattern Fingerprint | None | New feature - requires new data model + UI |
| Outlier Inspector | None | New feature - requires AI prompt updates + UI |
| Before/After Comparator | Partial (history exists) | Needs visual diff, impact analysis |
| Failure Radar | Strong (clusters exist) | Minor enhancement - already has Apply Fix |
| Shareable Insight Cards | None | New feature - requires canvas/image generation |
| Confidence Explainer | Partial (confidence score shown) | Needs actionable guidance UI |

---

## Technical Feasibility Assessment

### Achievable with Moderate Effort

1. **Visual Pattern Diff** - Mainly UI work, data already exists
2. **Pattern Fingerprint** - New UI + data model, no new AI complexity
3. **Confidence Explainer Enhancement** - UI work, logic exists in `lib/metrics.ts`
4. **Before/After Comparator** - Data exists in `prompt_iterations`, needs visualization

### Achievable with Significant Effort

5. **Outlier Inspector** - Requires AI prompt engineering + new algorithms
6. **Shareable Insight Cards** - Requires canvas/image generation, export pipeline

### Technical Risks & Challenges

| Risk                                                 | Impact | Mitigation                                       |
| ---------------------------------------------------- | ------ | ------------------------------------------------ |
| AI prompt for outliers produces low-quality insights | High   | Extensive testing, multiple prompt iterations    |
| Image generation performance/size                    | Medium | Use server-side rendering, optimize compression  |
| Outlier detection false positives                    | Medium | Statistical threshold tuning, user feedback loop |
| Before/after diff computation for complex changes    | Low    | Use existing diff libraries (jsdiff)             |

---

## Phase 1: Visual Pattern Diff (2 weeks)

**Goal**: Create the "aha moment" with a visually compelling side-by-side comparison that tells the quality story at a glance.

### 1.1 Pattern Summary Card (New Component)

**File**: `components/pattern-summary-card.tsx`

A new hero component that distills the entire analysis into one scannable view:

```tsx
interface PatternSummaryCardProps {
  dimensions: DimensionalAnalysis;
  successRate: number;
  totalOutputs: number;
  failureCount: number;
  successCount: number;
}
```

**Visual Design**:

```
+------------------------------------------------------------------+
|  YOUR 5-STAR OUTPUTS (12)          YOUR 1-STAR OUTPUTS (5)       |
+------------------------------------------------------------------+
|  Length: 200-300 words             Length: 50-100 words          |
|  [========]                        [===]                          |
|                                                                    |
|  Structure:                        Structure:                      |
|  [x] Bullet points                 [ ] Bullet points              |
|  [x] Examples                      [ ] Examples                    |
|  [x] Headers                       [ ] Headers                     |
|                                                                    |
|  ALWAYS Include:                   MISSING:                       |
|  + Specific steps                  - Actionable advice            |
|  + Timeline estimate               - Timeline                     |
|  + Empathy statement               - Personal touch               |
|                                                                    |
|  Tone: Professional, warm          Tone: Too formal               |
+------------------------------------------------------------------+
```

**Implementation Approach**:

1. Extract "must haves" from `high_rated_includes` arrays
2. Extract "missing" from comparing high vs low rated patterns
3. Use color coding: green backgrounds for good, red for bad
4. Use checkmark/X icons for quick visual scanning
5. Add visual length bar using percentage widths

### 1.2 Enhanced DimensionCard

**Updates to**: `components/dimension-card.tsx`

- Add visual bars for length comparisons
- Add prevalence bars for structure elements (showing 80% vs 20% usage)
- Add "Key Difference" highlight badge when gap is significant

### 1.3 Insights Page Redesign

**Updates to**: `app/projects/[id]/insights/page.tsx`

**New Layout**:

1. **Hero Section**: Pattern Summary Card (new)
2. **Quick Stats Row**: Success Rate, Confidence, Analyzed count
3. **Tabbed Interface**:
   - Tab 1: "Pattern Diff" (default) - Visual comparison
   - Tab 2: "Failure Clusters" - Existing failure radar
   - Tab 3: "Dimensions" - Detailed 5-dimension breakdown
   - Tab 4: "Actions" - Recommendations and fixes

**Effort**: 8-10 dev days

### 1.4 AI Prompt Enhancement

**Updates to**: `app/api/projects/[id]/extract/route.ts`

Add new fields to AI prompt for "must have" and "never do" extraction:

```typescript
// Add to response schema
"quality_signature": {
  "must_haves": ["Include current date", "Use bullet points"],
  "never_do": ["Generic apologies", "Corporate jargon"],
  "key_differentiators": [
    {
      "factor": "Length",
      "high_rated": "200-300 words",
      "low_rated": "50-100 words",
      "impact": "high"
    }
  ]
}
```

**Security**: Wrap new fields in existing validation schema.

---

## Phase 2: Outlier Inspector (1.5 weeks)

**Goal**: Surface surprising exceptions that reveal edge cases and mental model gaps.

### 2.1 Outlier Detection Algorithm

**New File**: `lib/analysis/outlier-detection.ts`

```typescript
interface Outlier {
  outputId: number;
  scenarioId: number;
  rating: number;
  expectedRating: "high" | "low"; // Based on pattern match
  actualRating: "high" | "low";
  deviations: Array<{
    dimension: string;
    expected: string;
    actual: string;
    severity: number; // Standard deviations from mean
  }>;
  inputText: string;
  outputText: string;
}

function detectOutliers(
  outputs: RatedOutput[],
  patterns: DimensionalAnalysis,
): Outlier[];
```

**Detection Logic**:

1. For each rated output, calculate how well it matches the "high-rated" pattern
2. Flag outputs where:
   - High-rated (4-5 stars) but matches "low-rated" pattern (2+ deviations)
   - Low-rated (1-2 stars) but matches "high-rated" pattern
3. Calculate deviation score for each dimension:
   - Length: Compare to median, calculate z-score
   - Structure: Check presence of expected elements
   - Tone: Compare formality/sentiment tags
   - Content: Check for required elements

**Threshold Recommendation**: Flag as outlier when:

- Rating is 4-5 AND 2+ dimensions match low-rated pattern
- Rating is 1-2 AND 2+ dimensions match high-rated pattern

### 2.2 AI Explanation Enhancement

**Updates to**: `app/api/projects/[id]/extract/route.ts`

Add outlier-specific prompt section:

```typescript
// After pattern extraction, in a second pass:
const outlierPrompt = `
Given these outputs that deviate from the established pattern:
${JSON.stringify(outliers)}

For each outlier, explain:
1. WHY it broke the pattern (specific reason, not generic)
2. What this reveals about edge cases
3. Whether the pattern should be refined to handle this case

Return JSON with structure:
{
  "outlier_explanations": [
    {
      "output_id": 14,
      "explanation": "User asked a yes/no question - didn't need detailed response",
      "pattern_gap": "Pattern assumes all questions need detailed answers",
      "recommendation": "Split pattern for question types: yes/no vs how-to"
    }
  ]
}
`;
```

### 2.3 Outlier Inspector UI

**New File**: `components/outlier-inspector.tsx`

**Visual Design**:

```
+------------------------------------------------------------------+
|  INTERESTING OUTLIERS (3 found)                                  |
+------------------------------------------------------------------+
|  [!] Output #14 - Rated 5-stars BUT breaks pattern               |
|      -------------------------------------------------           |
|      Only 87 words (pattern: 200-300 words)                      |
|      No example (pattern: always include example)                |
|                                                                   |
|      WHY IT WORKED:                                              |
|      User asked "yes/no question" - didn't need length           |
|                                                                   |
|      DISCOVERY:                                                   |
|      Your pattern works for "how-to" but not "yes/no" questions  |
|                                                                   |
|      [View Output] [Update Pattern]                              |
+------------------------------------------------------------------+
```

**Effort**: 6-8 dev days

---

## Phase 3: Pattern Fingerprint Generator (2 weeks)

**Goal**: Create a one-page visual spec that becomes the source of truth for quality.

### 3.1 Data Model

**New Migration**: `supabase/migrations/YYYYMMDD_add_pattern_fingerprints.sql`

```sql
CREATE TABLE pattern_fingerprints (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  extraction_id INTEGER REFERENCES extractions(id),
  version INTEGER NOT NULL DEFAULT 1,

  -- Core fingerprint data
  fingerprint JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- RLS policies (same pattern as extractions)
ALTER TABLE pattern_fingerprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fingerprints for their projects" ON pattern_fingerprints
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects WHERE workbench_id IN (
        SELECT workbench_id FROM user_workbenches WHERE user_id = auth.uid()
      )
    )
  );
```

**Fingerprint JSONB Structure**:

```typescript
interface PatternFingerprint {
  projectName: string;
  createdAt: string;
  version: number;

  // Core quality definition
  structure: {
    pattern: string[]; // ["Greeting", "Problem acknowledgment", "Solution steps", "Follow-up"]
    description: string;
  };

  length: {
    range: string; // "200-300 words"
    description: string; // "conversational, not terse"
  };

  tone: {
    primary: string; // "Empathetic + Solution-focused"
    characteristics: string[];
  };

  mustHaves: string[]; // ["Specific steps", "Timeline estimate", "Empathy statement"]
  neverDo: string[]; // ["Generic responses", "No action items", "Corporate jargon"]

  // Metadata
  confidence: number;
  sampleSize: number;
  successRate: number;
}
```

### 3.2 Fingerprint Generation API

**New File**: `app/api/projects/[id]/fingerprint/route.ts`

```typescript
export async function POST(request: Request, { params }: RouteParams) {
  // 1. Auth check
  // 2. Get latest extraction
  // 3. Generate fingerprint from dimensional analysis
  // 4. Store in pattern_fingerprints table
  // 5. Return fingerprint
}

export async function GET(request: Request, { params }: RouteParams) {
  // Return latest fingerprint for project
}
```

### 3.3 Fingerprint UI Component

**New File**: `components/pattern-fingerprint.tsx`

**Visual Design** (follows design system - monochrome with indigo accent):

```
+------------------------------------------------------------------+
|  QUALITY FINGERPRINT                              [Export] [Share]|
|  Customer Support Bot                                   v2        |
+------------------------------------------------------------------+
|                                                                    |
|  STRUCTURE                                                        |
|  [Greeting] -> [Acknowledge] -> [Solution Steps] -> [Follow-up]   |
|                                                                    |
|  LENGTH                                                           |
|  200-300 words (conversational, not terse)                        |
|                                                                    |
|  TONE                                                             |
|  Empathetic + Solution-focused                                    |
|                                                                    |
|  MUST HAVE                           NEVER                        |
|  [x] Specific steps                  [x] Generic responses        |
|  [x] Timeline estimate               [x] No action items          |
|  [x] Empathy statement               [x] Corporate jargon         |
|                                                                    |
+------------------------------------------------------------------+
|  Confidence: 85% | Based on 24 outputs | 73% success rate         |
+------------------------------------------------------------------+
```

### 3.4 Export Functionality

**New File**: `lib/export/fingerprint-export.ts`

**Formats**:

1. **Markdown** (for docs/README):

```markdown
# Quality Fingerprint: Customer Support Bot

## Structure

Greeting -> Problem acknowledgment -> Solution steps -> Follow-up offer

## Length

200-300 words (conversational, not terse)

## Tone

Empathetic + Solution-focused

## Must Have

- Specific steps (not "contact support")
- Timeline estimate ("within 24 hours")
- Empathy statement ("I understand this is frustrating")

## Never

- Generic responses ("We're sorry for the inconvenience")
- No action items
- Corporate jargon

---

_Generated by Sageloop | Confidence: 85% | Based on 24 outputs_
```

2. **PDF**: Use `@react-pdf/renderer` for server-side PDF generation

3. **PNG**: Use `html-to-image` library for screenshot generation

**Effort**: 10-12 dev days

---

## Phase 4: Failure Radar Enhancement (1 week)

**Goal**: Make the existing failure analysis even more actionable.

### 4.1 Diff Preview Enhancement

**Updates to**: `components/apply-fix-button.tsx`

Add visual diff preview before applying fixes:

```tsx
import { diffWords } from "diff";

function DiffPreview({ oldPrompt, newPrompt }: DiffPreviewProps) {
  const diff = diffWords(oldPrompt, newPrompt);

  return (
    <div className="font-mono text-sm">
      {diff.map((part, index) => (
        <span
          key={index}
          className={
            part.added
              ? "bg-green-100 text-green-800"
              : part.removed
                ? "bg-red-100 text-red-800 line-through"
                : ""
          }
        >
          {part.value}
        </span>
      ))}
    </div>
  );
}
```

### 4.2 Fix Tracking

**Database Update**: Add to `prompt_iterations` table:

```sql
ALTER TABLE prompt_iterations ADD COLUMN fixes_applied JSONB;
```

Track which fixes from which clusters were applied:

```json
{
  "fixes_applied": [
    {
      "cluster_name": "Missing Context",
      "fix_text": "Use {{current_date}} as context...",
      "applied_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

### 4.3 Re-analysis Verification

After applying fixes and regenerating, show:

- Which failure clusters were resolved
- New success rate comparison
- Any new failures introduced

**Effort**: 4-5 dev days

---

## Phase 5: Shareable Insight Cards (1.5 weeks)

**Goal**: Create beautiful, screenshot-worthy cards that PMs want to share.

### 5.1 Image Generation Pipeline

**Approach**: Server-side HTML-to-image conversion

**Libraries**:

- `@vercel/og` - Vercel's OG image generation (best performance)
- Alternative: `puppeteer` for more complex layouts

**New Route**: `app/api/projects/[id]/insight-card/route.tsx`

```typescript
import { ImageResponse } from '@vercel/og';

export async function GET(request: Request, { params }: RouteParams) {
  const extraction = await getLatestExtraction(params.id);

  return new ImageResponse(
    (
      <div style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        background: 'white',
        padding: 60,
      }}>
        <InsightCardContent extraction={extraction} />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

### 5.2 Insight Card Template

**Dimensions**: 1200x630px (Twitter/LinkedIn optimized)

**Design** (follows design system):

```
+------------------------------------------------------------------+
|  [SAGELOOP LOGO]                                                 |
|                                                                    |
|  THE PATTERN THAT MATTERS                                        |
|  Customer Support Bot                                             |
|                                                                    |
|  5-star outputs ALWAYS include:    1-star outputs are MISSING:   |
|  [check] Specific steps            [x] Actionable next steps     |
|  [check] Timeline estimate         [x] Any timeline              |
|  [check] Empathy statement         [x] Personal touch            |
|                                                                    |
|  Impact: 73% success rate (up from 40%)                          |
|                                                                    |
|  -----------------------------------------------------------------|
|  sageloop.com                                   @sageloop         |
+------------------------------------------------------------------+
```

### 5.3 Share Functionality

**New Component**: `components/share-insight-button.tsx`

```tsx
interface ShareInsightButtonProps {
  projectId: number;
  successRate: number;
  projectName: string;
}

export function ShareInsightButton({
  projectId,
  successRate,
  projectName,
}: ShareInsightButtonProps) {
  const imageUrl = `/api/projects/${projectId}/insight-card`;

  const twitterText = `Found the pattern that makes AI outputs great! ${Math.round(successRate * 100)}% success rate with @sageloop`;
  const linkedInText = `Just discovered what makes our AI outputs work - ${projectName} now has ${Math.round(successRate * 100)}% success rate. Made with Sageloop.`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => downloadImage(imageUrl)}>
          <Download className="mr-2 h-4 w-4" />
          Download Image
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyImageToClipboard(imageUrl)}>
          <Copy className="mr-2 h-4 w-4" />
          Copy to Clipboard
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => shareToTwitter(twitterText, imageUrl)}>
          <Twitter className="mr-2 h-4 w-4" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => shareToLinkedIn(linkedInText)}>
          <Linkedin className="mr-2 h-4 w-4" />
          Share on LinkedIn
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 5.4 Security Considerations

- **Rate Limiting**: Apply rate limit to image generation endpoint (expensive operation)
- **Authentication**: Require auth for generating insight cards (prevents scraping)
- **Caching**: Cache generated images for 1 hour (same extraction = same image)
- **No Sensitive Data**: Insight cards should NOT include actual output text, only patterns

**Effort**: 7-8 dev days

---

## Phase 6: Before/After Comparator (2 weeks)

**Goal**: Show improvement over time with visual proof.

### 6.1 Extraction Comparison Logic

**New File**: `lib/analysis/extraction-comparison.ts`

```typescript
interface ExtractionComparison {
  before: {
    extractionId: number;
    date: string;
    successRate: number;
    patterns: DimensionalAnalysis;
  };
  after: {
    extractionId: number;
    date: string;
    successRate: number;
    patterns: DimensionalAnalysis;
  };
  changes: {
    successRateDelta: number; // +0.33 means went from 40% to 73%
    improvementsApplied: string[];
    patternsChanged: Array<{
      dimension: string;
      before: string;
      after: string;
      impact: "positive" | "negative" | "neutral";
    }>;
    regressions: Array<{
      description: string;
      scenarioCount: number;
    }>;
  };
}

function compareExtractions(
  beforeId: number,
  afterId: number,
): Promise<ExtractionComparison>;
```

### 6.2 Visual Timeline View

**New Page**: `app/projects/[id]/insights/timeline/page.tsx`

Shows extraction history as visual timeline:

```
v3 (Jan 22)  73% ============[===]  +33%
v2 (Jan 18)  45% ======[===]        +5%
v1 (Jan 15)  40% =====
```

### 6.3 Side-by-Side Comparison View

**New Component**: `components/extraction-comparison.tsx`

```
+------------------------------------------------------------------+
|  PATTERN EVOLUTION                                                |
|                                                                    |
|  Version 1 (Jan 15)        ->      Version 2 (Jan 22)            |
|  Success: 40%              ->      Success: 73%                   |
+------------------------------------------------------------------+
|  WHAT CHANGED:                                                    |
|                                                                    |
|  [+] Added: "Include current date"      -> Fixed 5 failures      |
|  [+] Added: "Use bullet points"         -> Fixed 3 failures      |
|  [-] Removed: "Be concise"              -> Broke 2 scenarios     |
|                                                                    |
|  KEY INSIGHT:                                                     |
|  Being "concise" was important for pricing questions              |
|  but not for how-to questions                                     |
+------------------------------------------------------------------+
```

### 6.4 Regression Detection

**Logic**: When comparing v1 to v2:

1. Find scenarios that were successful in v1 but failed in v2
2. Analyze common patterns in regressed scenarios
3. Surface as "regressions" in comparison view

**Effort**: 10-12 dev days

---

## Phase 7: Confidence Explainer Enhancement (0.5 weeks)

**Goal**: Make confidence scores actionable with specific guidance.

### 7.1 Enhanced Confidence Display

**Updates to**: `lib/metrics.ts` and insights page

```typescript
interface DetailedConfidenceAssessment {
  overall: number;
  breakdown: {
    dimension: string;
    confidence: number;
    sampleCount: number;
    recommendation: string | null;
  }[];
  recommendedActions: Array<{
    action: string;
    impact: string; // "With 5 more casual-tone examples, you'll hit 85% confidence"
    priority: "high" | "medium" | "low";
  }>;
  projectedConfidenceAt20: number;
  projectedConfidenceAt30: number;
}
```

### 7.2 UI Component

**New Component**: `components/confidence-explainer.tsx`

```
+------------------------------------------------------------------+
|  CONFIDENCE ASSESSMENT                                            |
|  Overall: 67% (MEDIUM)                                           |
+------------------------------------------------------------------+
|                                                                    |
|  HIGH CONFIDENCE (9+ samples each):                              |
|  [====] Length pattern: 200-300 words                            |
|  [====] Must include examples                                    |
|                                                                    |
|  LOW CONFIDENCE (2-4 samples each):                              |
|  [==  ] Tone requirements (only 3 casual examples)               |
|  [=   ] Error patterns (only 2 hallucination examples)           |
|                                                                    |
|  RECOMMENDED ACTIONS:                                             |
|  1. Add 5 more scenarios testing casual vs formal tone           |
|  2. Add 3 more edge cases that might hallucinate                 |
|                                                                    |
|  With 20 rated outputs, you'll hit 85% confidence (prod-ready)   |
+------------------------------------------------------------------+
```

**Effort**: 3 dev days

---

## Phased Rollout Recommendation

### MVP (4 weeks) - Ship First

| Phase | Feature                     | Effort  | Impact    | Priority |
| ----- | --------------------------- | ------- | --------- | -------- |
| 1     | Visual Pattern Diff         | 10 days | Very High | P0       |
| 3     | Pattern Fingerprint (basic) | 7 days  | High      | P0       |
| 7     | Confidence Explainer        | 3 days  | Medium    | P0       |

**Why**: These provide the core "aha moment" with minimal AI complexity. Pattern diff is mostly UI work on existing data.

### V1.1 (3 weeks) - Quick Follow

| Phase | Feature                   | Effort | Impact | Priority |
| ----- | ------------------------- | ------ | ------ | -------- |
| 4     | Failure Radar Enhancement | 5 days | Medium | P1       |
| 2     | Outlier Inspector         | 8 days | High   | P1       |

**Why**: Outliers add significant value but require AI tuning. Failure radar is quick win.

### V1.2 (3 weeks) - Growth Features

| Phase | Feature                 | Effort  | Impact       | Priority |
| ----- | ----------------------- | ------- | ------------ | -------- |
| 5     | Shareable Insight Cards | 8 days  | High (viral) | P1       |
| 6     | Before/After Comparator | 12 days | Medium       | P2       |

**Why**: Sharing is viral growth driver. Before/after is "nice to have" for power users.

---

## Security Requirements Checklist

All new features MUST follow existing security patterns:

### API Routes

- [ ] Use `createServerClient()` (RLS enforcement)
- [ ] Check `user` auth before any operations
- [ ] Use `parseId()` for URL parameters
- [ ] Apply rate limiting to expensive endpoints (image generation)

### AI Interactions

- [ ] Wrap user content with `wrapUserContent()`
- [ ] Validate responses with `validateExtractionResponse()`
- [ ] Use Zod schemas for all new response structures

### Data Access

- [ ] All new tables have RLS policies
- [ ] Pattern fingerprints scoped to workbench
- [ ] No cross-user data leakage in comparisons

### Sharing Features

- [ ] Insight cards do NOT include actual output text
- [ ] No PII in shareable images
- [ ] Rate limit image generation endpoint
- [ ] Cache images to prevent abuse

---

## Testing Strategy

### Unit Tests

- Outlier detection algorithm edge cases
- Confidence calculation with various sample sizes
- Fingerprint generation from dimensional analysis
- Diff calculation for before/after comparison

### Integration Tests

- Full extraction with outlier detection
- Fingerprint generation and storage
- Image generation endpoint
- Share flow end-to-end

### Visual Regression Tests (Playwright)

- Pattern summary card layout
- Fingerprint component
- Insight card image generation
- Before/after comparison view

### AI Response Tests

- Mock AI responses for outlier explanations
- Validate quality_signature extraction
- Test malformed response handling

---

## Performance Considerations

### Image Generation

- Use `@vercel/og` for edge-optimized generation
- Cache generated images in Supabase Storage (1 hour TTL)
- Limit image dimensions to 1200x630 (optimal for social)

### Extraction Performance

- Current: <30s for 50 outputs (acceptable)
- Outlier detection: Add ~2-5s (local computation)
- Fingerprint generation: Add ~5s (additional AI call)

### Page Load

- Insights page currently loads in <2s (acceptable)
- New components should be lazy-loaded
- Use React Suspense for async components

---

## Open Questions Requiring PM Input

1. **Outlier Threshold**: The PRD suggests 2+ standard deviations. Should we make this configurable per-project?

2. **Free vs Pro**: Which features should be gated?
   - Recommended: Basic pattern diff = free, Visual fingerprint + outliers + sharing = Pro

3. **Export Formats**: PDF generation adds significant complexity. Should we defer PDF and focus on PNG + Markdown?

4. **Fingerprint Versioning**: Should we auto-version fingerprints when patterns change, or require manual "save as new version"?

5. **Share Analytics**: Do we want to track when insight cards are shared and where? Requires additional analytics infrastructure.

---

## Dependencies

### External Libraries (New)

- `@vercel/og` - Image generation (MIT license)
- `diff` - Text diff computation (BSD license)
- `@react-pdf/renderer` - PDF generation (MIT) - Phase 3 only if PDF needed

### Internal Dependencies

- Security infrastructure (existing, reuse)
- AI generation pipeline (existing, extend)
- UI component library (existing, extend)

---

## Estimated Total Effort

| Phase | Feature                   | Days | Cumulative |
| ----- | ------------------------- | ---- | ---------- |
| 1     | Visual Pattern Diff       | 10   | 10         |
| 7     | Confidence Explainer      | 3    | 13         |
| 3     | Pattern Fingerprint       | 10   | 23         |
| 4     | Failure Radar Enhancement | 5    | 28         |
| 2     | Outlier Inspector         | 8    | 36         |
| 5     | Shareable Insight Cards   | 8    | 44         |
| 6     | Before/After Comparator   | 12   | 56         |

**Total**: ~56 dev days (11-12 weeks with 1 engineer)
**MVP**: ~20 days (4 weeks)

---

## Success Metrics Alignment

Each phase maps to PRD success metrics:

| Phase            | Metric Target                                  |
| ---------------- | ---------------------------------------------- |
| 1 (Pattern Diff) | 90% "aha moment" within 60s                    |
| 3 (Fingerprint)  | Engineers can implement from fingerprint alone |
| 5 (Sharing)      | 70% screenshot insights, 30% share externally  |
| 2 (Outliers)     | Discover edge cases in 50% of analyses         |
| 6 (Before/After) | Prove ROI of iterations to stakeholders        |

---

## Next Steps

1. **PM Review**: Validate priorities and open questions
2. **Design Review**: Get high-fidelity mockups for Pattern Summary Card and Fingerprint
3. **Sprint Planning**: Break Phase 1 into user stories
4. **Spike**: Validate `@vercel/og` image generation quality (1 day)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-30
