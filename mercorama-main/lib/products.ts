export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number        // charged amount (monthly or annual total)
  priceDisplay: string        // per-month display price
  billingInterval: 'month' | 'year' | 'free' | 'contact'
  features: string[]
  recommended?: boolean
}

// Pricing:
//   Starter monthly: $99/mo
//   Starter annual:  $99 × 12 × 0.80 = $950.40/yr  → $79.20/mo effective
//   Growth monthly:  $249/mo
//   Growth annual:   $249 × 12 × 0.80 = $2390.40/yr → $199.20/mo effective

export const PRODUCTS: Product[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with trade intelligence at no cost.',
    priceInCents: 0,
    priceDisplay: '$0',
    billingInterval: 'free',
    features: [
      '3 Incoterms Analyzer runs / month',
      '3 HS Code classifications / month',
      'Basic analysis results',
      'Email support',
    ],
  },
  {
    id: 'pro-monthly',
    name: 'Starter',
    description: 'For your first export deals.',
    priceInCents: 9900,
    priceDisplay: '$99',
    billingInterval: 'month',
    recommended: true,
    features: [
      '10 complete deals per month',
      '30 Incoterms Analyzer runs / month',
      '30 HS Code classifications / month',
      '30 Deal Summary Generator runs / month',
      'Save Product Export Profiles',
      '🔒 Fund My Export — Growth Plan only',
      'Email support',
    ],
  },
  {
    id: 'pro-annual',
    name: 'Starter',
    description: 'For your first export deals — billed annually.',
    priceInCents: 95040,      // $950.40/yr billed annually
    priceDisplay: '$79',      // $79.20/mo effective
    billingInterval: 'year',
    recommended: true,
    features: [
      '10 complete deals per month',
      '30 Incoterms Analyzer runs / month',
      '30 HS Code classifications / month',
      '30 Deal Summary Generator runs / month',
      'Save Product Export Profiles',
      '🔒 Fund My Export — Growth Plan only',
      'Email support',
    ],
  },
  {
    id: 'team-monthly',
    name: 'Growth',
    description: 'For manufacturers exporting every month.',
    priceInCents: 24900,
    priceDisplay: '$249',
    billingInterval: 'month',
    features: [
      '50 complete deals per month',
      '150 Incoterms Analyzer runs / month',
      '150 HS Code classifications / month',
      '150 Deal Summary Generator runs / month',
      'FTA Diversify Wizard + Export Compass',
      '💰 Fund My Export — match to 20+ Canadian grants & programs (20 searches/mo)',
      'Shared Product Export Profiles',
      'Priority support + onboarding call',
    ],
  },
  {
    id: 'team-annual',
    name: 'Growth',
    description: 'For manufacturers exporting every month — billed annually.',
    priceInCents: 239040,     // $2390.40/yr billed annually
    priceDisplay: '$199',     // $199.20/mo effective
    billingInterval: 'year',
    features: [
      '50 complete deals per month',
      '150 Incoterms Analyzer runs / month',
      '150 HS Code classifications / month',
      '150 Deal Summary Generator runs / month',
      'FTA Diversify Wizard + Export Compass',
      '💰 Fund My Export — match to 20+ Canadian grants & programs (20 searches/mo)',
      'Shared Product Export Profiles',
      'Priority support + onboarding call',
    ],
  },
  {
    id: 'enterprise',
    name: 'Advisory',
    description: 'For brokers and consultants serving many clients.',
    priceInCents: 0,
    priceDisplay: "Let's talk",
    billingInterval: 'contact',
    features: [
      'Everything in Growth, unlimited volumes',
      'Multi-client workspaces',
      'Custom deal summary templates and white-labeled exports',
      'Dedicated success manager',
    ],
  },
]

export function getProduct(productId: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === productId)
}
