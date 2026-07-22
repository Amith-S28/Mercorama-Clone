import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Hash, ArrowRightLeft, Briefcase, FileText,
  Compass, Globe, Building2, Target, Zap, Users,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { PlatformDiagram } from '@/components/about/PlatformDiagram';

export const metadata: Metadata = {
  title: 'About Mercorama | AI-Powered Trade Intelligence',
  description:
    'Mercorama is built by MightyIQ Inc. — a Canada-based trade intelligence platform helping SMEs navigate global markets with AI-powered tools.',
};

const TOOLS = [
  {
    icon: Hash,
    name: 'HS Code Intelligence',
    href: '/hscode',
    description:
      'AI-assisted product classification against WCO Harmonized System 2022 nomenclature. Instantly identify the correct 6-digit HS code for customs, duty calculation, and trade statistics.',
  },
  {
    icon: ArrowRightLeft,
    name: 'Incoterms Navigator',
    href: '/incoterms',
    description:
      'Understand risk transfer, cost allocation, and seller/buyer responsibilities under each of the 11 Incoterms 2020 rules — tailored to your cargo type and trade corridor.',
  },
  {
    icon: Briefcase,
    name: 'Deal Wizard',
    href: '/deal',
    description:
      'Structure cross-border deals with payment terms, risk scorecards, and negotiation checklists aligned to your Incoterm and counterparty country.',
  },
  {
    icon: FileText,
    name: 'Deal Wizard',
    href: '/deal',
    description:
      'Build an export plan end-to-end — from HS code through Incoterm to an export-ready deal summary with clauses, milestones, and risk flags.',
  },
  {
    icon: Compass,
    name: 'Export Compass',
    href: '/export-compass',
    description:
      'Discover the highest-demand global markets for your product using live UN Comtrade import data — ranked by trade volume, growth, and strategic fit.',
  },
  {
    icon: Globe,
    name: 'FTA Diversify Wizard',
    href: '/fta-diversify',
    description:
      'Map your product HS code against active Free Trade Agreements to identify preferential tariff opportunities and reduce duty exposure across key corridors.',
  },
];

const VALUES = [
  {
    icon: Target,
    title: 'Execution-First',
    body: 'We ship tools that work in the real world — not slide decks. Every feature is built around an actual trade workflow pain point.',
  },
  {
    icon: Zap,
    title: 'Speed + Clarity',
    body: 'SMEs don\'t have procurement teams or customs lawyers on retainer. Mercorama delivers expert-level guidance in seconds, not weeks.',
  },
  {
    icon: Users,
    title: 'Built for SMEs',
    body: 'We focus on emerging exporters, Canadian growth brands, and international suppliers who need traction in new markets without enterprise overhead.',
  },
];

