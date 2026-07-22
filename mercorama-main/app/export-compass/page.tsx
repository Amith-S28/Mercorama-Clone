// app/export-compass/page.tsx — Marketing landing page for Export Compass
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Compass, CheckCircle2, ArrowRight, TrendingUp,
  ShieldCheck, Mail, Zap, BarChart3,
  ChevronRight, Globe, Package, Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Export Compass — Find Your Top Export Markets | Mercorama',
  description:
    'AI-powered GPS for Canadian exporters. Discover the top 10 global markets for any product — scored across demand, growth, FTA access, logistics, and risk. Branded PDF reports included.',
};

// ─── Static data ───────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: BarChart3,
    title: 'AI-Powered Export Scoring',
    body: 'Every market receives a composite Export Score (0–100) weighted across 6 factors — demand, growth, Canada advantage, market access, logistics, and risk. Discrimination is built in; scores span the full range.',
  },
  {
    icon: Globe,
    title: 'Top 10 Global Markets',
    body: 'Unlike tools that show 3 options, Export Compass returns 10 ranked markets — a mix of established destinations and high-growth emerging economies. More choices, better decisions.',
  },
  {
    icon: ShieldCheck,
    title: 'FTA Advantage Flagged',
    body: 'Every market shows whether a Canadian FTA applies, which agreement covers it, and the resulting tariff rate. No manual FTA lookup needed — it\'s baked into the score.',
  },
  {
    icon: TrendingUp,
    title: 'Trade Signal Dashboard',
    body: 'Each market shows market size in USD, 5-year import growth, Canada\'s existing export share, top competitor countries, and an AI-generated 120-word market insight.',
  },
  {
    icon: Mail,
    title: 'Branded PDF Report by Email',
    body: 'Receive a professionally designed Mercorama PDF in your inbox — all 10 markets with score breakdowns, trade stats, AI insights, and cross-tool links in one shareable document.',
  },
  {
    icon: Zap,
    title: 'Two Steps, Under 90 Seconds',
    body: 'Enter your product description and optional HS Code. Click analyze. Get a ranked, scored list of 10 global markets — ready to explore, share, or act on immediately.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Describe your product',
    body: 'Enter your product description (be specific — type, format, end-use). Optionally add your HS Code for more accurate tariff data. Canada is pre-set as the origin country.',
  },
  {
    n: '02',
    title: 'AI analyzes 50+ markets',
    body: 'Mercorama scans global import data, applies FTA advantage filters, weights 6 competitive factors, and returns the top 10 markets sorted by Export Score — in under 90 seconds.',
  },
  {
    n: '03',
    title: 'Review, explore & get your PDF',
    body: 'Drill into each market card — trade stats, sub-scores, competitors, AI insight. Enter your email to receive a branded PDF report with all 10 markets and actionable intelligence.',
  },
];

const SAMPLE_MARKETS = [
  {
    country: 'Germany',
    flag: '🇩🇪',
    fta: 'CETA',
    ftaColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    exportScore: 84,
    scoreColor: 'text-green-700 dark:text-green-400',
    scoreBg: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    marketSize: '$2.4B',
    growth: '+6.8%',
    insight: 'Tariffs eliminated on 98% of Canadian exports under CETA. High consumer spending, robust retail infrastructure, and strong demand for premium food and materials.',
  },
  {
    country: 'Japan',
    flag: '🇯🇵',
    fta: 'CPTPP',
    ftaColor: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
    exportScore: 78,
    scoreColor: 'text-green-700 dark:text-green-400',
    scoreBg: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    marketSize: '$3.8B',
    growth: '+4.2%',
    insight: 'CPTPP delivers phased tariff reductions to zero on most Canadian goods. USD 4T economy with high import appetite for quality agricultural, industrial, and consumer products.',
  },
  {
    country: 'Vietnam',
    flag: '🇻🇳',
    fta: 'CPTPP',
    ftaColor: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
    exportScore: 71,
    scoreColor: 'text-green-700 dark:text-green-400',
    scoreBg: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    marketSize: '$680M',
    growth: '+14.3%',
    insight: 'Fastest-growing CPTPP market. Rising middle class and rapid urbanisation driving import demand. Canadian goods benefit from zero-tariff access under CPTPP phase-in schedule.',
  },
];

const SCORING_FACTORS = [
  { label: 'Demand',          weight: '30%', desc: 'Market size and receptiveness' },
  { label: 'Growth',          weight: '20%', desc: '5-year import growth trajectory' },
  { label: 'Canada Advantage', weight: '20%', desc: "Canada's existing competitiveness" },
  { label: 'Market Access',   weight: '15%', desc: 'Tariff environment and FTA status' },
  { label: 'Logistics',       weight: '10%', desc: 'Distance, shipping, infrastructure' },
  { label: 'Risk',            weight: '5%',  desc: 'Regulatory and political risk' },
];

