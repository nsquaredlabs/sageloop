# Use Case: Content Generation

> Learn how content teams use Sageloop to define and improve AI content quality.

## Overview

**Goal**: Ensure consistent, on-brand content for blogs, emails, social posts, and more.

**Time Investment**: 30 minutes to first insights

## The Challenge

You're building a content generator for your marketing team.

**Questions**:

- What style and tone should content have?
- How long should posts be?
- What should we include/exclude?
- How do we maintain brand voice?

## Quick Example: Blog Post Generator

### Step 1: Create Project

Project Name: "Blog Post Generator - v1"

System Prompt:

```
You are a professional tech blog writer for Sageloop.
Write engaging blog posts about AI, productivity, and software engineering.
Use clear language, include examples, keep tone conversational but professional.
```

### Step 2: Add Scenarios

```
Write a blog post about AI ethics
Explain how to use Sageloop for prompt engineering
Create a post about remote work productivity
Guide to building AI products
The future of AI assistants
```

### Step 3: Generate, Rate, Extract

Rate based on:

- Brand voice alignment
- Length and structure
- Technical accuracy
- Engagement

### Step 4: Get Insights

Pattern extraction reveals:

- Optimal length: 800-1200 words
- Structure: Intro → Problem → Solution → Conclusion
- Tone: Professional but conversational (not academic)
- Examples: All 5-star posts include concrete examples

## Scenarios by Content Type

### Blog Posts

```
Write a blog post about [topic]
Explain [concept] for beginners
Create a guide to [tool/technique]
What's new in [field]
```

### Email Copy

```
Write a welcome email for new users
Create promotional email for [product]
Write a re-engagement email
Announce new feature: [description]
```

### Social Media

```
Write a LinkedIn post about [topic]
Create a Twitter thread about [topic]
Instagram caption for [product image]
TikTok script about [topic]
```

### Product Descriptions

```
Write product description for [product]
Create compelling headline for [product]
Write benefit-focused copy for [feature]
```

## Key Metrics for Content

### What Makes Content "5-Star"?

- **Clarity**: Easy to understand
- **Brand Voice**: Consistent with style guide
- **Structure**: Logical flow
- **Engagement**: Compelling and readable
- **Accuracy**: Factually correct

### Common Failure Patterns

**Pattern 1: Wrong Tone**

- 5-star: Conversational, friendly
- 1-star: Too formal, sounds like textbook

**Pattern 2: Missing Examples**

- 5-star: Includes concrete examples
- 1-star: Generic advice, no real examples

**Pattern 3: Wrong Length**

- 5-star: 800-1200 words (substantial)
- 1-star: 200 words (too brief)

**Pattern 4: Poor Structure**

- 5-star: Clear intro → problem → solution
- 1-star: Rambling, no clear structure

## Iteration Example

**Iteration 1** (65% success):

- Feedback: "Too formal, sounds like Wikipedia"
- Fix: Add "Use casual, conversational tone like talking to friends"

**Iteration 2** (80% success):

- Feedback: "Needs real examples"
- Fix: Add "Include 2-3 concrete examples"

**Iteration 3** (92% success):

- Feedback: "Better! A few posts are still too brief"
- Fix: Add "Posts should be 800-1200 words"

**Final** (96% success): Ready for production

## Tips for Content Evaluation

Rate based on:

- Brand voice alignment
- Readability and clarity
- Accuracy of information
- Engagement level
- Usefulness to reader

Don't rate based on:

- Personal preference for topic
- Whether you personally would read it
- Length alone (context matters)

## Export for Marketing Team

1. Export golden examples (5-star posts)
2. Extract insights (patterns and recommendations)
3. Share with team:
   - Marketing team uses golden examples as templates
   - Writers reference extracted patterns
   - CI/CD tests new content against standards

## Next Steps

- [Quick Start](../quickstart.md) - Start with your content
- [Rating System](../guide/rating-outputs.md) - Master the rating system
