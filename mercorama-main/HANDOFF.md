# Mercorama — Build Handoff Brief (2026-04-28)

## What is Mercorama
AI-powered trade intelligence platform for Canadian SMEs. Helps businesses identify export markets, classify products (HS codes), navigate Incoterms, and structure trade deals. Built by MightyIQ Inc.

**Live URL:** https://mercorama.com
**GitHub:** https://github.com/grtalluri/mercorama (branch: `main`)

---

## Stack
- **Frontend:** Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API routes (`app/api/`)
- **Database:** Supabase (Postgres + RLS)
- **AI:** Anthropic SDK — Haiku 4.5 default, Sonnet 4.5 for complex tasks
- **Infra:** Hetzner VPS (`root@77.42.16.7`), PM2 cluster, Nginx reverse proxy
- **Auth:** Supabase Auth
- **Payments:** Stripe

---

## Server Access
```bash
ssh -i ~/.ssh/server_iamgrt_id_ed25519 root@77.42.16.7
# App at: /var/www/mercorama
# Deploy: bash /var/www/mercorama/scripts/deploy.sh
# Deploy pulls from GitHub — always push first, then deploy
```

---

## GitHub
- Repo: https://github.com/grtalluri/mercorama
- Branch: `main`
- Git user: `grtalluri`

```bash
git clone https://github.com/grtalluri/mercorama.git
cd mercorama
# make changes, then:
git add . && git commit -m "feat: ..." && git push origin main
# then SSH in and deploy
```

---

## Git Version Snapshots
| Tag | What |
|-----|------|
| `mercoramav1-27042026` | Original landing page (restore point) |
| `mercoramadashv1` | Full backend + dashboard (restore point) |
| `04e9196` | Current HEAD as of 2026-04-28 |

**To restore a version:**
```bash
git checkout mercoramav1-27042026 -- app/page.tsx
git commit -m "revert(home): restore mercoramav1-27042026"
git push origin main
ssh -i ~/.ssh/server_iamgrt_id_ed25519 root@77.42.16.7 "bash /var/www/mercorama/scripts/deploy.sh"
```

---

## Live App Pages (Routes)
| Route | Purpose |
|-------|---------|
| `/` | Home / marketing landing page |
| `/dashboard` | Main user dashboard |
| `/export-compass` | Export market discovery tool |
| `/hscode` | HS Code classification tool |
| `/incoterms` | Incoterm analyzer |
| `/deal` | Deal Wizard (4-step guided flow) |
| `/deal-summary` | Deal summary output |
| `/contract` | Contract generator |
| `/risk` | Risk allocation scorecard |
| `/pricing` | Pricing page (Stripe-connected) |
| `/checkout` | Checkout page |
| `/blog` | Blog |
| `/about` | About page |
| `/contact` | Contact / book a demo |
| `/beta` | Early access signup |
| `/experts` | Trade Experts Marketplace |
| `/board-experts` | Experts board view |
| `/admin` | Admin panel (data sync, batch ops) |
| `/data-sources` | Data sources info page |
| `/data-retention` | Data retention policy |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

---

## Landing Page Components (`components/landing/`)
| File | Status |
|------|--------|
| `Hero.tsx` | Active — main hero section |
| `ExportCompassShowcase.tsx` | Active — white bg |
| `HowMercoramaWorksFlow.tsx` | Active — dark navy, 6-step animated flow |
| `WhyMercorama.tsx` | Active — white bg |
| `FinalCta.tsx` | Active — dark navy/teal gradient |
| `MarketingNav.tsx` | Active — sticky nav with horizontal logo |
| `HowItWorks.tsx` | In codebase but NOT used (merged into HowMercoramaWorksFlow) |
| `Features.tsx` | In codebase but NOT used (removed from page) |
| `MarketingFooter.tsx` | Available but not currently used |
| `WorldTradeMap.tsx` | react-simple-maps world map component |

**Current home page section order + colors:**
1. Hero — dark navy gradient (`<Hero />`)
2. Stats bar — light grey (`bg-muted/40`)
3. Export Compass Showcase — white (`<ExportCompassShowcase />`)
4. How Mercorama Works — dark navy (`<HowMercoramaWorksFlow />`)
5. Why Mercorama — white (`<WhyMercorama />`)
6. Why Choose stats — dark navy (`#0B1F3A`)
7. FAQ — light grey (`#F6F8FB`)
8. Final CTA — dark navy/teal gradient (`<FinalCta />`)

