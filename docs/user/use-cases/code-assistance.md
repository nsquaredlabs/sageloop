# Use Case: Code Assistance

> Learn how teams evaluate AI code generation and explanation quality.

## Overview

**Goal**: Ensure AI code assistants generate correct, readable, maintainable code.

**Time Investment**: 30 minutes to first insights

## The Challenge

You're building a code assistant for your developers.

**Questions**:

- How correct should generated code be?
- What code style matters?
- How should explanations be written?
- When should the AI say "I don't know"?

## Quick Example: Python Code Assistant

### Step 1: Create Project

System Prompt:

```
You are a Python coding assistant.
Generate correct, readable Python code.
Explain code clearly using simple language.
Use modern Python practices (Python 3.10+).
```

### Step 2: Add Scenarios

```
Write a function to check if a string is a palindrome
Create a decorator to log function calls
Implement binary search algorithm
Write a context manager for file handling
Explain what list comprehension does
Fix this code: [buggy code snippet]
```

### Step 3: Generate, Rate, Extract

Rate based on:

- **Correctness**: Does code work?
- **Style**: Follows PEP 8?
- **Clarity**: Easy to understand?
- **Comments**: Well-explained?

### Step 4: Get Insights

Patterns reveal:

- All 5-star: Code has clear variable names
- All 5-star: Includes example usage
- Low-star: Missing error handling
- Low-star: Overly complex when simpler solution exists

## Scenarios by Language

### Python

```
Write a function to [task]
Create a [data structure] implementation
Explain [Python concept]
Optimize this code for performance
Fix this error: [error message]
```

### JavaScript

```
Write a React component that [requirement]
Create an async function to [task]
Explain how [JavaScript concept] works
Refactor this code for readability
Debug this issue: [description]
```

### Go/Rust/etc.

Similar patterns apply for other languages.

## Key Metrics for Code Quality

### What Makes Code "5-Star"?

- **Correctness**: Works as expected
- **Readability**: Clear variable names, good structure
- **Efficiency**: No unnecessary complexity
- **Safety**: Handles edge cases and errors
- **Best Practices**: Follows language conventions

### Common Failure Patterns

**Pattern 1: Incorrect Implementation**

- 5-star: Correct algorithm
- 1-star: Off-by-one errors, wrong logic

**Pattern 2: Poor Naming**

- 5-star: `count_active_users()`
- 1-star: `x = 5`

**Pattern 3: Missing Error Handling**

- 5-star: Handles edge cases, throws meaningful errors
- 1-star: Assumes happy path, crashes on edge cases

**Pattern 4: Poor Explanation**

- 5-star: Clear step-by-step explanation
- 1-star: Assumes reader knows everything

## Evaluation Tips

**For Generated Code**:

- Test it (does it compile/run?)
- Check correctness (does it solve the problem?)
- Review readability (would you merge this?)
- Consider efficiency (any obvious optimizations?)

**For Explanations**:

- Is it accurate?
- Is it at the right level of detail?
- Would a junior dev understand it?
- Does it include examples?

## Iteration Example

**Iteration 1** (60% success):

- Issue: Code is correct but missing comments
- Fix: Add "Include clear comments for complex logic"

**Iteration 2** (75% success):

- Issue: Doesn't handle edge cases
- Fix: Add "Include error handling and edge case checks"

**Iteration 3** (88% success):

- Issue: Explanations assume too much knowledge
- Fix: Add "Explain assumptions and provide beginner-friendly context"

**Final** (94% success): Ready for production

## Export for Engineering

1. Export golden examples (5-star code snippets)
2. Extract patterns (best practices discovered)
3. Use in:
   - Code review guidelines
   - Junior dev training
   - CI/CD integration (syntax checking)
   - Documentation of expected behavior

## Next Steps

- [Quick Start](../quickstart.md) - Evaluate your code assistant
- [Rating System](../guide/rating-outputs.md) - Rating system guide
