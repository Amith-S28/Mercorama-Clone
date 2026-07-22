// app/auth/get-current-user.ts

import { PlanId, FeatureKey, planFeatures } from './plan-config';

export type UserSession = {
  id: string;
  name?: string;
  planId: PlanId;
  features: FeatureKey[];
};

export async function getCurrentUser(): Promise<UserSession> {
  // TODO: replace with real auth/session lookup
  // For now hardcode planId = 'pro'.
  return {
    id: 'demo-user',
    name: 'Demo User',
    planId: 'pro',
    features: planFeatures['pro'],
  };
}
