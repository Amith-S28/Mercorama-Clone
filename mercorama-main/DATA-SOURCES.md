# Mercorama — Data Sources & Refresh Frequencies

Last updated: 2026-04-30

---

## 1. UN Comtrade

| Property | Detail |
|----------|--------|
| **What** | Global merchandise trade flow data (import/export values by HS code × country pair) |
| **Coverage** | Canada's top 73 export HS codes (6-digit, validated Apr 2026) × top 15 destination countries |
| **Frequency** | Monthly — split across 3 days (~23 HS codes/day × 15 countries ≈ 345 calls/day) |
| **API limit** | 500 calls/day on free tier |
| **Cron route** | `GET /api/cron/comtrade-sync` |
| **Schedule** | Manual trigger via admin panel (Quick or Full mode); chunked day=1/2/3 |
| **Supabase table** | `trade_flows` |
| **Source** | comtrade.un.org |

**HS code set (73 codes):** Covers chapters 03, 10, 12, 15, 19, 26, 27, 28, 30, 31, 39, 44, 47, 48, 71, 72, 74, 76, 84, 85, 87, 88 — Canada's top export categories by value (Mineral Fuels, Vehicles, Precious Metals, Machinery, Aerospace, Agriculture, Fertilizers, Wood/Pulp, Metals/Ores, Pharma/Chemicals, Electrical).

---

## 2. Statistics Canada (StatCan)

| Property | Detail |
|----------|--------|
| **What** | Canadian export statistics, retail trade data, provincial economic indicators |
| **Coverage** | Top 20 Canadian export HS codes; provinces NS, ON, BC, AB |
| **Frequency** | Monthly (batch) — top 10 codes in quick mode, top 20 in full mode |
| **Cron route** | `GET /api/cron/statcan-sync` |
| **Schedule** | Manual trigger via admin panel |
| **Supabase table** | `trade_flows`, `province_intel` |
| **Source** | www150.statcan.gc.ca (SDMX API) |

---

## 3. USITC — US International Trade Commission (HTS Schedule)

| Property | Detail |
|----------|--------|
| **What** | US Harmonized Tariff Schedule (HTS) — duty rates, special rates, chapter notes |
| **Coverage** | All chapters relevant to Canada's top 73 export HS codes (22 chapters) |
| **Frequency** | **Nightly** — runs at 02:00 UTC via Hetzner crontab |
| **Cron entry** | `0 2 * * * curl -s -H "x-cron-secret: $CRON_SECRET" https://mercorama.com/api/cron/usitc-ingest` |
| **Cron route** | `GET /api/cron/usitc-ingest` |
| **What it does** | Fetches full HTS schedule, diffs against prior snapshot, writes tariff changes to DB |
| **Supabase tables** | `hts_rates`, `tariff_changes` |
| **Source** | hts.usitc.gov/reststop/search |

---

## 4. Verified Tariff Rates (Manual / Admin-managed)

| Property | Detail |
|----------|--------|
| **What** | Manually verified MFN (Most Favoured Nation) duty rates for key HS code × country pairs |
| **Coverage** | Priority HS codes × major destination markets |
| **Frequency** | On-demand — admin panel CRUD via `GET/POST/DELETE /api/admin/tariff-rates` |
| **Managed by** | Admin users (email-gated) |
| **Supabase table** | `verified_tariff_rates` |
| **Notes** | These override AI-estimated rates in the HS Code Intelligence output when a verified rate exists. Layers 1–5 of tariff validation. |

---

## 5. WCO HS 2022 Reference Data (Static)

| Property | Detail |
|----------|--------|
| **What** | World Customs Organization HS 2022 nomenclature — 6-digit headings, descriptions, GRI rules |
| **Coverage** | Full HS 2022 schedule (~5,600 headings) |
| **Frequency** | **Static** — updated only on WCO revision cycles (every 5–6 years; next: HS 2028) |
| **Storage** | `data/hs6-reference.json` (local file, loaded at runtime) |
| **Used for** | Validating AI-generated HS codes against real WCO codes; nearest-code suggestions |
| **Source** | WCO HS 2022 |

---

## 6. Canada Province Intelligence

| Property | Detail |
|----------|--------|
| **What** | AI-generated export intelligence summaries for Canadian provinces (NS, ON, BC, AB) |
| **Coverage** | 4 provinces — key export sectors, opportunities, buyer signals |
| **Frequency** | **Bi-weekly** — Mon & Thu at 02:00 UTC |
| **Cron entry** | `0 2 * * 1,4 curl -s -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/canada-intel-refresh` |
| **Cron route** | `GET /api/cron/canada-intel-refresh` |
| **AI model** | Claude Haiku 4.5 |
| **Supabase table** | `province_intel` |
| **Source** | StatCan SDMX API + Claude AI synthesis |

---

## 7. Export Funding Programs

| Property | Detail |
|----------|--------|
| **What** | Canadian export funding programs, grants, and financing opportunities |
| **Coverage** | Federal + provincial funding programs relevant to Canadian exporters |
| **Frequency** | **Weekly** — triggered via cron or external scheduler |
| **Cron route** | `GET /api/cron/funding-sync` |
| **What it does** | Runs weekly sync, diffs changes, purges expired cache entries |
| **Supabase table** | `funding_programs`, `funding_sync_log` |
| **Source** | Government program databases (EDC, BDC, provincial programs) |

---

