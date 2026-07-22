// app/freight-connect/upgrade/page.tsx
// Forwarder tier upgrade: Claimed → Verified → Featured + Stripe Checkout
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2, Star, Zap, Shield, AlertCircle, Loader2, Truck,
  ArrowRight, Clock, Users, BarChart3, Award,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// ─── Pricing data ─────────────────────────────────────────────────────────────

const FOUNDING_CUTOFF_DATE = new Date('2026-06-30');
const isFoundingPeriod = () => new Date() < FOUNDING_CUTOFF_DATE;

const TIERS = [
  {
    id:           'claimed',
    label:        'Claimed',
    icon:         Truck,
    iconColor:    'text-slate-600 dark:text-slate-400',
    iconBg:       'bg-slate-100 dark:bg-slate-900/40',
    border:       'border-border',
    badge:        null,
    priceMonthly: null,
    priceAnnual:  null,
    priceLine:    'Pay-per-lead',
    priceSub:     '$99–$149 CAD per quote request',
    description:  'Start receiving quote requests with no subscription commitment.',
    features: [
      'Listed in search results',
      '$99 / quote (quote only) or $149 / quote (full profile)',
      'Automatic refund if SLA missed',
      '48-hour SLA enforcement',
      'CIFFA badge on listing',
    ],
    notIncluded: [
      'Priority placement',
      'Free leads',
      'Analytics dashboard',
      'Featured placement',
    ],
    cta:       null,
    isCurrent: true,
  },
  {
    id:           'verified',
    label:        'Verified',
    icon:         Shield,
    iconColor:    'text-sky-700 dark:text-sky-400',
    iconBg:       'bg-sky-100 dark:bg-sky-900/40',
    border:       'border-sky-200 dark:border-sky-800',
    badge:        'Most Popular',
    badgeStyle:   'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
    priceMonthly: 199,
    priceAnnual:  1990,
    priceLine:    null,
    priceSub:     null,
    description:  'Free leads, priority listing, and analytics — for forwarders ready to grow.',
    features: [
      'Everything in Claimed',
      'Free leads — subscription covers cost',
      'Priority placement above Claimed',
      'Verified badge on listing',
      'Lane analytics & response rate dashboard',
      'Rate benchmarking (last 3 quotes per lane)',
      'Up to 5 testimonials displayed',
    ],
    notIncluded: [
      'Featured (pinned) placement',
      'Homepage spotlight',
    ],
    cta:       'Upgrade to Verified',
    isCurrent: false,
  },
  {
    id:           'featured',
    label:        'Featured',
    icon:         Star,
    iconColor:    'text-amber-600 dark:text-amber-400',
    iconBg:       'bg-amber-100 dark:bg-amber-900/40',
    border:       'border-amber-200 dark:border-amber-800',
    badge:        'Best Value',
    badgeStyle:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    priceMonthly: 349,
    priceAnnual:  3490,
    priceLine:    null,
    priceSub:     null,
    description:  'Maximum visibility. Pinned to the top of all relevant search results.',
    features: [
      'Everything in Verified',
      'Pinned — top of all search results',
      '"Mercorama Partner" spotlight label',
      'Listed in Mercorama Partners section',
      'Up to 10 testimonials displayed',
      'Early access to new SME markets',
    ],
    notIncluded: [],
    cta:       'Upgrade to Featured',
    isCurrent: false,
  },
] as const;

type TierId = 'verified' | 'featured';

// ─── Comparison row ───────────────────────────────────────────────────────────

const COMPARISON_ROWS = [
  { feature: 'Appears in search results',  claimed: true,  verified: true,  featured: true  },
  { feature: 'Lead cost',                  claimed: '$99–149/quote', verified: 'Free', featured: 'Free' },
  { feature: 'SLA refund guarantee',       claimed: true,  verified: true,  featured: true  },
  { feature: 'CIFFA verified badge',       claimed: true,  verified: true,  featured: true  },
  { feature: 'Priority placement',         claimed: false, verified: true,  featured: true  },
  { feature: 'Lane analytics',             claimed: false, verified: true,  featured: true  },
  { feature: 'Rate benchmarking',          claimed: false, verified: true,  featured: true  },
  { feature: 'Pinned to top of results',   claimed: false, verified: false, featured: true  },
  { feature: 'Mercorama Partners section', claimed: false, verified: false, featured: true  },
  { feature: 'Homepage spotlight',         claimed: false, verified: false, featured: true  },
];

function CellValue({ val }: { val: boolean | string }) {
  if (typeof val === 'string') {
    return <span className="text-xs font-medium text-foreground">{val}</span>;
  }
  return val
    ? <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
    : <span className="text-muted-foreground">—</span>;
}

