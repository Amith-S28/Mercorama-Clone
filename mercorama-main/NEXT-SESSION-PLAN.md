# Mercorama — Next Session Plan

**Date:** April 25, 2026
**Context:** Data integrity fixes for AI-generated HS codes and tariff rates

---

## Problem Statement

The platform has **5 critical hallucination risk points** where Claude AI generates HS codes and tariff rates that users act on — without server-side validation against verified data sources.

**Example observed:** Maple syrup tariff in China showed 45% in one run and 30% in another. Neither was validated against a real source.

---

## Agreed Fix Plan — 5 Layers

### Layer 1 — HS Code Validation Gate (CRITICAL)

**File:** `data/hs6-reference.json` exists (55,527 lines, full WCO HS 2022) but is NOT used for validation.

**Fix:**
- Create `lib/hs/validator.ts`
- Load `hs6-reference.json` as canonical lookup
- After Claude returns a code from `/api/hscode/classify`, validate it exists in the reference
- If invalid → flag + suggest nearest valid code
- Never show unverified code to user without a warning badge

### Layer 2 — Tariff Rate Verification (CRITICAL)

**Current state:** `lib/tariff-rates.ts` has only **21 entries** covering 10 countries × 3-4 HS chapters. Only used in `/api/enhance-hs`.

**Fix:**
- Expand `tariff-rates.ts` to cover all 73 priority HS codes × 15 countries
- Source verified rates from:
  - USITC HTS (US rates)
  - EU TARIC (EU/CETA rates)
  - National tariff schedules (Japan, China, Korea, etc.)
- Every AI route that mentions a tariff rate must check this lookup first
- If no verified rate → show "Estimated — verify with customs broker"

### Layer 3 — Apply Tariff Lookup to ALL Routes

**Currently only `/api/enhance-hs` uses `lookupTariffRate()`.** These routes also generate tariff numbers without verification:

| Route | What AI generates | Fix |
|---|---|---|
| `/api/hscode/classify` | `duty.estimatedRate` | Override with verified rate |
| `/api/fta-diversify/suggest` | `tariffInsight.baseTariffEstimate`, `ftaTariffEstimate` | Override with verified rate |
| `/api/export-compass/analyze` | `tariffRate` per country | Override with verified rate |
| `/api/generate-deal-playbook` | Tariff numbers in risk statements | Inject verified rates into prompt |

### Layer 4 — Supabase Verified Rates Table

**Create:** `verified_tariff_rates` table
- Columns: `hs_code`, `country_iso2`, `mfn_rate`, `preferential_rate`, `fta_name`, `source`, `verified_date`, `confidence`
- Admin panel page to manually verify/correct rates
- USITC cron auto-populates US rates
- Replaces the static `tariff-rates.ts` file over time

### Layer 5 — UI Confidence Labels

Every tariff number shown to users must have a source label:
- 🟢 **Verified** — "Source: USITC HTS 2024" (from verified_tariff_rates)
- 🟡 **Estimated** — "AI-generated, verify before quoting" (no verified rate available)
- 🔴 **Unknown** — "Consult customs broker" (no data at all)

---

## Implementation Order

1. **Layer 1 + 2 + 3** first (most impactful — stops hallucinated data from reaching users)
2. **Layer 4** (persistent storage replaces static file)
3. **Layer 5** (UI polish)

---

## Files to Touch

| File | Change |
|---|---|
| `lib/hs/validator.ts` | NEW — HS code validation against WCO reference |
| `lib/tariff-rates.ts` | EXPAND — 73 HS codes × 15 countries |
| `data/hs6-reference.json` | EXISTS — wire into validator |
| `/api/hscode/classify/route.ts` | Add validation gate + tariff override |
| `/api/fta-diversify/suggest/route.ts` | Add tariff override |
| `/api/export-compass/analyze/route.ts` | Add tariff override |
| `/api/generate-deal-playbook/route.ts` | Inject verified rates into prompt |
| `supabase/migrations/016_verified_tariff_rates.sql` | NEW — verified_tariff_rates table |
| Admin UI for tariff management | NEW page |

---

## What NOT to Touch

- Dashboard state logic
- Canada Explorer / Canada Plan
- Intelligence Orchestrator (working correctly)
- Cron jobs (already fixed and scheduled)
- Expert marketplace

---

## Session Summary (April 23-25, 2026)

### What was built:
1. Incoterm + HS Code Intelligence layers (archived standalone tools)
2. Deal Summary Generator archived → Deal Wizard output
3. Pure flow-driven dashboard with view-based OS routing
4. Intelligence surface (2-column: signals + actions)
5. Intelligence Orchestrator (types, retrieval, router, orchestrator)
6. Full intelligence flow (correct stages, market knowledge, vectorless RAG)
7. Growth intent system (Canada vs Global paths)
8. Canada Market Intelligence (Supabase tables + admin panel + cron)
9. Canada Go-to-Market Plan tool
10. Data Sources admin dashboard with quick/full sync
11. 73 HS codes × 15 countries Comtrade pipeline (3-day cycle)
12. All cron jobs fixed and scheduled

### What needs fixing next:
- HS code validation gate (Layer 1)
- Tariff rate verification (Layer 2-3)
- Supabase verified rates table (Layer 4)
- UI confidence labels (Layer 5)
