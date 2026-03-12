# Sageloop Product Roadmap: Strengthening Differentiation

**Last Updated**: December 18, 2025
**Purpose**: Feature prioritization focused on unique competitive advantages
**Timeframe**: Q1-Q4 2026

## Strategic Focus

Based on our competitive analysis (see [`PROMPTLAYER_ANALYSIS.md`](../PROMPTLAYER_ANALYSIS.md)), our roadmap prioritizes features that **strengthen our differentiated position** as a behavioral design tool for the discovery phase, rather than features that move us toward becoming a prompt management or production monitoring platform.

### Core Principle

**We win by being the best at helping PMs discover and define quality criteria, not by competing with deployment tools.**

### What We Build vs. What We Integrate

**Build** (our competitive moat):

- ✅ Pattern discovery from ratings
- ✅ Batch visual evaluation UX
- ✅ PM-friendly interfaces (no code)
- ✅ Behavioral spec generation
- ✅ Example-driven quality definition

**Integrate** (partner with specialists):

- 🔌 Prompt version control (PromptLayer, Humanloop)
- 🔌 Production monitoring (PromptLayer, LangSmith)
- 🔌 Automated testing frameworks (pytest, Jest)
- 🔌 CI/CD pipelines (GitHub Actions, etc.)

## Feature Categories

### Category 1: Discovery & Pattern Recognition (Core Moat)

These features strengthen our unique value proposition: helping PMs discover quality criteria through examples.

### Category 2: PM Workflow Optimization (Differentiation)

These features make Sageloop faster and more intuitive for non-technical users than any alternative.

### Category 3: Spec Generation & Export (Strategic)