## 8. Expert Booking Reminders

| Property | Detail |
|----------|--------|
| **What** | Automated email reminders for Trade Experts Marketplace bookings |
| **Coverage** | All confirmed expert sessions scheduled within next 24–28 hours |
| **Frequency** | **Daily** — 08:00 UTC |
| **Cron entry** | `0 8 * * * curl -s -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/expert-reminders` |
| **Cron route** | `GET /api/cron/expert-reminders` |

---

## 9. Data Validation

| Property | Detail |
|----------|--------|
| **What** | Integrity checks on core data tables |
| **Checks** | `trade_flows` row count, `province_intel` all 4 provinces present, staleness checks |
| **Frequency** | On-demand via admin panel |
| **Cron route** | `GET /api/cron/data-validation` |
| **Output** | Pass/warning/error per check |

---

## Summary Table

| Source | What | Frequency |
|--------|------|-----------|
| UN Comtrade | Trade flows (73 HS × 15 countries) | Monthly (3-day chunked) |
| Statistics Canada | Canadian export stats + provincial data | Monthly |
| USITC HTS | US tariff schedule + duty rates | **Nightly** (02:00 UTC) |
| Verified Tariff Rates | Manually verified MFN duty rates | On-demand (admin) |
| WCO HS 2022 | HS code reference / validation | Static (HS 2028 next) |
| Province Intelligence | AI export briefs (NS/ON/BC/AB) | Bi-weekly (Mon + Thu) |
| Funding Programs | Export grants & financing | Weekly |
| Expert Reminders | Booking notification emails | Daily (08:00 UTC) |
| Data Validation | Table integrity checks | On-demand (admin) |

---

## Notes

- **HS Code Intelligence** output combines: WCO HS 2022 reference (validation) + USITC HTS rates (nightly) + `verified_tariff_rates` table (admin-managed) + Claude AI classification (real-time)
- **Export Compass** market scores are computed in real-time using `trade_flows` data (from Comtrade + StatCan monthly sync)
- All cron jobs are secured with `x-cron-secret` header; admin routes are email-gated
- Comtrade free tier: 500 API calls/day — the 3-day chunked sync was built to stay within this limit

---

## Recent Build Work — HS Codes & Tariffs (Apr 2026)

### Layer 1 — WCO HS 2022 Validation (`lib/hs/validator.ts`)
Built Apr 27, 2026 (commit `66cb1cd`).

- Validates every AI-generated HS code against the full WCO HS 2022 reference (5,613 leaf codes stored in `data/hs6-reference.json`)
- Flags invalid codes with `codeVerified: false` + `codeWarning` message
- Provides nearest valid alternatives (`nearestValidCodes`) when code not found
- Used in `/api/hscode/classify` — result tagged as `codeSource: 'WCO HS 2022'`

### Layer 2 — Verified Tariff Rates (`lib/tariff-rates.ts`)
Built Apr 27, 2026 (commit `66cb1cd`). Expanded from 21 → 554 lines.

- **Coverage:** 73 priority HS codes × 12 countries: US (CUSMA), EU (CETA), CN, JP (CPTPP), GB (CUKTCA), KR (CKFTA), AU, MX, BR, ID, IN, CH
- **Lookup chain:** 6-digit exact match → 4-digit fallback → 2-digit (chapter) fallback
- **FTA rates included:** CUSMA 0%, CETA 0%, CPTPP preferential rates
- Replaces hallucinated AI duty rates with verified static data

### Layer 3 — Anti-Hallucination Wiring
`lookupTariffRate()` injected into all 4 high-risk routes:
- `/api/hscode/classify` — overrides `duty.estimatedRate`
- `/api/fta-diversify/suggest` — overrides `tariffInsight` fields
- `/api/export-compass/analyze` — overrides `tariffRate` per market
- `/api/generate-deal-playbook` — verified rate injected into Claude prompt; system prompt now explicitly forbids AI from fabricating tariff numbers

### Layer 4 — Database (`verified_tariff_rates` table)
Migration `016_verified_tariff_rates.sql`:
- Supabase table with RLS, indexes, `updated_at` trigger
- `lookupTariffRateFromDb()` — DB-first lookup with static fallback
- `upsertTariffRate()` — admin write function
- Admin CRUD API: `GET/POST/DELETE /api/admin/tariff-rates`
- Admin UI: `/admin/tariff-rates` (email-gated)

### Layer 5 — UI Badges
- `TariffBadge` — shows Verified / Estimated / Unknown with colour coding
- `HsCodeBadge` — shows WCO verified / unverified status
- Wired into HS classifier (`app/hscode/_components/hs-classifier.tsx`) and Deal Wizard dossier summary

---

### HS Code List Corrections (commit `9be233f`, Apr 25 2026)
- `271000` (invalid generic code) → split into `271012` (light oils) + `271019` (other petroleum products)
- Added `870360`, `870370`, `870380` — HS 2022 EV subheadings for electric vehicles
- Total HS codes in sync set: **73** (was 70)

### HS Intelligence Layer (`lib/hs/intelligence.ts`, `lib/hs/knowledge.ts`)
Built Apr 23, 2026 (commit `bafd7b3`):
- 3-stage orchestrator: `early` (SLM) → `exploring` (Haiku) → `execution` (Sonnet)
- Knowledge base for 7 product categories injected into prompts
- Standalone HS Code Assistant archived; intelligence now runs through unified orchestrator
