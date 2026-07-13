import { env, isServiceConfigured } from '@/lib/env';
import type { ApiHealthStatus, ApiServiceHealth, ApiServiceId } from '@/types';

interface ServiceProbe {
  id: ApiServiceId;
  keyEnv?: keyof typeof env;
  probe?: () => Promise<{ ok: boolean; latencyMs: number; error?: string }>;
}

const PROBES: ServiceProbe[] = [
  {
    id: 'comtrade',
    keyEnv: 'COMTRADE_API_KEY',
    probe: async () => {
      const start = Date.now();
      try {
        const res = await fetch('https://comtradeapi.un.org/public/v1/preview/C/A/HS', {
          headers: env.COMTRADE_API_KEY ? { 'Ocp-Apim-Subscription-Key': env.COMTRADE_API_KEY } : {},
          signal: AbortSignal.timeout(5000),
        });
        return { ok: res.ok, latencyMs: Date.now() - start, error: res.ok ? undefined : `HTTP ${res.status}` };
      } catch (error) {
        return {
          ok: false,
          latencyMs: Date.now() - start,
          error: error instanceof Error ? error.message : 'Probe failed',
        };
      }
    },
  },
  {
    id: 'exchange_rate',
    keyEnv: 'EXCHANGE_RATE_API_KEY',
    probe: async () => {
      const start = Date.now();
      try {
        const res = await fetch(`https://v6.exchangerate-api.com/v6/${env.EXCHANGE_RATE_API_KEY}/latest/CAD`, {
          signal: AbortSignal.timeout(5000),
        });
        return { ok: res.ok, latencyMs: Date.now() - start, error: res.ok ? undefined : `HTTP ${res.status}` };
      } catch (error) {
        return {
          ok: false,
          latencyMs: Date.now() - start,
          error: error instanceof Error ? error.message : 'Probe failed',
        };
      }
    },
  },
  {
    id: 'csl',
    keyEnv: 'CSL_API_KEY',
    probe: async () => {
      const start = Date.now();
      try {
        const res = await fetch(`https://api.trade.gov/consolidated_screening_list/search?api_key=${env.CSL_API_KEY}&size=1`, {
          signal: AbortSignal.timeout(5000),
        });
        return { ok: res.ok, latencyMs: Date.now() - start, error: res.ok ? undefined : `HTTP ${res.status}` };
      } catch (error) {
        return {
          ok: false,
          latencyMs: Date.now() - start,
          error: error instanceof Error ? error.message : 'Probe failed',
        };
      }
    },
  },
  {
    id: 'wto',
    keyEnv: 'WTO_API_KEY',
    probe: async () => {
      const start = Date.now();
      try {
        const res = await fetch(`https://api.wto.org/timeseries/v1/indicators?subscription-key=${env.WTO_API_KEY}`, {
          signal: AbortSignal.timeout(5000),
        });
        return { ok: res.ok, latencyMs: Date.now() - start, error: res.ok ? undefined : `HTTP ${res.status}` };
      } catch (error) {
        return {
          ok: false,
          latencyMs: Date.now() - start,
          error: error instanceof Error ? error.message : 'Probe failed',
        };
      }
    },
  },
  {
    id: 'usda_agtransport',
    probe: async () => {
      const start = Date.now();
      try {
        const res = await fetch('https://agtransport.usda.gov/resource/dtp5-fwp8.json?$limit=1', {
          signal: AbortSignal.timeout(5000),
        });
        return { ok: res.ok, latencyMs: Date.now() - start, error: res.ok ? undefined : `HTTP ${res.status}` };
      } catch (error) {
        return {
          ok: false,
          latencyMs: Date.now() - start,
          error: error instanceof Error ? error.message : 'Probe failed',
        };
      }
    },
  },
  {
    id: 'usitc',
    probe: async () => {
      const start = Date.now();
      try {
        const res = await fetch('https://hts.usitc.gov/reststop/search?keyword=0101', {
          signal: AbortSignal.timeout(5000),
        });
        return { ok: res.ok, latencyMs: Date.now() - start, error: res.ok ? undefined : `HTTP ${res.status}` };
      } catch (error) {
        return {
          ok: false,
          latencyMs: Date.now() - start,
          error: error instanceof Error ? error.message : 'Probe failed',
        };
      }
    },
  },
  {
    id: 'taric',
    probe: async () => {
      const start = Date.now();
      try {
        const res = await fetch('https://ec.europa.eu/taxation_customs/dds2/taric/taric_consultation.jsp', {
          signal: AbortSignal.timeout(5000),
        });
        return { ok: res.ok, latencyMs: Date.now() - start, error: res.ok ? undefined : `HTTP ${res.status}` };
      } catch (error) {
        return {
          ok: false,
          latencyMs: Date.now() - start,
          error: error instanceof Error ? error.message : 'Probe failed',
        };
      }
    },
  },
];

export async function checkApiHealth(): Promise<ApiServiceHealth[]> {
  const now = new Date().toISOString();

  return Promise.all(
    PROBES.map(async (service): Promise<ApiServiceHealth> => {
      const isKeyConfigured = service.keyEnv ? isServiceConfigured(service.keyEnv) : true;

      if (!isKeyConfigured) {
        return {
          serviceId: service.id,
          status: 'unconfigured',
          lastCheckedAt: now,
          lastSuccessAt: null,
          latencyMs: null,
          error: 'API key not configured — using structured fallback data',
          isKeyConfigured: false,
        };
      }

      if (!service.probe) {
        return {
          serviceId: service.id,
          status: 'healthy',
          lastCheckedAt: now,
          lastSuccessAt: now,
          latencyMs: null,
          error: null,
          isKeyConfigured: true,
        };
      }

      const result = await service.probe();
      const status: ApiHealthStatus = result.ok ? 'healthy' : 'degraded';

      return {
        serviceId: service.id,
        status,
        lastCheckedAt: now,
        lastSuccessAt: result.ok ? now : null,
        latencyMs: result.latencyMs,
        error: result.error ?? null,
        isKeyConfigured: true,
      };
    })
  );
}
