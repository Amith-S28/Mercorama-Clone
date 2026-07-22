# Mercorama Platform — Current Build Structure

**Last updated:** April 25, 2026

## Platform Overview

**Mercorama** is an AI-powered trade intelligence platform for Canadian SMEs. It operates as a dual-domain setup:
- **mercorama.com** — Marketing site
- **board.mercorama.com** — Dashboard application (OS-style persistent shell)

**Stack:** Next.js 16 (standalone) · TypeScript · Supabase (Postgres + pgvector) · Anthropic Claude (Haiku + Sonnet) · Ollama (local SLM) · PM2 · Nginx · Hetzner VPS

---

## Dashboard Architecture

The dashboard is a persistent "operating system" — sidebar always visible, tools render inside via `?view=` params. User never leaves `/dashboard`.

```
/dashboard                    → BGI Dashboard (intelligence surface)
/dashboard?view=profile       → Business Snapshot (inline Sheet or view)
/dashboard?view=canada-markets → Canada Explorer
/dashboard?view=canada-plan   → Canada Go-to-Market Plan
/dashboard?view=global-markets → Export Compass (Global Markets)
/dashboard?view=export-plan   → Deal Builder (Export Plan)
/dashboard?view=trade-advantage → FTA Diversify (Trade Advantage)
/dashboard?view=freight-connect → Freight Connect
/dashboard?view=fund-my-export → Fund My Export
/dashboard?view=find-experts  → Expert Marketplace Search
```

Legacy `?tool=` routes preserved for bookmarks.

---

## Growth Intent System

Users choose their path at the Business Snapshot stage:

**Canada Path:**
```
Business Snapshot → Canada Explorer (province picker Sheet)
→ Canada Go-to-Market Plan (retail + distribution + regulatory)
→ Talk to an Expert
```

**Global Path:**
```
Business Snapshot → Global Markets (Export Compass)
→ Export Plan (Deal Builder: HS → Incoterm → Deal Summary)
→ Talk to an Expert
```

The two paths never overlap — Canada users see Canada-specific CTAs, journey labels, and tools.

---

## Active Tools & Features

| Tool | View | Status | AI Model |
|---|---|---|---|
| **Business Snapshot** | `?view=profile` / Sheet | Active | None (form only) |
| **Canada Explorer** | Sheet in dashboard | Active | Haiku (AI suggestions) + Supabase (real data) |
| **Canada Go-to-Market Plan** | `?view=canada-plan` | Active | Haiku via Orchestrator |
| **Export Compass (Global Markets)** | `?view=global-markets` | Active | Haiku via Orchestrator |
| **Deal Builder (Export Plan)** | `?view=export-plan` | Active | Haiku (HS, Incoterm) + Sonnet (Playbook) |
| **Trade Advantage (FTA Diversify)** | `?view=trade-advantage` | Active | Haiku via Orchestrator |
| **Freight Connect** | `?view=freight-connect` | Active | None (data-driven) |
| **Fund My Export** | `?view=fund-my-export` | Active | None (EDC/BDC matching) |
| **Expert Marketplace** | `?view=find-experts` | Active | None (search + booking) |
| **HS Code Assistant** | Archived (banner) | Accessible via `?tool=hs-code-assistant` | Haiku |
| **Incoterms Analyzer** | Archived (banner) | Accessible via `?tool=incoterms-analyzer` | Haiku |
| **Deal Summary Generator** | Archived (banner) | Accessible via `?tool=deal-summary-generator` | Haiku |

---

## Intelligence Orchestrator

All AI calls route through a single orchestrator:

```
lib/intelligence/
├── types.ts          — IntelligenceStage, IntelligenceLayer, IntelligenceContext
├── retrieval.ts      — Knowledge loader (HS + Incoterm + Market)
├── router.ts         — Model router (SLM → Haiku → Sonnet)
└── orchestrator.ts   — runIntelligenceLayer<T>()
```

