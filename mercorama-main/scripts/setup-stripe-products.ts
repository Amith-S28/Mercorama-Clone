// scripts/setup-stripe-products.ts
// One-time script — creates the 4 Stripe products for Cohort 1.
// Run: npx tsx scripts/setup-stripe-products.ts
//
// IMPORTANT: Set STRIPE_SECRET_KEY in your environment before running.
// After running, copy the 4 price IDs printed below into your .env:
//   STRIPE_PRICE_STARTER_FOUNDING=price_xxx
//   STRIPE_PRICE_GROWTH_FOUNDING=price_xxx
//   STRIPE_PRICE_STARTER_PUBLIC=price_xxx
//   STRIPE_PRICE_GROWTH_PUBLIC=price_xxx

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function createProduct(name: string): Promise<string> {
  const product = await stripe.products.create({ name });
  return product.id;
}

async function run() {
  console.log('Creating Stripe products and prices for Mercorama Cohort 1...\n');

  // ── STARTER FOUNDING (active) ────────────────────────────────────────────
  const starterProductId = await createProduct('Mercorama Starter');
  const starterFounding = await stripe.prices.create({
    product:    starterProductId,
    unit_amount: 9900,
    currency:   'cad',
    recurring:  { interval: 'month' },
    nickname:   'Starter — Founding Member',
    active:     true,
    metadata: {
      plan:         'starter',
      founding:     'true',
      public_price: '14900',
      lock_months:  '6',
    },
  });

  // ── STARTER PUBLIC (inactive — hold for launch) ──────────────────────────
  const starterPublic = await stripe.prices.create({
    product:    starterProductId,
    unit_amount: 14900,
    currency:   'cad',
    recurring:  { interval: 'month' },
    nickname:   'Starter',
    active:     false,
    metadata: {
      plan:     'starter',
      founding: 'false',
    },
  });

  // ── GROWTH FOUNDING (active) ─────────────────────────────────────────────
  const growthProductId = await createProduct('Mercorama Growth');
  const growthFounding = await stripe.prices.create({
    product:    growthProductId,
    unit_amount: 29900,
    currency:   'cad',
    recurring:  { interval: 'month' },
    nickname:   'Growth — Founding Member',
    active:     true,
    metadata: {
      plan:         'growth',
      founding:     'true',
      public_price: '34900',
      lock_months:  '6',
    },
  });

  // ── GROWTH PUBLIC (inactive — hold for launch) ───────────────────────────
  const growthPublic = await stripe.prices.create({
    product:    growthProductId,
    unit_amount: 34900,
    currency:   'cad',
    recurring:  { interval: 'month' },
    nickname:   'Growth',
    active:     false,
    metadata: {
      plan:     'growth',
      founding: 'false',
    },
  });

  console.log('✅ Products and prices created.\n');
  console.log('Add these to your .env on the server:\n');
  console.log(`STRIPE_PRICE_STARTER_FOUNDING=${starterFounding.id}`);
  console.log(`STRIPE_PRICE_GROWTH_FOUNDING=${growthFounding.id}`);
  console.log(`STRIPE_PRICE_STARTER_PUBLIC=${starterPublic.id}`);
  console.log(`STRIPE_PRICE_GROWTH_PUBLIC=${growthPublic.id}`);
}

run().catch((e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
