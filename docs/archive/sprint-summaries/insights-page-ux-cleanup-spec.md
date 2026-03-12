# Insights Page UX Cleanup Specification

**Created**: December 31, 2025
**Status**: Planning
**Priority**: P0 (Post-MVP Pattern Analysis Features)
**Estimated Effort**: 2-3 days

---

## Executive Summary

The Insights page now has 8 major component sections following the addition of three MVP Pattern Analysis features (Visual Pattern Diff, Pattern Fingerprint, Confidence Explainer). This has created information hierarchy and UX consistency challenges. This specification defines a comprehensive cleanup project to transform the Insights page into a cohesive, intuitive experience that guides users from high-level patterns to actionable next steps.

**Current State**: 8 component sections with inconsistent visual treatment, unclear hierarchy, and redundant information.

**Target State**: Streamlined 3-tier information architecture with consistent visual language, clear progressive disclosure, and optimized mobile responsiveness.

---

## Current Component Inventory

### New Pattern Analysis Components (MVP)

1. **PatternSummaryCard** - Visual Pattern Diff (ALWAYS/NEVER side-by-side)
2. **PatternFingerprintCard** - One-page quality spec
3. **ConfidenceExplainerCard** - Dimension breakdown with actionable guidance

### Existing Components

4. **SampleSizeAlert** - Sample size guidance (green/yellow/red alerts)
5. **System Prompt Snapshot** - Historical system prompt display
6. **Failure Analysis** - Clustered failures with suggested fixes
7. **Dimensional Analysis** - 5x DimensionCard components (Length, Tone, Structure, Content, Errors)
8. **Legacy Sections** - Quality Criteria, Summary, Key Insights, Recommendations

### Header Elements

- Success Rate + Confidence scores with badges
- Export dropdown (JSON, Markdown, Pytest, Jest)
- Golden Examples button
- History button

---

## Problem Analysis

### 1. Information Hierarchy Issues

**Current Flow** (Top to Bottom):

1. Header with metrics
2. Contextual alerts (if success/confidence actionable)
3. Sample Size Alert
4. PatternSummaryCard (hero)
5. PatternFingerprintCard
6. ConfidenceExplainerCard
7. System Prompt Snapshot
8. Failure Analysis (if failures exist)
9. Dimensional Analysis (5 cards)
10. Summary
11. Quality Criteria (legacy)
12. Key Insights (legacy)
13. Recommendations (legacy)

**Problems**:

- No clear "above the fold" priority
- Three competing "hero" components (lines 299-334)
- Legacy sections duplicate content from new pattern analysis features
- User can't quickly answer "What should I do next?"
- Critical action items (Failure Analysis) buried mid-page

### 2. Visual Consistency Issues

**Border Treatments**:

- PatternSummaryCard: `border-2 border-primary/20` with gradient background
- PatternFingerprintCard: `border-2 border-primary/30`
- ConfidenceExplainerCard: `border-2 border-primary/20`
- DimensionCard: Standard card border (no special treatment)
- SampleSizeAlert: Semantic colors (green/yellow/red)
- Failure Analysis: `border-destructive/30`

**Problems**:

- No visual distinction between "hero insights" vs "drill-down details"
- Inconsistent border weights/colors create visual noise
- Three cards with similar `border-2 border-primary/X` treatment compete for attention

### 3. Redundancy Issues

**Overlapping Information**:

- **Confidence**: Shown in header, SampleSizeAlert, ConfidenceExplainerCard
- **Pattern detection**: PatternSummaryCard ALWAYS/NEVER vs DimensionCard patterns
- **Recommendations**: Failure Analysis suggested fixes vs Recommendations section vs ConfidenceExplainerCard actions
- **Sample size**: SampleSizeAlert vs ConfidenceExplainerCard breakdown

**Problems**:

- Users see same information presented 2-3 different ways
- Unclear which source is "canonical"
- Cognitive load determining what's new vs repeated

### 4. Mobile Responsiveness Issues

**Current Grid Patterns**:

- PatternSummaryCard: `grid-cols-1 md:grid-cols-2` (ALWAYS/NEVER split)
- PatternFingerprintCard: `grid-cols-1 md:grid-cols-2` (Must Have/Never split)
- DimensionCard: `grid-cols-2` (High/Low pattern split) - NO responsive breakpoint
- ConfidenceExplainerCard: No grids, stacked sections

**Problems**:

- DimensionCard forces 2-column layout even on mobile (accessibility issue)
- Three side-by-side grids create repetitive visual rhythm
- Mobile users see too much scrolling with 13 sections

### 5. Empty State Inconsistency

**Current Empty States**:

- PatternSummaryCard: Dashed border with "Pattern Analysis Pending"
- PatternFingerprintCard: Dashed border with "Fingerprint Pending"
- ConfidenceExplainerCard: None (always shows data)
- Dimensional Analysis: None (always shows 5 cards)

**Problems**:

- No page-level empty state for "no patterns detected"
- Individual components show empty states inconsistently
- Unclear minimum data requirements

---

## Target Information Architecture

### 3-Tier Progressive Disclosure

**Tier 1: At-a-Glance (Above the Fold)**
_"What's the verdict? What should I do?"_

1. **Header with Smart Status Badge**
   - Success Rate + Confidence → Combined "Readiness" badge
   - Values: "Production Ready" | "Needs More Data" | "Review Required"
   - Quick export + history actions

2. **Smart Alert Banner** (Contextual)
   - HIGH PRIORITY: Failure Analysis alert (if failures > 20%)
   - MEDIUM PRIORITY: Sample size warning (if confidence < 60%)
   - LOW PRIORITY: Success congratulations (if success > 80% + confidence > 85%)
   - RULE: Show max 1 alert, pick highest priority

3. **Pattern Summary Hero** (PatternSummaryCard)
   - The "aha moment" - ALWAYS/NEVER patterns
   - Expanded visual treatment
   - Quick link to drill-down sections

**Tier 2: Actionable Insights (Mid-Page)**
_"What patterns were found? What needs fixing?"_

4. **Failure Analysis** (if failures exist)
   - Moved up from position 8 to position 4
   - Clusters + suggested fixes
   - "Apply Fix" CTA

5. **Confidence Assessment** (ConfidenceExplainerCard)
   - Dimension breakdown
   - Recommended actions
   - Path to production-ready

