# Rating Outputs

> Learn how to rate AI outputs effectively. Your ratings teach Sageloop what quality means to you.

## Why Rating Matters

**Better ratings → Better pattern extraction → Better prompt fixes → Higher quality AI**

Your ratings are the foundation of Sageloop's insights. Garbage in, garbage out.

## The 5-Star Scale

### 5 Stars: Perfect

**Definition**: Exactly what I want in production. Zero changes needed.

**Criteria**:

- Accurate information
- Appropriate tone
- Correct length
- Proper formatting
- Handles edge case well

**Example** (Support Bot):

> "I sincerely apologize for the delay with your order. Refunds typically take 5-7 business days to process. You can track the status in your account dashboard. Let me know if you have any other questions!"

**Why 5-star**: Empathetic, specific timeline, actionable next step.

### 4 Stars: Good, Minor Issues

**Definition**: I'd ship this, but small improvements would help.

**Typical Issues**:

- Slightly too long/short
- Could be friendlier/more professional
- Missing one small detail
- Minor formatting preference

**Example**:

> "Apologies for the delay. Refunds take 5-7 days. Check your dashboard for status."

**Why 4-star**: Correct info, but a bit terse. Could be warmer.

### 3 Stars: Acceptable but Needs Improvement

**Definition**: Not ideal, but not broken. Wouldn't ship without changes.

**Typical Issues**:

- Missing important information
- Tone is off (too formal or too casual)
- Awkward phrasing
- Could cause confusion

**Example**:

> "Your refund is being processed. It will arrive soon."

**Why 3-star**: Vague timeline ("soon"), missing empathy, no next steps.

### 2 Stars: Problematic, Major Issues

**Definition**: Multiple serious problems. Needs significant rework.

**Typical Issues**:

- Incorrect information
- Inappropriate tone
- Unprofessional language
- Confusing structure
- Missing critical details

**Example**:

> "Refunds are handled by the finance department according to internal processing schedules."

