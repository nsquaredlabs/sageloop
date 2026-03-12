# Quick Start Guide

> Get from installation to your first insights in 15 minutes. No code required.

## What You'll Learn

By the end of this guide, you'll:

1. Create your first project
2. Add test scenarios
3. Generate AI outputs
4. Rate outputs
5. Extract patterns and get actionable insights

## Prerequisites

Install and run Sageloop locally. API keys are configured in `sageloop.config.yaml`.

That's it! Just start the app and you're ready to go.

## Step 1: Create Your Project (2 min)

After opening Sageloop, you'll see an empty dashboard.

1. Click **"New Project"**
2. Enter a project name: "My First Eval"
3. Write a system prompt (example below)
4. Click **"Create Project"**

### Example System Prompt

Pick something simple for your first project:

```
You are a helpful customer support agent. Answer customer questions clearly and professionally. Always be empathetic.
```

> **Tip:** Don't worry about perfection—you'll refine this later based on patterns you discover.

## Step 2: Add Test Scenarios (3 min)

Now you need user inputs to test. Scenarios are the questions or requests your AI will receive.

1. Click **"Add Scenarios"**
2. Click **"Bulk Add"** and paste these 15 examples (or use your own):

```
Where is my refund?
I want a refund for order #12345
How long does a refund take?
Can I get a partial refund?
My refund hasn't arrived yet
Where is my order?
When will my package arrive?
Can I change my shipping address?
Item arrived damaged, what do I do?
How do I return an item?
Can I return after 30 days?
How do I reset my password?
I can't log in
Cancel my subscription
Delete my account
```

3. Click **"Add All"**

> **Tip:** Use real questions from your support queue, documentation, or actual customer interactions. Real data makes patterns more valuable.

## Step 3: Generate Outputs (2 min)

Now let Sageloop call AI models for each scenario.

1. Click **"Generate Outputs"**
2. Wait 30-60 seconds
3. You'll see all outputs in a table view

**This is Sageloop's superpower**: See all 15 AI responses at once. Compare them visually and spot patterns instantly.

## Step 4: Rate Outputs (5 min)

Rate each output based on what you want in production. Use the 5-star scale:

- **5 stars**: Perfect. Deploy as-is.
- **4 stars**: Good, minor issues
- **3 stars**: Okay, but needs improvement
- **2 stars**: Problems. Major issues.
- **1 star**: Unacceptable. Never ship this.

### Rating Tips

- **Trust your gut**. If it feels wrong, it's 1-2 stars.
- **For 1-2 star outputs**, click **"Add Feedback"** and explain why (e.g., "Too formal", "Missing refund timeline")
- **Use keyboard shortcuts**: Press `1-5` to rate, then `↓` to move to next output

> **Tip:** You can rate all 15 outputs in under 5 minutes using keyboard shortcuts. Press `1-5` to rate, then `Tab` to advance.

## Step 5: Extract Patterns (2 min)

This is where Sageloop gets smart.

1. Go to the **"Insights"** tab
2. Click **"Run Pattern Extraction"**
3. Wait 5-10 seconds
4. You'll see failure clusters and quality patterns

### What You'll See

**Failure Analysis**:

> Cluster 1: Vague Timelines (3 outputs)
> Pattern: All 1-2 star outputs use "soon" instead of specific "5-7 business days"
> Fix: Add to system prompt: "Always say exactly '5-7 business days' for refund timeline"

**Quality Patterns** (5-star outputs):

All 5-star outputs:

- Start with an apology
- Use specific timeline ("5-7 business days")
- Include next steps
- End with friendly closing

## Step 6: Apply Fixes (Optional, 3 min)

See improvement opportunity? Let's test a fix.

1. Click **"Apply Suggested Fix"** on a failure cluster
2. Review the updated system prompt
3. Click **"Update & Retest"**
4. Only the failed scenarios regenerate (saves time)
5. Rate the new outputs
6. Check if quality improved

> **Tip:** If 3 outputs failed for "missing timeline," after applying the fix, you might see "2/3 now pass ✅"

## You're Done!

Congratulations! You've completed your first evaluation loop:

1. Created a project
2. Added scenarios
3. Generated outputs
4. Rated outputs
5. Extracted patterns
6. Applied a fix and retested

## What's Next?

Now that you've seen how Sageloop works, explore deeper:

- [Core Concepts](core-concepts.md) - Understand the methodology
- [Rating Guide](guide/rating-outputs.md) - Advanced rating techniques
- [Pattern Extraction](guide/pattern-extraction.md) - How extraction works
- [Use Cases](use-cases/customer-support.md) - See how others use Sageloop

## Common Questions

**How do I improve my system prompt?**
The insights show you exact patterns to fix. Copy suggested fixes into your prompt.

**When should I extract patterns?**
After you've rated 15-30 outputs for reliable patterns. Sageloop will warn you if sample is too small.

**Can I use this for production AI?**
Absolutely. Export your insights as a test suite for CI/CD integration.
