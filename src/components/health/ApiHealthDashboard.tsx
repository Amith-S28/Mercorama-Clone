'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown } from '@/components/ui/icons';
import { AnimatePresence, motion } from 'motion/react';
import { ApiStatusBadge } from '@/components/health/ApiStatusBadge';
import { Loader } from '@/components/ui/Loader';
import type { ApiHealthStatus, ApiServiceHealth, ApiServiceId } from '@/types';

const SERVICE_ORDER: ApiServiceId[] = [
  'comtrade',
  'exchange_rate',
  'usda_agtransport',
  'csl',
  'wto',
  'usitc',
  'taric',
];

const SERVICE_LABELS: Record<ApiServiceId, string> = {
  comtrade: 'UN Comtrade',
  exchange_rate: 'Exchange Rate',
  usda_agtransport: 'USDA AgTransport',
  csl: 'CSL Screening',
  wto: 'WTO Tariffs',
  usitc: 'USITC DataWeb',
  taric: 'EU TARIC',
};

const POLL_INTERVAL_MS = 30_000;

interface HealthApiResponse {
  services: ApiServiceHealth[];
  checkedAt: string;
}

function createUnknownService(serviceId: ApiServiceId): ApiServiceHealth {
  return {
    serviceId,
    status: 'unknown',
    lastCheckedAt: null,
    lastSuccessAt: null,
    latencyMs: null,
    error: null,
    isKeyConfigured: false,
  };
}

function worstStatus(statuses: ApiHealthStatus[]): ApiHealthStatus {
  const priority: ApiHealthStatus[] = [
    'down',
    'degraded',
    'unconfigured',
    'unknown',
    'healthy',
  ];
  for (const status of priority) {
    if (statuses.includes(status)) return status;
  }
  return 'unknown';
}

function formatLatency(latencyMs: number | null): string {
  if (latencyMs === null) return '—';
  return `${latencyMs}ms`;
}

export interface ApiHealthDashboardProps {
  collapsed?: boolean;
}

export function ApiHealthDashboard({ collapsed = false }: ApiHealthDashboardProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [services, setServices] = useState<ApiServiceHealth[]>(() =>
    SERVICE_ORDER.map(createUnknownService)
  );
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Health check failed (${response.status})`);
      }
      const data = (await response.json()) as HealthApiResponse;
      const byId = new Map(data.services.map((s) => [s.serviceId, s]));
      setServices(
        SERVICE_ORDER.map((id) => byId.get(id) ?? createUnknownService(id))
      );
      setLastCheckedAt(data.checkedAt);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach health API');
      setServices(SERVICE_ORDER.map(createUnknownService));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHealth();
    const interval = window.setInterval(() => {
      void fetchHealth();
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [fetchHealth]);

  const aggregateStatus = worstStatus(services.map((s) => s.status));
  const healthyCount = services.filter((s) => s.status === 'healthy').length;

  if (collapsed) {
    const dotClass =
      aggregateStatus === 'healthy'
        ? 'status-dot status-dot--healthy'
        : aggregateStatus === 'down'
          ? 'status-dot status-dot--down'
          : 'status-dot status-dot--degraded';

    return (
      <div
        className="health-panel"
        style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0.5rem' }}
        title={`${healthyCount}/${SERVICE_ORDER.length} services healthy`}
      >
        <span className={dotClass} aria-label={`API health: ${aggregateStatus}`} />
      </div>
    );
  }

  return (
    <div className="health-panel">
      <button
        type="button"
        className="health-panel__header"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
      >
        <span className="health-panel__summary">
          <span className="mono-label" style={{ fontSize: '0.625rem' }}>
            API Health
          </span>
          {loading ? (
            <Loader size="sm" label="" />
          ) : (
            <ApiStatusBadge status={aggregateStatus} />
          )}
        </span>
        <span className="health-panel__meta">
          {healthyCount}/{SERVICE_ORDER.length}
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          style={{ display: 'flex', color: 'var(--text-tertiary)' }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            className="health-panel__list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          >
            {error ? (
              <p className="health-panel__meta" style={{ padding: '0.375rem 0.625rem' }}>
                {error}
              </p>
            ) : null}
            {services.map((service) => (
              <div key={service.serviceId} className="health-panel__row">
                <span className="health-panel__service">
                  {SERVICE_LABELS[service.serviceId]}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="health-panel__meta">
                    {formatLatency(service.latencyMs)}
                  </span>
                  <ApiStatusBadge status={service.status} showDot={false} />
                </div>
              </div>
            ))}
            {lastCheckedAt ? (
              <p className="health-panel__meta" style={{ padding: '0.25rem 0.625rem' }}>
                Last checked {new Date(lastCheckedAt).toLocaleTimeString()}
              </p>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
