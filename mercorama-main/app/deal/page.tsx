// app/deal/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight, Briefcase, Search, Ship, FileText,
  CheckCircle2, AlertTriangle, Clock, Shield, Zap, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { MarketingCmsSection } from '@/components/marketing/MarketingCmsSection';

export const metadata: Metadata = {
  title: 'Deal Wizard — HS Code to Export-Ready Deal in 4 Steps | Mercorama',
  description:
    'The Deal Wizard guides you from product description to an export-ready deal dossier in four steps. HS Code classification, Incoterm selection, and deal dossier generation — all connected.',
};

export default function DealPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <section className="border-b bg-gradient-to-b from-primary/8 to-background px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-primary/10 px-3 py-1 text-sm">
              <Briefcase className="h-4 w-4 text-primary" />
              <span className="font-semibold text-primary">End-to-end export workflow</span>
            </div>
            <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
              HS Code to Export-Ready Deal<br className="hidden sm:block" />
              <span className="text-primary"> in Four Steps</span>
            </h1>
            <p className="mb-8 text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">
              Stop jumping between tariff databases, Incoterm guides, and deal summary templates.
              The Deal Wizard connects every stage of your export deal into one guided flow —
              powered by AI, grounded in international trade law.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/auth/signup">
                <Button size="lg" className="h-12 px-8 text-base gap-2 shadow-md">
                  <Briefcase className="h-4 w-4" />
                  Start Your First Deal
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/beta">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  View Pricing
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Available on Starter, Growth, and Advisory plans.</p>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-balance sm:text-3xl">
              The Export Deal Problem
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Most exporters waste hours — and make costly mistakes — by piecing together their deals manually.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: AlertTriangle,
                color: 'text-red-500',
                bg: 'bg-red-50 dark:bg-red-900/20',
                title: '12–15% of shipments have HS Code errors',
                body: 'Misclassification triggers customs delays, back-payments, and penalties of up to 4× the duty owed.',
              },
              {
                icon: Ship,
                color: 'text-amber-500',
                bg: 'bg-amber-50 dark:bg-amber-900/20',
                title: 'The wrong Incoterm costs you money',
                body: 'Sellers often bear unexpected freight or insurance costs because the Incoterm was chosen without understanding risk transfer.',
              },
              {
                icon: FileText,
                color: 'text-rose-500',
                bg: 'bg-rose-50 dark:bg-rose-900/20',
                title: 'Deal documents disconnected from the deal',
                body: 'Generic deal templates don\'t reference the HS Code or Incoterm — leaving gaps that lead to disputes and non-payment.',
              },
            ].map(({ icon: Icon, color, bg, title, body }) => (
              <div key={title} className="rounded-xl border bg-background p-6">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="mb-2 font-semibold leading-snug">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Four Steps */}
      <section className="border-y bg-muted/30 px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold text-balance sm:text-3xl">
              Four Steps. One Complete Deal.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Each step builds on the last — so nothing gets lost between classification, shipping terms, and deal summary.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                icon: Search,
                title: 'Describe Your Product',
                body: 'Enter your product description and buyer country. The AI classifies the HS Code using WCO General Rules of Interpretation.',
                color: 'text-violet-600',
                bg: 'bg-violet-100 dark:bg-violet-900/30',
                border: 'border-violet-200 dark:border-violet-800',
              },
              {
                step: '02',
                icon: Shield,
                title: 'Review HS Dossier',
                body: 'See the full dossier: 6–10 digit code, confidence score, legal references, misclassification flags, and estimated duty rate.',
                color: 'text-sky-600',
                bg: 'bg-sky-100 dark:bg-sky-900/30',
                border: 'border-sky-200 dark:border-sky-800',
              },
              {
                step: '03',
                icon: Ship,
                title: 'Choose Your Incoterm',
                body: 'Select from all 11 Incoterms 2020 with plain-language guidance on risk transfer, cost allocation, and insurance obligations.',
                color: 'text-amber-600',
                bg: 'bg-amber-100 dark:bg-amber-900/30',
                border: 'border-amber-200 dark:border-amber-800',
              },
              {
                step: '04',
                icon: FileText,
                title: 'Download Your Deal Dossier',
                body: 'Receive a structured deal dossier with your HS Code, Incoterm, line items, and suggested clause references — ready to review and share.',
                color: 'text-primary',
                bg: 'bg-primary/10',
                border: 'border-primary/20',
              },
            ].map(({ step, icon: Icon, title, body, color, bg, border }) => (
              <div key={step} className={`relative rounded-2xl border ${border} bg-background p-6`}>
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-6 w-6 ${color}`} />
                </div>
                <p className={`mb-1 text-3xl font-black ${color} opacity-30 leading-none`}>{step}</p>
                <h3 className="mb-2 font-semibold text-base leading-snug">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
            <div className="flex-1">
              <h2 className="mb-4 text-2xl font-bold text-balance sm:text-3xl">
                What You Walk Away With
              </h2>
              <p className="mb-8 max-w-lg text-muted-foreground leading-relaxed">
                Every Deal Wizard session produces four concrete outputs — no copy-pasting
                between tools, no missing references.
              </p>
              <div className="space-y-5">
                {[
                  {
                    icon: Search,
                    title: 'HS Code Dossier',
                    desc: '6–10 digit HS Code with GRI-based reasoning, confidence score, indent analysis, legal references, misclassification risk flags, and estimated MFN duty rate.',
                    color: 'text-violet-600',
                    bg: 'bg-violet-100 dark:bg-violet-900/30',
                  },
                  {
                    icon: Ship,
                    title: 'Incoterm Analysis',
                    desc: 'Your chosen Incoterm explained: exact risk transfer point, seller and buyer cost responsibilities, insurance obligations, and common pitfalls.',
                    color: 'text-sky-600',
                    bg: 'bg-sky-100 dark:bg-sky-900/30',
                  },
                  {
                    icon: FileText,
                    title: 'Deal Dossier PDF',
                    desc: 'Structured dossier with your HS Code, Incoterm, line items, suggested clause references, and risk scorecard — ready to download and share.',
                    color: 'text-amber-600',
                    bg: 'bg-amber-100 dark:bg-amber-900/30',
                  },
                  {
                    icon: Briefcase,
                    title: 'Deal Summary',
                    desc: 'A one-page deal summary referencing the product, buyer country, HS Code, Incoterm, and deal status — ready to share with your team or counterparty.',
                    color: 'text-primary',
                    bg: 'bg-primary/10',
                  },
                ].map(({ icon: Icon, title, desc, color, bg }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div>
                      <p className="font-semibold leading-tight mb-1">{title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Checklist card */}
            <div className="flex-shrink-0 lg:w-72 xl:w-80">
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 to-background p-5 sm:p-6 lg:sticky lg:top-6">
                <div className="mb-4 flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <p className="font-bold text-primary">Deal Wizard Checklist</p>
                </div>
                <ul className="space-y-3">
                  {[
                    'Product classified with 6–10 digit HS Code',
                    'GRI-based reasoning documented',
                    'Duty rate and FTA eligibility noted',
                    'Misclassification risks identified',
                    'Incoterm selected and confirmed',
                    'Risk transfer point documented',
                    'Clause references generated',
                    'HS Code referenced in goods section',
                    'Incoterm referenced in delivery section',
                    'Deal summary ready to share',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link href="/auth/signup">
                    <Button className="w-full gap-2">
                      Start Your Deal
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="border-t bg-muted/30 px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-balance sm:text-3xl">
              Built for Exporters Who Can't Afford Mistakes
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Zap,
                color: 'text-amber-500',
                title: 'Minutes, not hours',
                body: 'A trade consultant charges $200–$400/hour for the same work. The Deal Wizard does it in under 10 minutes.',
              },
              {
                icon: Shield,
                color: 'text-sky-500',
                title: 'Reduce compliance exposure',
                body: 'Every output references the GRI rules used, so you have documented reasoning if customs ever questions your classification.',
              },
              {
                icon: Clock,
                color: 'text-primary',
                title: 'Consistent across every deal',
                body: 'No more ad-hoc classifications or mismatched deal documents. Every deal follows the same rigorous four-step process.',
              },
            ].map(({ icon: Icon, color, title, body }) => (
              <div key={title} className="rounded-xl border bg-background p-6">
                <Icon className={`mb-3 h-6 w-6 ${color}`} />
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary px-4 py-20 text-primary-foreground sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-balance sm:text-3xl">
            Start Your First Export Deal Today
          </h2>
          <p className="mb-8 text-lg opacity-90 text-pretty">
            Start on the Starter plan to access the Deal Wizard and every Mercorama tool —
            close every export deal with confidence.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="h-12 px-8 text-base gap-2">
                <Briefcase className="h-4 w-4" />
                Start with Starter
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/beta">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white">
                View Plans <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <MarketingCmsSection slug="deal" />

      <Footer />
    </div>
  );
}