// ─── Founding partner banner ──────────────────────────────────────────────────

function FoundingBanner() {
  if (!isFoundingPeriod()) return null;

  return (
    <div className="mb-8 rounded-xl border border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5">
      <div className="flex items-start gap-3">
        <Award className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-800 dark:text-amber-300 mb-1">
            Founding Partner offer — closes 30 June 2026
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-2">
            Be one of the first 20 Verified or Featured partners and lock in <strong>3 months free</strong> on any annual plan.
            Your rate is guaranteed for 12 months from subscription start.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-amber-600 dark:text-amber-400">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Rate locked 12 months</span>
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> First 20 partners only</span>
            <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> 3 months free on annual</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Checkout handler component ───────────────────────────────────────────────

function UpgradeButton({
  tier,
  billingPeriod,
  forwarderId,
}: {
  tier:          TierId;
  billingPeriod: 'monthly' | 'annual';
  forwarderId:   string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleCheckout() {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/freight-connect/stripe/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forwarder_id:        forwarderId,
          tier,
          billing_period:      billingPeriod,
          is_founding_partner: isFoundingPeriod(),
        }),
      });
      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok || !data.url) {
        setError(data.error ?? 'Checkout failed. Please try again.');
        return;
      }

      window.location.href = data.url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleCheckout} disabled={loading} className="w-full gap-1.5">
        {loading
          ? <><Loader2 className="h-4 w-4 animate-spin" />Redirecting…</>
          : <>Upgrade to {tier.charAt(0).toUpperCase() + tier.slice(1)} <ArrowRight className="h-3.5 w-3.5" /></>
        }
      </Button>
      {error && (
        <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />{error}
        </p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function UpgradePageInner() {
  const searchParams  = useSearchParams();
  const success       = searchParams.get('success') === '1';
  const cancelled     = searchParams.get('cancelled') === '1';
  const forwarderId   = searchParams.get('forwarder_id') ?? '';

  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');

  // Scroll to top on success
  useEffect(() => {
    if (success) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [success]);

  function annualMonthlyEquiv(annual: number) {
    return (annual / 12).toFixed(0);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-lg bg-sky-100 dark:bg-sky-900/30 px-3 py-1.5 mb-4">
          <Truck className="h-4 w-4 text-sky-700 dark:text-sky-400" />
          <span className="text-sm font-medium text-sky-700 dark:text-sky-400">Freight Connect</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">Upgrade Your Listing</h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Move from pay-per-lead to a subscription and get free leads, priority placement, and analytics.
        </p>
      </div>

      {/* Success / cancelled banners */}
      {success && (
        <div className="mb-8 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-5 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">Upgrade successful!</p>
            <p className="text-sm text-green-700 dark:text-green-400">
              Your listing has been upgraded. You&apos;ll receive free leads and priority placement in all relevant search results from now on.
            </p>
          </div>
        </div>
      )}
      {cancelled && (
        <div className="mb-8 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Checkout was cancelled. Your listing remains active on the Claimed (pay-per-lead) plan.
          </p>
        </div>
      )}

      <FoundingBanner />

      {/* Billing toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center rounded-lg border bg-muted/30 p-1 gap-1">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              billing === 'monthly'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('annual')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              billing === 'annual'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Annual
            <span className="rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 text-xs px-1.5 py-0.5">
              Save 2 months
            </span>
          </button>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid gap-6 md:grid-cols-3 mb-12">
        {TIERS.map((tier) => {
          const Icon = tier.icon;
          const monthlyPrice = billing === 'annual' && tier.priceAnnual
            ? Number(annualMonthlyEquiv(tier.priceAnnual))
            : tier.priceMonthly;

          return (
            <Card
              key={tier.id}
              className={`flex flex-col relative ${tier.border} ${
                tier.id === 'verified' ? 'ring-2 ring-sky-200 dark:ring-sky-800' : ''
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${tier.badgeStyle}`}>
                    {tier.badge}
                  </span>
                </div>
              )}

              <CardContent className="pt-6 pb-6 flex flex-col flex-1">
                {/* Tier header */}
                <div className="flex items-center gap-2.5 mb-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${tier.iconBg}`}>
                    <Icon className={`h-4.5 w-4.5 ${tier.iconColor}`} />
                  </div>
                  <div>
                    <p className="font-bold text-base">{tier.label}</p>
                    {tier.isCurrent && (
                      <span className="text-xs text-muted-foreground">Your current plan</span>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {tier.priceLine ? (
                    <>
                      <p className="text-2xl font-bold">{tier.priceLine}</p>
                      <p className="text-sm text-muted-foreground">{tier.priceSub}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          ${billing === 'annual' ? annualMonthlyEquiv(tier.priceAnnual!) : monthlyPrice}
                        </span>
                        <span className="text-muted-foreground text-sm">CAD / mo</span>
                      </div>
                      {billing === 'annual' && tier.priceAnnual && (
                        <p className="text-xs text-muted-foreground">
                          Billed ${tier.priceAnnual} / year
                          {isFoundingPeriod() && (
                            <span className="ml-1 text-amber-600 dark:text-amber-400 font-semibold">
                              → 3 months free with Founding Partner
                            </span>
                          )}
                        </p>
                      )}
                      {billing === 'monthly' && (
                        <p className="text-xs text-muted-foreground">Billed monthly · cancel anytime</p>
                      )}
                    </>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{tier.description}</p>

                {/* Features */}
                <ul className="space-y-2 flex-1 mb-5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-500" />
                      {f}
                    </li>
                  ))}
                  {tier.notIncluded.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="h-3.5 w-3.5 shrink-0 mt-0.5 text-center leading-none">—</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {tier.cta && forwarderId ? (
                  <UpgradeButton
                    tier={tier.id as TierId}
                    billingPeriod={billing}
                    forwarderId={forwarderId}
                  />
                ) : tier.cta && !forwarderId ? (
                  <div>
                    <Button variant="outline" className="w-full" disabled>
                      {tier.cta}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      Claim your listing first to upgrade.
                    </p>
                  </div>
                ) : (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Comparison table */}
      <div className="mb-12">
        <h2 className="text-lg font-bold mb-4">Feature Comparison</h2>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Feature</th>
                <th className="text-center px-4 py-3 font-medium">Claimed</th>
                <th className="text-center px-4 py-3 font-medium text-sky-700 dark:text-sky-400">Verified</th>
                <th className="text-center px-4 py-3 font-medium text-amber-600 dark:text-amber-400">Featured</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row, i) => (
                <tr key={row.feature} className={i % 2 === 0 ? '' : 'bg-muted/10'}>
                  <td className="px-4 py-3 text-sm">{row.feature}</td>
                  <td className="px-4 py-3 text-center"><CellValue val={row.claimed} /></td>
                  <td className="px-4 py-3 text-center"><CellValue val={row.verified} /></td>
                  <td className="px-4 py-3 text-center"><CellValue val={row.featured} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ strip */}
      <div className="rounded-xl border bg-muted/20 p-6">
        <h2 className="text-base font-semibold mb-4">Common Questions</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              q: 'Can I cancel my subscription?',
              a: 'Monthly plans cancel at end of the current period. Annual plans are non-refundable after 7 days but you keep access through the paid period.',
            },
            {
              q: 'What happens to my listing if I cancel?',
              a: 'Your listing reverts to Claimed (pay-per-lead) tier. It stays active and visible — you just resume paying per lead.',
            },
            {
              q: 'How does the Founding Partner discount work?',
              a: 'Sign up for any annual plan before 30 June 2026. A Stripe coupon applies 3 free months (25% off annual price). Rate is locked for 12 months.',
            },
            {
              q: 'Do verified forwarders really get free leads?',
              a: 'Yes. Your subscription replaces per-lead charges. Every matched quote request delivered to you is included at no extra cost.',
            },
            {
              q: 'Is there a contract length?',
              a: 'No minimum contract. Monthly plans are month-to-month. Annual plans run 12 months from the start date.',
            },
            {
              q: 'What analytics are included?',
              a: 'Lane summary (response rates per origin-market pair), mode breakdown, and rate benchmarking (last 3 responded quotes per lane).',
            },
          ].map((faq) => (
            <div key={faq.q}>
              <p className="text-sm font-semibold mb-1">{faq.q}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics preview callout */}
      <div className="mt-8 rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/10 p-5 flex items-start gap-4">
        <BarChart3 className="h-8 w-8 text-sky-600 dark:text-sky-400 shrink-0" />
        <div>
          <p className="font-semibold text-sky-800 dark:text-sky-300 mb-1">Lane Analytics included in Verified &amp; Featured</p>
          <p className="text-sm text-muted-foreground">
            Track which lanes and product categories are generating the most requests, monitor your response rate against the 48-hour SLA, and benchmark your rates against other responded quotes on the platform.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-10 text-muted-foreground">Loading…</div>}>
      <UpgradePageInner />
    </Suspense>
  );
}
