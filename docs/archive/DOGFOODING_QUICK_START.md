# Dogfooding Quick Start: 15-Minute Test

**Purpose**: Start testing Sageloop's extraction feature in 15 minutes
**For**: Product team members who want to immediately start dogfooding

---

## TL;DR

Copy the system prompt and scenarios below into Sageloop, generate outputs, rate them, and run extraction. You'll immediately see if extraction finds the "date defaulting" pattern.

---

## Step 1: Create Project (1 minute)

1. Log into Sageloop
2. Create new project
3. **Name**: "Extraction Test - Date Parser"
4. **System Prompt**:
   ```
   Extract event details from the text. Return JSON with event name, date, time, location.
   ```
5. **Model**: GPT-5-nano

---

## Step 2: Add Scenarios (2 minutes)

**Bulk import these 10 scenarios** (copy-paste all at once):

```
Hey team, let's meet tomorrow at 2pm in the blue room
Annual company retreat is scheduled for October 5th, 2025
Can we schedule a quick standup this Friday morning?
Board meeting agenda for November 3, 2025 at 1pm
Emergency all-hands meeting today at 4:30pm
Parent-teacher conference scheduled for April 18, 2025 at 3:15pm
Workshop series every Monday in January 2025 starting at 3pm
Your flight departs LAX on December 15th at 6:45am
Wedding invitation: Sarah & Mike are getting married on June 14, 2025
Dr. Smith's office called - your appointment is next Tuesday at 10:30am
```

---

## Step 3: Generate Outputs (2 minutes)

1. Click "Generate All Outputs"
2. Wait for all 10 to complete (~1-2 minutes)

---

## Step 4: Rate Outputs (5 minutes)

**Rate based on this pattern**:

**5 stars** ⭐⭐⭐⭐⭐ - Outputs with **explicit dates**:

- "October 5th, 2025" → **5 stars**
  - Tag: `accurate`, `complete`
  - Feedback: "Perfect - extracted all details correctly"

**1-2 stars** ⭐⭐ - Outputs with **relative dates that fail** (defaulting to 2022 or missing year):

- "tomorrow at 2pm" → probably returns wrong date → **2 stars**
  - Tag: `wrong_date`, `missing_context`
  - Feedback: "Wrong year - defaulted to 2022 instead of using current date context"

**Expected distribution**: 6 successes (5 stars), 4 failures (1-2 stars)

---

## Step 5: Run Extraction (1 minute)

1. Click "Analyze Patterns" button
2. Wait 5-10 seconds

---

## Step 6: Evaluate Quality (4 minutes)

**Check if extraction found these patterns**:

### ✅ What Good Extraction Should Show:

**Failure Cluster**:

- **Name**: Something like "date_defaulting" or "relative_date_handling"
- **Count**: 4 failures
- **Pattern**: "Relative dates (tomorrow, today, next Tuesday) are defaulting to wrong year or missing context"
- **Root Cause**: "No current date context provided to the model"
- **Suggested Fix**: "Add current date to system prompt: 'Current date: {{current_date}}. When extracting dates, use this as reference for relative terms.'"
- **Example Inputs**: Lists "tomorrow", "Friday", "today", "next Tuesday"
- **Scenario IDs**: [1, 3, 5, 10] (or similar - the 4 failing scenarios)
- **Severity**: "high"

**Success Patterns**:

- "Extracts explicit dates correctly (October 5th, 2025)"
- "Handles time parsing well across different formats"
- "Successfully identifies event names and locations"

**Dimensional Analysis**:

- **Length**: Should show metrics for high-rated vs low-rated
- **Tone**: Should detect professional/neutral tone
- **Structure**: Should note JSON format is consistent
- **Content**: Should recognize that explicit dates work, relative dates fail
- **Errors**: Should categorize the date failures

**Confidence Scores**:

- Should be **moderate** (0.5-0.7 range) since only 10 samples

---

## What to Look For

### 🎯 Signs of Excellent Extraction:

- ✅ Correctly identifies all 4 failures (100% recall)
- ✅ Root cause is accurate ("missing current date context")
- ✅ Suggested fix is copy-pasteable and specific
- ✅ Example inputs are the actual failing scenarios
- ✅ Scenario IDs match the failing outputs
- ✅ Severity is appropriate (high for 40% failure rate)
- ✅ Success patterns are specific, not generic

### ⚠️ Signs of Poor Extraction:

- ❌ Misses the date defaulting pattern entirely
- ❌ Root cause is vague ("improve date handling")
- ❌ Suggested fix is generic ("be more specific about dates")
- ❌ Example inputs don't match actual failures
- ❌ Scenario IDs are wrong or missing
- ❌ Claims high confidence (>0.8) with only 10 samples
- ❌ Success patterns are platitudes ("provide accurate information")

---

## Next Steps

### If Extraction Worked Well ✅

1. Document what made it good
2. Test edge cases (see main DOGFOODING_PLAN.md)
3. Create quality rubric based on findings

### If Extraction Failed ❌

1. Document specific issues (what was missed? what was wrong?)
2. Hypothesize why it failed (prompt too complex? not enough data? model limitations?)
3. Propose improvements to extraction system prompt
4. Re-run test after fixes

---

## Full Documentation

For comprehensive testing including edge cases and quality rubrics, see:
**`/docs/product/DOGFOODING_PLAN.md`**

This includes:

- The complete extraction system prompt (copy-pasteable)
- 4 happy path scenario sets
- 10 edge case scenario sets
- Quality evaluation rubric (5-star system)
- Success criteria and metrics
- Common pitfalls to watch for
- Expected learnings and next steps

---

**Time to complete**: 15 minutes
**Expected outcome**: Clear answer to "Does extraction find the date defaulting pattern?"