const PRICING_TIERS = [
  {
    name: 'Starter',
    planId: 'pro',
    price: '$79',
    runs: 5,
    included: true,
    note: '5 analyses / month (limited preview)',
    badge: null,
    featured: false,
  },
  {
    name: 'Growth',
    planId: 'team',
    price: '$199',
    runs: 20,
    included: true,
    note: '20 analyses / month',
    badge: 'Best for Export Compass',
    featured: true,
  },
  {
    name: 'Advisory',
    planId: 'enterprise',
    price: 'Custom',
    runs: null,
    included: true,
    note: 'Unlimited analyses',
    badge: 'Unlimited',
    featured: false,
  },
];

const FAQS = [
  {
    q: 'How does the Export Score work?',
    a: 'The Export Score (0–100) is a weighted composite: Demand (30%), Growth (20%), Canada Advantage (20%), Market Access (15%), Logistics (10%), and Risk (5%). Each factor is scored by AI based on publicly known trade patterns, FTA schedules, and import statistics. Scores are intentionally spread across the range — a score of 70+ signals a strong opportunity.',
  },
  {
    q: 'Which Canadian FTAs does Export Compass cover?',
    a: 'All 11 active Canadian FTAs: CETA (EU), CPTPP (Asia-Pacific), CUSMA (US/Mexico), CKFTA (South Korea), EFTA (Iceland, Norway, Switzerland, Liechtenstein), CCOFTA (Colombia), CCRFTA (Costa Rica), CPAFTA (Panama), CHFTA (Honduras), CIFTA (Israel), and CPEFTA (Peru). FTA status is factored into the Market Access score and shown on every market card.',
  },
  {
    q: 'How accurate are the trade data and tariff figures?',
    a: 'Export Compass generates AI estimates based on publicly available trade data, FTA text, and HS code schedules. Import values, growth rates, Canada export share, and tariff rates are illustrative estimates, not live data feeds. Always verify specific duty rates and market conditions with a licensed customs broker and your local Trade Commissioner Service before acting.',
  },
  {
    q: 'Can I use my HS Code to improve results?',
    a: "Yes — entering your HS Code significantly improves tariff accuracy and enables more precise FTA matching. If you don't have your HS Code, use the Mercorama HS Code Assistant to classify your product first, then return to Export Compass with the code pre-filled.",
  },
  {
    q: 'What does the PDF report include?',
    a: 'A Mercorama-branded PDF with all 10 markets, each including: country, FTA status, Export Score, trade stats (market size, growth, Canada share, tariff), top competitor countries, AI-generated insight, and sub-score breakdown across all 6 factors. Plus a cross-tool section linking to FTA Diversify, HS Code Assistant, Deal Wizard, and Deal Summary Generator.',
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ExportCompassMarketingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-indigo-50 via-background to-background dark:from-indigo-950/30 dark:via-background px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-indigo-100/40 dark:bg-indigo-900/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 text-sm">
            <Compass className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-400" />
            <span className="font-semibold text-indigo-700 dark:text-indigo-400">A GPS for Canadian exporters</span>
            <span className="ml-1 rounded-full bg-indigo-700 dark:bg-indigo-500 px-2 py-0.5 text-xs font-semibold text-white">Growth Plan</span>
          </div>

          <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Find your top 10 export markets{' '}
            <span className="text-indigo-700 dark:text-indigo-400">in under 90 seconds</span>
          </h1>

          <p className="mb-8 mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Export Compass uses AI to score 50+ global markets across 6 competitive factors —
            demand, growth, Canada advantage, FTA access, logistics, and risk — and returns the
            top 10, ranked, with branded PDF reports by email.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth/signup?plan=team">
              <Button size="lg" className="gap-2 bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-sm">
                Start with Growth Plan
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard?tool=export-compass">
              <Button size="lg" variant="outline" className="gap-2 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30">
                Open Export Compass
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {[
              '10 markets per analysis',
              '6-factor AI scoring',
              '11 Canadian FTAs covered',
              'Branded PDF reports by email',
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="border-b bg-indigo-900 dark:bg-indigo-950 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            {[
              { value: '50+',  label: 'Global markets scanned' },
              { value: '10',   label: 'Ranked markets per analysis' },
              { value: '6',    label: 'Weighted scoring factors' },
              { value: '11',   label: 'Canadian FTAs covered' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
                <p className="mt-0.5 text-xs text-indigo-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-b px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">How it works</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Product description to market intelligence in 3 steps
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/40">
                  <span className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{step.n}</span>
                </div>
                <h3 className="mb-2 text-base font-semibold">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Sample markets ── */}
      <section className="border-b bg-muted/30 px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">Sample output</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Scored markets with trade intelligence — not generic lists
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
              Every market includes an Export Score, FTA status, trade signals, competitor analysis,
              and an AI-generated insight — tailored to your product.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {SAMPLE_MARKETS.map((m) => (
              <div key={m.country} className="rounded-xl border bg-background p-5 shadow-sm">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{m.flag}</span>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{m.country}</p>
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', m.ftaColor)}>
                        {m.fta}
                      </span>
                    </div>
                  </div>
                  <div className={cn('flex flex-col items-center rounded-xl border px-3 py-1.5', m.scoreBg)}>
                    <span className={cn('text-xl font-bold tabular-nums leading-none', m.scoreColor)}>
                      {m.exportScore}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Export Score</span>
                  </div>
                </div>
                {/* Stats */}
                <div className="mb-3 grid grid-cols-2 gap-1.5">
                  <div className="rounded-md bg-muted/40 px-2.5 py-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Market size</p>
                    <p className="text-sm font-semibold">{m.marketSize}</p>
                  </div>
                  <div className="rounded-md bg-muted/40 px-2.5 py-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">5Y growth</p>
                    <p className="text-sm font-semibold text-green-600">{m.growth}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">{m.insight}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Sample data shown for illustrative purposes. Actual output is customised to your product and HS Code.
          </p>
        </div>
      </section>

      {/* ── Scoring methodology ── */}
      <section className="border-b px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">Scoring model</p>
              <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
                Six factors. One score.<br className="hidden sm:block" /> No guesswork.
              </h2>
              <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                The Mercorama Export Score is a weighted composite model built specifically for
                Canadian SMEs. It surfaces the markets where Canada already has competitive
                traction, not just the biggest economies.
              </p>
              <Link href="/dashboard?tool=export-compass">
                <Button className="gap-2 bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-700">
                  Try it with your product
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {SCORING_FACTORS.map((f) => (
                <div key={f.label} className="flex items-center gap-4 rounded-xl border bg-background px-4 py-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                    <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">{f.weight}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{f.label}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="border-b bg-muted/30 px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-700 dark:text-indigo-400">What's included</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Everything in one analysis
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-xl border bg-background p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/40">
                    <Icon className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
                  </div>
                  <h3 className="mb-1.5 text-sm font-semibold">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Plan info ── */}
      <section className="border-b px-4 py-10 sm:px-6 lg:px-8" id="pricing">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
              Export Compass is included in the Growth Plan
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Get access to Export Compass along with all other Mercorama tools.{' '}
            <Link href="/beta" className="underline underline-offset-2 hover:text-foreground">
              View full pricing →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Cross-tool promo ── */}
      <section className="border-b bg-muted/30 px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Complete your export workflow</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Found your market? Mercorama helps you enter it
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: Globe,
                title: 'FTA Diversify Wizard',
                desc: 'Go deeper on 3 FTA markets with full AI snapshots — market size, demographics, spending trends, tariff notes, and risk flags.',
                href: '/fta-diversify',
                plan: 'Growth',
                planStyle: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
              },
              {
                icon: Package,
                title: 'HS Code Assistant',
                desc: 'Classify your product to the correct HS Code with GRI-based reasoning and estimated duty rates for your target country.',
                href: '/hscode',
                plan: 'Starter',
                planStyle: 'bg-primary/10 text-primary',
              },
              {
                icon: Briefcase,
                title: 'Deal Wizard',
                desc: 'Go from product description to HS Code, Incoterm, and signed export contract in one four-step guided workflow.',
                href: '/deal',
                plan: 'Starter',
                planStyle: 'bg-primary/10 text-primary',
              },
            ].map((tool) => {
              const Icon = tool.icon;
              return (
                <Link key={tool.title} href={tool.href}>
                  <div className="group rounded-xl border bg-background p-5 hover:border-primary/40 transition-colors h-full">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', tool.planStyle)}>
                        {tool.plan}
                      </span>
                    </div>
                    <h3 className="mb-1.5 text-sm font-semibold group-hover:text-primary transition-colors">{tool.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{tool.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-b px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">FAQ</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Common questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border bg-background px-5 py-4 open:pb-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold">
                  {faq.q}
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/40">
            <Compass className="h-7 w-7 text-indigo-700 dark:text-indigo-400" />
          </div>
          <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to find your top 10 export markets?
          </h2>
          <p className="mb-8 text-base leading-relaxed text-muted-foreground max-w-xl mx-auto">
            Stop guessing which markets to enter. Let Export Compass score 50+ global opportunities
            and surface the ones where Canada already has an edge.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth/signup?plan=team">
              <Button size="lg" className="gap-2 bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 shadow-sm">
                Get the Growth Plan
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/beta">
              <Button size="lg" variant="outline">
                Compare all plans
              </Button>
            </Link>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Included in the Growth Plan ·{' '}
            <Link href="/beta" className="underline underline-offset-2 hover:text-foreground">
              View pricing
            </Link>
            {' '}· Cancel anytime
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
