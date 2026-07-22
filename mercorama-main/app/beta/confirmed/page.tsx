// app/beta/confirmed/page.tsx
// Shown after successful /beta application submission. No auth required.
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, Copy, Check, Linkedin, ArrowRight } from 'lucide-react';

const BETA_URL = 'https://mercorama.com/beta';
const LINKEDIN_URL = 'https://www.linkedin.com/company/mercorama';
const LINKEDIN_SHARE_URL = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(BETA_URL)}`;

const FEATURES = [
  { label: 'HS Code Intelligence',       desc: 'Classify your products in seconds, not days.' },
  { label: 'Incoterm Recommender',        desc: 'Know exactly who owns the risk at every step.' },
  { label: 'Deal Clarity',                 desc: 'Flag red-clause language before you sign.' },
  { label: 'Deal Wizard',                 desc: 'Build a complete trade deal structure end-to-end.' },
  { label: 'Fund My Export',              desc: 'Match to EDC, BDC, and provincial programs.' },
  { label: 'FTA Diversify Wizard',        desc: 'Find tariff advantages across 15+ trade agreements.' },
  { label: 'Export Compass',              desc: 'Country-level market fit scoring (Growth).' },
  { label: 'Freight Connect',             desc: 'Direct quotes from verified Canadian forwarders.' },
];

export default function BetaConfirmedPage() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(BETA_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Slim nav — no back / re-submission links */}
      <header className="border-b px-6 py-4 flex items-center">
        <Link href="/" className="text-sm font-semibold text-foreground">
          Mercorama
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-16 space-y-14">

        {/* ── Confirmation headline ─────────────────────────────────────────── */}
        <section className="text-center space-y-4">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h1 className="text-3xl font-bold tracking-tight">Application received.</h1>
          <p className="text-muted-foreground text-base leading-relaxed max-w-lg mx-auto">
            We review every application personally and will be in touch within{' '}
            <strong>48 hours</strong>. Check your inbox — a confirmation has been sent.
          </p>
          <p className="text-muted-foreground text-sm">
            Questions? Reply directly to that email. We read every response.
          </p>
        </section>

        {/* ── Feature preview ──────────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground text-center">
            What you'll unlock
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div
                key={f.label}
                className="rounded-lg border bg-card px-4 py-3 flex gap-3 items-start"
              >
                <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-[#FF6100]" />
                <div>
                  <p className="text-sm font-medium leading-snug">{f.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Social share ─────────────────────────────────────────────────── */}
        <section className="space-y-3 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Follow the journey
          </h2>
          <p className="text-sm text-muted-foreground">
            We share build updates, trade insights, and cohort news on LinkedIn.
          </p>
          <a
            href={LINKEDIN_SHARE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[#0A66C2] text-[#0A66C2] px-5 py-2.5 text-sm font-medium hover:bg-[#0A66C2]/5 transition-colors"
          >
            <Linkedin className="h-4 w-4" />
            Share on LinkedIn
          </a>
        </section>

        {/* ── Referral CTA ─────────────────────────────────────────────────── */}
        <section className="rounded-xl border bg-muted/40 px-6 py-6 space-y-4 text-center">
          <h2 className="font-semibold text-base">Know another Canadian exporter?</h2>
          <p className="text-sm text-muted-foreground">
            Early access spots are limited. Share your link — founding spots are first-come,
            first-served.
          </p>
          <div className="flex items-center gap-2 max-w-sm mx-auto">
            <input
              readOnly
              value={BETA_URL}
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm text-muted-foreground select-all"
              onFocus={(e) => e.target.select()}
            />
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#FF6100] px-3 py-2 text-sm font-medium text-white hover:bg-[#e55800] transition-colors"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </section>

      </main>

      <footer className="border-t mt-16 px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Mercorama &middot;{' '}
          <Link href="/terms" className="hover:underline">Terms</Link>
          {' · '}
          <Link href="/privacy" className="hover:underline">Privacy</Link>
        </p>
      </footer>
    </div>
  );
}
