// components/landing/Hero.tsx
'use client';

import Link from 'next/link';
import { ArrowRight, Compass, TrendingUp } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#0B1F3A] px-4 py-16 sm:py-24 sm:px-6 lg:px-8">
      {/* Gradient overlays */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#1F6FEB] opacity-20 blur-3xl" />
        <div className="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-[#2DD4BF] opacity-15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[#1F6FEB] opacity-10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">

          {/* Left — copy */}
          <div className="flex-1 text-white">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <TrendingUp className="h-3.5 w-3.5 text-[#2DD4BF]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#2DD4BF]">
                AI‑Powered Trade Intelligence
              </span>
            </div>

            <h1 className="mb-5 text-4xl font-bold leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Find the Best Global{' '}
              <span className="bg-gradient-to-r from-[#1F6FEB] to-[#2DD4BF] bg-clip-text text-transparent">
                Markets
              </span>{' '}
              for Your Product
            </h1>

            <p className="mb-8 max-w-xl text-base leading-relaxed text-white/70 text-pretty sm:text-lg">
              Mercorama helps Canadian SMEs discover export opportunities, analyze global trade
              demand, and navigate international markets — from HS Code to export-ready deal summary.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/export-compass"
                onClick={() => trackEvent('cta_click', { label: 'hero_explore_export_compass', location: 'hero' })}
                className="inline-flex items-center gap-2 rounded-lg bg-[#1F6FEB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1F6FEB]/30 transition-all hover:bg-[#1a5fd4] hover:shadow-[#1F6FEB]/50 hover:-translate-y-0.5"
              >
                <Compass className="h-4 w-4" />
                Explore Export Compass
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/signup"
                onClick={() => trackEvent('cta_click', { label: 'hero_try_mercorama', location: 'hero' })}
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:-translate-y-0.5"
              >
                Try Mercorama
              </Link>
            </div>

            <p className="mt-5 text-xs text-white/40">
              Built for Canadian exporters and their advisors.
            </p>
          </div>

          {/* Right — Export Compass UI mock */}
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-1 shadow-2xl backdrop-blur-sm">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 px-4 pt-3 pb-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                <span className="ml-3 text-xs font-medium text-white/40">Export Compass</span>
              </div>

              <div className="rounded-xl bg-[#F6F8FB] p-5">
                {/* Header bar */}
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#1F6FEB]">Export Compass</p>
                    <p className="text-sm font-bold text-[#0B1F3A]">Sample Analysis</p>
                  </div>
                  <span className="rounded-full bg-[#1F6FEB]/10 px-2.5 py-1 text-xs font-semibold text-[#1F6FEB]">
                    Live
                  </span>
                </div>

                {/* Product pill */}
                <div className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-500">Product</p>
                      <p className="text-sm font-semibold text-[#0B1F3A]">Organic Oats</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">HS Code</p>
                      <p className="text-sm font-semibold text-[#0B1F3A]">1104.22</p>
                    </div>
                  </div>
                </div>

                {/* Markets table */}
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">Top Markets</p>
                <div className="space-y-2">
                  {[
                    { rank: 1, country: 'Germany',  flag: '🇩🇪', score: 84, fta: 'CETA',  color: 'text-emerald-600 bg-emerald-50' },
                    { rank: 2, country: 'USA',       flag: '🇺🇸', score: 79, fta: 'CUSMA', color: 'text-blue-600 bg-blue-50' },
                    { rank: 3, country: 'UAE',       flag: '🇦🇪', score: 71, fta: null,    color: 'text-amber-600 bg-amber-50' },
                    { rank: 4, country: 'Japan',     flag: '🇯🇵', score: 68, fta: 'CPTPP', color: 'text-violet-600 bg-violet-50' },
                  ].map(({ rank, country, flag, score, fta, color }) => (
                    <div
                      key={country}
                      className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-white px-3 py-2 shadow-sm"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">
                        {rank}
                      </span>
                      <span className="text-base leading-none">{flag}</span>
                      <span className="flex-1 text-sm font-medium text-[#0B1F3A]">{country}</span>
                      {fta && (
                        <span className="rounded-full bg-[#2DD4BF]/15 px-2 py-0.5 text-xs font-semibold text-teal-700">
                          {fta}
                        </span>
                      )}
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${color}`}>
                        {score}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Score bar */}
                <div className="mt-4 rounded-lg bg-[#1F6FEB]/8 px-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#0B1F3A]">Export Score</span>
                    <span className="font-bold text-[#1F6FEB]">84 / 100</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full w-[84%] rounded-full bg-gradient-to-r from-[#1F6FEB] to-[#2DD4BF]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
