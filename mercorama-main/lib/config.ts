function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const config = {
  anthropicApiKey: requireEnv('ANTHROPIC_API_KEY'),
  // Stripe — optional at startup; route guards against missing key at request time
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  // Stripe price IDs — set after running scripts/setup-stripe-products.ts
  stripePriceStarterFounding: process.env.STRIPE_PRICE_STARTER_FOUNDING ?? '',
  stripePriceGrowthFounding:  process.env.STRIPE_PRICE_GROWTH_FOUNDING ?? '',
  stripePriceStarterPublic:   process.env.STRIPE_PRICE_STARTER_PUBLIC ?? '',
  stripePriceGrowthPublic:    process.env.STRIPE_PRICE_GROWTH_PUBLIC ?? '',
  supabaseUrl: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
  // Resend — optional at startup; route guards against missing key at request time
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? 'Mercorama Reports <reports@mercorama.com>',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mercorama.com',
  boardUrl: process.env.NEXT_PUBLIC_BOARD_URL ?? 'https://board.mercorama.com',
  marketingUrl: process.env.NEXT_PUBLIC_MARKETING_URL ?? 'https://mercorama.com',
  // Live data API keys — optional at startup; connectors guard against missing keys
  comtradeApiKey:  process.env.COMTRADE_API_KEY ?? '',
  statcanApiKey:   process.env.STATCAN_API_KEY ?? '',  // not required for public tables
  cronSecret:      process.env.CRON_SECRET ?? '',
};
