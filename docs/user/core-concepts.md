# Core Concepts

> Understand the philosophy and methodology behind Sageloop

## The Core Insight: Inductive Quality Definition

Sageloop uses a different approach than traditional evaluation tools.

### Traditional Approach (Deductive)

1. **Define** quality criteria upfront ("responses must be 100-200 words")
2. **Test** AI outputs against criteria
3. **Pass/fail** based on rules

**Problem**: PMs can't articulate quality upfront. You know good when you see it, but describing it is hard.

### Sageloop Approach (Inductive)

1. **Generate** examples of AI behavior
2. **Rate** examples based on your intuition
3. **Discover** patterns in your ratings
4. **Improve** your prompt based on discovered patterns

**Why it works better**:

- You don't need to know criteria upfront
- Patterns you see ≠ patterns you can describe
- Real outputs reveal edge cases you'd never think of
- Faster: Rate 30 outputs in 5 minutes vs. 2 hours debating criteria

### Real Example

A support bot PM at a startup tested 20 refund scenarios.

**Approach A (Traditional)**:
PM spends 2 hours defining criteria: "Responses should be friendly, include timeline, apologize"

Launches bot. Users complain: "Why didn't it mention the return shipping fee?"

Missed edge case. Rework prompt. Relaunch.

**Approach B (Sageloop)**:
PM rates 20 real refund questions in 5 minutes

Pattern extraction finds: "All 5-star outputs mention return shipping fee"

PM adds to prompt: "Always mention return shipping details"

Retests. Quality jumps to 95%.

**Winner**: Sageloop (faster, catches edge cases, clearer patterns)

## The Evaluation Loop

```
Scenarios → Outputs → Ratings → Insights → Fixes → Retest → Iterate
```

### 1. Scenarios (Inputs)

Test inputs representing real user requests.

**Good scenario**:

- Specific and realistic
- Represents actual use case
- Clear user intent

Good example:

```
Where is my refund?
```

Bad example:

```
Test 1
```

### 2. Outputs (AI Responses)

AI-generated responses using your system prompt.

**Sageloop's Advantage**: Generates all outputs at once so you can compare them visually.

**Visual Pattern Recognition**:

- Response 1: "Refunds take 5-7 business days"
- Response 2: "Refunds arrive shortly"
- Response 3: "Timeline: 5-7 business days"
- Response 4: "Refunds processed soon"

**You see it immediately**: Half mention specific timeline, half say "soon"

### 3. Ratings (Your Judgment)

Your 1-5 star ratings teach Sageloop what quality means to you.

**Rating Principle**: Trust your gut.

- **5 stars**: Perfect
- **4 stars**: Good
- **3 stars**: Okay
- **2 stars**: Problem
- **1 star**: Unacceptable

> **Tip:** For 1-2 star outputs, add feedback explaining WHY.

### 4. Insights (Pattern Extraction)

Sageloop's AI clusters your low-rated outputs by root cause.

- Not generic: "Outputs should be better"
- Concrete: "4 outputs missing specific refund timeline (5-7 days)"

Example insight:

> **Cluster: Vague Timelines** (4 outputs, high confidence)
>
> **Root Cause**: System prompt doesn't specify exact timeline
>
> **Fix**: Add "Always say exactly '5-7 business days'"

### 5. Fixes (Iteration)

Apply suggested fixes and regenerate only failed scenarios.

**Example**:

- **Version 1**: "You are a helpful support agent"
- **Version 2**: "You are a helpful support agent. Always mention '5-7 business days' for refund timeline."

### 6. Retest (Validation)

Rate new outputs. Did quality improve?

**Example**:

- Before: 4 failures → 73% success rate
- After fix: 1 failure → 91% success rate
- Result: "3/4 outputs now pass ✅"

## Key Terminology

**Project**: A workspace for evaluating a specific AI behavior (e.g., "Customer Support Bot v1")

**Scenario**: A single user input you want to test (e.g., "Where is my refund?")

**Output**: The AI-generated response to a scenario

**Rating**: Your 1-5 star quality judgment + optional feedback