6. **Quality Fingerprint** (PatternFingerprintCard)
   - The "source of truth" spec
   - Shareable, printable
   - Export-friendly format

**Tier 3: Deep Dive (Below the Fold)**
_"How does this work? Show me the details."_

7. **System Prompt Context** (Expandable)
   - Collapsed by default
   - "View system prompt snapshot" toggle
   - Metadata: extraction date, rated outputs count

8. **Dimensional Analysis** (Accordions or Tabs)
   - 5 dimensions as interactive sections
   - Progressive disclosure: Title + confidence visible, details on click
   - Reduces initial scroll length by ~60%

9. **REMOVED: Legacy Sections**
   - Quality Criteria → Redundant with PatternSummaryCard
   - Summary → Redundant with PatternFingerprintCard
   - Key Insights → Redundant with ConfidenceExplainerCard
   - Recommendations → Redundant with Failure Analysis + ConfidenceExplainerCard

---

## Visual Design System Alignment

### Visual Hierarchy

**Tier 1 Components** (Hero - Emphasize):

- Border: `border-2 border-primary/30`
- Background: Subtle gradient `bg-gradient-to-br from-background to-muted/30`
- Shadow: None (borders preferred per Design System)
- Spacing: `mb-8` (32px) after each

**Tier 2 Components** (Actionable - Standard):

- Border: Standard card `border border-border`
- Background: `bg-background`
- Spacing: `mb-6` (24px) after each

**Tier 3 Components** (Detail - Subtle):

- Border: `border border-border/50` (lighter)
- Background: `bg-muted/30`
- Spacing: `mb-4` (16px) after each

### Color Consistency

**Status Indicators** (following Design System semantic tokens):

```tsx
// Production Ready (High confidence + High success)
Badge: variant="default" (indigo)
Alert: "border-green-200 bg-green-50 dark:bg-green-950"

// Needs Attention (Medium confidence OR failures exist)
Badge: variant="secondary" (yellow tone)
Alert: "border-yellow-200 bg-yellow-50 dark:bg-yellow-950"

// Critical Issues (Low confidence OR high failure rate)
Badge: variant="destructive" (red)
Alert: "border-red-200 bg-red-50 dark:bg-red-950"
```

**Pattern Indicators** (consistent across all components):

- High-rated / ALWAYS / Must Have: `text-green-600 dark:text-green-400`
- Low-rated / NEVER / Anti-pattern: `text-red-600 dark:text-red-400`
- Dimension labels: `text-primary` (indigo)

### Typography Consistency

**Headers** (following Design System):

```tsx
Page Title: "text-4xl font-bold tracking-tight"  // Insights
Section Title: "text-2xl font-bold mb-4"         // Dimensional Analysis
Card Title: "text-xl" (PatternSummaryCard) or "text-lg" (DimensionCard)
Subsection: "text-xs font-semibold tracking-wide uppercase" (STRUCTURE, TONE)
```

**Current Inconsistencies**:

- PatternSummaryCard title: `text-xl` ✅
- PatternFingerprintCard title: `text-xl` ✅
- ConfidenceExplainerCard title: `text-lg` ❌ (should be `text-xl`)
- DimensionCard title: `text-lg` ✅ (appropriate for Tier 3)

### Spacing Consistency

**Section Spacing** (following Design System vertical rhythm):

```tsx
Tier 1: mb-8  (32px) - Generous spacing for hero components
Tier 2: mb-6  (24px) - Standard spacing for actionable sections
Tier 3: mb-4  (16px) - Compact spacing for details
```

**Card Padding**:

```tsx
Standard: p-6 (24px) - DimensionCard, Failure Analysis
Emphasized: p-6 with expanded CardHeader pb-4 - Pattern cards
```

---

## Component-Specific Improvements

### 1. Smart Alert Banner (NEW)

**Purpose**: Replace multiple competing alerts with single contextual banner

**Logic**:

```typescript
function getSmartAlertPriority(
  failureRate: number,
  confidence: number,
  successRate: number,
): "failure" | "sample_size" | "success" | null {
  if (failureRate > 0.2) return "failure"; // > 20% failures
  if (confidence < 0.6) return "sample_size"; // < 60% confidence
  if (successRate > 0.8 && confidence > 0.85) return "success"; // Production ready
  return null;
}
```

**Design**:

```tsx
{
  /* HIGH PRIORITY: Failure Alert */
}
<Alert className="border-red-200 bg-red-50 dark:bg-red-950 mb-6">
  <AlertTriangle className="h-4 w-4" />
  <AlertTitle>Action Required: {failureCount} outputs failing</AlertTitle>
  <AlertDescription>
    Review Failure Analysis below for suggested fixes.
    <Button variant="link">Jump to Failures</Button>
  </AlertDescription>
</Alert>;

{
  /* MEDIUM PRIORITY: Sample Size Warning */
}
<Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 mb-6">
  <Info className="h-4 w-4" />
  <AlertTitle>Medium Confidence: More samples recommended</AlertTitle>
  <AlertDescription>
    Add {needsMore} more rated outputs to reach production-ready confidence
    (85%).
    <Button variant="link">View Confidence Breakdown</Button>
  </AlertDescription>
</Alert>;

{
  /* LOW PRIORITY: Success */
}
<Alert className="border-green-200 bg-green-50 dark:bg-green-950 mb-6">
  <CheckCircle2 className="h-4 w-4" />
  <AlertTitle>Production Ready: High confidence patterns detected</AlertTitle>
  <AlertDescription>
    {successPercent}% success rate with {confidencePercent}% confidence. Ready
    to export.
    <Button variant="link">Download Spec</Button>
  </AlertDescription>
</Alert>;
```

**Replaces**:

- Contextual alerts (lines 263-285)
- SampleSizeAlert (lines 288-297)

### 2. PatternSummaryCard Enhancements

**Current State**: Good foundation, needs polish

**Improvements**:

1. **Add Section Anchor Links**:

```tsx
<div className="flex items-center gap-2 text-xs text-muted-foreground mt-4 border-t pt-3">
  <span>Explore:</span>
  <Button variant="ghost" size="sm" onClick={() => scrollTo("#failures")}>
    Failures ({failureCount})
  </Button>
  <Button variant="ghost" size="sm" onClick={() => scrollTo("#dimensions")}>
    Dimensions (5)
  </Button>
  <Button variant="ghost" size="sm" onClick={() => scrollTo("#fingerprint")}>
    Full Spec
  </Button>
</div>
```

