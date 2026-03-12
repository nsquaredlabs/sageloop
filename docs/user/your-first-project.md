# Your First Project

> A hands-on tutorial to create your first Sageloop project and extract insights

In this tutorial, you'll create an evaluation for a simple customer support bot and discover patterns in 20 minutes.

## What You'll Build

A complete evaluation loop for a customer support bot, from creating scenarios to extracting actionable insights.

## Prerequisites

Install and run Sageloop locally. See the [Quick Start](quickstart.md) guide if you haven't set it up yet.

## Step 1: Create a New Project

1. Click **"New Project"** on your dashboard
2. Enter name: **"Support Bot - First Try"**
3. Paste system prompt:

```
You are a helpful customer support agent for an online store.
Answer customer questions about orders, refunds, and returns.
Be polite, professional, and empathetic.
Always provide clear information about policies.
```

4. Click **"Create Project"**

## Step 2: Add 15 Test Scenarios

Click **"Bulk Add Scenarios"** and paste these:

```
Where is my order?
How long does delivery take?
Can I return an item?
How do I get a refund?
My order arrived damaged
What's your return policy?
I want to cancel my order
How do I track my package?
Can I change my shipping address?
Do you offer exchanges?
My refund hasn't arrived
What's your shipping cost?
I received the wrong item
How do I contact support?
Can I get a discount?
```

Click **"Add All"**.

## Step 3: Generate Outputs

1. Click **"Generate Outputs"**
2. Wait 30-60 seconds
3. Review the table of responses

> **Tip:** Take a moment to look at the outputs: Notice variation in length, tone, and content.

## Step 4: Rate the Outputs

Using the 5-star scale, rate each output:

- **5 stars**: Perfect, ready for production
- **4 stars**: Good, minor issues
- **3 stars**: Okay, needs improvement
- **2 stars**: Problem, major issues
- **1 star**: Unacceptable

**Shortcut**: Press keys 1-5 to rate, then ↓ to move to next.

**For 1-2 star outputs**, click **"Add Feedback"** explaining why:

- "Too vague"
- "Missing key information"
- "Wrong tone"
- "Doesn't match policy"

### Typical pattern you'll see:

- Some outputs say "soon" for refund timeline
- Some don't apologize
- Some are too formal
- Some are perfect

> **Tip:** You can rate all 15 in about 5 minutes with shortcuts.

## Step 5: Extract Patterns

1. Go to **"Insights"** tab
2. Click **"Run Pattern Extraction"**
3. Wait 5-10 seconds for results

**You'll see**:

### Failure Analysis

Groups of low-rated outputs with their root causes:

> **Cluster 1: Vague Timelines** (3 outputs)
>
> Issues: Says "soon" instead of specific timeframe
>
> Fix: Add "specific refund timeline (5-7 days)" to prompt

> **Cluster 2: Missing Apology** (2 outputs)
>
> Issues: Doesn't acknowledge customer concern
>
> Fix: "Always start by apologizing"

### Quality Patterns

What 5-star outputs have in common:

**5-Star Pattern**:

- Starts with apology
- Specific information (not vague)
- Clear next steps
- Professional but warm tone

## Step 6: Apply a Fix & Retest

1. Click **"Apply Fix & Retest"** on Cluster 1 (Vague Timelines)
2. Review the suggested prompt update
3. Click **"Update & Retest"**

**What happens**:

- Only the 3 failed scenarios regenerate
- You get new outputs to rate
- Check if they're better

**If they improved**: Great! You've just improved your AI bot.

## Step 7: Check Your Progress

Review your **Success Rate**:

- Started: ~65% (9/15 passing)
- After first fix: ~85% (13/15 passing)

You've improved quality by 20% in one iteration!

## What You've Learned

1. Created a project
2. Added realistic scenarios
3. Generated AI outputs
4. Rated based on intuition
5. Discovered patterns from your ratings
6. Applied concrete improvements
7. Validated improvements

## Next Steps

Now that you understand the workflow:

- [Rating Guide](guide/rating-outputs.md) - Master rating technique
- [Pattern Extraction](guide/pattern-extraction.md) - Advanced insights
- [Use Cases](use-cases/customer-support.md) - See other examples
- [Creating Scenarios](guide/creating-scenarios.md) - Build better test suites

## Tips for Success

- **Start simple**: Don't aim for perfection in first iteration
- **Use real data**: Real scenarios > made-up ones
- **Iterate**: 2-4 iterations is normal
- **Export golden examples**: Use for CI/CD
