import { notFound } from 'next/navigation';
import { Navbar } from '@/components/navbar';
import { getProduct } from '@/lib/products';
import { CheckoutPanel } from './_components/CheckoutPanel';

interface Props {
  params: Promise<{ productId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { productId } = await params;
  const product = getProduct(productId);
  if (!product) return {};
  return {
    title: `Subscribe to ${product.name} — Mercorama`,
  };
}

export default async function CheckoutPage({ params }: Props) {
  const { productId } = await params;
  const product = getProduct(productId);

  if (!product || product.billingInterval === 'free' || product.billingInterval === 'contact') {
    notFound();
  }

  const billingLabel =
    product.billingInterval === 'year'
      ? `$${(product.priceInCents / 100).toFixed(2)} / year`
      : `$${(product.priceInCents / 100).toFixed(2)} / month`;

  const effectiveLabel =
    product.billingInterval === 'year'
      ? `${product.priceDisplay}/mo effective`
      : null;

  return (
    <div className="flex min-h-screen flex-col bg-[#0B1F3A]">
      <Navbar />

      <main className="flex flex-1 flex-col lg:flex-row">

        {/* ── Left: Plan summary ── */}
        <div className="relative flex flex-col justify-center border-b border-slate-700/50 bg-[#0B1F3A] px-6 py-10 lg:w-[420px] lg:shrink-0 lg:border-b-0 lg:border-r lg:px-12 lg:py-16">

          {/* Ambient blob */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#1F6FEB]/15 blur-3xl" aria-hidden />

          <a
            href="/beta"
            className="relative mb-8 inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-teal-400"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back to pricing
          </a>

          {/* Plan badge */}
          <div className="relative mb-6">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-teal-400">
                {product.billingInterval === 'year' ? 'Annual plan' : 'Monthly plan'}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white">{product.name}</h1>
            <p className="mt-1 text-slate-400">{product.description}</p>
          </div>

          {/* Price display */}
          <div className="relative mb-6 rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black text-white">{product.priceDisplay}</span>
              <span className="mb-1 text-sm text-slate-400">/mo</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">{billingLabel}</p>
            {effectiveLabel && (
              <p className="mt-0.5 text-xs text-teal-400">{effectiveLabel} — 20% off monthly</p>
            )}
          </div>

          {/* Features */}
          <ul className="relative space-y-3">
            {product.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          {/* Trust note */}
          <p className="relative mt-8 text-xs text-slate-500">
            Secured by Stripe · Cancel anytime · No hidden fees
          </p>
        </div>

        {/* ── Right: Stripe checkout ── */}
        <div className="flex flex-1 flex-col items-center justify-start bg-slate-950/50 px-4 py-10 lg:px-12 lg:py-16">
          <div className="w-full max-w-lg">
            <h2 className="mb-6 text-lg font-semibold text-white">Complete your subscription</h2>
            <CheckoutPanel productId={productId} />
          </div>
        </div>

      </main>
    </div>
  );
}