---

## API Routes (`app/api/`)
| Route | Purpose |
|-------|---------|
| `/api/analyze` | Core Claude analysis (Haiku/Sonnet router) |
| `/api/hscode` | HS code classification |
| `/api/incoterm` | Incoterm recommendation |
| `/api/deal` | Deal wizard steps |
| `/api/export-compass` | Market scoring |
| `/api/canada-explorer` | Canada trade data |
| `/api/fta-diversify` | FTA market finder |
| `/api/snapshot` | Report snapshot save |
| `/api/stripe` | Stripe checkout session |
| `/api/webhooks` | Stripe webhooks |
| `/api/experts` | Experts marketplace |
| `/api/admin` | Admin data sync triggers |
| `/api/cron` | Scheduled data sync jobs |
| `/api/mercorama` | Core platform API |

---

## Key Files
| File | Purpose |
|------|---------|
| `lib/claude.ts` | All Anthropic SDK calls (`callClaudeHaiku`, `callClaudeSonnet`, `callClaudeWithRetry`) |
| `lib/config.ts` | Single env var source — never access `process.env` directly elsewhere |
| `ecosystem.config.js` | PM2 config, loads `.env` into process |
| `app/page.tsx` | Home page — component-based, see section order above |
| `components/landing/` | All landing page section components |
| `public/mercorama-logo-hz.png` | Horizontal logo (eagle + globe + wordmark) |
| `public/og-image.png` | OG image (1200×630) |
| `public/home.html` | Staging HTML for home page redesign |
| `public/experts.html` | Staging HTML for experts page |
| `public/solution.html` | Staging HTML for solutions page |
| `public/about.html` | Staging HTML for about page |
| `public/contact.html` | Staging HTML for contact page |

---

## Brand Colors
| Token | Value |
|-------|-------|
| Navy | `#0B1F3A` |
| Teal (dark) | `#0d6e74` |
| Teal (light) | `#2DD4BF` |
| Blue | `#1F6FEB` |
| Light bg | `#F6F8FB` |

---

## What Was Done (2026-04-27/28)
- Added horizontal logo (`mercorama-logo-hz.png`) to nav + footer
- Installed `react-simple-maps` for world trade map component
- Removed: "Four Tools" section, "HS Code to Signed Contract in Four Steps" section
- Removed: "Everything you need in one export workspace" heading + entire Features section
- Merged `HowItWorks` (3 steps) into `HowMercoramaWorksFlow` (now 6 unified steps covering full journey)
- Fixed alternating section colors throughout home page (light → white → dark → white → dark → light → dark)
- Created staging HTML files in `public/` for offline redesign: home, experts, solution, about, contact
- Tagged two git restore points: `mercoramav1-27042026` and `mercoramadashv1`

---

## Staging HTML Files (for redesign work)
These are standalone single-file HTML pages (no Next.js dependency) at:
- `public/home.html` → accessible at https://mercorama.com/home.html
- `public/experts.html` → https://mercorama.com/experts.html
- `public/solution.html` → https://mercorama.com/solution.html
- `public/about.html` → https://mercorama.com/about.html
- `public/contact.html` → https://mercorama.com/contact.html

Edit locally, push to GitHub, deploy — then view at the URL above. Once finalized, convert back into Next.js components in `app/page.tsx`.

---

## Planned Next (priority order)
1. Continue home page marketing refinements
2. Build out experts, solution, about, contact pages from staging HTML
3. Export Readiness Checker (Q3 2026 target)
4. Country Import Intelligence Engine (Q1 2027 target)

---

## Rules for Claude (non-negotiable)
- Default model: `claude-haiku-4-5-20251001` — never use Opus
- All Anthropic API calls via `lib/claude.ts` — never use `fetch()` directly
- All env vars via `lib/config.ts` — never inline `process.env`
- Never commit `.env` or any secrets
- Always `git push` before running deploy script on server
- SSH always requires `-i ~/.ssh/server_iamgrt_id_ed25519`
- Load skills files on-demand only (`skills/anthropic-client.md`, `skills/comtrade-pipeline.md`, etc.)
- Do not rewrite working modules unless explicitly required
- Do not add dependencies without confirming first
