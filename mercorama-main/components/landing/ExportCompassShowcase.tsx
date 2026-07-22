// components/landing/ExportCompassShowcase.tsx
import Link from 'next/link';
import { Compass, ArrowRight, CheckCircle2 } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    title: 'Identify your product',
    body: 'Enter a product name or HS code. Mercorama maps it to the right trade classification automatically.',
  },
  {
    n: '02',
    title: 'Analyze global demand',
    body: "Mercorama analyzes global import patterns and Canada's current export position for your product.",
  },
  {
    n: '03',
    title: 'Discover top markets',
    body: 'Export Compass recommends high-potential export destinations ranked by a composite opportunity score.',
  },
];

const SAMPLE_MARKETS = [
  { country: 'Germany',     flag: '🇩🇪', score: 84, demand: 'High',   fta: 'CETA' },
  { country: 'USA',         flag: '🇺🇸', score: 79, demand: 'High',   fta: 'CUSMA' },
  { country: 'UAE',         flag: '🇦🇪', score: 71, demand: 'Medium', fta: '—' },
  { country: 'Japan',       flag: '🇯🇵', score: 68, demand: 'Medium', fta: 'CPTPP' },
  { country: 'Netherlands', flag: '🇳🇱', score: 64, demand: 'Medium', fta: 'CETA' },
];

export function ExportCompassShowcase() {
  return (
    <section className="bg-background px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 px-3 py-1.5">
              <Compass className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                Export Compass
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              The GPS for Canadian Exporters
            </h2>
            <p className="mt-3 text-lg text-muted-foreground text-pretty">
              Export Compass scores and ranks global markets for your products using demand, growth,
              FTAs, logistics, and risk.
            </p>
          </div>
          <Link
            href="/export-compass"
            className="hidden shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:-translate-y-0.5 sm:inline-flex"
          >
            See it in action <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
          {/* Left — how it works steps */}
          <div className="flex-1 space-y-6">
            {STEPS.map(({ n, title, body }) => (
              <div key={n} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-sm shadow-indigo-600/30">
                    {n}
                  </span>
                  <div className="mt-2 w-px flex-1 bg-indigo-200 dark:bg-indigo-800 last:hidden" />
                </div>
                <div className="pb-4 pt-1">
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}

            <div className="mt-2 flex items-center gap-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-5 py-4">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <p className="text-sm text-muted-foreground">
                Results include AI-generated market narratives and a PDF report delivered to your inbox.
              </p>
            </div>

            <Link
              href="/export-compass"
              className="mt-2 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700 hover:-translate-y-0.5 sm:hidden"
            >
              See it in action <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right — ranked markets mockup */}
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="overflow-hidden rounded-2xl border bg-background shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-semibold">Top Markets — Organic Oats</span>
                </div>
                <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2.5 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  HS 1104.22
                </span>
              </div>

              {/* Column headers */}
              <div className="grid grid-cols-4 border-b px-5 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span className="col-span-2">Country</span>
                <span className="text-center">Score</span>
                <span className="text-right">FTA</span>
              </div>

              {/* Rows */}
              <div className="divide-y">
                {SAMPLE_MARKETS.map(({ country, flag, score, fta }, i) => (
                  <div
                    key={country}
                    className={`grid grid-cols-4 items-center px-5 py-3 ${i === 0 ? 'bg-indigo-50/60 dark:bg-indigo-900/10' : ''}`}
                  >
                    <div className="col-span-2 flex items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500">
                        {i + 1}
                      </span>
                      <span className="text-base leading-none">{flag}</span>
                      <span className="text-sm font-medium">{country}</span>
                    </div>
                    <div className="flex justify-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          score >= 80
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : score >= 70
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {score}
                      </span>
                    </div>
                    <div className="text-right">
                      {fta !== '—' ? (
                        <span className="rounded-full bg-teal-100 dark:bg-teal-900/30 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:text-teal-400">
                          {fta}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="border-t bg-muted/20 px-5 py-3">
                <p className="text-xs text-muted-foreground">
                  Scored across Demand · Growth · FTA Access · Logistics · Risk
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