2. **Empty State Improvement**:

```tsx
// Current: Generic "Pattern Analysis Pending"
// Better: Specific guidance
<p className="text-sm text-muted-foreground text-center max-w-md">
  Need <strong>5+ high-rated</strong> (4-5 stars) and{" "}
  <strong>5+ low-rated</strong>
  (1-2 stars) outputs to detect clear patterns.
  <br />
  <span className="text-xs mt-2 block">
    Currently: {highRatedCount} high, {lowRatedCount} low
  </span>
</p>
```

### 3. ConfidenceExplainerCard Consistency Fixes

**Current Issues**:

- Title size inconsistent: `text-lg` (should be `text-xl` for Tier 2 component)
- Overall percent display: Good
- Dimension grouping: Excellent
- Actions: Good, but overlap with SampleSizeAlert

**Fixes**:

```tsx
// Line 160: Update title size
<CardTitle className="flex items-center gap-2 text-xl">
  {" "}
  {/* was text-lg */}
  <BarChart3 className="h-5 w-5 text-primary" />
  Confidence Assessment
</CardTitle>
```

**Integration**:

- Remove redundant sample size guidance from this card
- Focus on dimension-level breakdown and prioritized actions
- Let Smart Alert Banner handle top-level sample size messaging

### 4. DimensionCard Mobile Fix

**CRITICAL ACCESSIBILITY ISSUE**:

```tsx
// Line 66: Missing responsive breakpoint
<div className="grid grid-cols-2 gap-4 mb-4"> {/* ❌ Forces 2-col on mobile */}

// Fix:
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"> {/* ✅ Responsive */}
```

### 5. Dimensional Analysis Accordion (NEW)

**Purpose**: Reduce initial scroll length by 60% while maintaining access to details

**Implementation**:

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

<div className="mb-6" id="dimensions">
  <h2 className="text-2xl font-bold mb-4">Dimensional Analysis</h2>
  <p className="text-sm text-muted-foreground mb-4">
    Quality patterns analyzed across 5 dimensions
  </p>

  <Accordion type="multiple" defaultValue={["length"]} className="space-y-2">
    {/* Length */}
    <AccordionItem value="length" className="border rounded-lg">
      <AccordionTrigger className="px-4 hover:no-underline">
        <div className="flex items-center justify-between w-full pr-2">
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-primary" />
            <span className="font-semibold">Length</span>
          </div>
          <Badge variant={getConfidenceBadge(dimensions.length.confidence)}>
            {(dimensions.length.confidence * 100).toFixed(0)}%
          </Badge>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        {/* Existing DimensionCard content (without outer Card wrapper) */}
      </AccordionContent>
    </AccordionItem>

    {/* Repeat for: Tone, Structure, Content, Errors */}
  </Accordion>
</div>;
```

**Benefits**:

- Reduces initial page length from ~8000px to ~3000px
- Maintains keyboard accessibility
- Users can open multiple sections simultaneously (`type="multiple"`)
- Default open "length" (typically highest confidence)

### 6. System Prompt Snapshot Toggle (NEW)

**Purpose**: Reduce visual clutter for non-technical users, maintain access for engineers

**Implementation**:

```tsx
<Card className="mb-6 border-border/50 bg-muted/30">
  {" "}
  {/* Tier 3 styling */}
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-lg">System Prompt Context</CardTitle>
        <CardDescription>
          Snapshot from {new Date(extraction.created_at).toLocaleDateString()}
        </CardDescription>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowPrompt(!showPrompt)}
      >
        {showPrompt ? <ChevronUp /> : <ChevronDown />}
        {showPrompt ? "Hide" : "View"} Prompt
      </Button>
    </div>
  </CardHeader>
  {showPrompt && (
    <CardContent>
      <p className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/50 p-4 rounded-md">
        {extraction.system_prompt_snapshot}
      </p>
    </CardContent>
  )}
</Card>
```

### 7. Remove Legacy Sections

**Sections to Remove** (lines 720-839):

- Summary (lines 720-732)
- Quality Criteria (lines 735-788)
- Key Insights (lines 791-810)
- Recommendations (lines 813-839)

**Rationale**:

- Summary → Content duplicated in PatternFingerprintCard
- Quality Criteria → Content duplicated in PatternSummaryCard (ALWAYS/NEVER) and DimensionCards
- Key Insights → Content duplicated in ConfidenceExplainerCard recommended actions
- Recommendations → Content duplicated in Failure Analysis suggested fixes + ConfidenceExplainerCard

**Migration**:

- These sections were generated by legacy extraction schema
- New pattern analysis features provide better, more actionable versions
- Backend can deprecate these fields in extraction criteria (separate task)

---

## Responsive Design Improvements

### Mobile-First Breakpoints

**Header Stack** (lines 169-259):

```tsx
{/* Current: Side-by-side buttons always */}
<div className="flex gap-2">

{/* Better: Stack on mobile */}
<div className="flex flex-col sm:flex-row gap-2">
```

**Stats Row** (lines 177-207):

```tsx
{/* Current: Horizontal always, can overflow */}
<div className="flex gap-4 mt-4 text-sm">

