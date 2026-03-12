# Use Case: Customer Support Bot

> Learn how to define and improve support bot quality.

## Overview

**Goal**: Ensure consistent, empathetic support responses that handle refunds, returns, shipping questions accurately.

**Time Investment**: 30 minutes to first insights

## The Challenge

You're building a support bot for an e-commerce company.

**Questions**:

- What makes a "good" support response?
- How empathetic should the bot be?
- When should it escalate to a human?
- How do we handle edge cases (damaged items, partial refunds)?

**Traditional Approach**: Spend weeks debating criteria in Google Docs, write vague guidelines like "be empathetic," launch bot, discover issues in production.

**Sageloop Approach**: Test 20 real support questions, rate responses, discover concrete quality patterns in 30 minutes.

## Step-by-Step Walkthrough

### Step 1: Gather Real Support Questions (5 min)

Pull 20 real questions from your support queue or help desk:

**Refund Questions**:

- "Where is my refund?"
- "I want a refund for order #12345"
- "How long do refunds take?"
- "Can I get a partial refund?"
- "My refund hasn't arrived yet"

**Shipping Questions**:

- "Where is my order?"
- "When will my package arrive?"
- "Can I change my shipping address?"
- "I need expedited shipping"
- "My tracking says delivered but I didn't receive it"

**Return Questions**:

- "How do I return an item?"
- "Can I return after 30 days?"
- "Do I have to pay return shipping?"
- "I lost the receipt, can I still return?"
- "Item arrived damaged, what do I do?"

**Account Questions**:

- "How do I reset my password?"
- "I can't log in"
- "Cancel my subscription"

> **Tip:** Use your 20 most frequent support questions. They'll give you patterns that matter to real users.

### Step 2: Create Project & Write Initial Prompt (3 min)

1. Click **"New Project"**
2. Name: "Customer Support Bot - v1"
3. Model: GPT-4 (for high quality)
4. Temperature: 0.3 (consistent responses)
5. System Prompt:

```
You are a helpful customer support agent for ShopCo, an e-commerce
company. Answer customer questions clearly and professionally.

Key policies:
- Refunds take 5-7 business days to process
- Returns accepted within 30 days of purchase
- Free return shipping for defective items
- Expedited shipping available for $15

Always be polite and helpful.
```

6. Click **"Create Project"**

### Step 3: Add Scenarios & Generate (5 min)

1. Click **"Bulk Add Scenarios"**
2. Paste your 20 questions
3. Click **"Generate Outputs"**
4. Wait 60 seconds
5. Review the table of AI responses

You'll immediately see variation in the outputs. Notice how some are thorough and others are vague.

### Step 4: Rate Outputs (10 min)

**Real Pattern You'll Notice**:

**Output for "Where is my refund?"**:

> "Refunds are processed within our standard timeframe. Please check your account for status."

**Your Rating**: 2 stars
**Feedback**: "Too vague—should say '5-7 business days' not 'standard timeframe'"

---

**Output for "Item arrived damaged"**:

> "I sincerely apologize that your item arrived damaged. We offer free return shipping for defective items. Please initiate a return in your account, and we'll process a full refund within 5-7 business days. Let me know if you need any help!"

**Your Rating**: 5 stars
**Feedback**: "Perfect—empathetic, clear policy, actionable steps"

---

**After rating all 20 outputs**:

| Rating  | Count | %   |
| ------- | ----- | --- |
| 5 stars | 8     | 40% |
| 4 stars | 5     | 25% |
| 3 stars | 3     | 15% |
| 2 stars | 4     | 20% |

**Success Rate**: 65% (13/20 rated 4-5 stars)

### Step 5: Extract Patterns (2 min)

Click **"Run Pattern Extraction"** and wait for results.

#### Failure Cluster 1: Vague Timelines (3 outputs)

> **Pattern**: Using "soon", "shortly", or "standard timeframe" instead of specific "5-7 business days"
> **Root Cause**: System prompt mentions policy but AI paraphrases instead of using exact wording
> **Suggested Fix**:
>
> ```
> Add to system prompt:
> "Always say exactly '5-7 business days' for refund timeline—don't paraphrase."
> ```
>
> **Affected Scenarios**: #1, #2, #5

#### Failure Cluster 2: Missing Empathy (2 outputs)

> **Pattern**: Responses jump straight to solution without acknowledging frustration
> **Root Cause**: Prompt says "be polite" but doesn't emphasize empathy
> **Suggested Fix**:
>
> ```
> Replace "Always be polite and helpful" with:
> "Always start by acknowledging the customer's frustration with an
> empathetic statement like 'I sincerely apologize for the inconvenience.'"
> ```
>
> **Affected Scenarios**: #10, #15

#### Quality Patterns (5-Star Outputs)

> **Structure**:
>
> 1. Empathetic opening ("I sincerely apologize...")
> 2. Clear explanation of policy
> 3. Specific timeline ("5-7 business days")
> 4. Actionable next step (link to account, instructions)
> 5. Friendly closing ("Let me know if you need anything else!")
>
> **Tone**: Professional but warm—not robotic
>
> **Length**: 100-200 words (concise but complete)
>
> **Key Phrases**:
>
> - "I sincerely apologize" (not just "Sorry")
> - "5-7 business days" (exact wording)
> - "Let me know if you have any questions" (invite follow-up)