These features create the bridge between discovery (our strength) and deployment (partners' strength).

### Category 4: Collaboration & Sharing (Growth)

These features expand usage within teams while maintaining PM-first design.

---

## Q1 2026: Double Down on Discovery

**Theme**: Make pattern discovery so good that it becomes the industry standard for behavioral spec creation.

### Milestone: Advanced Pattern Extraction

**Why This Matters**: Our inductive approach (learn criteria from examples) is our competitive moat versus deductive tools (test against predefined criteria).

#### Features

**1.1 Multi-Dimensional Pattern Analysis** (Priority: P0)

- **What**: Extract patterns across 5+ dimensions automatically
  - Length (character count, sentence count, paragraph count)
  - Tone (formal/casual, technical/accessible)
  - Structure (lists, headers, examples, code blocks)
  - Content elements (citations, specificity, disclaimers)
  - Error patterns (hallucinations, refusals, formatting issues)
- **Why**: Competitors require manual test definition. We discover criteria automatically.
- **Success Metric**: Extract 5+ meaningful patterns from 20 rated outputs (80% of projects)
- **Effort**: 3 weeks (2 eng)

**1.2 Comparative Pattern Visualization** (Priority: P0)

- **What**: Visual diff showing 5-star vs 1-star patterns
  - "5-star outputs: 200-300 words, 3-4 paragraphs, always include example"
  - "1-star outputs: <100 words OR >500 words, no examples"
- **Why**: Makes patterns instantly obvious without reading AI analysis
- **Success Metric**: PMs identify key quality difference in <30 seconds (90% of users)
- **Effort**: 2 weeks (1 eng)

**1.3 Confidence Scores & Sample Size Guidance** (Priority: P1)

- **What**: Show confidence in each extracted pattern
  - "High confidence (12/15 samples): Include current date"
  - "Low confidence (2/15 samples): Use bullet points"
  - Suggest optimal sample size for robust patterns
- **Why**: Builds trust in inductive approach; educates PMs on statistical validity
- **Success Metric**: 70% of PMs add more scenarios when confidence is low
- **Effort**: 1 week (1 eng)

**1.4 Exception Analysis** (Priority: P1)

- **What**: Highlight outputs that break the pattern
  - "3 outputs rated 5-star but don't include examples—what's different?"
  - Surface edge cases that might need different criteria
- **Why**: Helps PMs refine their mental model of quality; catches nuance
- **Success Metric**: 50% of PMs update ratings or scenarios based on exceptions
- **Effort**: 2 weeks (1 eng)

**Total Q1 Effort**: 8 weeks (overlapping work)

---

## Q2 2026: PM Workflow Velocity

**Theme**: Make Sageloop 10x faster than spreadsheets or Google Docs for eval workflows.

### Milestone: Rapid Evaluation UX

**Why This Matters**: Speed is our advantage over manual testing. We need to maximize throughput for PM judgment.

#### Features

**2.1 Scenario Templates** (Priority: P1)

- **What**:
  - ✅ **Already Shipped**: Bulk import from CSV, Google Sheets, plain text
  - 🚧 **To Build**: Pre-built scenario templates for common use cases
    - Customer support (30 common support questions)
    - Content generation (blog, social, email)
    - Code assistance (debugging, explanation, generation)
  - Auto-detect and deduplicate similar scenarios on import
- **Why**: Reduces setup time from 30 minutes to 30 seconds
- **Success Metric**: 40% of new projects use templates; avg setup time <1 minute
- **Effort**: 1.5 weeks (1 eng)

**2.2 Smart Rating Suggestions** (Priority: P1)

- **What**:
  - "This output is similar to one you rated 4-star. Same rating?"
  - Carry forward ratings for identical/nearly-identical outputs during retest
  - Highlight changed outputs so PMs focus attention
- **Why**: Reduces rating time for large eval sets; prevents inconsistency
- **Success Metric**: 40% of ratings accepted as suggestions; 50% time savings
- **Effort**: 2 weeks (1 eng)

**2.3 Enhanced Keyboard Shortcuts** (Priority: P1)

- **What**:
  - ✅ **Already Shipped**: `1-5` keys for star rating, up/down arrows for navigation
  - 🚧 **To Build**: Additional power user shortcuts
    - `J/K` for next/previous output (Vim-style)
    - `F` to add feedback (quick modal)
    - `T` to add tag
    - `R` to retest failed output
    - `Shift+Enter` to rate and advance
- **Why**: Target 30 outputs rated in <5 minutes (currently ~10 minutes)
- **Success Metric**: Power users rate 6+ outputs/minute (vs 3/minute baseline)
- **Effort**: 1 week (1 eng)

**2.4 Comparative Rating Mode** (Priority: P2)

- **What**: Side-by-side comparison for similar outputs
  - "These 3 outputs all answer 'What is AI?' differently. Rank them."
  - Relative rating (A > B > C) instead of absolute (3 stars, 4 stars, 5 stars)
- **Why**: Easier to judge relative quality than absolute; surfaces subtle differences
- **Success Metric**: 30% of PMs use comparative mode at least once
- **Effort**: 2 weeks (1 eng)

**2.5 Tagging Autocomplete & Custom Tags** (Priority: P1)

- **What**:
  - Learn common tags from past ratings ("too formal", "missing context")
  - Autocomplete as PM types
  - Project-specific tag libraries
- **Why**: Faster tagging → more structured feedback → better pattern extraction
- **Success Metric**: 70% of tags are autocompleted; avg tags/output increases 2x
- **Effort**: 1 week (1 eng)

**Total Q2 Effort**: 8.5 weeks (overlapping work)

---

## Q3 2026: Spec Generation & Export

**Theme**: Create the perfect handoff artifact from PM (discovery) to engineering (implementation).

### Milestone: Production-Ready Test Suites

**Why This Matters**: Our export is the bridge to deployment tools (PromptLayer, CI/CD). Best-in-class export = natural integration point.

#### Features

**3.1 Golden Example Library** (Priority: P0)

- **What**:
  - Automatic "golden examples" collection (all 5-star rated outputs)
  - Organize by scenario category/tag
  - Rich export formats:
    - **Markdown**: Clean format with scenario → output → feedback structure
    - **JSON**: Structured data for programmatic use
    - **Inline code comments**: Copy-paste into test files with explanations
  - Include PM feedback/rationale with each example ("Why is this 5-star?")
  - Filter by tags, date range, or specific scenarios
- **Why**: Engineers need concrete examples, not abstract criteria. This is the Figma → dev handoff equivalent.
- **Success Metric**: 80% of projects export golden examples; engineers report usefulness >4/5 (survey)
- **Effort**: 2 weeks (1 eng)

**3.2 Multi-Format Test Suite Export** (Priority: P0)

- **What**: Export test suites to common frameworks
  - **Python**: pytest format with fixtures and golden examples as assertions
  - **JavaScript**: Jest/Vitest format with test cases
  - **JSON**: Generic schema for custom frameworks
  - **Markdown**: Human-readable test scenarios + expected patterns
- **Why**: Reduces friction to CI/CD integration; works with existing eng workflows
- **Success Metric**: 50% of exports are pytest/Jest (actively used in CI/CD)
- **Effort**: 2 weeks (1 eng)

**3.3 Versioned Exports & Changelog** (Priority: P2)

- **What**:
  - Track changes to extracted criteria and golden examples over time
  - "Version 1 (Jan 15): 12 golden examples, avg 250 words"
  - "Version 2 (Jan 22): 18 golden examples, avg 300 words (relaxed length)"
  - Export includes changelog showing evolution
  - Compare versions side-by-side
- **Why**: Documents evolution of PM understanding; explains why standards changed
- **Success Metric**: Projects with 3+ versions show 30% fewer post-launch revisions (survey)
- **Effort**: 2 weeks (1 eng)

**3.4 Integration APIs (PromptLayer, Humanloop)** (Priority: P2)

- **What**:
  - Export directly to PromptLayer as regression test suite
  - Export to Humanloop as evaluation dataset
  - One-click "Send to [Tool]" button
- **Why**: Seamless workflow from Sageloop (discovery) to deployment tools (production)
- **Success Metric**: 20% of exports go directly to integration partner
- **Effort**: 3 weeks (1 eng) + partnership setup

**Total Q3 Effort**: 9 weeks (overlapping work)

- **Note**: Removed "Behavioral Spec Document Generator" (engineers prefer golden examples)

---

## Q4 2026: Collaboration & Scale

**Theme**: Enable team workflows while keeping PM as primary user.

### Milestone: Team Discovery Workflows

**Why This Matters**: Expansion within companies; maintain PM-first UX while adding multiplayer value.

#### Features

**4.1 Collaborative Rating (Async)** (Priority: P1)

- **What**:
  - Multiple PMs can rate the same outputs independently
  - Show rating distribution: "Alice: 5-star, Bob: 3-star → Discuss"
  - Highlight disagreements for team discussion
- **Why**: Aligns team on quality definition; surfaces hidden assumptions
- **Success Metric**: 30% of projects have multi-rater collaboration; disagreement rate <20%
- **Effort**: 3 weeks (2 eng)

**4.2 PM → Engineer Handoff Flow** (Priority: P1)

- **What**:
  - PM creates spec → Shares read-only link with engineer
  - Engineer can comment on scenarios, ask clarifying questions
  - PM can "lock" criteria when finalized
  - Notification when eng marks implementation complete
- **Why**: Formalizes discovery → implementation handoff; reduces misalignment
- **Success Metric**: 50% of projects use handoff flow; post-launch revision rate drops 30%
- **Effort**: 2 weeks (1 eng)

**4.3 Team Templates & Pattern Library** (Priority: P2)

- **What**:
  - Company-wide pattern library: "Our customer support tone standards"
  - Reusable scenario sets for common use cases
  - Team-level golden example repository
- **Why**: Scales quality standards across org; new PMs learn faster
- **Success Metric**: 40% of teams with 3+ users create shared templates
- **Effort**: 2 weeks (1 eng)

**4.4 Usage Analytics for PMs** (Priority: P2)

- **What**:
  - "You've rated 240 outputs across 8 projects"
  - "Your average rating: 3.2 stars (you're tough!)"
  - "Top tag: 'too formal' (used 45 times)"
  - Help PMs understand their own quality patterns
- **Why**: Self-awareness improves rating consistency; gamification engagement
- **Success Metric**: 60% of PMs view their analytics; rating consistency improves 15%
- **Effort**: 1.5 weeks (1 eng)

**Total Q4 Effort**: 8.5 weeks (overlapping work)

---

## Feature Prioritization Framework

When evaluating new features, score against these criteria:

| Criterion              | Weight | Question                                                  |
| ---------------------- | ------ | --------------------------------------------------------- |
| **Differentiation**    | 40%    | Does this strengthen our unique position vs. competitors? |
| **PM-First**           | 25%    | Can non-technical PMs use this without help?              |
| **Discovery Focus**    | 20%    | Does this help define quality, not just test against it?  |
| **Integration Bridge** | 10%    | Does this create value for deployment tool users?         |
| **Team Expansion**     | 5%     | Does this drive usage across teams?                       |

**Scoring**:

- **P0 (Must Have)**: Total score >80, Differentiation >35
- **P1 (Should Have)**: Total score >60, Differentiation >25
- **P2 (Nice to Have)**: Total score >40
- **P3 (Defer)**: Total score <40

---

## What We're NOT Building

To maintain focus, we explicitly choose NOT to build these features (partner or integrate instead):

### Behavioral Spec Documents (Auto-Generated Prose)

- **Why Not**: Engineers don't read specs; they want golden examples + extracted criteria
- **Our Approach**: Focus on Golden Example Library with inline explanations
- **Rationale**: "Show, don't tell" - concrete examples > abstract documentation

### Prompt Version Control

- **Why Not**: PromptLayer, Humanloop do this excellently
- **Our Approach**: Export to their tools via API

### Production Monitoring

- **Why Not**: Requires infrastructure we don't have; not PM-focused
- **Our Approach**: Partners handle observability; we define criteria

### Automated Testing Execution

- **Why Not**: CI/CD tools (GitHub Actions, pytest) already solve this
- **Our Approach**: Export test suites they can run

### Fine-Tuning & Model Training

- **Why Not**: Completely different user (ML engineer) and workflow
- **Our Approach**: Stay focused on prompt-based AI products

### Real-Time Collaborative Editing

- **Why Not**: Complexity vs. value; async collaboration is enough
- **Our Approach**: Async workflows with notifications

### Custom Evaluation Metrics

- **Why Not**: Moves us toward "deductive" (define-then-test) model
- **Our Approach**: Let PM ratings drive discovery, not predefined metrics

---

## Success Metrics by Quarter

### Q1 2026: Discovery Excellence

- **Pattern Quality**: 80% of projects extract 5+ meaningful patterns
- **PM Confidence**: 75% of PMs say criteria match their mental model (survey)
- **Adoption**: 40% of PMs use advanced extraction features

### Q2 2026: Workflow Speed

- **Time to Rate**: Avg time to rate 30 outputs drops from 10 min to 5 min
- **Bulk Adoption**: 60% of new projects use bulk import
- **Power Users**: 30% of PMs use keyboard shortcuts regularly

### Q3 2026: Integration Success

- **Export Usage**: 70% of projects export test suites
- **Engineer Satisfaction**: 80% of engineers say spec is clear (survey)
- **CI/CD Integration**: 30% of exports are actively used in automated testing

### Q4 2026: Team Growth

- **Multi-User Projects**: 40% of projects have 2+ collaborators
- **Template Usage**: 50% of teams create shared templates
- **NPS by Persona**: PM NPS >60, Engineer NPS >50

---

## Investment Allocation

### Engineering Time Distribution (2026)

| Category                  | % Time | Rationale               |
| ------------------------- | ------ | ----------------------- |
| Discovery & Patterns (Q1) | 30%    | Core competitive moat   |
| PM Workflow (Q2)          | 25%    | Speed = differentiation |
| Export & Integration (Q3) | 25%    | Bridge to deployment    |
| Collaboration (Q4)        | 15%    | Team expansion          |
| Maintenance & Debt        | 5%     | Keep quality high       |

### Design Time Distribution

| Category              | % Time | Rationale                      |
| --------------------- | ------ | ------------------------------ |
| PM UX Research        | 40%    | Ensure non-technical usability |
| Pattern Visualization | 30%    | Make insights obvious          |
| Export Templates      | 20%    | Eng handoff quality            |
| Marketing Assets      | 10%    | Support go-to-market           |

---

## Partnership Roadmap

### Q1 2026: PromptLayer Integration

- **Goal**: "Use Sageloop for discovery, PromptLayer for deployment"
- **Deliverables**:
  - Export to PromptLayer API (one-click)
  - Co-marketing content ("Better together")
  - Joint webinar on discovery → deployment workflow

### Q2 2026: Humanloop Integration

- **Goal**: Expand integration ecosystem
- **Deliverables**:
  - Export to Humanloop evaluation datasets
  - Case study with shared customer

### Q3 2026: CI/CD Framework Guides

- **Goal**: Make Sageloop → CI/CD workflow dead simple
- **Deliverables**:
  - Pytest integration guide + templates
  - Jest integration guide + templates
  - GitHub Actions workflow examples

### Q4 2026: LLM Provider Partnerships

- **Goal**: Position as neutral platform for all providers
- **Deliverables**:
  - OpenAI case study
  - Anthropic case study
  - Multi-provider comparison tool

---

## Risk Mitigation

### Risk: Competitors Add "Discovery" Features

**Likelihood**: Medium
**Impact**: High
**Mitigation**:

- Move fast on Q1 pattern extraction (build moat)
- Focus on PM UX simplicity (hard to copy)
- Build integration partnerships (ecosystem lock-in)

### Risk: PMs Don't Export to CI/CD

**Likelihood**: Medium
**Impact**: Medium
**Mitigation**:

- Invest heavily in Q3 export UX
- Create eng-facing documentation
- Showcase CI/CD success stories

### Risk: Manual Rating Doesn't Scale

**Likelihood**: Low
**Impact**: High
**Mitigation**:

- Bulk import reduces setup time
- Smart suggestions reduce rating time
- Focus on "small batch is enough" (20 scenarios)

### Risk: Team Features Dilute PM Focus

**Likelihood**: Medium
**Impact**: Medium
**Mitigation**:

- Keep PM as primary user in all designs
- Async-first collaboration (no complex multiplayer)
- Defer enterprise features until PM workflow is perfect

---

## Roadmap Principles

1. **Discovery First**: Every feature must support "figuring out what good means"
2. **PM-Centric**: If it requires coding or technical setup, we're doing it wrong
3. **Integration Over Duplication**: Partner for production; own discovery
4. **Speed Wins**: Faster than spreadsheets or we fail
5. **Visual Patterns**: Show, don't tell—make insights obvious

---

## Appendix: Rejected Features (and Why)

**Live Prompt Testing**:

- Why rejected: Moves us toward PromptLayer's territory
- Alternative: Link to ChatGPT/PromptLayer for live testing

**Automated Grading**:

- Why rejected: Replaces PM judgment (our core value)
- Alternative: Smart suggestions, not automated decisions

**Multi-Model A/B Testing**:

- Why rejected: Production feature, not discovery
- Alternative: Export scenarios for A/B testing elsewhere

**Custom Evaluation Code**:

- Why rejected: Requires coding; breaks PM-first principle
- Alternative: Tag-based filtering + pattern extraction

**Real-Time Metrics Dashboard**:

- Why rejected: Monitoring is for production; we're pre-production
- Alternative: Point-in-time success metrics post-extraction

---

**Questions or Feedback**: Contact product team or submit issues to [project repository]
