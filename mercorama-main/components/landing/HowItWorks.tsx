// components/landing/HowItWorks.tsx
import { PackageSearch, TrendingUp, Globe } from 'lucide-react';

const STEPS = [
  {
    icon: PackageSearch,
    n: '01',
    title: 'Enter your product',
    body: 'Describe your goods and, if you have it, add the HS code. Mercorama maps it to the right trade classification automatically.',
    color: 'bg-[#1F6FEB] text-white',
    iconBg: 'bg-[#1F6FEB]/10 text-[#1F6FEB]',
  },
  {
    icon: TrendingUp,
    n: '02',
    title: 'Mercorama analyzes trade flows',
    body: "We combine trade data, FTAs, and AI‑powered insights to surface the best opportunities — scored across demand, growth, access, and risk.",
    color: 'bg-[#2DD4BF] text-[#0B1F3A]',
    iconBg: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
  },
  {
    icon: Globe,
    n: '03',
    title: 'Discover your best export markets',
    body: 'See ranked markets, HS dossiers, and deal-ready insights you can act on immediately — including a branded PDF report.',
    color: 'bg-[#0B1F3A] text-white dark:bg-slate-700',
    iconBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  },
];

export function HowItWorks() {
  return (
    <section className="px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            How Mercorama Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Three steps from product description to export-ready intelligence.
          </p>
        </div>

        <div className="relative grid gap-8 sm:grid-cols-3">
          {/* Connector line — desktop only */}
          <div className="pointer-events-none absolute top-11 left-[calc(16.7%+1.5rem)] right-[calc(16.7%+1.5rem)] hidden h-px bg-gradient-to-r from-[#1F6FEB] via-[#2DD4BF] to-[#0B1F3A] sm:block dark:to-slate-600" />

          {STEPS.map(({ icon: Icon, n, title, body, color, iconBg }) => (
            <div key={n} className="relative flex flex-col items-center text-center">
              {/* Step bubble */}
              <div className={`relative mb-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-md ${color}`}>
                <span className="text-sm font-bold">{n}</span>
              </div>

              {/* Icon chip */}
              <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>

              <h3 className="mb-2 text-base font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