### Step 6: Apply Fixes & Retest (5 min)

**Updated System Prompt** (v2):

```
You are a helpful customer support agent for ShopCo, an e-commerce
company.

RESPONSE STRUCTURE:
1. Always start by acknowledging the customer's frustration with an
   empathetic statement like "I sincerely apologize for the inconvenience."
2. Explain the relevant policy clearly
3. Provide specific timelines (use exact wording from policies below)
4. Give actionable next steps (include links when relevant)
5. End with "Let me know if you need anything else!"

KEY POLICIES:
- Refunds: "Refunds take 5-7 business days to process" (use exact wording)
- Returns: Accepted within 30 days of purchase
- Return shipping: Free for defective items; customer pays for others
- Expedited shipping: Available for $15
```

1. Click **"Apply Fix & Retest"**
2. Review the diff
3. Click **"Update & Retest"**
4. Only the 4 failed scenarios regenerate (saves time)

**New Results**:

- 3 out of 4 now pass ✅
- 1 still fails (partial refunds not in policy)

**Updated Success Rate**: 90% (18/20)

### Step 7: Final Iteration (Optional)

**Remaining Failure**: Partial refund scenario

**Issue**: Policy doesn't cover partial refunds (only full refunds)

**Action**: Add to system prompt:

```
Partial refunds: Only available for multi-item orders. Refund is
prorated by item price.
```

**Final Success Rate**: 95% (19/20)

## Key Insights from This Example

### Pattern 1: Exact Wording Matters

AI paraphrases unless you explicitly say "use exact wording."

**Fix**: Add "say exactly '5-7 business days'—don't paraphrase"

### Pattern 2: Empathy Must Be Explicit

"Be polite" doesn't mean "apologize first."

**Fix**: Specify exact empathetic opening phrase

### Pattern 3: Structure Improves Consistency

Numbered steps in system prompt → more consistent output structure

**Fix**: Use numbered list for response structure

### Pattern 4: Edge Cases Emerge from Testing

Partial refunds weren't considered until a scenario revealed the gap.

**Fix**: Add to policy documentation

## Support Bot Scenario Library

Ready to test your own support bot? Use these scenarios:

### Refunds & Returns (5 scenarios)

```
Where is my refund?
I want a refund for order #12345
How long do refunds take?
Can I get a partial refund?
Item arrived damaged, what do I do?
```

### Shipping & Delivery (5 scenarios)

```
Where is my order?
When will my package arrive?
Can I change my shipping address?
Tracking says delivered but I didn't receive it
I need expedited shipping
```

### Account Management (5 scenarios)

```
How do I reset my password?
I can't log in
Update my email address
Cancel my subscription
Delete my account
```

### Product Questions (3 scenarios)

```
Do you have [product] in stock?
What sizes do you have for [product]?
Is this product compatible with [other product]?
```

### Escalation Scenarios (2 scenarios)

```
I want to speak to a human
This is unacceptable, I demand compensation
```

## Best Practices for Support Bots

### Do

**Empathy First**: Always acknowledge frustration before solving

**Exact Policy Wording**: Use precise language for timelines, prices, processes

**Clear Next Steps**: Tell user exactly what to do next

**Consistent Tone**: Define tone explicitly ("professional but warm" vs. "casual and friendly")

**Handle Escalation**: Detect when to say "Let me connect you with a human agent"

### Don't

**Vague Language**: "Soon", "shortly", "typically"—be specific

**Robotic Responses**: "Your request has been processed" → "I've processed your request!"

**Ignore Emotion**: User is angry → Acknowledge it, don't ignore

**Over-Apologize**: One apology at start is enough

**Make Promises You Can't Keep**: "I'll personally ensure..." (you're a bot!)

## Export for Engineering

After achieving 95%+ success rate:

1. Click **"Export"**
2. Choose **"Golden Examples"** (all 5-star outputs)
3. Choose **"Test Suite"** (pytest format for CI/CD)
4. Share with engineering team

**Handoff to Engineering**:

- Engineer implements bot using your system prompt
- Engineer runs exported test suite in CI
- If bot fails tests, engineer knows exactly which scenarios broke
- CI/CD prevents regressions

**Result**: Clear PM → Eng handoff with zero ambiguity.

## Success Metrics

| Metric                     | Before Sageloop                | After Sageloop              |
| -------------------------- | ------------------------------ | --------------------------- |
| Time to quality definition | 2 weeks                        | 30 minutes                  |
| Quality bar clarity        | Vague ("be helpful")           | Concrete (exact criteria)   |
| Success rate at launch     | ~60% (discover issues in prod) | 95%+ (tested before launch) |
| PM confidence              | Low                            | High                        |
| Documentation clarity      | Subjective                     | Quantified & actionable     |

## Common Support Bot Use Cases

### E-commerce Support

Refunds, returns, shipping, order tracking

### SaaS Support

Billing, account management, feature questions

### Financial Services

Account inquiries, transaction questions, compliance

### Healthcare

Appointment scheduling, insurance questions

### Travel & Hospitality

Booking changes, cancellations, customer support

## Next Steps

- [Rating Outputs](../guide/rating-outputs.md) - Master rating outputs
- [Pattern Extraction](../guide/pattern-extraction.md) - Learn pattern extraction
- [Quick Start](../quickstart.md) - Quick start guide
