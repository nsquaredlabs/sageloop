# Pattern Extraction

> Understand how Sageloop's AI learns from your ratings to find patterns and suggest improvements.

## What Is Pattern Extraction?

Pattern extraction is Sageloop's AI-powered analysis that discovers quality criteria from your ratings.

**How It Works**:

1. You rate 15-30 outputs (1-5 stars + feedback)
2. You click "Run Pattern Extraction"
3. Sageloop's AI analyzes ratings and clusters failures by root cause
4. You get actionable insights and suggested prompt fixes

**Why It's Powerful**: You don't need to articulate quality criteria upfront. The AI learns from your examples.

## When to Extract

**Minimum**: 15 rated outputs
**Ideal**: 20-30 rated outputs
**Sageloop Warning**: If you have fewer than 15 outputs, extraction will show low confidence

### Sample Size Matters

Too few ratings = noise, not signal.

| Ratings       | Confidence  | Action                    |
| ------------- | ----------- | ------------------------- |
| Fewer than 10 | Very Low    | Wait and rate more        |
| 10-14         | Low         | Rate more for reliability |
| 15-29         | Medium-High | Good for extraction       |
| 30+           | High        | Very reliable patterns    |

## How Extraction Works

### Step 1: You Rate Outputs

**Sageloop Sees**:

- 12 outputs rated 5 stars
- 4 outputs rated 4 stars
- 2 outputs rated 3 stars
- 4 outputs rated 1-2 stars
- Your feedback: "Missing timeline", "Too formal", "No apology"

### Step 2: AI Analysis

Sageloop sends all low-rated outputs (≤2 stars) + your feedback to an LLM with this prompt:

> "A PM rated these AI outputs poorly. Find common root causes and suggest specific fixes to the system prompt."

**The AI**:

- Groups failures by root cause (not just symptoms)
- Identifies concrete patterns
- Suggests copy-pasteable prompt improvements

### Step 3: Insights & Recommendations

You get:

1. **Failure clusters** - Groups of low-rated outputs with same root cause
2. **Quality patterns** - Characteristics of 5-star outputs
3. **Success metrics** - Your current success rate and distribution
4. **Suggested fixes** - Copy-pasteable prompt improvements

## Understanding Your Insights

### Failure Clusters

**Example**:

> **Cluster 1: Missing Specific Timeline** (4 outputs, High Confidence)
>
> **Pattern**: All low-rated outputs use vague language like "soon" or "shortly" instead of specific timeframe
>
> **Root Cause**: System prompt doesn't specify the 5-7 business day refund timeline
>
> **Suggested Fix**:
>
> ```
> Add to your system prompt:
> "Always mention that refunds take 5-7 business days to process."
> ```
>
> **Affected Scenarios**:
>
> - Scenario #2: "Where is my refund?"
> - Scenario #5: "How long does a refund take?"
> - Scenario #9: "When will I get my money back?"
> - Scenario #14: "I'm waiting for my refund"
>
> **Severity**: High (4 out of 22 outputs failed)

### Why This Format Matters

- **Concrete**: Not "be more specific"—actual words to add
- **Root Cause**: Identifies WHY failures happened
- **Actionable**: Copy-paste fix available
- **Evidence**: Shows which scenarios failed
- **Severity**: Tells you impact (4/22 = 18%)

### Quality Patterns (5-Star Outputs)

**Example**:

> **5-Star Outputs: Common Characteristics** (12 outputs)
>
> **Length**: 150-250 words
>
> **Structure**: 1. Apology → 2. Explanation → 3. Timeline → 4. Next steps
>
> **Tone**: Empathetic but professional ("I sincerely apologize..." not "Sorry.")
>
> **Key Elements Always Present**:
>
> - Starts with an apology or empathetic statement
> - Mentions "5-7 business days" for timeline
> - Includes link or direction to account dashboard
> - Ends with "Let me know if you need anything else!"

### Success Metrics

> **Current Success Rate**: 73%
>
> **Definition**: Outputs rated 4-5 stars
>
> **Rating Distribution**:
>
> - 5 stars: 12 outputs (55%)
> - 4 stars: 4 outputs (18%)
> - 3 stars: 2 outputs (9%)
> - 2 stars: 3 outputs (14%)
> - 1 star: 1 output (5%)
>
> **Goal**: Improve 1-2 star outputs to 4-5 stars

## How to Use Insights

### Step 1: Review Failure Clusters

**Focus on High Severity First**: Fix clusters affecting the most outputs (4+ failures).

**Ask Yourself**:

- Does the root cause make sense?
- Is the suggested fix accurate?
- Are there other failures I noticed?

> **Tip:** If a fix seems wrong, don't apply it. The AI can make mistakes. Review the extraction rationale and trust your judgment.

### Step 2: Apply Suggested Fixes

**Option A: Manual Copy-Paste**

1. Click "Copy Fix"
2. Go to Project Settings
3. Paste into system prompt
4. Save

**Option B: One-Click Apply & Retest** (Recommended)

1. Click "Apply Fix & Retest"
2. Review before/after prompt diff
3. Edit if needed
4. Click "Update & Retest"
5. Only failed scenarios regenerate (saves time)

### Step 3: Retest & Validate

After applying fix:

- New outputs generated for failed scenarios
- Rate the new outputs
- Check if success rate improved

**Example**:

- **Before**: 4 failures → 73% success rate
- **After**: 1 failure → 91% success rate
- **Result**: "3/4 outputs now pass ✅"

