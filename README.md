# Sageloop

**Behavioral design tool for AI products.** Think "Figma for AI Evals."

Define what good looks like. Generate outputs. Rate them. Extract quality patterns. Export test suites. All locally, no cloud required.

---

## Quick Start

```bash
git clone https://github.com/sageloop/sageloop.git
cd sageloop
npm install
cp sageloop.config.example.yaml sageloop.config.yaml
# Add your API key(s) to sageloop.config.yaml
npm run dev
# Open http://localhost:3000
```

Database auto-creates on first boot. No Docker, no external services.

API keys can also be configured via the UI at **Settings → API Keys**.

---

## Features

- **Scenario management** — define test inputs for your AI system
- **Multi-model generation** — OpenAI (GPT-4o, GPT-4.1) and Anthropic (Claude Sonnet 4, Claude Haiku 4.5)
- **Rating interface** — rate outputs 1–5 stars with feedback and tags
- **Pattern extraction** — AI-powered dimensional analysis of what makes outputs good or bad
- **Failure clustering** — automatic grouping of similar failures with suggested prompt fixes
- **Prompt iteration** — apply fixes, re-generate, compare versions
- **Test suite export** — JSON, Markdown, Pytest, Jest formats
- **Local-first** — SQLite database, YAML config, your own API keys

---

## Configuration

Edit `sageloop.config.yaml`:

```yaml
openai_api_key: "sk-..."
anthropic_api_key: "sk-ant-..."
default_model: "gpt-4o-mini"
```

At least one API key is required. You can also use environment variables `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` instead.

---

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite via better-sqlite3 + Drizzle ORM
- **AI**: OpenAI, Anthropic

---

## Project Structure

```
app/          — Next.js App Router pages and API routes
components/   — React components
lib/          — Core libraries (AI, database, config, queue)
lib/db/       — SQLite schema and Drizzle ORM client
lib/ai/       — AI generation, provider resolution
lib/queue/    — In-process generation queue
types/        — TypeScript type definitions
drizzle/      — Database migrations
```

---

## Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run type-check   # TypeScript check
npm test             # Run tests
```

---

## License

MIT
