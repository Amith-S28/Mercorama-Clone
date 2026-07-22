'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { PRODUCTS, Product } from '@/lib/products'
import { cn } from '@/lib/utils'
import { trackEvent } from '@/lib/analytics'

const Checkout = dynamic(() => import('@/components/checkout'), { ssr: false })

const PLAN_ORDER = ['pro', 'team', 'enterprise']

function planKey(id: string) {
  if (id.startsWith('pro')) return 'pro'
  if (id.startsWith('team')) return 'team'
  return id
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function PlanCard({
  product,
  onSelect,
  selectedId,
  annual,
}: {
  product: Product
  onSelect: (id: string | null) => void
  selectedId: string | null
  annual: boolean
}) {
  const isContact = product.billingInterval === 'contact'
  const isSelected = selectedId === product.id
  const isAnnual = product.billingInterval === 'year'

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-8 transition-all duration-200',
        product.recommended
          ? 'border-teal-500 bg-slate-800 shadow-xl shadow-teal-500/10'
          : 'border-slate-700/60 bg-slate-800/50',
      )}
    >
      {product.recommended && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
          <span className="rounded-full bg-teal-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-slate-900">
            Most Popular
          </span>
        </div>
      )}

      {/* Plan name + description */}
      <div className="mb-6 mt-2">
        <h3 className="mb-1 text-xl font-bold text-white">{product.name}</h3>
        <p className="text-sm leading-relaxed text-slate-400">{product.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6 border-b border-slate-700/50 pb-6">
        {isContact ? (
          <p className="text-3xl font-black text-white">Let's talk</p>
        ) : (
          <>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-black text-white">{product.priceDisplay}</span>
              <span className="mb-1.5 text-sm text-slate-400">/mo</span>
            </div>
            {isAnnual ? (
              <p className="mt-1.5 text-xs font-medium text-teal-400">Billed annually — 20% off</p>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">Billed monthly</p>
            )}
          </>
        )}
      </div>

      {/* Features */}
      <ul className="mb-8 flex flex-col gap-3">
        {product.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
            <CheckIcon />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-auto">
        {isContact ? (
          <a
            href="mailto:hello@mercorama.com"
            onClick={() => trackEvent('cta_click', { label: 'pricing_contact_sales', location: 'pricing', plan: product.name })}
            className="block w-full rounded-xl border border-slate-600 py-3 text-center text-sm font-semibold text-slate-300 transition hover:border-teal-500/50 hover:text-white"
          >
            Contact Sales
          </a>
        ) : isSelected ? (
          <>
            <button
              onClick={() => onSelect(null)}
              className="mb-3 w-full text-xs text-slate-500 hover:text-slate-400"
            >
              ← Back to plans
            </button>
            <Checkout productId={product.id} />
          </>
        ) : (
          <button
            onClick={() => {
              trackEvent('cta_click', { label: 'pricing_get_started', location: 'pricing', plan: product.name });
              onSelect(product.id);
            }}
            className={cn(
              'w-full rounded-xl py-3 text-sm font-semibold transition',
              product.recommended
                ? 'bg-teal-500 text-slate-900 hover:bg-teal-400 shadow-lg shadow-teal-500/25'
                : 'bg-slate-700 text-white hover:bg-slate-600',
            )}
          >
            Get Started
          </button>
        )}
      </div>
    </div>
  )
}

export function PricingGrid() {
  const [annual, setAnnual] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const displayed = PRODUCTS.filter((p) => {
    if (p.billingInterval === 'free') return false
    if (p.billingInterval === 'contact') return true
    if (annual) return p.billingInterval === 'year'
    return p.billingInterval === 'month'
  }).sort((a, b) => PLAN_ORDER.indexOf(planKey(a.id)) - PLAN_ORDER.indexOf(planKey(b.id)))

  return (
    <section className="bg-[#0B1F3A] py-20 px-4 sm:py-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Heading */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-400">Pricing</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mx-auto max-w-xl text-lg text-slate-400">
            Start with your first export deal. Scale as your pipeline grows.
          </p>
        </div>

        {/* Monthly / Annual toggle */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className={cn('text-sm font-medium transition-colors', !annual ? 'text-white' : 'text-slate-500')}>
            Monthly
          </span>
          <button
            role="switch"
            aria-checked={annual}
            onClick={() => { setAnnual((v) => !v); setSelectedId(null) }}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
              annual ? 'bg-teal-500' : 'bg-slate-600',
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
                annual ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
          <span className={cn('flex items-center gap-2 text-sm font-medium transition-colors', annual ? 'text-white' : 'text-slate-500')}>
            Annual
            <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-xs font-semibold text-teal-400">
              Save 20%
            </span>
          </span>
        </div>

        {/* Cards — 3 column on desktop */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((product) => (
            <PlanCard
              key={product.id}
              product={product}
              selectedId={selectedId}
              onSelect={setSelectedId}
              annual={annual}
            />
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          All prices in USD · Annual plans billed as a single charge · Cancel anytime
        </p>
      </div>
    </section>
  )
}
