// components/landing/FinalCta.tsx
'use client';

import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

export function FinalCta() {
  return (
    <section className="relative overflow-hidden px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
      {/* Gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0B1F3A] via-[#1F6FEB]/90 to-[#2DD4BF]/70" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#2DD4BF] opacity-20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#1F6FEB] opacity-25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center text-white">
        <h2 className="mb-5 text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
          Start Exploring Global Markets Today
        </h2>
        <p className="mb-10 text-lg leading-relaxed text-white/75 text-pretty">
          See how Mercorama can take you from HS code to export-ready deals in one workspace —
          built for Canadian SMEs ready to compete globally.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            onClick={() => trackEvent('cta_click', { label: 'final_cta_launch_mercorama', location: 'final_cta' })}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[#0B1F3A] shadow-xl shadow-black/20 transition-all hover:-translate-y-1 hover:shadow-2xl"
          >
            Launch Mercorama
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/export-compass"
            onClick={() => trackEvent('cta_click', { label: 'final_cta_explore_export_compass', location: 'final_cta' })}
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:-translate-y-1"
          >
            <Compass className="h-4 w-4" />
            Explore Export Compass
          </Link>
        </div>

        <p className="mt-8 text-sm text-white/40">
          Plans from $99/month — cancel anytime.
        </p>
      </div>
    </section>
  );
}
