# Testing Guide - New Features

## Quick Test Workflow

### Prerequisites

1. `npm run dev` - Start development server
2. `npx supabase start` - Local Supabase running
3. Create an account and login

---

## Test 1: Failure Clustering (15 minutes)

### Setup

1. Create a new project (e.g., "Date Parser Test")
2. Set system prompt: "Extract event details from the text. Return JSON with event name, date, time, location."
3. Add 10 scenarios using the event parser examples:
   ```
   - "Hey team, let's meet tomorrow at 2pm in the blue room"
   - "Annual company retreat is scheduled for October 5th, 2025"
   - "Can we schedule a quick standup this Friday morning?"
   - "Board meeting agenda for November 3, 2025 at 1pm"
   - "Emergency all-hands meeting today at 4:30pm"
   - "Parent-teacher conference scheduled for April 18, 2025 at 3:15pm"
   - "Workshop series every Monday in January 2025 starting at 3pm"
   - "Your flight departs LAX on December 15th at 6:45am"
   - "Wedding invitation: Sarah & Mike are getting married on June 14, 2025"
   - "Dr. Smith's office called - your appointment is next Tuesday at 10:30am"
   ```

### Generate & Rate

1. Click "Generate All Outputs"
2. Rate outputs:
   - Give 1-2 stars to any that default to year 2022 or wrong years
   - Give 4-5 stars to ones that get dates correct
   - Add feedback: "Wrong year - defaulted to 2022" for failures

### Run Analysis

1. Go to Insights page
2. Click "Analyze Patterns"
3. **Expected Result**: Should see Failure Analysis section showing:
   - Cluster named something like "year_defaulting" or "date_inference"
   - Root cause: "No current date context"
   - Suggested fix: "Add current date to system prompt"
   - List of scenario IDs that failed

---

## Test 2: Apply Fix & Retest (10 minutes)

### Continue from Test 1

1. On Insights page, find the failure cluster
2. Click "Apply Fix & Retest" button
3. **Expected**: Dialog opens showing:
   - Current prompt in left panel
   - Updated prompt in right panel (with suggested fix appended)
   - Improvement note pre-filled
   - Warning about updating project

4. Click "Show Before/After" to see diff
5. Optionally edit the prompt further
6. Click "Update Prompt & Retest"

### Verify Results

1. **Expected**: Alert shows "Retest complete! Version 2, X scenarios regenerated"
2. Go to Outputs page
3. **Expected**: See new outputs for the failed scenarios only
4. Rate the new outputs
5. **Expected**: Should see improvement (more get dates right now)

---

## Test 3: Version History (5 minutes)

### Create Multiple Iterations

1. After first retest, go back to Insights
2. Run "Analyze Patterns" again on newly rated outputs
3. If still failures, apply another fix
4. Repeat 2-3 times

### Check Version History

**Future Feature** (API endpoint exists but UI not built yet):

```bash
curl http://localhost:3000/api/projects/{PROJECT_ID}/versions
```

**Expected Response**:

```json
{
  "current_version": 3,
  "versions": [
    {
      "version": 3,
      "system_prompt": "...",
      "improvement_note": "Fixed date parsing",
      "success_rate_before": 0.4,
      "success_rate_after": 0.8,
      "is_current": true
    },
    {
      "version": 2,
      "improvement_note": "Added current date context",
      ...
    }
  ]
}
```

---

## Test 4: Export Quality (5 minutes)

### After Pattern Extraction

1. Go to Insights page
2. Click "Export JSON"

### Verify Export Structure

**Should INCLUDE**:

- ✅ `model_config` with system_prompt
- ✅ `golden_examples` with input/output/rating/feedback
- ✅ `negative_examples` with why_failed and suggested_fix
- ✅ `failure_analysis` with clusters

**Should NOT include** (removed fluff):

- ❌ `quality_criteria` section
- ❌ `test_cases` section
- ❌ `implementation_recommendations` section

### Check Negative Examples

Each negative example should have:

```json
{
  "input": "...",
  "output": "...",
  "rating": 1,
  "why_failed": "Wrong year - defaulted to 2022",
  "suggested_fix": "Add 'Current date: {{current_date}}' to system prompt",
  "failure_cluster": "year_defaulting"
}
```

---

## Test 5: Markdown Export (5 minutes)

1. Click "Export Spec" button
2. Open downloaded `.md` file

### Verify Markdown Structure

**Should see**:

1. Model Configuration section
2. **NEW: Failure Analysis section** with:
   - Total failures count
   - Each cluster showing:
     - Name and count
     - Pattern description
     - Root cause
     - Suggested fix in code block
     - Example inputs that failed
3. Golden Examples (5 star outputs)
4. What to Avoid (negative examples with suggested fixes)

**Should NOT see**:

- Quality Criteria section (removed)
- Implementation Recommendations section (removed)

---

## Edge Cases to Test

### No Failures

1. Create project where all outputs get 4-5 stars
2. Run analysis
3. **Expected**: No failure analysis section shows
4. Export should still work, just no negative_examples

### No Analysis Yet

1. Create project but don't run analysis
2. Try to export
3. **Expected**: Error "No extraction found. Please analyze patterns first."

### Retest with No Failed Scenarios

1. Try to call retest endpoint with empty scenarioIds array
2. **Expected**: Error "scenarioIds array is required"

### Invalid Scenario IDs

1. Try to retest with scenario IDs from different project
2. **Expected**: Should filter out (scenarios query has project_id filter)

---

## Success Criteria

✅ **Task 1 Complete** if:

- Export JSON has no quality_criteria, test_cases, or recommendations
- Export is focused on golden examples and failure analysis

✅ **Task 2 Complete** if:

- Pattern extraction creates failure_analysis with clusters
- Each cluster has concrete suggested_fix
- Negative examples are matched to clusters

✅ **Task 3 Complete** if:

- Apply Fix button appears on failure clusters
- Can update prompt and retest specific scenarios
- New version is saved with prompt history
- Only failed scenarios are regenerated (not all)

---

## Known Limitations / Future Work

1. **Version History UI**: API exists but no UI page yet
2. **Success Rate Tracking**: `success_rate_after` is calculated but not shown in UI
3. **Prompt Diff Visualization**: Basic side-by-side, could be enhanced
4. **Auto-rating**: Not implemented (intentionally - needs confidence threshold)
5. **Scenario IDs**: LLM needs to correctly extract scenario_ids into clusters

---

## Troubleshooting

### "No ratings found since last extraction"

- This is expected behavior (incremental analysis)
- Rate some new outputs before running analysis again

### Failure clusters have no scenario_ids

- LLM may not always extract IDs correctly
- Fallback: clusters still show example_inputs
- Can manually identify scenarios from inputs

### Apply Fix button doesn't work

- Check browser console for errors
- Verify API endpoint `/api/projects/[id]/retest` exists
- Check OpenAI API key is set

### Build errors

- Run `npx supabase db reset` to apply migrations
- Run `npx supabase gen types typescript --local > types/supabase.ts`
- Run `npm run build` to verify

---

## Performance Notes

- Pattern extraction: ~3-5 seconds (GPT-4-turbo call)
- Retest 5 scenarios: ~10-15 seconds (5 GPT calls)
- Export generation: <1 second (just database queries)

---

**Happy Testing!** 🚀