export default function AboutPage() {
  return (
    <>
    <Navbar />
    <main className="min-h-screen bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0B1F3A] px-4 py-20 sm:py-28 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#1F6FEB] opacity-20 blur-3xl" />
          <div className="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-[#2DD4BF] opacity-15 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center text-white">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5">
            <Building2 className="h-3.5 w-3.5 text-[#2DD4BF]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#2DD4BF]">
              Built by MightyIQ Inc.
            </span>
          </div>
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            About{' '}
            <span className="bg-gradient-to-r from-[#1F6FEB] to-[#2DD4BF] bg-clip-text text-transparent">
              Mercorama
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/70">
            AI-powered trade intelligence for SMEs navigating the complexity of global commerce —
            from HS classification to export-ready deal structure.
          </p>
        </div>
      </section>

      {/* ── Name origin ───────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border bg-muted/40 p-8 sm:p-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              The Name
            </p>
            <h2 className="mb-6 text-3xl font-bold tracking-tight">
              Where the name comes from
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border bg-background p-6">
                <p className="mb-1 text-2xl font-bold text-[#FF6100]">Merco</p>
                <p className="text-sm font-semibold text-foreground mb-2">from Mercantile</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Mercantile — relating to trade, commerce, and the movement of goods across
                  borders. It captures the core of what we do: enabling SMEs to trade
                  internationally with confidence and precision.
                </p>
              </div>
              <div className="rounded-xl border bg-background p-6">
                <p className="mb-1 text-2xl font-bold text-[#1F6FEB]">rama</p>
                <p className="text-sm font-semibold text-foreground mb-2">from Panorama</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Panorama — a wide, comprehensive, unobstructed view. Together, Mercorama
                  gives you a panoramic view of global trade: markets, duties, agreements,
                  and deal structure, all in one place.
                </p>
              </div>
            </div>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground text-pretty">
              The name reflects our mission: to give export-driven SMEs a{' '}
              <strong className="text-foreground">whole, clear picture</strong> of the global
              trading landscape — not fragmented data across a dozen government portals, but
              intelligent, actionable insight in a single platform.
            </p>
          </div>
        </div>
      </section>

      {/* ── Platform visual ───────────────────────────────────────────────── */}
      <section className="px-4 py-8 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
            The Platform
          </p>
          <h2 className="mb-10 text-3xl font-bold tracking-tight text-center">
            How Mercorama works
          </h2>

          <PlatformDiagram />

          <p className="mt-6 text-center text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Six tools connected through a shared intelligence layer — each one solving a specific
            pain point in the export journey, from product classification to market selection and
            deal structure.
          </p>
        </div>
      </section>

      {/* ── Tools ─────────────────────────────────────────────────────────── */}
      <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
            The Tools
          </p>
          <h2 className="mb-10 text-3xl font-bold tracking-tight text-center">
            Built for every stage of your export journey
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="group rounded-xl border bg-background p-5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6100]/10">
                    <tool.icon className="h-4 w-4 text-[#FF6100]" />
                  </div>
                  <p className="text-sm font-semibold leading-tight">{tool.name}</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center">
            Our Approach
          </p>
          <h2 className="mb-10 text-3xl font-bold tracking-tight text-center">
            How we think about trade intelligence
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {VALUES.map((v) => (
              <div key={v.title} className="rounded-xl border bg-muted/40 p-6">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#1F6FEB]/10">
                  <v.icon className="h-4.5 w-4.5 text-[#1F6FEB]" />
                </div>
                <p className="mb-2 font-semibold">{v.title}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Company ───────────────────────────────────────────────────────── */}
      <section className="bg-muted/30 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                The Company
              </p>
              <h2 className="mb-5 text-3xl font-bold tracking-tight">
                Built by MightyIQ Inc.
              </h2>
              <p className="mb-4 text-base leading-relaxed text-muted-foreground">
                MightyIQ Inc. is a Canada-based, globally oriented consultancy built for brands
                that need clarity and traction in new markets. We specialise in international
                trade enablement, CPG distribution strategy, and digital transformation for
                growth across borders.
              </p>
              <p className="mb-4 text-base leading-relaxed text-muted-foreground">
                Mercorama is the product of working directly with emerging Canadian exporters —
                seafood producers, food and beverage brands, and technology suppliers — who all
                faced the same friction: fragmented information, expensive professional advice,
                and tools built for enterprise, not SMEs.
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                Our process model is simple: <strong className="text-foreground">Discover → Strategy → Launch → Scale.</strong>{' '}
                Mercorama supports every stage of that journey with AI-powered, data-verified
                intelligence.
              </p>
            </div>
            <div className="rounded-2xl border bg-background p-8 space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Company</p>
                <p className="font-semibold">MightyIQ Inc.</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Headquarters</p>
                <p className="font-semibold">Bedford, Nova Scotia, Canada</p>
                <p className="text-sm text-muted-foreground">42 Lewis Drive, NS B4B 1C3</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Focus</p>
                <p className="text-sm text-muted-foreground">International trade enablement · CPG distribution · Digital growth systems</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Serving</p>
                <p className="text-sm text-muted-foreground">Export-driven SMEs across Canada and international suppliers entering North America</p>
              </div>
              <a
                href="https://mightyiq.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1F6FEB] hover:underline"
              >
                Visit mightyiq.ca →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight">
            Ready to explore global markets?
          </h2>
          <p className="mb-8 text-base leading-relaxed text-muted-foreground">
            Mercorama is in active Beta. Apply to get early access and help shape the platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/beta"
              className="inline-flex items-center justify-center rounded-md bg-[#FF6100] px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-[#e05500] transition-colors"
            >
              Apply for Beta →
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-md border px-6 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>

    </main>
    <Footer />
    </>
  );
}