**Why 2-star**: Too corporate, no timeline, mentions internal processes (user doesn't care).

### 1 Star: Unacceptable, Completely Wrong

**Definition**: This would damage our brand. Never ship this.

**Typical Issues**:

- Factually incorrect
- Rude or offensive
- Completely misunderstands request
- Security/privacy violation
- Nonsensical

**Example**:

> "I don't know. Ask someone else."

**Why 1-star**: Unhelpful, unprofessional, dismissive.

## Adding Feedback (Critical for 1-2 Stars)

**Rule**: Always explain WHY you gave 1-2 stars.

### Examples of Good Feedback

- Bad: "This is wrong"
- Good: "Missing specific refund timeline (should say 5-7 days)"

- Bad: "Tone is off"
- Good: "Too formal and corporate—should be friendly and empathetic like the other good ones"

- Bad: "Not good"
- Good: "Jumps straight to solution without apologizing first; low ratings all skip apology"

### Feedback Categories

**Length Issues**:

- "Too long—should be 2-3 sentences max"
- "Too brief—needs more context and explanation"

**Tone Issues**:

- "Too formal—users expect casual, friendly language"
- "Too casual—this is financial transaction, be professional"
- "Sounds robotic, not human"

**Accuracy Issues**:

- "Wrong refund timeline (it's 5-7 days, not 3-5)"
- "Mentions features we don't have"
- "Outdated policy"

**Missing Information**:

- "Should mention they can track status in dashboard"
- "Doesn't apologize first (empathy is critical)"
- "No clear next steps"

**Formatting Issues**:

- "Should use bullet points for steps"
- "Needs line breaks between paragraphs"
- "Needs a clear call-to-action at the end"

> **Tip:** Be specific. "Missing empathy" is okay, but "Doesn't start with apology like all the 5-star ones" is better because it points Sageloop to the exact pattern.

## Rating Best Practices

### 1. Rate Consistently

**Scenario**: Two outputs are nearly identical.

- Inconsistent: Rate one 5-star, one 3-star
- Consistent: Rate both 5-star (or both 3-star)

**Why**: Inconsistent ratings confuse pattern extraction.

**Tip**: If unsure, compare to previous ratings. "Is this better or worse than the last 4-star I gave?"

### 2. Rate Honestly

**Temptation**: "I want 80% success rate, so I'll inflate scores."

- Don't: Give 4-star to a 2-star output
- Do: Rate truthfully; let metrics reflect reality

**Why**: Honest ratings reveal true quality gaps. Inflated ratings hide problems you need to fix.

### 3. Provide Context in Feedback

- Vague: "This is bad"
- Specific: "Too corporate—users expect friendly, casual tone like 'Hey there!' not 'Dear Customer'"

**Include Examples**: Show what "good" looks like in your feedback.

### 4. Rate the Output, Not the Scenario

**Bad Scenario**: "asdfghjkl"
**AI Output**: "I'm sorry, I didn't understand that. Could you clarify?"

**Temptation**: Rate 1-star because scenario is garbage.

**Correct**: Rate 5-star—AI handled nonsensical input gracefully!

**Principle**: Rate how well the AI responded, not the scenario quality.

### 5. Don't Overthink It

**Trust Your Gut**: If it feels wrong, it's 1-2 stars. If it feels great, it's 5 stars.

**Avoid Analysis Paralysis**: "Is this a 3 or a 4?" → Pick one and move on.

**Why**: Patterns emerge from aggregate ratings, not individual precision.

## Keyboard Shortcuts (Speed Rating)

Rate all outputs faster using keyboard shortcuts.

### Rating Shortcuts

- `1` - 1 star
- `2` - 2 stars
- `3` - 3 stars
- `4` - 4 stars
- `5` - 5 stars

### Navigation

- `↓` or `J` - Next output
- `↑` or `K` - Previous output
- `F` - Add feedback (opens modal)
- `T` - Add tag
- `Shift + Enter` - Save and advance to next

### Pro Workflow

1. Press `3` (rate 3 stars)
2. Press `F` (add feedback modal opens)
3. Type "Too formal, should be casual"
4. Press `Shift + Enter` (save and move to next)

**Result**: Rate 30 outputs in about 5 minutes.

## Common Rating Mistakes

### Mistake 1: Rating Too Generously

**Problem**: Everything is 4-5 stars, even mediocre outputs.

**Impact**: Pattern extraction can't find failures to fix.

**Fix**: Use the full scale. 3 is average, not bad.

### Mistake 2: No Feedback on Low Ratings

**Problem**: You give 1-2 stars but don't explain why.

**Impact**: Sageloop can't group failures or suggest fixes.

**Fix**: Always add feedback for ratings ≤2 stars.

### Mistake 3: Inconsistent Standards

**Problem**: Similar outputs get wildly different ratings.

**Impact**: Confuses pattern detection; unreliable insights.

**Fix**: Compare to past ratings. Ask "Is this better/worse/same as output #5?"

### Mistake 4: Overthinking

**Problem**: Spending 2 minutes per output debating 3 vs 4 stars.

**Impact**: Slow workflow; rating fatigue.

**Fix**: Trust your gut. Rate quickly. Patterns matter, not individual precision.

### Mistake 5: Rating Based on Potential

**Problem**: "This could be 5-star with one small fix" → Rate 5-star.

**Impact**: Inflates metrics; hides real issues.

**Fix**: Rate what you see now, not what it could be. If it needs a fix, it's 3-4 stars.

## When to Re-Rate

### Scenario 1: You Change Your Mind

After rating 10 outputs, you realize your standards shifted.

Go back and adjust earlier ratings for consistency.

### Scenario 2: After Prompt Iteration

New outputs are generated after updating the prompt.

Re-rate new outputs—old ratings stay with old outputs for version comparison.

### Scenario 3: Different Reviewers

Teammate rated outputs differently.

Discuss and align on standards. Decide on a shared mental model of quality.

## Example Rating Session

**Scenario**: "How do I reset my password?"

**Output A**:

> "To reset your password, visit account settings and click 'Reset Password.'"

**Your Rating**: 3 stars
**Feedback**: "Missing link to account settings and no next steps (check email for reset link)"

---

**Output B**:

> "I can help you reset your password! Visit your account settings, click 'Reset Password,' and check your email for a reset link. Let me know if you need anything else!"

**Your Rating**: 5 stars
**Feedback**: "Perfect—friendly tone, clear steps, sets expectation for email"

---

**Output C**:

> "Password resets are handled via the automated system. Follow the standard protocol."

**Your Rating**: 1 star
**Feedback**: "Too corporate and vague—no actionable steps, assumes user knows 'standard protocol', no link or guidance"

## Tips for Great Ratings

- **Trust your gut** - You know quality when you see it
- **Be specific** - "Too formal" + example is better than vague feedback
- **Compare to past ratings** - Maintain consistency across batch
- **Provide feedback on failures** - Helps extraction group similar issues
- **Rate quickly** - Don't overthink. Patterns emerge from aggregate, not individual precision

Avoid:

- Rating generously to inflate metrics
- Skipping feedback on low ratings
- Spending 2+ minutes per output
- Rating based on potential ("could be good")
- Second-guessing yourself endlessly

## Next Steps

- [Pattern Extraction](pattern-extraction.md) - How ratings become insights
- [Quick Start](../quickstart.md) - Create your first project
- [FAQ](../faq.md) - Full keyboard shortcut reference
