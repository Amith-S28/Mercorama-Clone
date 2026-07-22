'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from '@/components/ui/icons';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { useGsapCounter } from '@/hooks';

export interface MacroEconomicsPanelProps {
  countryIso3: string;
}

export function MacroEconomicsPanel({ countryIso3 }: MacroEconomicsPanelProps) {
  const [data, setData] = useState<{ gdpUsd: number | null, gdpYear: string | null, inflationPct: number | null, inflationYear: string | null, dataOrigin: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/sandbox/macro?country=${countryIso3}`);
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [countryIso3]);

  const gdpBillion = data?.gdpUsd ? data.gdpUsd / 1000000000 : 0;

  const { ref: gdpRef, value: gdpValue } = useGsapCounter<HTMLHeadingElement>({
    end: gdpBillion,
    decimals: 1,
    prefix: '$',
    suffix: 'B',
  });

  const { ref: inflationRef, value: inflationValue } = useGsapCounter<HTMLHeadingElement>({
    end: data?.inflationPct ?? 0,
    decimals: 1,
    suffix: '%',
  });

  if (loading) {
    return (
      <div className="bento-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
        <Loader2 size={18} className="animate-spin" />
        Loading Macro Data...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bento-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
            Macro Economics
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {countryIso3} Indicators
            </span>
            <LiveIndicator origin={data.dataOrigin} sourceName="World Bank" />
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        <div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Gross Domestic Product ({data.gdpYear})</p>
          <h3 ref={gdpRef} style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{gdpValue}</h3>
        </div>
        <div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Inflation Rate ({data.inflationYear})</p>
          <h3 ref={inflationRef} style={{ fontSize: '1.75rem', fontWeight: 600, margin: 0, color: data.inflationPct && data.inflationPct > 5 ? 'var(--warning)' : 'var(--text-primary)' }}>{inflationValue}</h3>
        </div>
      </div>
    </div>
  );
}
