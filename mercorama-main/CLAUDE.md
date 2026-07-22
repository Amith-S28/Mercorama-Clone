# Mercorama – CLAUDE.md

## Project Overview
- Platform: AI-powered trade intelligence tool for SMEs
- Stack: Hetzner VPS, Node.js/TypeScript, Supabase (Postgres),
  Next.js frontend, Anthropic API, Ollama (local SLM – planned)
- Deployed on: Hetzner (migrated from Vercel)
- Env vars managed via: .env on server, never committed to git

## Current Features (Live)
- Incoterm Recommender
- HS Code Intelligence
- Contract Clarity
- Payment Alignment
- Risk Allocation Scorecard

## Planned Features
- Export Readiness Checker (Q3 2026) – also PhD research instrument
- Country Import Intelligence Engine (Q1 2027):
  Layer 1: Country Trade Intelligence (UN Comtrade + Supabase tariff tables)
  Layer 2: Match Engine (company capabilities → HS code + country fit)
  Layer 3: Strategic Narrative (full AI-generated export opportunity brief)

## Build Sequence (Do Not Change Without Discussion)
1. Fix Anthropic API client on Hetzner (immediate)
2. Stand up local SLM service via Ollama on Hetzner (Mistral 7B or Phi-4 mini)
3. Implement SLM + Claude router across existing 5 features
4. Build Export Readiness Checker (Q3 2026)
5. Build Country Import Intelligence (Q1 2027)

## Model Strategy
- Default model for all tasks: claude-haiku-4-5-20251001 (Haiku 4.5)
- Use Sonnet (claude-sonnet-4-5-20251001) only for:
  - Country Intelligence Layer 2 Match Engine logic
  - Country Intelligence Layer 3 narrative generation
  - Any task requiring multi-step trade strategy reasoning
- Never use Opus
- Always set max_tokens conservatively (512–1024 unless task requires more)
- Do not enable streaming unless explicitly required

## SLM Routing Rules (Once Ollama is Live)
Route to LOCAL SLM if:
- User asks "what is / explain / define / difference between X"
- Request is for a standard clause template or Incoterm definition
- HS task is "suggest headings to inspect" (not final code)
- Message length < 200 chars with no country + payment + risk combo

Route to CLAUDE (Haiku) if:
- Final HS code + duty + FTA eligibility decision
- Risk scoring or misalignment analysis across 2+ dimensions
- Contract red-flag detection or re-drafting
- Payment + Incoterm alignment scoring

Route to CLAUDE (Sonnet) if:
- Country Intelligence Layer 2 or Layer 3
- Complex multi-country, multi-factor strategy output

## Token Efficiency Rules (Mandatory)
- Run /clear between features; never carry context across unrelated tasks
- Run /compact at ~70% context fill, never wait for auto-compact at 95%
- Run /cost at the start and end of every session
- Start every session with: "Do not write code yet. Read the relevant
  files and write a plan to plan.md first."
- Keep CLAUDE.md under 400 lines – move detail to /skills/ files
- Disable any MCP servers not actively needed for the current task

## Skills Files (Load On-Demand Only)
- @skills/supabase-schema.md    – DB schema, table conventions, Supabase rules
- @skills/comtrade-pipeline.md  – UN Comtrade API usage, ingestion patterns
- @skills/anthropic-client.md   – Anthropic SDK usage, model names, error handling
- @skills/slm-router.md         – SLM routing logic, Ollama setup, classifier prompts
- @skills/export-readiness.md   – Export Readiness Checker logic + PhD data notes
- @skills/country-intelligence.md – Layer 1/2/3 architecture and data sources

Do NOT load all skills at once – only load the file relevant to
the current task.

## Coding Conventions
- Language: TypeScript (Node.js) throughout
- All Anthropic API calls go through a single shared client function:
  callClaudeHaiku(prompt: string): Promise<string>
  callClaudeSonnet(prompt: string): Promise<string>
- All SLM calls go through:
  callLocalSLM(prompt: string): Promise<string>
- Router function:
  routeQuery(userMessage: string): Promise<string>
  – decides which client function to call
- All env vars accessed via a single config.ts file, never inline
- Errors: always log HTTP status + full response body from Anthropic

## What NOT to Do
- Do not rewrite working modules unless the task explicitly requires it
- Do not add new dependencies without confirming in plan.md first
- Do not use fetch() directly for Anthropic calls – use the SDK
- Do not commit .env or any API keys
- Do not add comments that explain obvious code
- Do not use Opus
