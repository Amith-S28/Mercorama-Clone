// components/landing/HowMercoramaWorksFlow.tsx
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    n: '01',
    title: 'Describe Your Product',
    body: 'Enter a plain-language description of your goods. Mercorama maps it to the right trade classification automatically.',
  },
  {
    n: '02',
    title: 'Get Your HS Code & Dossier',
    body: 'Receive a GRI-based HS Code with confidence score, risk flags, duty snapshot, and legal references.',
  },
  {
    n: '03',
    title: 'Analyze Trade Flows & Markets',
    body: 'Mercorama combines trade data, FTAs, and AI insights to surface your best export markets — scored on demand, growth, access, and risk.',
  },
  {
    n: '04',
    title: 'Choose Your Incoterm',
    body: 'See who carries cost and risk under each rule, then lock in the right Incoterm for your deal.',
  },
  {
    n: '05',
    title: 'Generate Your Deal Summary',
    body: 'Create an export-ready deal summary referencing your HS Code and Incoterm — ready for advisor review.',
  },
  {
    n: '06',
    title: 'Ship with Confidence',
    body: 'Keep HS dossiers, market insights, and deal summaries together for audits, reporting, and repeat deals.',
  },
];

// Bezier paths connecting card centres in the desktop zigzag grid.
// ViewBox = "0 0 1024 1192" ≈ max-w-5xl width × (6 rows × 172px + 5 gaps × 32px).
// Col 1 centre x ≈ 240, Col 2 centre x ≈ 784.
// Row centres y: 86, 290, 494, 698, 902, 1106.
// Each curve passes through x=512 (container mid-point) at matched y values.
const FLOW_PATHS = [
  'M 240 86  C 512 86  512 290 784 290',
  'M 784 290 C 512 290 512 494 240 494',
  'M 240 494 C 512 494 512 698 784 698',
  'M 784 698 C 512 698 512 902 240 902',
  'M 240 902 C 512 902 512 1106 784 1106',
];

export function HowMercoramaWorksFlow() {
  return (
    <section className="relative overflow-hidden bg-[#0B1F3A] py-14 px-4 sm:py-20 sm:px-6 lg:px-8">

      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-48 top-24 h-[500px] w-[500px] rounded-full bg-blue-600/8 blur-3xl" />
        <div className="absolute -right-48 bottom-24 h-[500px] w-[500px] rounded-full bg-teal-500/8 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">

        {/* Section heading */}
        <div className="mb-16 text-center sm:mb-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-400">
              End-to-end workflow
            </span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How Mercorama Works
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-400">
            From product description to HS classification, market discovery, Incoterms, and a deal-ready summary — all in one connected flow.
          </p>
        </div>

        {/* Cards + SVG overlay container */}
        <div className="relative">

          {/* ── SVG animated flow lines — desktop only ── */}
          <svg
            viewBox="0 0 1024 1192"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
            aria-hidden="true"
          >
            <defs>
              {/* Gradient for the travelling glow dot */}
              <linearGradient id="hmw-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#2DD4BF" stopOpacity="0.05" />
                <stop offset="40%"  stopColor="#1F6FEB" stopOpacity="0.9"  />
                <stop offset="60%"  stopColor="#2DD4BF" stopOpacity="0.9"  />
                <stop offset="100%" stopColor="#1F6FEB" stopOpacity="0.05" />
              </linearGradient>

              {/* Keyframes for the travelling dash */}
              <style>{`
                @keyframes hmw-flow {
                  from { stroke-dashoffset: 500; }
                  to   { stroke-dashoffset: 0; }
                }
              `}</style>
            </defs>

            {/* Static dim track lines */}
            {FLOW_PATHS.map((d, i) => (
              <path
                key={`track-${i}`}
                d={d}
                stroke="#1e3a5f"
                strokeWidth="1.5"
                fill="none"
              />
            ))}

            {/* Animated glow dots travelling along each path */}
            {FLOW_PATHS.map((d, i) => (
              <path
                key={`glow-${i}`}
                d={d}
                stroke="url(#hmw-grad)"
                strokeWidth="3"
                fill="none"
                strokeDasharray="55 445"
                style={{
                  animation: `hmw-flow 3.2s linear ${(i * 0.65).toFixed(2)}s infinite`,
                }}
              />
            ))}

            {/* Node dots at each card center */}
            {[
              [240,  86], [784, 290], [240, 494],
              [784, 698], [240, 902], [784, 1106],
            ].map(([cx, cy], i) => (
              <circle
                key={`dot-${i}`}
                cx={cx}
                cy={cy}
                r="5"
                fill="#2DD4BF"
                fillOpacity="0.5"
              />
            ))}
          </svg>

          {/* ── Cards grid ── */}
          {/* Mobile: single column. Desktop: 2-column zigzag with explicit placement. */}
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 md:gap-x-10 md:gap-y-8 lg:grid-cols-2 lg:gap-x-16">
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className={cn(
                  i % 2 === 0 ? 'lg:col-start-1' : 'lg:col-start-2',
                  i === 0 ? 'lg:row-start-1' :
                  i === 1 ? 'lg:row-start-2' :
                  i === 2 ? 'lg:row-start-3' :
                  i === 3 ? 'lg:row-start-4' :
                  i === 4 ? 'lg:row-start-5' :
                            'lg:row-start-6',
                )}
              >
                <div className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/70 p-6 backdrop-blur-sm transition-all duration-300 hover:border-teal-500/30 hover:bg-slate-900/90 sm:p-7">
                  {/* Top edge highlight — brightens on hover */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent transition-opacity duration-300 group-hover:via-teal-500/50" />

                  {/* Inner corner glow */}
                  <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-500/5 blur-xl transition-all duration-300 group-hover:bg-teal-500/10" />

                  {/* Step label */}
                  <span className="mb-3 block font-mono text-4xl font-black leading-none tracking-tight text-[#2DD4BF] opacity-90">
                    {step.n}
                  </span>

                  {/* Title */}
                  <h3 className="mb-2 text-lg font-bold leading-snug text-white">
                    {step.title}
                  </h3>

                  {/* Body */}
                  <p className="text-sm leading-relaxed text-slate-400">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-center">
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2DD4BF] px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-teal-500/20 transition-all duration-200 hover:bg-teal-300 hover:shadow-teal-500/30"
          >
            Start Your First Deal
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link
            href="/deal"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-300 transition-all duration-200 hover:border-slate-500 hover:text-white"
          >
            See the Deal Wizard
          </Link>
        </div>

      </div>
    </section>
  );
}