**Stage routing:**
| Stage | Model | Used By |
|---|---|---|
| `early` | Ollama SLM (fallback: Haiku) | Quick suggestions |
| `exploring` | Claude Haiku (system+user split) | HS classify, Incoterm insights, Canada plan, Export Compass, FTA suggest, Canada Explorer |
| `execution` | Claude Sonnet | Deal Playbook only |

---

## Knowledge Layers (Vectorless RAG)

```
lib/hs/knowledge.ts        — 7 product categories (seafood, maple, wood, etc.)
lib/incoterm/knowledge.ts   — All 11 Incoterms 2020
lib/market/knowledge.ts     — 8 category rules + 9 country contexts + FTA data
```

Cross-layer injection: Compliance layer (Deal Playbook) gets HS + Incoterm + Market knowledge combined.

---

## Canada Market Intelligence (Supabase)

**Tables:**
| Table | Records | Purpose |
|---|---|---|
| `canada_provinces` | 4 | NS, ON, BC, AB with demographics |
| `canada_retail_chains` | 15 | National + regional grocery, pharmacy, health specialty |
| `canada_distributors` | 8 | Broker, direct-to-retail, hybrid models |
| `province_intel` | 4 | Intelligence per province+category (specialty_food) |

**RAG support:** pgvector extension enabled, `vector(768)` embedding column on `province_intel`, IVFFLAT index, `search_province_intel()` function.

**Admin panel:** `/dashboard/admin/canada-intel` — 4×3 status grid, province intelligence editor, AI summary generation, RAG embedding generation.

**Cron:** Bi-weekly refresh (Mon + Thu at 2am) — StatCan signals + Claude Haiku intelligence update + Ollama embedding regeneration.

---

## Expert Marketplace

- Public search with tier-based gating
- Expert profiles with verification badges
- B2B advisory workflow: Request → Proposal → Booking
- Expert Studio (profile, services, availability, bookings)
- Collections / curated expert groups
- Application flow for new experts
- Cal.com integration (self-hosted) for scheduling
- Admin panel for expert management

---

## API Routes (90+ endpoints)

**Core intelligence:** `/api/hscode/classify`, `/api/incoterm-insights`, `/api/enhance-hs`, `/api/generate-deal-playbook`, `/api/export-compass/*`, `/api/fta-diversify/suggest`, `/api/canada/plan`, `/api/canada/provinces/*`, `/api/canada/intelligence`

**Expert marketplace:** `/api/experts/*`, `/api/bookings/*`, `/api/studio/*`

**Freight Connect:** `/api/freight-connect/*` (search, quote, claim, analytics, billing)

**Admin:** `/api/admin/province-intel/*`, `/api/admin/retail-chains`, `/api/admin/distributors`, `/api/admin/experts/*`, `/api/admin/freight-connect/*`, `/api/admin/cohorts/*`

**Cron:** 7 scheduled jobs (log-purge, expert-reminders, canada-intel-refresh, comtrade-sync, statcan-sync, funding-sync, usitc-ingest)

---

## Supabase Migrations (15)

| # | Migration | Purpose |
|---|---|---|
| 001 | blog_and_pages | CMS tables |
| 002 | pricing_seed | Plan pricing |
| 003 | fund_my_export | Funding programs |
| 004-005 | freight_connect | Forwarder marketplace |
| 006-008 | cohort_beta | Beta application flow |
| 009 | canada_restriction | Geo-gating |
| 010 | data_trust | Data validation pipeline |
| 011-012 | live_data + province_trade | Comtrade/StatCan ingestion |
| 013 | canada_market_intel | Provinces, chains, distributors, province_intel + pgvector |
| 014 | province_intel_seed | 4 province intelligence rows |
| 015 | snapshot_growth_intent | Growth intent column on user_snapshots |

---

## Dashboard Intelligence Surface

The dashboard home shows:
- **Growth Focus** — primary CTA based on 5 deterministic states (A-E)
- **Growth Journey** — clickable step progress (intent-aware labels)
- **Market Signals** — 2-3 contextual insights
- **Suggested Actions** — clickable cards with specific routing
- **Continue Where You Left Off** — last view tracking
- **Active Export Plan** / **Market Tracking** — conditional cards
