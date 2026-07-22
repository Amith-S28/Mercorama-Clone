'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight, CheckCircle2, ChevronDown, Users, Zap, Star,
  ShieldCheck, BadgeCheck, X, Globe, BarChart3, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Block = {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position: number;
};

type Plan = {
  name: string;
  tagline: string;
  price: string;
  annualPrice?: string;
  priceNote?: string;
  annualPriceNote?: string;
  dealsPerMonth: string;
  bestFor?: string;
  features: string[];
  highlight?: boolean;
  ctaLabel: string;
  ctaHref: string;
  ribbon?: string;
  monthlyProductId?: string;
  annualProductId?: string;
};

type PersonaCard = {
  title: string;
  description: string;
  planHint?: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

// ─── HeroBlock ────────────────────────────────────────────────────────────────

function HeroBlock({ data }: { data: Record<string, unknown> }) {
  const heading           = data.heading as string;
  const subheading        = data.subheading as string;
  const primaryLabel      = data.primaryButtonLabel as string;
  const primaryHref       = data.primaryButtonHref as string;
  const secondaryLabel    = data.secondaryButtonLabel as string;
  const secondaryHref     = data.secondaryButtonHref as string;
  const badgeText         = data.badgeText as string;
  const reassuranceItems  = (data.reassuranceItems as string[]) ?? [];

  if (!heading) return null;

  return (
    <>
      {/* Dark hero — matches homepage Hero.tsx bg-[#0B1F3A] */}
      <section className="relative overflow-hidden bg-[#0B1F3A] px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#1F6FEB] opacity-20 blur-3xl" />
          <div className="absolute top-1/2 -right-24 h-80 w-80 rounded-full bg-[#2DD4BF] opacity-15 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-[#1F6FEB] opacity-10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl text-center">
          {/* Eyebrow badge — exact homepage Hero.tsx pattern */}
          {badgeText && (
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2DD4BF]" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#2DD4BF]">{badgeText}</span>
            </div>
          )}

          <h1 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-white text-balance sm:text-4xl lg:text-5xl">
            {heading}
          </h1>

          {subheading && (
            <p className="mb-8 text-base leading-relaxed text-white/70 text-pretty sm:text-lg">
              {subheading}
            </p>
          )}

          {/* CTAs — exact homepage Hero.tsx button classes */}
          {(primaryLabel || secondaryLabel) && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              {primaryLabel && primaryHref && (
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#1F6FEB] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1F6FEB]/30 transition-all hover:bg-[#1a5fd4] hover:shadow-[#1F6FEB]/50 hover:-translate-y-0.5"
                >
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {secondaryLabel && secondaryHref && (
                <Link
                  href={secondaryHref}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:-translate-y-0.5"
                >
                  {secondaryLabel}
                </Link>
              )}
            </div>
          )}

          {/* Trust anchor — exact homepage Hero.tsx pattern */}
          <p className="mt-5 text-xs text-white/40">Built for Canadian exporters and their advisors.</p>

          {/* Reassurance strip */}
          {reassuranceItems.length > 0 && (
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {reassuranceItems.map((item, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-white/50">
                  <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-[#2DD4BF]/70" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Stats strip — exact homepage app/page.tsx stats bar pattern */}
      <section className="border-b bg-muted/40 px-4 py-4 sm:py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium">150+ countries</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium">11 Incoterms 2020</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-medium">10,000+ HS Codes</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

// ─── PricingPlansBlock ────────────────────────────────────────────────────────
// Dark section (position 3 in alternating rhythm: dark → light → DARK → light → …)

function PricingPlansBlock({ data }: { data: Record<string, unknown> }) {
  const sectionTitle    = data.sectionTitle as string;
  const sectionSubtitle = data.sectionSubtitle as string;
  const plans           = (data.plans as Plan[]) ?? [];
  const [annual, setAnnual] = useState(false);

  if (plans.length === 0) return null;

  const gridCols =
    plans.length === 2 ? 'sm:grid-cols-2' :
    plans.length === 3 ? 'lg:grid-cols-3 sm:grid-cols-2' :
    'sm:grid-cols-2 lg:grid-cols-4';

  const hasAnnualToggle = plans.some((p) => p.annualProductId || p.annualPrice);

  return (
    <section className="bg-[#0B1F3A] px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {(sectionTitle || sectionSubtitle) && (
          <div className="mb-8 text-center">
            {/* Eyebrow — dark bg pattern matching homepage Deal Wizard badge */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#2DD4BF]">PRICING PLANS</span>
            </div>
            {sectionTitle && (
              <h2 className="text-2xl font-bold tracking-tight text-white text-balance sm:text-3xl">{sectionTitle}</h2>
            )}
            {sectionSubtitle && (
              <p className="mt-3 mx-auto max-w-2xl text-white/60 text-pretty">{sectionSubtitle}</p>
            )}
          </div>
        )}

        {/* Annual/monthly toggle */}
        {hasAnnualToggle && (
          <div className="mb-8 flex items-center justify-center gap-3">
            <span className={cn('text-sm font-medium transition-colors', !annual ? 'text-white' : 'text-white/40')}>
              Monthly
            </span>
            <button
              role="switch"
              aria-checked={annual}
              onClick={() => setAnnual((v) => !v)}
              className={cn(
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                annual ? 'bg-[#2DD4BF]' : 'bg-white/20',
              )}
            >
              <span className={cn(
                'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                annual ? 'translate-x-6' : 'translate-x-1',
              )} />
            </button>
            <span className={cn('flex items-center gap-2 text-sm font-medium transition-colors', annual ? 'text-white' : 'text-white/40')}>
              Annual
              <span className="rounded-full bg-[#2DD4BF]/20 px-2 py-0.5 text-xs font-semibold text-[#2DD4BF]">
                Save 20%
              </span>
            </span>
          </div>
        )}

        {/* Plan cards */}
        <div className={`grid gap-6 ${gridCols} items-start`}>
          {plans.map((plan, i) => {
            const displayPrice     = annual && plan.annualPrice ? plan.annualPrice : plan.price;
            const displayPriceNote = annual && plan.annualPriceNote ? plan.annualPriceNote : plan.priceNote;
            const productId        = annual ? (plan.annualProductId ?? plan.monthlyProductId) : plan.monthlyProductId;
            const planId           = `plan-${plan.name.toLowerCase()}`;

            return (
              <div
                key={i}
                id={planId}
                className={cn(
                  'relative flex flex-col rounded-2xl bg-white p-5 shadow-xl transition-all duration-200 sm:p-7',
                  plan.highlight
                    ? 'ring-2 ring-[#2DD4BF] shadow-[#2DD4BF]/25 lg:scale-[1.03]'
                    : 'shadow-black/20',
                )}
              >
                {plan.ribbon && (
                  <div className={cn(
                    'absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-1 text-xs font-bold',
                    plan.highlight
                      ? 'bg-[#2DD4BF] text-slate-900'
                      : 'bg-[#1F6FEB] text-white',
                  )}>
                    {plan.ribbon}
                  </div>
                )}

                <div className="mb-5 mt-2">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="mt-0.5 text-sm text-slate-500">{plan.tagline}</p>

                  <div className="mt-4">
                    <span className={cn(
                      'text-4xl font-black tracking-tight',
                      plan.highlight ? 'text-[#1F6FEB]' : 'text-slate-900',
                    )}>
                      {displayPrice}
                    </span>
                    {displayPriceNote && (
                      <p className={cn('mt-1 text-xs', plan.highlight ? 'text-[#2DD4BF]' : 'text-slate-400')}>
                        {displayPriceNote}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-3 space-y-0.5">
                    <p className="text-xs font-semibold text-slate-700">{plan.dealsPerMonth}</p>
                    {plan.bestFor && (
                      <p className="text-xs text-slate-400">{plan.bestFor}</p>
                    )}
                  </div>
                </div>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#2DD4BF]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA — homepage primary button style */}
                {productId ? (
                  <Link
                    href={`/checkout/${productId}`}
                    className={cn(
                      'block w-full rounded-xl py-3 text-center text-sm font-semibold transition',
                      plan.highlight
                        ? 'bg-[#2DD4BF] text-slate-900 hover:bg-teal-300 shadow-md shadow-teal-500/20'
                        : 'bg-[#0B1F3A] text-white hover:bg-[#0d2647]',
                    )}
                  >
                    {plan.ctaLabel}
                  </Link>
                ) : (
                  <Link
                    href={plan.ctaHref}
                    className="block w-full rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-700 transition hover:border-[#2DD4BF] hover:text-[#0B1F3A]"
                  >
                    {plan.ctaLabel}
                  </Link>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-sm text-white/50">
          Cancel anytime. No onboarding fees. We&apos;ll help you move up or down as your export volume changes.
        </p>
      </div>
    </section>
  );
}

// ─── FeatureListBlock ─────────────────────────────────────────────────────────
// Light section (position 4 in alternating rhythm: dark → light → dark → LIGHT → …)

const FEATURE_ICONS = [FileText, Globe, ShieldCheck] as const;
const FEATURE_ICON_STYLES = [
  { bg: 'bg-sky-100 dark:bg-sky-900/30',    color: 'text-sky-600 dark:text-sky-400'    },
  { bg: 'bg-violet-100 dark:bg-violet-900/30', color: 'text-violet-600 dark:text-violet-400' },
  { bg: 'bg-amber-100 dark:bg-amber-900/30',  color: 'text-amber-600 dark:text-amber-400'  },
] as const;

function FeatureListBlock({ data }: { data: Record<string, unknown> }) {
  const title    = (data.title ?? data.sectionTitle) as string;
  const subtitle = (data.subtitle ?? data.sectionSubtitle) as string;
  const rawItems = (data.items as (string | { title: string; description: string })[]) ?? [];

  if (!title && rawItems.length === 0) return null;

  const isObjectItems = rawItems.length > 0 && typeof rawItems[0] === 'object';

  return (
    <section className="border-y bg-muted/30 px-4 py-10 sm:py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {(title || subtitle) && (
          <div className="mb-8 text-center">
            {/* Eyebrow — light bg pattern matching homepage Deal Wizard spotlight */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">WHY MERCORAMA</span>
            </div>
            {title    && <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h2>}
            {subtitle && <p className="mt-3 mx-auto max-w-2xl text-muted-foreground text-pretty">{subtitle}</p>}
          </div>
        )}

        {isObjectItems ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(rawItems as { title: string; description: string }[]).map((item, i) => {
              const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
              const style = FEATURE_ICON_STYLES[i % FEATURE_ICON_STYLES.length];
              return (
                <div key={i} className="rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md">
                  <div className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-lg', style.bg)}>
                    <Icon className={cn('h-5 w-5', style.color)} />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <ul className="mx-auto max-w-2xl space-y-3">
            {(rawItems as string[]).map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ─── WhoItIsForBlock ──────────────────────────────────────────────────────────
// Dark section (position 5: … → light → DARK → light → …)

function WhoItIsForBlock({ data }: { data: Record<string, unknown> }) {
  const sectionTitle = data.sectionTitle as string;
  const cards        = (data.cards as PersonaCard[]) ?? [];

  if (cards.length === 0) return null;

  const ICONS = [Users, Zap, Star];

  function scrollToPlan(planName: string) {
    const el = document.getElementById(`plan-${planName.toLowerCase()}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  return (
    <section className="bg-[#0B1F3A] px-4 py-10 sm:py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {sectionTitle && (
          <div className="mb-8 text-center">
            {/* Eyebrow — dark bg pattern */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#2DD4BF]">WHO IT&apos;S FOR</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white text-balance sm:text-3xl">{sectionTitle}</h2>
          </div>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <div key={i} className="flex flex-col rounded-2xl bg-white p-6 shadow-xl shadow-black/20 transition-all duration-200 hover:shadow-[#2DD4BF]/10">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#2DD4BF]/10">
                  <Icon className="h-5 w-5 text-[#2DD4BF]" />
                </div>
                <h3 className="font-semibold text-slate-900">{card.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">{card.description}</p>
                {card.planHint && (
                  <button
                    onClick={() => scrollToPlan(card.planHint!)}
                    className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#2DD4BF]/30 bg-[#2DD4BF]/5 py-2 text-xs font-semibold text-[#0B1F3A] transition hover:bg-[#2DD4BF]/15"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-[#2DD4BF]" />
                    Recommended plan: {card.planHint}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── FaqBlock ─────────────────────────────────────────────────────────────────
// Light section (position 6: … → dark → LIGHT → dark)

function FaqBlock({ data }: { data: Record<string, unknown> }) {
  const sectionTitle = data.sectionTitle as string;
  const items        = (data.items as FaqItem[]) ?? [];
  const [open, setOpen] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <section className="px-4 py-10 sm:py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {sectionTitle && (
          <div className="mb-8 text-center">
            {/* Eyebrow — light bg pattern */}
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1.5">
              <span className="text-xs font-bold uppercase tracking-widest text-primary">FAQ</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{sectionTitle}</h2>
          </div>
        )}
        {/* FAQ accordion — matches homepage accordion style: rounded-lg border px-6 */}
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border px-6">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-semibold transition-colors hover:no-underline"
              >
                <span>{item.question}</span>
                {open === i
                  ? <X className="h-4 w-4 shrink-0 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                }
              </button>
              {open === i && (
                <div className="border-t pb-5 pt-4 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CtaBlock ─────────────────────────────────────────────────────────────────
// Dark gradient — matches FinalCta.tsx exactly

function CtaBlock({ data }: { data: Record<string, unknown> }) {
  const heading     = data.heading as string;
  const body        = data.body as string;
  const buttonLabel = data.buttonLabel as string;
  const buttonHref  = data.buttonHref as string;

  if (!heading) return null;

  return (
    <section className="relative overflow-hidden px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
      {/* Gradient background — exact FinalCta.tsx pattern */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0B1F3A] via-[#1F6FEB]/90 to-[#2DD4BF]/70" aria-hidden />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#2DD4BF] opacity-20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#1F6FEB] opacity-25 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center text-white">
        {/* Eyebrow */}
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-sm">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#2DD4BF]">GET STARTED</span>
        </div>

        <h2 className="mb-5 text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
          {heading}
        </h2>

        {body && (
          <p className="mb-10 text-lg leading-relaxed text-white/75 text-pretty">{body}</p>
        )}

        {/* CTAs — exact FinalCta.tsx button classes */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          {buttonLabel && buttonHref && (
            <Link
              href={buttonHref}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-[#0B1F3A] shadow-xl shadow-black/20 transition-all hover:-translate-y-1 hover:shadow-2xl"
            >
              {buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
          <Link
            href="/export-compass"
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:-translate-y-1"
          >
            View Export Compass
          </Link>
        </div>

        {/* Trust note — exact FinalCta.tsx pattern */}
        <p className="mt-8 text-sm text-white/40">Plans from $99/month — cancel anytime.</p>
      </div>
    </section>
  );
}

// ─── TextBlock ────────────────────────────────────────────────────────────────

function TextBlock({ data }: { data: Record<string, unknown> }) {
  const heading = data.heading as string;
  const body    = data.body as string;

  if (!heading && !body) return null;

  return (
    <section className="bg-[#0B1F3A] px-4 py-10 sm:py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {heading && <h2 className="mb-4 text-2xl font-bold text-white text-balance sm:text-3xl">{heading}</h2>}
        {body    && <p className="text-base leading-relaxed text-white/60 text-pretty">{body}</p>}
      </div>
    </section>
  );
}

// ─── RichTextBlock ────────────────────────────────────────────────────────────

function RichTextBlock({ data }: { data: Record<string, unknown> }) {
  const html = data.html as string;
  if (!html) return null;

  return (
    <section className="bg-[#0B1F3A] px-4 py-10 sm:py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div
          className="prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </section>
  );
}

// ─── Main renderer ────────────────────────────────────────────────────────────

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case 'rich_text':     return <RichTextBlock     key={block.id} data={block.data} />;
          case 'hero':          return <HeroBlock         key={block.id} data={block.data} />;
          case 'pricing_plans': return <PricingPlansBlock key={block.id} data={block.data} />;
          case 'feature_list':  return <FeatureListBlock  key={block.id} data={block.data} />;
          case 'who_it_is_for': return <WhoItIsForBlock   key={block.id} data={block.data} />;
          case 'faq':           return <FaqBlock          key={block.id} data={block.data} />;
          case 'cta':           return <CtaBlock          key={block.id} data={block.data} />;
          case 'text':          return <TextBlock         key={block.id} data={block.data} />;
          default:              return null;
        }
      })}
    </>
  );
}