**Extraction**: The AI-powered analysis finding patterns in your ratings

**Failure Cluster**: A group of low-rated outputs with the same root cause

**Golden Example**: A 5-star rated output representing ideal AI behavior

**Success Rate**: % of outputs rated 4-5 stars (your quality benchmark)

## Why Batch Evaluation Matters

### Single Output (ChatGPT Style)

- Test one output at a time
- Hard to remember previous tests
- Patterns hidden

### Batch Evaluation (Sageloop)

- See 20-30 outputs at once
- Compare visually
- Patterns obvious

### The Difference

Testing date parsing:

#### Single Output

- Test 1: "2024-01-15" ✅
- Test 2: "2024-01-22" ✅
- Test 3: (wait, what did test 1 do?)
- Test 10: "2022" ✅ (Wait, this is wrong!)
- **Miss the pattern**: Some outputs use 2022 instead of 2024

#### Batch Evaluation

- See all 10 outputs in a table
- Immediately spot: "Outputs #3, #7, #9 say '2022'"
- **Pattern found in 10 seconds**

## When to Use Sageloop

### Perfect For

- **Discovery**: Figuring out what "good" AI behavior means
- **Prompt Iteration**: Testing different prompt versions
- **Quality Spec Creation**: Defining standards for engineering
- **Edge Case Discovery**: Finding failure modes

### Not Ideal For

> **Warning:** Sageloop is not the right tool for:
>
> - Production monitoring (use PromptLayer, LangSmith)
> - Automated testing in CI (export to pytest instead)
> - Fine-tuning models (use training platforms)
> - A/B testing in production (use experimentation platforms)

### Perfect Workflow

```
Sageloop (discovery) → Export golden examples → CI/CD testing (production)
```

## The Methodology in Numbers

### How Many Scenarios?

**Sweet Spot**: 15-30 scenarios

- **Too few** (fewer than 10): Patterns won't be statistically meaningful
- **Too many** (more than 50): Rating takes forever; diminishing returns
- **15-30**: Fast to rate, enough for reliable patterns

### Success Rate Target

Start with whatever you have. Sageloop will help you improve.

**Typical Journey**:

1. Iteration 1: 65% success rate
2. Iteration 2: 80% success rate
3. Iteration 3: 90% success rate
4. Iteration 4: 95%+ success rate

### Expected Timeline

| Activity                    | Time       | Notes              |
| --------------------------- | ---------- | ------------------ |
| Create project              | 2 min      | One-time           |
| Add 20 scenarios            | 3 min      | Bulk paste         |
| Generate outputs            | 2 min      | AI does the work   |
| Rate outputs                | 5 min      | Keyboard shortcuts |
| Extract patterns            | 2 min      | AI does the work   |
| **Total to first insights** | **14 min** | Very fast          |
| Apply fix + retest          | 5 min      | Optional iteration |

## Comparison Table

| Aspect            | Traditional     | Sageloop                |
| ----------------- | --------------- | ----------------------- |
| Define criteria   | Upfront (hard)  | From examples (natural) |
| Test method       | One at a time   | Batch visual            |
| Pattern discovery | Manual          | AI-powered              |
| Iteration         | Guess and check | Targeted fixes          |
| PM-friendly       | No              | Yes                     |
| Code required     | Maybe           | No                      |
| Time to value     | Weeks           | 15 minutes              |

## Core Principles

1. **PMs Know Quality When They See It** - Even if they can't articulate why.
2. **Patterns Emerge from Examples** - More reliable than pre-defined criteria.
3. **Batch > Individual** - Comparing 20 outputs reveals patterns; testing one hides them.
4. **Iteration Works** - Small prompt changes → test → validate → repeat.
5. **Actionability Matters** - Generic fixes ("be better") don't work. Concrete fixes do ("always say 5-7 days").

## Next Steps

- [Quick Start](quickstart.md) - Create your first project
- [Rating Outputs](guide/rating-outputs.md) - Master the rating system
- [Pattern Extraction](guide/pattern-extraction.md) - Deep dive into insights
