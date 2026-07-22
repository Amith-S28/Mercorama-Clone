// components/landing/WhyMercorama.tsx
import { CheckCircle2 } from 'lucide-react';

const POINTS = [
  {
    title: 'Data-driven market discovery',
    body: 'Rankings built on real import patterns, not guesses. We surface where your product already sells globally.',
  },
  {
    title: 'AI-assisted export insights',
    body: 'Claude AI generates plain-language analysis — so you understand the opportunity, not just the numbers.',
  },
  {
    title: 'Trade agreement & tariff awareness',
    body: "Canada's 11 active FTAs are mapped to your product. Know your tariff advantage before you pitch a buyer.",
  },
  {
    title: 'Designed for SMEs and trade advisors',
    body: 'No customs broker required to get started. Mercorama gives professional-grade intelligence to any exporter.',
  },
];

export function WhyMercorama() {
  return (
    <section className="border-y px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-20">
          {/* Left — heading */}
          <div className="max-w-sm shrink-0 lg:pt-2">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Built for Global Trade Intelligence
            </h2>
            <p className="text-lg text-muted-foreground text-pretty">
              Mercorama turns complex trade data into clear, actionable guidance for Canadian exporters.
            </p>
          </div>

          {/* Right — points grid */}
          <div className="grid gap-6 sm:grid-cols-2 flex-1">
            {POINTS.map(({ title, body }) => (
              <div
                key={title}
                className="rounded-2xl border bg-background p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#1F6FEB]/10">
                    <CheckCircle2 className="h-4 w-4 text-[#1F6FEB]" />
                  </div>
                  <p className="text-sm font-semibold">{title}</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