**If Still Failing**: You've found a deeper issue. The prompt needs more fundamental changes.

### Step 4: Iterate

**Typical Flow**:

1. Extract patterns (find 4 failures)
2. Apply fix (improve 3, 1 still fails)
3. Extract again (deeper root cause emerges)
4. Apply second fix (last failure resolved)
5. Success rate: 95%+

**Expect 2-4 Iterations**: Complex behavior takes multiple rounds.

## Confidence Scores

Sageloop shows confidence scores for each pattern.

### High Confidence (90%+)

Pattern appears in 12+ out of 15 samples.

**Example**: "100% of 5-star outputs include an apology"

**Action**: Trust this pattern. It's statistically robust.

### Medium Confidence (70-89%)

Pattern appears in 7-11 out of 15 samples.

**Example**: "8 out of 12 (67%) of 5-star outputs use bullet points"

**Action**: Likely meaningful, but consider adding more scenarios to confirm.

### Low Confidence (below 70%)

Pattern appears in fewer than 7 out of 15 samples.

**Example**: "2 out of 15 outputs mention a phone number"

**Action**: May be noise, not signal. Add more scenarios or ignore.

> **Warning:** Low sample sizes create false patterns. You need 15-30 rated outputs for reliable insights. If confidence is low, Sageloop will show: "Add 5-10 more rated scenarios for more reliable patterns."

## Common Extraction Results

### Result 1: Clear Failure Cluster

**Scenario**: 6 outputs fail for the same reason.

**Extraction**:

> **Cluster: Missing Empathy** (6 outputs)
> **Fix**: Add "Always start responses with an apology or empathetic acknowledgment."

**Action**: Apply fix confidently—pattern is strong.

---

### Result 2: Multiple Small Clusters

**Scenario**: 2 failures for reason A, 2 for reason B, 1 for reason C.

**Extraction**:

> **Cluster 1**: Missing timeline (2 outputs)
> **Cluster 2**: Too formal (2 outputs)
> **Cluster 3**: Incorrect policy (1 output)

**Action**: Fix Cluster 1 and 2 (higher frequency). Cluster 3 might be edge case.

---

### Result 3: No Clear Clusters

**Scenario**: Every failure is unique.

**Extraction**:

> "No strong failure patterns detected. Failures appear unrelated."

**Action**:

- Review individual failures manually
- Your ratings may be inconsistent (re-check)
- Prompt may need fundamental rework, not incremental fix

---

### Result 4: High Variance in 5-Star Outputs

**Scenario**: 5-star outputs are very different from each other.

**Extraction**:

> **Pattern**: 5-star outputs range from 50-400 words, use different tones and structures.
> **Insight**: You may value flexibility—quality isn't one-size-fits-all.

**Action**: This is fine! Not all use cases need rigid criteria.

## Troubleshooting Extraction

### Problem: Patterns Don't Match My Intuition

**Example**: Extraction says "5-star outputs are 200-300 words" but you rated some 100-word outputs as 5-star.

**Possible Causes**:

1. **Inconsistent ratings**: You rated similar outputs differently
2. **Small sample size**: Not enough data for robust pattern
3. **Edge case**: 100-word output was exception (short but perfect)

**Fix**:

- Review ratings for consistency
- Add more scenarios
- Manually adjust extracted criteria if needed

### Problem: No Meaningful Patterns Found

**Example**: "No strong patterns detected."

**Possible Causes**:

1. **Too few ratings**: Need 15-30 minimum
2. **All high ratings**: If everything is 4-5 stars, no failures to cluster
3. **Random failures**: Each failure is unique

**Fix**:

- Add more scenarios and rate them
- If quality is truly high, extraction may not be needed
- Review individual failures manually

### Problem: Suggested Fix Seems Wrong

**Example**: Fix says "Use bullet points" but you don't want bullet points.

**Possible Causes**:

1. **Coincidence**: Some 5-star outputs had bullets, but it's not causal
2. **AI hallucination**: Extraction made incorrect inference

**Fix**:

- Don't blindly apply suggested fixes
- Review extraction rationale
- Manually edit fix before applying

### Problem: Low Confidence Warnings

**Example**: "Confidence: 60% (low sample size)"

**Cause**: Only 10 outputs rated.

**Fix**: Add 5-10 more scenarios and rate them. Re-run extraction.

## Best Practices

- **Rate 15-30 outputs** before extraction (minimum sample size)
- **Provide feedback** on 1-2 star ratings (helps clustering)
- **Review suggested fixes** before applying (don't trust blindly)
- **Expect 2-4 iterations** to reach high quality
- **Check confidence scores** (ignore low-confidence patterns)

Avoid:

- Extracting with fewer than 10 ratings (too small sample)
- Applying fixes without reviewing (AI can hallucinate)
- Expecting perfection in one pass (iteration is normal)
- Trusting low-confidence patterns (need more data)

## Extraction Versioning

Every extraction is saved with a version number.

**Why**: Track how your understanding of quality evolves.

**Example**:

- **Version 1** (Jan 10): "Outputs should be concise (100-150 words)"
- **Version 2** (Jan 15): "Outputs should be detailed (200-300 words)" (You changed your mind after user feedback)

**View History**: Go to Insights → History to see all past extractions.

**Compare Versions**: See how criteria changed over time.

## Next Steps

- [Quick Start](../quickstart.md) - Create your first project
- [Rating Outputs](rating-outputs.md) - Master rating
- [Use Cases](../use-cases/customer-support.md) - See real examples
