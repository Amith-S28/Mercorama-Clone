// app/fta-diversify/page.tsx — Marketing landing page for FTA Diversify Wizard
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Globe, CheckCircle2, ArrowRight, MapPin, TrendingUp,
  ShieldCheck, FileDown, Zap, BarChart3,
  ChevronRight, Building2, Package, Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Canada FTA Diversify Wizard | Mercorama',
  description:
    'Discover FTA-backed export markets for your products. AI-generated market snapshots, tariff notes, risk flags, and branded PDF reports — built for Canadian SMEs.',
};

// ─── Static data ───────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Globe,
    title: 'FTA-Backed Market Discovery',
    body: 'Identifies 3 high-potential markets covered by Canada\'s 11 active FTAs — CETA, CPTPP, CUSMA, CKFTA, EFTA, and more. Every suggestion comes with a direct tariff advantage.',
  },
  {
    icon: BarChart3,
    title: 'Full Market Snapshots',
    body: 'Each market includes market size, key buyer segments, demographics, spending trends, and a 3–5 year outlook — AI-generated from real trade data.',
  },
  {
    icon: ShieldCheck,
    title: 'Risk Flags Included',
    body: 'Every recommendation surfaces regulatory, logistical, and competitive risks specific to that market — so you enter informed, not surprised.',
  },
  {
    icon: FileDown,
    title: 'Branded PDF Reports by Email',
    body: 'Receive a professionally designed PDF report in your inbox — Mercorama-branded with all market snapshots, tariff notes, and risk analysis in one document.',
  },
  {
    icon: Zap,
    title: 'Three Steps, Under Two Minutes',
    body: 'Enter your company profile and product, review the AI-generated markets, then generate your report. No onboarding. No uploads. Just answers.',
  },
  {
    icon: TrendingUp,
    title: 'HS Code Integration',
    body: 'Optionally link your HS Code to improve tariff accuracy. Works seamlessly with the Mercorama HS Code Assistant — no manual lookups needed.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Profile your company & product',
    body: 'Enter your province, sector, current export markets, product description, and optional HS Code. The more context you give, the sharper the recommendations.',
  },
  {
    n: '02',
    title: 'Review AI-generated FTA markets',
    body: 'Mercorama returns 3 FTA-backed markets with full snapshots: market size, segments, spending trends, tariff advantage under the relevant agreement, and risk flags.',
  },
  {
    n: '03',
    title: 'Select markets & receive your PDF',
    body: 'Choose the markets to include in your report. Enter your email and receive a Mercorama-branded PDF with the full analysis — ready to share with your team or advisor.',
  },
];

const SAMPLE_MARKETS = [
  {
    country: 'Germany',
    fta: 'CETA',
    ftaColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
    insight: 'EUR 2.4B premium consumer goods market. Tariffs eliminated on 98% of CA exports under CETA.',
    segments: ['Retail', 'E-commerce', 'Food service'],
  },
  {
    country: 'Japan',
    fta: 'CPTPP',
    ftaColor: 'bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300',
    insight: 'USD 3.8T economy with strong import appetite. CPTPP delivers phased tariff reductions to zero.',
    segments: ['Specialty retail', 'HORECA', 'Health & wellness'],
  },
  {
    country: 'South Korea',
    fta: 'CKFTA',
    ftaColor: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300',
    insight: 'Rapidly growing premium import category. 92% of CA tariff lines eliminated under CKFTA.',
    segments: ['Modern trade', 'Online platforms', 'Department stores'],
  },
];

const PRICING_TIERS = [
  {
    name: 'Starter',
    planId: 'pro',
    price: '$79',
    runs: 0,
    included: false,
    note: 'Not included — upgrade to Growth',
    badge: null,
  },
  {
    name: 'Growth',
    planId: 'team',
    price: '$199',
    runs: 30,
    included: true,
    note: '30 FTA analyses / month',
    badge: 'Best for FTA',
  },
  {
    name: 'Advisory',
    planId: 'enterprise',
    price: 'Custom',
    runs: null,
    included: true,
    note: 'Unlimited analyses',
    badge: 'Unlimited',
  },
];

