# Tellah

**AI Evals for PMs** - A behavioral design tool for AI products

## Overview

Tellah enables Product Managers to define what "good" AI behavior looks like through examples and ratings, rather than code. It creates a shared artifact between PMs and engineers for AI product quality.

**The Problem:** For AI products, there's no equivalent to Figma mockups that define acceptable behavior for probabilistic outputs. PMs write vague requirements, engineers write prompts, and no one can agree on what "right" looks like.

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

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Type check with TypeScript
- `npm run supabase:gen-types` - Regenerate types from Supabase schema

## Database Schema

- **projects** - Evaluation projects with AI configuration
- **scenarios** - Test scenarios (user inputs)
- **outputs** - AI-generated responses
- **ratings** - PM ratings and feedback
- **extractions** - AI-extracted behavioral patterns
- **metrics** - Success metrics over time

## Development Workflow

1. Make changes to the database schema in `supabase/migrations/`
2. Apply migrations: `supabase db reset`
3. Regenerate types: `npm run supabase:gen-types`
4. Build features using the typed Supabase client

## Documentation

- [Product Specification](docs/product-spec.md) - Detailed MVP requirements
- [CLAUDE.md](CLAUDE.md) - Project guidance for Claude Code

## License

ISC
