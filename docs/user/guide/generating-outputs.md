# Generating Outputs

> Learn how to generate AI outputs for your scenarios.

## What Is Output Generation?

Output generation is when Sageloop calls your chosen AI model (GPT-4, Claude, etc.) to generate responses for each of your scenarios.

**How It Works**:

1. You add scenarios to your project
2. You click "Generate Outputs"
3. Sageloop calls your AI model once per scenario
4. Results appear in a table for easy comparison

## Getting Started

### Prerequisites

- **Project Created**: You've already created a project with a system prompt
- **Scenarios Added**: You've added 10+ scenarios

> **Tip:** API keys are configured in `sageloop.config.yaml`. Make sure the appropriate keys are set before generating.

## Running Generation

1. Navigate to your project
2. Click **"Generate Outputs"**
3. Select your model (GPT-4, GPT-3.5, Claude, etc.)
4. Click **"Generate"**
5. Wait for results (usually 30-60 seconds for 20 scenarios)

**What You'll See**:

- Progress indicator
- Table of generated responses
- Status for each scenario

## Understanding Generation

### Temperature & Consistency

Generation quality depends on your system prompt clarity:

- **Low temperature settings** (0.0-0.5): Consistent, predictable responses
- **Higher temperature** (0.7+): More diverse, creative variations

> **Note:** Use temperature 0.3-0.5 for evaluating support bots, content generation, etc. Use higher temperature (0.7+) if you want to test diverse variations.

### Selective Regeneration

After your first generation, you can regenerate specific scenarios:

1. Select scenarios you want to regenerate
2. Click **"Regenerate Selected"**
3. Only selected scenarios are regenerated (saves time)

**When to Use**:

- After updating your system prompt
- When you want to retry failed scenarios
- When you want different variations of same scenario

## Understanding Your Outputs

### Output Table View

The output table shows:

- **Scenario** (on left)
- **AI Response** (in middle)
- **Your Rating** (on right, if already rated)

**Features**:

- Expand/collapse scenarios
- Copy outputs to clipboard
- Regenerate specific scenarios
- Add notes/feedback

### Looking for Patterns

Before rating, scan for patterns:

**Example**:

- Scenario 1: "Where is my refund?" → "Refunds take 5-7 business days"
- Scenario 2: "Where is my refund?" → "Refunds arrive soon"
- Scenario 3: "When will I get my refund?" → "Refunds are processed shortly"

**Pattern**: Inconsistent timeline wording (some say "5-7 days", others say "soon")

**Action**: Rate accordingly and add feedback to help extraction identify this pattern.

## Troubleshooting Generation

### Problem: Generation Fails

**Possible Causes**:

1. API rate limit exceeded
2. Model not available
3. Network connectivity issue

**Fix**:

- Wait a few minutes and retry
- Try a different model
- Check your connection and API key configuration in `sageloop.config.yaml`

### Problem: Outputs Are Too Similar

**Cause**: Model configuration too rigid

**Fix**: Regenerate with different settings or refine system prompt

### Problem: Outputs Are Inconsistent

**Cause**: System prompt lacks specificity

**Fix**: Add more detailed instructions to your system prompt, then regenerate

### Problem: Outputs Are Too Short/Long

**Solution**: Update system prompt with output length guidance

```
Your responses should be 150-250 words.
(instead of no guidance)
```

Then regenerate.

## System Prompt Best Practices

### Clear Instructions

```
Good:
"You are a customer support agent. Always:
1. Start with an apology
2. Explain the policy clearly
3. Give specific timeline (5-7 business days)
4. Provide next steps
5. End with friendly offer to help"

Vague:
"Be a helpful support agent"
```

### Context

```
Good:
"You are helping ShopCo customers with refund questions.
ShopCo's refund policy: 5-7 business days from receipt.
You cannot offer exceptions."

Vague:
"Help with refunds"
```

### Examples

```
Good:
"When asked about refunds, respond like:
'I sincerely apologize for the inconvenience.
Refunds take 5-7 business days to process...'"

Vague:
"Be empathetic"
```

## Batch vs. Individual Testing

### Sageloop (Batch)

```
Generate all 20 outputs at once
See them all in a table
Compare visually
Rate in bulk using shortcuts
```

**Advantage**: Fast pattern recognition

### ChatGPT (Individual)

```
Test one output at a time
Hard to remember previous tests
Need to manually organize results
```

**Disadvantage**: Slow, patterns hidden

## Next Steps

- [Quick Start](../quickstart.md) - Create your first project
- [Creating Scenarios](creating-scenarios.md) - Add test inputs
- [Rating Outputs](rating-outputs.md) - Evaluate your outputs
- [Pattern Extraction](pattern-extraction.md) - Extract insights