const FAQS = [
  {
    q: 'Which Canadian FTAs does the wizard cover?',
    a: 'All 11 active Canadian FTAs: CETA (EU), CPTPP (Asia-Pacific), CUSMA (US/Mexico), CKFTA (South Korea), EFTA (Iceland, Norway, Switzerland, Liechtenstein), CCOFTA (Colombia), CCRFTA (Costa Rica), CPAFTA (Panama), CHFTA (Honduras), CIFTA (Israel), and CPEFTA (Peru).',
  },
  {
    q: 'How accurate are the tariff and market figures?',
    a: 'The AI draws on trade agreement texts, HS code schedules, and published trade data to generate tariff notes and market snapshots. We recommend verifying specific duty rates with a licensed customs broker before acting on them.',
  },
  {
    q: 'Can I run the wizard for multiple products?',
    a: 'Yes — each submission is a separate analysis. On the Growth plan you have 30 analyses per calendar month, which resets on the 1st of each month.',
  },
  {
    q: 'What does the PDF report include?',
    a: 'A Mercorama-branded PDF with your company/product profile, full market snapshots (market size, segments, demographics, spending trends, outlook), tariff advantage under the relevant FTA, risk flags, and a cross-reference to other Mercorama tools.',
  },
  {
    q: 'Is this only for Canadian exporters?',
    a: 'Yes — the tool is purpose-built for Canadian SMEs leveraging Canada\'s FTA network. All market suggestions must fall under a Canadian trade agreement.',
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function FtaDiversifyMarketingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-teal-50 via-background to-background dark:from-teal-950/30 dark:via-background px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
        {/* Background accent */}
        <div className="pointer-events-none absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-teal-100/40 dark:bg-teal-900/20 blur-3xl" />
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/30 px-3 py-1.5 text-sm">
            <Globe className="h-3.5 w-3.5 text-teal-700 dark:text-teal-400" />
            <span className="font-semibold text-teal-700 dark:text-teal-400">Canada FTA Market Discovery</span>
            <span className="ml-1 rounded-full bg-teal-700 dark:bg-teal-500 px-2 py-0.5 text-xs font-semibold text-white">Growth Plan</span>
          </div>

          <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Find your next export market{' '}
            <span className="text-teal-700 dark:text-teal-400">before your competitors do</span>
          </h1>

          <p className="mb-8 mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            The Canada FTA Diversify Wizard uses AI to match your product against Canada's 11 active
            Free Trade Agreements — returning ranked markets with tariff advantages, full market
            snapshots, and risk flags in under two minutes.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth/signup?plan=team">
              <Button size="lg" className="gap-2 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700 shadow-sm">
                Start with Growth Plan
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard?tool=fta-diversify">
              <Button size="lg" variant="outline" className="gap-2 border-teal-300 dark:border-teal-700 text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30">
                Open the Wizard
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {[
              '11 Canadian FTAs covered',
              'AI-powered market analysis',
              'Branded PDF reports by email',
              '30 analyses / month on Growth',
            ].map((item) => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FTA network stats bar ── */}
      <section className="border-b bg-teal-900 dark:bg-teal-950 px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
            {[
              { value: '11', label: 'Active Canadian FTAs' },
              { value: '50+', label: 'Countries covered' },
              { value: '98%', label: 'Tariff lines eliminated (CETA)' },
              { value: '3', label: 'Markets per analysis' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
                <p className="mt-0.5 text-xs text-teal-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-b px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-400">How it works</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              From product description to market report in 3 steps
            </h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="relative">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
                  <span className="text-lg font-bold text-teal-700 dark:text-teal-400">{step.n}</span>
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-400">Sample output</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Real market intelligence, not generic suggestions
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
              Every market is matched to an active Canadian FTA with a specific tariff advantage — not just a list of countries.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {SAMPLE_MARKETS.map((m) => (
              <div key={m.country} className="rounded-xl border bg-background p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-teal-600 shrink-0" />
                  <span className="font-semibold">{m.country}</span>
                  <span className={cn('ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold', m.ftaColor)}>
                    {m.fta}
                  </span>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{m.insight}</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.segments.map((s) => (
                    <span key={s} className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Sample data shown for illustrative purposes. Actual output is customised to your product and sector.
          </p>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="border-b px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-700 dark:text-teal-400">What's included</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need to choose your next market
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-xl border bg-background p-5">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/40">
                    <Icon className="h-5 w-5 text-teal-700 dark:text-teal-400" />
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
      <section className="border-b bg-muted/30 px-4 py-10 sm:px-6 lg:px-8" id="pricing">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/30 px-4 py-2">
            <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span className="text-sm font-semibold text-teal-800 dark:text-teal-300">
              FTA Diversify Wizard is included in the Growth Plan
            </span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Get access to the FTA Diversify Wizard along with all other Mercorama tools.{' '}
            <Link href="/beta" className="underline underline-offset-2 hover:text-foreground">
              View full pricing →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Cross-tool promo ── */}
      <section className="border-b px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Complete your export workflow</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Once you've found your market, Mercorama helps you close the deal
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: Package,
                title: 'HS Code Assistant',
                desc: 'Classify your product to the correct HS Code with GRI-based reasoning and estimated duty rates for your target country.',
                href: '/hscode',
                plan: 'Starter',
              },
              {
                icon: Briefcase,
                title: 'Deal Wizard',
                desc: 'Go from product description to HS Code, Incoterm, and signed export contract in one four-step guided workflow.',
                href: '/deal',
                plan: 'Starter',
              },
              {
                icon: Building2,
                title: 'Deal Wizard',
                desc: 'Build your export plan end-to-end — from HS code through Incoterm to an export-ready deal summary, all in one flow.',
                href: '/deal',
                plan: 'Starter',
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
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
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
      <section className="border-b bg-muted/30 px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
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
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 dark:bg-teal-900/40">
            <Globe className="h-7 w-7 text-teal-700 dark:text-teal-400" />
          </div>
          <h2 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to find your next export market?
          </h2>
          <p className="mb-8 text-base leading-relaxed text-muted-foreground max-w-xl mx-auto">
            Join Canadian SMEs using Mercorama to identify, evaluate, and enter FTA-backed markets
            faster than ever before.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/auth/signup?plan=team">
              <Button size="lg" className="gap-2 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700 shadow-sm">
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
