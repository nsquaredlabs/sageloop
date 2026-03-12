# Sageloop Documentation

Welcome to the Sageloop documentation. Select from the sections below based on your role.

## Quick Start

**New to Sageloop?** Start here:

- [Quickstart Guide](user/quickstart.md) - Get up and running in 5 minutes
- [Your First Project](user/your-first-project.md) - Step-by-step walkthrough
- [Core Concepts](user/core-concepts.md) - Understand the key ideas

## User Documentation

Learn how to use Sageloop to evaluate and improve your AI products.

### Getting Started

- [Quickstart](user/quickstart.md)
- [Your First Project](user/your-first-project.md)
- [Core Concepts](user/core-concepts.md)
- [Common Workflows](user/common-workflows.md)
- [FAQ](user/faq.md)

### Feature Guides

- [Creating Scenarios](user/guide/creating-scenarios.md)
- [Generating Outputs](user/guide/generating-outputs.md)
- [Rating Outputs](user/guide/rating-outputs.md)
- [Pattern Extraction](user/guide/pattern-extraction.md)

### Use Cases

- [Customer Support](user/use-cases/customer-support.md)
- [Code Assistance](user/use-cases/code-assistance.md)
- [Content Generation](user/use-cases/content-generation.md)
- [Data Extraction](user/use-cases/data-extraction.md)

## Developer Documentation

Build and extend Sageloop. Start with [Code Organization](developer/code-organization.md) to understand the project structure.

### Developer Guides

- [Code Organization](developer/code-organization.md) - Project structure and architecture
- [AI Integration](developer/ai-integration.md) - OpenAI, Anthropic, and provider resolution
- [API Patterns](developer/api-patterns.md) - Error handling, authentication, responses
- [Database Queries](developer/database-queries.md) - Supabase patterns and RLS
- [Environment Variables](developer/environment.md) - Type-safe env configuration
- [Design System](developer/design-system.md) - UI components and Tailwind tokens
- [Testing](developer/testing.md) - Unit, integration, and E2E testing
- [Security Notes](developer/security-notes.md) - Security best practices

### Security & Advanced Topics

- [Security Checklist](security/SECURITY_CHECKLIST.md) - Required security review before commits
- [Prompt Injection Analysis](security/PROMPT_INJECTION_ANALYSIS.md) - Injection attack patterns and mitigations
- [Extraction System Prompt](developer/extraction-system-prompt.md) - Pattern extraction AI system prompt

## Product Documentation

Strategic product information for stakeholders.

- [Design System](product/DESIGN_SYSTEM.md) - UI/UX specifications and brand guidelines
- [Extraction System Prompt](product/EXTRACTION_SYSTEM_PROMPT.md) - Pattern extraction specifications

## Reference Materials

Quick lookup and technical references.

- [Event Parser Test Scenarios](reference/event-parser-test-scenarios.md) - Test scenarios for event parsing
- [System Prompt Variables Summary](reference/system-prompt-vairables-summary.md) - AI prompt variable reference
- [Future Ideas](reference/future-ideas.md) - Planned features and enhancements

## Implementation & Planning

Recent feature implementations and technical plans.

- [Pattern Analysis Implementation Plan](implementation/pattern-analysis-implementation-plan.md)
- [Extraction History Implementation](implementation/extraction-history-implementation.md)

## Archive

Older documentation, sprint summaries, and historical records.

- [Design Sprint Summaries](archive/design-sprints/) - Historical design sprint notes
- [Product Roadmap](archive/PRODUCT_ROADMAP.md) - Legacy roadmap
- [Product Spec v2](archive/product-spec-v2.md) - Previous product specification
- [Security Training](archive/SECURITY_TRAINING.md) - Security fundamentals guide
- [Dogfooding Documentation](archive/DOGFOODING_PLAN.md) - Internal testing process

## Directory Structure

```
docs/
├── user/                 # End-user documentation
│   ├── guide/           # Feature how-to guides
│   └── use-cases/       # Real-world usage examples
├── developer/           # Developer reference guides
├── security/            # Security documentation and analysis
├── product/             # Strategic product docs
├── reference/           # Quick reference materials
├── implementation/      # Recent feature implementation docs
└── archive/             # Historical documents
    ├── design-sprints/
    ├── sprint-summaries/
    └── obsolete/        # Deprecated documentation
```
