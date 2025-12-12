# Sageloop

**Intelligent Prompt Engineering** - A platform built for PMs who need to rapidly build and test AI prompts

## Overview

Sageloop enables Product Managers to define what "good" AI behavior looks like through examples and ratings, rather than code. It creates a shared artifact between PMs and engineers for AI product quality.

**The Problem:** For AI products, there's no equivalent to Figma mockups that define acceptable behavior for probabilistic outputs. PMs write vague requirements, engineers write prompts, and no one can agree on what "right" looks like. We solve this.

**Our Solution:** PM taste → Behavioral spec → Test suite

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL + Auth + Storage + Real-time)
- **Type Safety**: Supabase CLI auto-generated types
- **AI**: OpenAI API for generation and pattern extraction
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker Desktop (for local Supabase)
- Supabase CLI: `npm install -g supabase`
- OpenAI API key

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Start Supabase locally:**
   ```bash
   supabase start
   ```

   This will apply migrations and seed the database with sample data.

3. **Set up environment variables:**

   Copy `.env.example` to `.env.local` and add your OpenAI API key:
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` and add:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase Studio

View your local database at [http://127.0.0.1:54323](http://127.0.0.1:54323)

## Project Structure

```
/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── lib/                   # Utility libraries
│   ├── supabase.ts        # Supabase client + helpers
│   └── openai.ts          # OpenAI wrapper
├── types/                 # TypeScript types
│   └── supabase.ts        # Auto-generated from schema
├── components/            # React components
├── supabase/             # Database files
│   ├── config.toml       # Local Supabase config
│   ├── migrations/       # SQL migrations
│   └── seed.sql          # Sample data
└── docs/                 # Documentation
    └── product-spec.md   # Detailed MVP spec
```

## Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Type check with TypeScript
- `npm run supabase:gen-types` - Regenerate types from Supabase schema

### Testing
- `npm test` - Run unit tests in watch mode
- `npm test -- --run` - Run unit tests once (CI mode)
- `npm run test:ui` - Run tests with interactive UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:e2e:ui` - Run E2E tests with interactive UI

## Database Schema

- **projects** - Evaluation projects with AI configuration
- **scenarios** - Test scenarios (user inputs)
- **outputs** - AI-generated responses
- **ratings** - PM ratings and feedback
- **extractions** - AI-extracted behavioral patterns
- **metrics** - Success metrics over time

## Testing

Sageloop uses a comprehensive testing strategy to ensure code quality and prevent regressions:

### Test Suite Structure

```
tests/
├── setup.ts                          # Global test configuration & mocks
├── security/
│   └── rls.test.ts                  # Row Level Security tests
├── unit/
│   └── ai/
│       └── provider-resolver.test.ts # Provider selection tests
├── api/
│   └── projects.test.ts              # API validation tests
└── e2e/
    └── project-workflow.spec.ts      # End-to-end workflow tests
```

### Running Tests Locally

```bash
# Run all unit tests (watch mode)
npm test

# Run tests once (CI mode)
npm test -- --run

# Run with interactive UI
npm run test:ui

# Run with coverage report
npm run test:coverage

# Run E2E tests (requires dev server running)
npm run test:e2e
```

### Test Coverage

- **Security Tests**: Verify Row Level Security (RLS) enforcement
- **API Tests**: Validate request/response schemas and business logic
- **Unit Tests**: Test provider resolution and AI integration logic
- **E2E Tests**: Full user workflow validation with Playwright

### CI/CD Pipeline

The project uses GitHub Actions for continuous integration. On every push and pull request:

1. **Type Checking** - Validates TypeScript types across the codebase
2. **Unit Tests** - Runs all Vitest tests with coverage reporting
3. **E2E Tests** - Runs Playwright tests in Chromium
4. **Artifacts** - Uploads test reports and coverage to Codecov

**Pipeline Configuration**: [.github/workflows/test.yml](.github/workflows/test.yml)

**Required Secrets** (for CI):
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

**Test Results**:
- Playwright reports are available as workflow artifacts
- Coverage reports are uploaded to Codecov (optional)

### Writing Tests

Tests use:
- **Vitest** - Fast unit test runner with native ESM support
- **React Testing Library** - Component testing utilities
- **Playwright** - Cross-browser E2E testing
- **MSW** - API mocking for integration tests

See [docs/sprint-0-summary.md](docs/sprint-0-summary.md) for detailed testing setup documentation.

## Development Workflow

1. Make changes to the database schema in `supabase/migrations/`
2. Apply migrations: `supabase db reset`
3. Regenerate types: `npm run supabase:gen-types`
4. Build features using the typed Supabase client
5. Write tests to verify functionality
6. Run `npm test` to ensure tests pass before committing

## Documentation

- [Product Specification](docs/product-spec.md) - Detailed MVP requirements
- [CLAUDE.md](CLAUDE.md) - Project guidance for Claude Code

## License

ISC