{/* Better: Wrap on mobile */}
<div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-sm">
```

**Pattern Cards** (All three hero cards):

```tsx
{/* Already responsive - maintain pattern */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
```

**Failure Analysis** (lines 389-449):

```tsx
{/* Current: Fixed layout */}
<div className="flex items-start justify-between mb-3">

{/* Better: Stack on mobile */}
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
```

### Touch Target Sizes

**Accordion Triggers**: Already 44px+ height ✅
**Button Sizes**: Using `size="sm"` which is 40px - OK for secondary actions
**Links**: Need padding for larger tap area

```tsx
{
  /* Add to navigation links */
}
<Button variant="link" className="min-h-[44px] px-4">
  Jump to Failures
</Button>;
```

---

## Loading & Empty States

### Page-Level Empty State

**Trigger**: `!extraction || !criteria.dimensions`

**Current**: Shows generic empty state at page level (lines 132-152) ✅

**Enhancement**: Add more specific CTAs

```tsx
<div className="space-y-4">
  <Button asChild size="lg">
    <Link href={`/projects/${id}/outputs`}>
      <Sparkles className="mr-2 h-5 w-5" />
      Generate & Rate Outputs
    </Link>
  </Button>

  <p className="text-xs text-muted-foreground">
    Need at least 10 rated outputs (5 high-rated, 5 low-rated) to extract
    patterns
  </p>
</div>
```

### Component-Level Empty States

**Pattern Summary**:

- Current: Dashed border card ✅
- Shows sample counts in message ✅

**Pattern Fingerprint**:

- Current: Dashed border card ✅
- Shows minimum requirements ✅

**Confidence Explainer**:

- Always shows data (even with low confidence)
- Good - provides guidance regardless

**Dimensional Analysis**:

- Always shows 5 dimensions
- Good - shows "No specific elements" when data sparse

### Loading States (Future Enhancement)

**Current**: Server-rendered page, no loading states needed ✅

**Future** (if making interactive):

```tsx
<Card>
  <CardContent className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
    <span className="ml-3 text-sm text-muted-foreground">
      Analyzing patterns...
    </span>
  </CardContent>
</Card>
```

---

## Acceptance Criteria

### Functional Requirements

#### FR-1: Smart Alert Banner

- [ ] Only 1 alert shown at a time (highest priority)
- [ ] Failure alert shown if failure rate > 20%
- [ ] Sample size alert shown if confidence < 60% (and no failures)
- [ ] Success alert shown if success > 80% AND confidence > 85%
- [ ] Alert includes "Jump to" link that scrolls to relevant section
- [ ] Alert color matches severity (red/yellow/green)

#### FR-2: Information Hierarchy

- [ ] Page organized into 3 tiers: At-a-Glance, Actionable, Deep Dive
- [ ] Failure Analysis moved to position 4 (when failures exist)
- [ ] System Prompt Snapshot collapsible (default: collapsed)
- [ ] Dimensional Analysis uses accordion (default: Length open)
- [ ] Legacy sections removed (Summary, Quality Criteria, Key Insights, Recommendations)

#### FR-3: Mobile Responsiveness

- [ ] All grid layouts use responsive breakpoints (`grid-cols-1 md:grid-cols-2`)
- [ ] Header buttons stack on mobile (`flex-col sm:flex-row`)
- [ ] Stats row wraps on mobile (`flex-wrap`)
- [ ] Failure Analysis stacks on mobile
- [ ] All touch targets >= 44px height
- [ ] No horizontal scroll on mobile (320px min width)

#### FR-4: Visual Consistency

- [ ] Tier 1 components: `border-2 border-primary/30` + gradient background + `mb-8`
- [ ] Tier 2 components: `border border-border` + `mb-6`
- [ ] Tier 3 components: `border border-border/50` + `bg-muted/30` + `mb-4`
- [ ] All pattern indicators use semantic colors (green/red)
- [ ] All card titles use consistent sizing (`text-xl` for Tier 1-2, `text-lg` for Tier 3)

#### FR-5: Empty States

- [ ] Page-level empty state shows when no extraction exists
- [ ] Component empty states show minimum data requirements
- [ ] Empty states use dashed borders for visual distinction
- [ ] Empty states provide specific CTAs (not generic "go back")

### Test Coverage Requirements

#### Unit Tests

- [ ] Smart alert priority logic (getSmartAlertPriority function)
- [ ] Component rendering with/without data
- [ ] Empty state triggers
- [ ] Responsive class application

#### Visual Regression Tests (Playwright)

- [ ] Desktop view (1920x1080)
- [ ] Tablet view (768x1024)
- [ ] Mobile view (375x667)
- [ ] Empty states (page-level + component-level)
- [ ] All 3 alert variants
- [ ] Accordion interactions
- [ ] System prompt toggle

#### Accessibility Tests

- [ ] All touch targets >= 44px
- [ ] Accordion keyboard navigation (Enter/Space to toggle, Arrow keys to navigate)
- [ ] Smart Alert links have descriptive text
- [ ] Color contrast ratios >= 4.5:1 for all text
- [ ] Focus indicators visible on all interactive elements

### Performance Requirements

- [ ] Initial page load: < 2s (existing performance maintained)
- [ ] Accordion expand/collapse: < 100ms
- [ ] Scroll-to-section smooth animation: < 300ms
- [ ] No layout shift (CLS = 0) on accordion interaction

### Security Requirements

- [ ] No new API routes (SSR page, no additional attack surface)
- [ ] All user content already sanitized by existing extraction process
- [ ] No XSS risk from accordion/toggle interactions (no user input)

### Documentation Requirements

- [ ] Update component documentation with new Smart Alert Banner
- [ ] Update Insights page component map
- [ ] Add mobile design patterns to Design System
- [ ] Document Tier 1/2/3 visual hierarchy system

---

## Implementation Plan

### Phase 1: Foundation (Quick Wins - 4 hours)

**Tasks**:

1. Fix DimensionCard mobile grid (1 line change)
2. Fix ConfidenceExplainerCard title size (1 line change)
3. Add responsive classes to header buttons
4. Add responsive classes to stats row
5. Add responsive classes to Failure Analysis layout
6. Run visual regression tests

**Deliverables**:

- Mobile-responsive Insights page (no horizontal scroll)
- Consistent typography across all cards
- Test coverage for responsive breakpoints

**Risk**: None (minor CSS changes only)

### Phase 2: Smart Alert Banner (6 hours)

**Tasks**:

1. Create `SmartAlertBanner` component at `/components/smart-alert-banner.tsx`
2. Implement priority logic (failure > sample_size > success)
3. Add scroll-to-section functionality
4. Replace contextual alerts + SampleSizeAlert in page
5. Update tests

**Deliverables**:

- Single contextual alert with prioritized messaging
- Jump-to links for relevant sections
- Unit tests for priority logic
- Reduced alert redundancy

**Risk**: Low (net reduction in complexity)

### Phase 3: Visual Hierarchy (6 hours)

**Tasks**:

1. Apply Tier 1/2/3 border and spacing classes
2. Add section IDs for scroll-to functionality
3. Reorder sections (move Failure Analysis to position 4)
4. Test visual hierarchy with design review
5. Update Design System docs with tier patterns

**Deliverables**:

- Clear visual distinction between tiers
- Improved information flow (failures surface earlier)
- Design System tier documentation
- Visual regression tests

**Risk**: Low (CSS changes only, no logic changes)

### Phase 4: Progressive Disclosure (8 hours)

**Tasks**:

1. Create accordion wrapper for Dimensional Analysis
2. Add System Prompt toggle component
3. Test keyboard navigation
4. Test mobile accordion interaction
5. Update accessibility tests

**Deliverables**:

- Dimensional Analysis accordion (default: Length open)
- System Prompt collapsible section (default: collapsed)
- Reduced initial page length (~60% reduction)
- Accessibility compliance maintained

**Risk**: Medium (new interactive patterns, test thoroughly)

### Phase 5: Remove Legacy Sections (2 hours)

**Tasks**:

1. Comment out legacy sections (Summary, Quality Criteria, Key Insights, Recommendations)
2. Test that no functionality breaks
3. Create backend task to deprecate legacy fields
4. Delete commented code after 1 sprint

**Deliverables**:

- Cleaner page with no redundant content
- Backend deprecation task documented
- Reduced maintenance burden

**Risk**: Low (backend still generates these fields, just not displayed)

### Phase 6: Polish & Documentation (4 hours)

**Tasks**:

1. Add anchor links to PatternSummaryCard
2. Improve empty state messaging
3. Update all component documentation
4. Create before/after screenshots
5. Update PROJECT_PLAN_P0_FEATURES.md

**Deliverables**:

- Complete component documentation
- Before/after visual comparison
- Updated roadmap

**Risk**: None (documentation only)

---

## Success Metrics

### User Experience Metrics

**Reduced Cognitive Load**:

- Before: 13 sections, ~8000px page length
- After: 8 sections, ~3000px page length (with accordions)
- Target: 60% reduction in initial scroll length

**Faster Time-to-Action**:

- Before: Failure Analysis at position 8 (~4000px scroll)
- After: Failure Analysis at position 4 (~1200px scroll)
- Target: 70% reduction in scroll distance to critical actions

**Mobile Usability**:

- Before: DimensionCard forces 2-column layout (unreadable on mobile)
- After: All components responsive
- Target: 100% mobile accessibility compliance

### Technical Metrics

**Visual Consistency**:

- Before: 6 different border treatments
- After: 3 tier-based treatments
- Target: 50% reduction in visual complexity

**Information Redundancy**:

- Before: Confidence shown in 3 places, patterns in 4 places
- After: Confidence shown in 2 places (header + breakdown), patterns in 2 places (summary + dimensions)
- Target: ~40% reduction in redundant information

### Accessibility Metrics

**WCAG 2.1 AA Compliance**:

- Before: DimensionCard mobile issue (CWE-1395 touch target)
- After: All touch targets >= 44px, keyboard navigation supported
- Target: 100% WCAG AA compliance

**Performance**:

- Before: No lazy loading, all 13 sections rendered immediately
- After: Accordions reduce initial render
- Target: Maintain < 2s page load, < 100ms interaction

---

## Design System Impact

### New Patterns Documented

**3-Tier Visual Hierarchy**:

```tsx
// Tier 1: Hero (Emphasize)
className =
  "border-2 border-primary/30 bg-gradient-to-br from-background to-muted/30 mb-8";

// Tier 2: Actionable (Standard)
className = "border border-border mb-6";

// Tier 3: Detail (Subtle)
className = "border border-border/50 bg-muted/30 mb-4";
```

**Smart Alert Priority System**:

- Single contextual alert based on state priority
- Semantic colors for severity
- Jump-to-section links for actionability

**Progressive Disclosure Components**:

- Accordion for long detail sections (5+ items)
- Toggle for supplementary context
- Default states optimized for 80% use case

### Design System Updates

**Add to `/docs/DESIGN_SYSTEM.md`**:

```markdown
## Information Hierarchy Patterns

### 3-Tier System

Use visual weight to guide user attention:

**Tier 1 (Hero)**: Primary insights, "aha moments"

- Border: `border-2 border-primary/30`
- Background: `bg-gradient-to-br from-background to-muted/30`
- Spacing: `mb-8` (32px)

**Tier 2 (Actionable)**: Next steps, decisions

- Border: `border border-border`
- Background: `bg-background`
- Spacing: `mb-6` (24px)

**Tier 3 (Detail)**: Supporting info, drill-down

- Border: `border border-border/50`
- Background: `bg-muted/30`
- Spacing: `mb-4` (16px)

### Progressive Disclosure

For dense content (5+ items):

- Use Accordion (shadcn/ui component)
- Default to 1 section open (highest priority)
- Allow multiple sections open (`type="multiple"`)
```

---

## Migration Strategy

### Backward Compatibility

**Extraction Schema**:

- Current extractions include legacy fields (summary, criteria, key_insights, recommendations)
- These fields will be hidden in UI but still exist in database
- Backend extraction logic unchanged
- Future: Deprecate legacy fields in new extractions (separate project)

**URL Parameters**:

- Existing `?extractionId=X` parameter continues to work
- Historical extractions display correctly (legacy sections hidden)

**Export Formats**:

- JSON export includes all fields (legacy + new pattern analysis)
- Markdown export prioritizes new pattern analysis features
- Test suites (pytest/jest) unaffected (use dimensional analysis)

### Rollout Plan

**Phase 1**: Deploy to staging

- Internal team testing (2 days)
- Validate all empty states
- Test with real extraction data

**Phase 2**: Gradual rollout (if desired)

- Feature flag: `FEATURE_NEW_INSIGHTS_UX=true`
- Enable for internal projects first
- Monitor analytics (scroll depth, interaction rates)

**Phase 3**: Full deployment

- Remove feature flag
- Monitor error rates
- Update help documentation

---

## Open Questions

### 1. Accordion Default State

**Question**: Should Dimensional Analysis accordion default to all closed or Length open?

**Options**:

- A) All closed (cleanest, most compact)
- B) Length open (highest confidence dimension, best UX)
- C) User preference saved to localStorage

**Recommendation**: B (Length open) - Balances compactness with "show don't hide" principle

---

### 2. Smart Alert Threshold Tuning

**Question**: Are the priority thresholds optimal?

**Current**:

- Failure alert: > 20% failure rate
- Sample size alert: < 60% confidence
- Success alert: > 80% success AND > 85% confidence

**Validation Needed**:

- Test with real project data
- May need to adjust thresholds based on user feedback
- Consider A/B testing different thresholds

**Action**: Ship with current thresholds, monitor user feedback in first 2 weeks

---

### 3. System Prompt Snapshot Visibility

**Question**: Should System Prompt Snapshot default to visible or hidden?

**Options**:

- A) Hidden (reduces clutter, optimizes for PM users)
- B) Visible (transparency, optimizes for engineer users)
- C) User role-based (PM = hidden, engineer = visible)

**Recommendation**: A (hidden) - PMs are primary persona, engineers can click to expand

---

### 4. Failure Analysis Position

**Question**: Should Failure Analysis be above or below Confidence Explainer?

**Current Plan**: Above (position 4, immediately after Pattern Summary)

**Alternative**: Below Confidence Explainer (position 6)

**Reasoning for Above**:

- Failures are highest priority actionable item
- Smart Alert will surface failures, user expects details next
- Confidence is important but less urgent than fixing failures

**Action**: Ship with position 4, monitor user flow analytics

---

### 5. Legacy Section Deletion Timeline

**Question**: When to fully delete legacy sections?

**Options**:

- A) Immediately (ship without them)
- B) After 1 sprint (comment out, observe, delete)
- C) After backend deprecation (safe deletion)

**Recommendation**: B (1 sprint buffer) - Allows quick rollback if needed

**Action**: Comment out in Phase 5, delete in next sprint if no issues

---

## Risks & Mitigations

### Risk 1: User Confusion from Missing Legacy Sections

**Impact**: Medium
**Probability**: Low

**Scenario**: Users accustomed to Summary/Recommendations sections can't find them

**Mitigation**:

1. Add changelog note: "Insights page simplified - recommendations now in Confidence Assessment"
2. Monitor support tickets for confusion
3. Quick rollback: Uncomment legacy sections if needed
4. Long-term: Better than maintaining redundant content

---

### Risk 2: Mobile Accordion Usability Issues

**Impact**: Medium
**Probability**: Low

**Scenario**: Users can't figure out how to expand accordion sections

**Mitigation**:

1. Use shadcn/ui Accordion (battle-tested component)
2. Clear visual affordance (chevron icon, hover state)
3. ARIA labels for screen readers
4. Fallback: Add "Tap to expand" hint on first visit
5. Test with non-technical users before launch

---

### Risk 3: Smart Alert Threshold Tuning

**Impact**: Low
**Probability**: Medium

**Scenario**: Alert priorities don't match user mental model

**Mitigation**:

1. Start with conservative thresholds
2. Instrument alert impressions (which alert shown when)
3. A/B test thresholds if needed
4. Easy to adjust (single function, no UI changes)

---

### Risk 4: Performance Degradation

**Impact**: Low
**Probability**: Very Low

**Scenario**: Accordion interaction causes lag

**Mitigation**:

1. Accordion uses CSS transitions (GPU accelerated)
2. No data fetching on expand (all data already loaded)
3. Performance budget: < 100ms expand/collapse
4. Test on low-end devices before launch

---

### Risk 5: Accessibility Regression

**Impact**: High
**Probability**: Very Low

**Scenario**: Accordion or toggle breaks keyboard navigation

**Mitigation**:

1. Use shadcn/ui components (WCAG AA compliant)
2. Comprehensive keyboard navigation tests
3. Screen reader testing
4. Manual QA with accessibility checklist
5. Automated a11y tests in CI

---

## Appendix A: Visual Mockups

### Before: Current Insights Page

```
┌─────────────────────────────────────────────┐
│ INSIGHTS                                    │
│ Success Rate: 67% | Confidence: 73%         │
│ [Golden Examples] [History] [Export ▼]      │
└─────────────────────────────────────────────┘

[Contextual Alert: Low Success Rate]
[Contextual Alert: Medium Confidence]

[Sample Size Alert: 15 samples (need 20)]

┌─────────────────────────────────────────────┐
│ ✨ PATTERN SUMMARY                          │
│ 5-Star ALWAYS | 1-Star NEVER               │
│ [Green items] | [Red items]                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🔍 QUALITY FINGERPRINT                      │
│ STRUCTURE: [flow diagram]                   │
│ MUST HAVE | NEVER                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📊 CONFIDENCE ASSESSMENT                     │
│ Overall: 73%                                │
│ High Confidence: Length (85%)               │
│ Medium Confidence: Tone (67%)               │
│ Recommended Actions...                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ SYSTEM PROMPT SNAPSHOT                       │
│ [Long prompt text visible]                  │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🐛 FAILURE ANALYSIS                         │
│ 8 failures clustered...                     │
└─────────────────────────────────────────────┘

DIMENSIONAL ANALYSIS
[Length Card - Full size]
[Tone Card - Full size]
[Structure Card - Full size]
[Content Card - Full size]
[Errors Card - Full size]

┌─────────────────────────────────────────────┐
│ 💡 SUMMARY                                  │
│ [Redundant summary text]                   │
└─────────────────────────────────────────────┘

QUALITY CRITERIA
[5 cards duplicating pattern summary]

┌─────────────────────────────────────────────┐
│ ✓ KEY INSIGHTS                              │
│ [Bullet list duplicating confidence]       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 💡 RECOMMENDATIONS                          │
│ [Actions duplicating failures + confidence] │
└─────────────────────────────────────────────┘
```

**Issues**:

- ~8000px page length
- 13 sections
- 3 competing alerts at top
- Failures buried at position 8
- Massive redundancy in bottom half

---

### After: Redesigned Insights Page

```
┌─────────────────────────────────────────────┐
│ INSIGHTS                                    │
│ Success Rate: 67% | Confidence: 73%         │
│ 🟡 NEEDS ATTENTION                          │
│ [Golden Examples] [History] [Export ▼]      │
└─────────────────────────────────────────────┘

🔔 ACTION REQUIRED: 8 outputs failing (>20%)
   Review Failure Analysis below for fixes.
   [Jump to Failures ↓]

┌═════════════════════════════════════════════┐ Tier 1
║ ✨ PATTERN SUMMARY                          ║ (Hero)
║ 5-Star ALWAYS | 1-Star NEVER               ║
║ [Green items] | [Red items]                ║
║                                             ║
║ Explore: [Failures (8)] [Dimensions] [Spec]║
└═════════════════════════════════════════════┘

┌─────────────────────────────────────────────┐ Tier 2
│ 🐛 FAILURE ANALYSIS (#failures)             │ (Actionable)
│ 8 failures in 2 clusters                    │
│ [Cluster 1: Missing examples (5)]           │
│ [Cluster 2: Too formal (3)]                │
│ [Apply Fix] button                          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 📊 CONFIDENCE ASSESSMENT (#confidence)       │
│ Overall: 73%                                │
│ HIGH (9+ samples): Length (85%)             │
│ MEDIUM (5-8): Tone (67%)                    │
│ LOW (<5): Errors (40%)                      │
│                                             │
│ 🎯 RECOMMENDED ACTIONS                       │
│ 1. Add 5 more error examples                │
│ 2. Rate 3 more tone variations              │
└─────────────────────────────────────────────┘

┌═════════════════════════════════════════════┐
║ 🔍 QUALITY FINGERPRINT (#fingerprint)       ║
║ STRUCTURE: [flow diagram]                   ║
║ MUST HAVE | NEVER                           ║
║ [Shareable one-page spec]                  ║
└═════════════════════════════════════════════┘

┌─────────────────────────────────────────────┐ Tier 3
│ SYSTEM PROMPT CONTEXT          [View ▼]     │ (Detail)
│ Snapshot from Dec 31, 2025                  │
│ (Collapsed by default)                      │
└─────────────────────────────────────────────┘

DIMENSIONAL ANALYSIS (#dimensions)

▼ Length (85% confidence)                    ▼ ← Default open
  [Full dimension details]

▶ Tone (67% confidence)                      ▶ ← Collapsed
▶ Structure (78% confidence)                 ▶
▶ Content (71% confidence)                   ▶
▶ Errors (40% confidence)                    ▶
```

**Improvements**:

- ~3000px page length (60% reduction)
- 8 sections (down from 13)
- 1 contextual alert (highest priority)
- Failures at position 4 (was position 8)
- No redundant sections
- Clear visual hierarchy (3 tiers)
- Mobile-responsive throughout

---

## Appendix B: Component Comparison

### Smart Alert Banner vs Current Alerts

**Current** (lines 263-297):

```tsx
{
  /* Contextual Alert 1: Success Rate */
}
{
  successInterpretation.actionable && (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>{successInterpretation.message}</AlertTitle>
      <AlertDescription>{successInterpretation.actionable}</AlertDescription>
    </Alert>
  );
}

{
  /* Contextual Alert 2: Confidence */
}
{
  confidenceInterpretation.actionable && (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{confidenceInterpretation.message}</AlertTitle>
      <AlertDescription>{confidenceInterpretation.actionable}</AlertDescription>
    </Alert>
  );
}

{
  /* Sample Size Alert */
}
<SampleSizeAlert
  totalSamples={extraction.rated_output_count || 0}
  highRatedCount={criteria.dimensions.length.sample_size.high}
  lowRatedCount={criteria.dimensions.length.sample_size.low}
  recommendedMinimum={20}
/>;
```

**Problems**:

- 3 potential alerts (often 2-3 shown simultaneously)
- No prioritization logic
- Redundant messaging (confidence shown 3 times)
- Visual clutter

**New**:

```tsx
<SmartAlertBanner
  failureRate={failureCount / totalOutputs}
  confidence={confidenceScore}
  successRate={successRate}
  failureCount={failureCount}
  needsMore={Math.max(0, 20 - totalSamples)}
/>
```

**Benefits**:

- 1 alert max (highest priority)
- Clear call-to-action
- Jump-to-section links
- 70% less code

---

### Dimensional Analysis: Cards vs Accordion

**Current** (lines 454-717):

```tsx
<div className="space-y-4">
  <DimensionCard title="Length" ... />  {/* ~60 lines */}
  <DimensionCard title="Tone" ... />    {/* ~60 lines */}
  <DimensionCard title="Structure" ... /> {/* ~60 lines */}
  <DimensionCard title="Content" ... />   {/* ~60 lines */}
  <DimensionCard title="Errors" ... />    {/* ~60 lines */}
</div>
```

**Page Impact**:

- ~2000px vertical space
- All details visible immediately
- Overwhelming on mobile

**New**:

```tsx
<Accordion type="multiple" defaultValue={["length"]}>
  <AccordionItem value="length">
    <AccordionTrigger>Length (85% confidence)</AccordionTrigger>
    <AccordionContent>{/* DimensionCard content */}</AccordionContent>
  </AccordionItem>
  {/* Repeat for 4 more dimensions */}
</Accordion>
```

**Page Impact**:

- ~400px vertical space (collapsed)
- ~600px when 1 section open
- 70% reduction in initial scroll
- Better mobile UX

---

## Appendix C: Accessibility Checklist

### WCAG 2.1 AA Compliance

**Perceivable**:

- [ ] All text has >= 4.5:1 contrast ratio
- [ ] All UI components have >= 3:1 contrast ratio
- [ ] No information conveyed by color alone (icons + text)
- [ ] Accordion state indicated by icon + aria-expanded

**Operable**:

- [ ] All functionality available via keyboard
- [ ] Accordion: Enter/Space to toggle, Arrow keys to navigate
- [ ] Focus indicators visible (ring-2 ring-primary)
- [ ] No keyboard traps
- [ ] Touch targets >= 44x44px

**Understandable**:

- [ ] Accordion labels clearly describe content
- [ ] Error messages are clear and actionable
- [ ] No unexpected context changes
- [ ] Consistent navigation patterns

**Robust**:

- [ ] Valid HTML5 semantic markup
- [ ] ARIA attributes used correctly
- [ ] Compatible with assistive technologies
- [ ] No console errors or warnings

### Screen Reader Testing

**Components to Test**:

1. Smart Alert Banner
   - Announces priority and message
   - Jump-to links labeled correctly

2. Accordion
   - Section labels read correctly
   - Expanded/collapsed state announced
   - Keyboard navigation smooth

3. Pattern Cards
   - Grid layout navigable
   - Badge confidence values read
   - Lists read sequentially

**Testing Tools**:

- macOS VoiceOver
- NVDA (Windows)
- axe DevTools (automated)

---

## Appendix D: Code Snippets

### SmartAlertBanner Component

**File**: `/components/smart-alert-banner.tsx`

```tsx
/**
 * SmartAlertBanner Component
 *
 * Displays a single, prioritized contextual alert for the Insights page.
 * Replaces multiple competing alerts with intelligent priority logic.
 *
 * Priority Order:
 * 1. Failure Alert (failure rate > 20%)
 * 2. Sample Size Warning (confidence < 60%)
 * 3. Success Celebration (success > 80% AND confidence > 85%)
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react";

interface SmartAlertBannerProps {
  failureRate: number;
  confidence: number;
  successRate: number;
  failureCount: number;
  needsMore: number;
}

type AlertPriority = "failure" | "sample_size" | "success" | null;

function getAlertPriority(
  failureRate: number,
  confidence: number,
  successRate: number,
): AlertPriority {
  if (failureRate > 0.2) return "failure";
  if (confidence < 0.6) return "sample_size";
  if (successRate > 0.8 && confidence > 0.85) return "success";
  return null;
}

function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function SmartAlertBanner({
  failureRate,
  confidence,
  successRate,
  failureCount,
  needsMore,
}: SmartAlertBannerProps) {
  const priority = getAlertPriority(failureRate, confidence, successRate);

  if (!priority) return null;

  // Failure Alert (Highest Priority)
  if (priority === "failure") {
    return (
      <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 mb-6">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertTitle className="text-red-900 dark:text-red-100">
          Action Required: {failureCount} output{failureCount !== 1 ? "s" : ""}{" "}
          failing
        </AlertTitle>
        <AlertDescription className="text-red-800 dark:text-red-200">
          <p className="mb-2">
            {Math.round(failureRate * 100)}% of outputs received low ratings.
            Review Failure Analysis for suggested fixes.
          </p>
          <Button
            variant="link"
            className="p-0 h-auto text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
            onClick={() => scrollToSection("failures")}
          >
            Jump to Failure Analysis ↓
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Sample Size Warning (Medium Priority)
  if (priority === "sample_size") {
    const confidencePercent = Math.round(confidence * 100);
    return (
      <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800 mb-6">
        <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <AlertTitle className="text-yellow-900 dark:text-yellow-100">
          Medium Confidence ({confidencePercent}%): More samples recommended
        </AlertTitle>
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <p className="mb-2">
            Add <strong>{needsMore} more rated outputs</strong> to reach
            production-ready confidence (85%). Current patterns may shift with
            more data.
          </p>
          <Button
            variant="link"
            className="p-0 h-auto text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100"
            onClick={() => scrollToSection("confidence")}
          >
            View Confidence Breakdown ↓
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Success Celebration (Low Priority)
  if (priority === "success") {
    const successPercent = Math.round(successRate * 100);
    const confidencePercent = Math.round(confidence * 100);
    return (
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 mb-6">
        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-900 dark:text-green-100">
          Production Ready: High confidence patterns detected
        </AlertTitle>
        <AlertDescription className="text-green-800 dark:text-green-200">
          <p className="mb-2">
            <strong>{successPercent}% success rate</strong> with{" "}
            <strong>{confidencePercent}% confidence</strong>. Patterns are
            statistically reliable and ready to export.
          </p>
          <Button
            variant="link"
            className="p-0 h-auto text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
            onClick={() => scrollToSection("fingerprint")}
          >
            View Quality Fingerprint ↓
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
```

---

### Dimensional Analysis Accordion

**File**: Inline in `/app/projects/[id]/insights/page.tsx`

```tsx
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Replace lines 454-717 with:

{
  criteria.dimensions && (
    <div className="mb-6" id="dimensions">
      <h2 className="text-2xl font-bold mb-4">Dimensional Analysis</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Quality patterns analyzed across 5 dimensions comparing high-rated vs
        low-rated outputs
      </p>

      <Accordion
        type="multiple"
        defaultValue={["length"]}
        className="space-y-2"
      >
        {/* Length Dimension */}
        <AccordionItem value="length" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline [&[data-state=open]]:border-b">
            <div className="flex items-center justify-between w-full pr-2">
              <div className="flex items-center gap-2">
                <Ruler className="h-4 w-4 text-primary" />
                <span className="font-semibold">Length</span>
              </div>
              <Badge
                variant={
                  criteria.dimensions.length.confidence > 0.8
                    ? "default"
                    : criteria.dimensions.length.confidence > 0.6
                      ? "secondary"
                      : "outline"
                }
              >
                {(criteria.dimensions.length.confidence * 100).toFixed(0)}%
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {/* Existing DimensionCard content without Card wrapper */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {criteria.dimensions.length.insight}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* High-rated pattern */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>High-Rated (4-5 stars)</span>
                  </div>
                  <div className="rounded-md bg-green-50 dark:bg-green-950 p-3 text-sm border border-green-200 dark:border-green-800">
                    <p className="font-medium">
                      {criteria.dimensions.length.high_rated_range.min}-
                      {criteria.dimensions.length.high_rated_range.max}{" "}
                      {criteria.dimensions.length.metric}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Median:{" "}
                      {criteria.dimensions.length.high_rated_range.median}{" "}
                      {criteria.dimensions.length.metric}
                    </p>
                  </div>
                </div>

                {/* Low-rated pattern */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span>Low-Rated (1-2 stars)</span>
                  </div>
                  <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm border border-red-200 dark:border-red-800">
                    <p className="font-medium">
                      {criteria.dimensions.length.low_rated_range.min}-
                      {criteria.dimensions.length.low_rated_range.max}{" "}
                      {criteria.dimensions.length.metric}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Median:{" "}
                      {criteria.dimensions.length.low_rated_range.median}{" "}
                      {criteria.dimensions.length.metric}
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample size metrics */}
              <div className="flex gap-4 text-sm text-muted-foreground border-t pt-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">High-rated samples:</span>
                  <span className="text-foreground">
                    {criteria.dimensions.length.sample_size.high}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Low-rated samples:</span>
                  <span className="text-foreground">
                    {criteria.dimensions.length.sample_size.low}
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Repeat for Tone, Structure, Content, Errors */}
        {/* ... (Similar structure) ... */}
      </Accordion>
    </div>
  );
}
```

---

## Revision History

| Version | Date         | Author          | Changes               |
| ------- | ------------ | --------------- | --------------------- |
| 1.0     | Dec 31, 2025 | Product Manager | Initial specification |

---

**Next Steps**: Review with engineering team, validate design decisions, begin Phase 1 implementation.
