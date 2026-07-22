// app/auth/plan-config.ts

export type FeatureKey =
  | 'incoterms-analyzer'
  | 'hs-code-assistant'
  | 'contract-generator'
  | 'deal-wizard'
  | 'fta-diversify'
  | 'export-compass'
  | 'fund-my-export'
  | 'freight-connect';

export type PlanId = 'pro' | 'team' | 'enterprise';

export const planFeatures: Record<PlanId, FeatureKey[]> = {
  pro:        ['incoterms-analyzer', 'hs-code-assistant', 'contract-generator', 'deal-wizard', 'export-compass', 'freight-connect'],
  team:       ['incoterms-analyzer', 'hs-code-assistant', 'contract-generator', 'deal-wizard', 'fta-diversify', 'export-compass', 'fund-my-export', 'freight-connect'],
  enterprise: ['incoterms-analyzer', 'hs-code-assistant', 'contract-generator', 'deal-wizard', 'fta-diversify', 'export-compass', 'fund-my-export', 'freight-connect'],
};
