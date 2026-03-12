# Frequently Asked Questions

> Quick answers to common questions about Sageloop.

## Getting Started

### How long does it take to get started?

**15 minutes** from installation to first insights.

You can:

1. Create a project (2 min)
2. Add scenarios (3 min)
3. Generate outputs (2 min)
4. Rate outputs (5 min)
5. Extract patterns (2 min)

### Do I need to know how to code?

**No.** Sageloop is designed for Product Managers. You rate outputs based on your intuition.

No coding, no technical knowledge required to use the evaluation interface.

### How many scenarios do I need?

**Start with 15-30.** This is enough to spot patterns without overwhelming yourself.

If testing narrow behavior (date parsing), 10-15 is okay.
If testing complex behavior, 30-50 is ideal.

---

## Rating & Feedback

### How do I rate outputs?

Use the 5-star scale:

- **5 stars**: Perfect
- **4 stars**: Good
- **3 stars**: Okay
- **2 stars**: Problem
- **1 star**: Unacceptable

Trust your gut. Rate quickly.

### Do I need to add feedback for every output?

**Only for 1-2 star ratings.** Feedback helps pattern extraction understand root causes.

For 5-star outputs, feedback is optional.

### What if I rate something wrong?

You can edit your rating anytime. Click the pencil icon and change your rating.

### What keyboard shortcuts are available?

**Rating**:

- `1` through `5` - Set star rating

**Navigation**:

- `↓` or `J` - Next output
- `↑` or `K` - Previous output
- `F` - Add feedback (opens modal)
- `T` - Add tag
- `Shift + Enter` - Save and advance to next

**Pro workflow**: Press a number to rate, then `F` to add feedback, then `Shift + Enter` to advance. Rate 30 outputs in about 5 minutes.

---

## Pattern Extraction

### What's the minimum for extraction?

**15 rated outputs.** You'll get a low-confidence warning with fewer than 15 outputs.

### Why are my patterns low confidence?

**Not enough data.** Add 5-10 more scenarios and rate them. Re-run extraction.

Low confidence means patterns might be noise, not signal.

### What if no patterns are found?

**Possible causes**:

1. All your ratings are 4-5 stars (no failures to cluster)
2. Each failure is unique (no common root cause)
3. Too few ratings (fewer than 15)

**Fix**: Add more scenarios, rate them, and try again.

### Can I trust suggested fixes?

**Usually yes, but verify first.** Review the extraction reasoning before applying fixes.

The AI can hallucinate. Trust your judgment.

---

## Scenarios

### Can I edit scenarios?

Yes. Click the pencil icon and update the text.

### What if I delete a scenario?

Its outputs and ratings are also deleted.

Be careful. Deleted scenarios can't be recovered.

### Can I import scenarios?

**Yes, three ways**:

1. One at a time (click "Add Scenario")
2. Bulk add (paste multiple, one per line)
3. Import CSV (with `scenario_text` column)

### How do I organize 100+ scenarios?

**Start with 15-30.** Test them, get insights, iterate.

Only add more scenarios when you identify new gaps.

---

## Generation & Models

### Can I regenerate specific scenarios?

Yes. Select scenarios you want, click "Regenerate Selected".

Only those regenerate (saves time).

### How long does generation take?

**30-60 seconds** for 20 scenarios.

Depends on model and API load.

### Where do I configure API keys?

API keys are configured in `sageloop.config.yaml` in your local instance directory.

---

## Export

### What can I export?

1. **Golden Examples**: All 5-star outputs (Markdown or JSON)
2. **Test Suite**: Pytest format for CI/CD
3. **Insights**: Extracted patterns and recommendations

### Can I use exports in CI/CD?

Yes. Export as pytest and integrate with your CI pipeline.

Engineers run exported tests to prevent regressions.

### What format is best for sharing?

**For non-technical people**: PDF or Markdown
**For engineers**: JSON or pytest
**For stakeholders**: Summary document + key metrics

---

## Privacy & Data

### Is my data private?

Yes. All data stays in your local instance. Nothing is sent to external servers except the AI model API calls you configure.

### Can I delete a project?

Yes, in project settings. Deletion is permanent.

---

## Troubleshooting

### Generation is failing

Wait a few minutes and retry. Check that:

- You have scenarios added
- Your API keys are correctly configured in `sageloop.config.yaml`
- The selected model is available

### Extraction is showing wrong patterns

Patterns might not be accurate if:

1. Ratings are inconsistent
2. Sample size is too small
3. Each failure is unique

Add more scenarios or review your ratings for consistency.

### My success rate isn't improving after fixes

The fix might not address the root cause.

Try:

1. Making larger prompt changes
2. Being more specific in instructions
3. Adding examples to system prompt

---

## Getting Help

### Where's the documentation?

Full user documentation lives in `sageloop/docs/user/`. Check the guides for topic-specific help:

- [Core Concepts](core-concepts.md)
- [Creating Scenarios](guide/creating-scenarios.md)
- [Generating Outputs](guide/generating-outputs.md)
- [Rating Outputs](guide/rating-outputs.md)
- [Pattern Extraction](guide/pattern-extraction.md)
- [Common Workflows](common-workflows.md)

### How do I report a bug?

Open an issue on the GitHub repository with screenshots and details.
