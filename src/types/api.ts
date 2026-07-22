export type ApiServiceId =
  | 'comtrade'
  | 'exchange_rate'
  | 'usda_agtransport'
  | 'csl'
  | 'wto'
  | 'usitc'
  | 'taric';

export type ApiHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'down'
  | 'unconfigured'
  | 'unknown';

export interface ApiServiceHealth {
  serviceId: ApiServiceId;
  status: ApiHealthStatus;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  latencyMs: number | null;
  error: string | null;
  isKeyConfigured: boolean;
}
