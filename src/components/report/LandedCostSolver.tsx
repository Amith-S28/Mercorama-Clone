'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import type { SmeRecord } from '@/types';
import { calculateLandedCost } from '@/lib/landed-cost-calculator';
import { getCountryFallback } from '@/lib/mock-fallback-data';
import { FolderDisclosure } from '@/components/shared/FolderDisclosure';
import { snappy } from '@/lib/animation/presets';

export interface LandedCostSolverProps {
  sme: SmeRecord;
}

export function LandedCostSolver({ sme }: LandedCostSolverProps) {
  const fallback = getCountryFallback(sme.targetCountry);
  const [freight, setFreight] = useState(fallback.freightRateCadPerFeu);
  const [tariffPct, setTariffPct] = useState(fallback.tariffRateDefault * 100);
  const [quantity, setQuantity] = useState(sme.exportQuantity);
  const [volatility30d, setVolatility30d] = useState<number | null>(fallback.volatility30d);
  const [volatility90d, setVolatility90d] = useState<number | null>(fallback.volatility90d);
  const [dataOrigin, setDataOrigin] = useState('structured-fallback');
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadMarketInputs() {
      const params = new URLSearchParams({
        origin: 'CAN',
        destination: sme.targetCountry,
        hsCode: sme.hsCode,
        country: sme.targetCountry,
        base: 'CAD',
        target: fallback.currency,
      });

      try {
        const [freightRes, tariffRes, ratesRes] = await Promise.all([
          fetch(`/api/sandbox/freight?origin=CAN&destination=${sme.targetCountry}`),
          fetch(`/api/sandbox/tariffs?${params.toString()}`),
          fetch(`/api/sandbox/rates?base=CAD&target=${fallback.currency}`),
        ]);

        if (cancelled) return;

        const origins = [freightRes, tariffRes, ratesRes]
          .map((res) => res.headers.get('data-origin'))
          .filter(Boolean);
        if (origins.includes('live')) setDataOrigin('live');
        else if (origins.includes('mock-fallback')) setDataOrigin('mock-fallback');

        if (freightRes.ok) {
          const freightData = (await freightRes.json()) as { containerRateCad?: number };
          if (freightData.containerRateCad) setFreight(freightData.containerRateCad);
        }
        if (tariffRes.ok) {
          const tariffData = (await tariffRes.json()) as { rate?: number };
          if (typeof tariffData.rate === 'number') setTariffPct(tariffData.rate * 100);
        }
        if (ratesRes.ok) {
          const ratesData = (await ratesRes.json()) as {
            volatility30d?: number;
            volatility90d?: number;
          };
          if (ratesData.volatility30d != null) setVolatility30d(ratesData.volatility30d);
          if (ratesData.volatility90d != null) setVolatility90d(ratesData.volatility90d);
        }
      } catch {
        if (!cancelled) setDataOrigin('structured-fallback');
      }
    }

    void loadMarketInputs();
    return () => {
      cancelled = true;
    };
  }, [sme.targetCountry, sme.hsCode, fallback.currency]);

  const result = useMemo(
    () =>
      calculateLandedCost({
        productionCost: sme.productionCost,
        unitPrice: sme.unitPrice,
        exportQuantity: quantity,
        targetProfitMargin: sme.targetProfitMargin,
        containerRateCad: freight,
        tariffRate: tariffPct / 100,
        volatility30d,
        volatility90d,
      }),
    [sme, freight, tariffPct, quantity, volatility30d, volatility90d]
  );

  const statusColor = result.insolvent ? '#EF4444' : result.meetsTarget ? '#22C55E' : '#F59E0B';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
          Landed Cost Solver
        </p>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          {sme.targetCountryName} · HS {sme.hsCode} · market inputs: {dataOrigin}
        </p>
      </div>

      <SliderField
        label="Container freight (CAD)"
        value={freight}
        min={1500}
        max={12000}
        step={100}
        format={(v) => `$${v.toLocaleString()}`}
        onChange={setFreight}
      />
      <SliderField
        label="Tariff rate (%)"
        value={tariffPct}
        min={0}
        max={35}
        step={0.5}
        format={(v) => `${v.toFixed(1)}%`}
        onChange={setTariffPct}
      />
      <SliderField
        label="Export quantity (units)"
        value={quantity}
        min={500}
        max={50000}
        step={500}
        format={(v) => v.toLocaleString()}
        onChange={setQuantity}
      />

      <motion.div
        layout
        transition={snappy}
        style={{
          padding: '1rem',
          borderRadius: '16px',
          border: `1px solid ${statusColor}`,
          background: 'var(--bg-primary)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Landed cost / unit</span>
          <span
            className="mono-label"
            style={{ fontSize: '1rem', color: 'var(--text-primary)' }}
          >
            ${result.landedCost.toFixed(2)}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginTop: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            FX-adjusted margin
          </span>
          <span className="mono-label" style={{ fontSize: '1rem', color: statusColor }}>
            {result.currencyAdjustedMargin.toFixed(1)}%
          </span>
        </div>
        {result.warning ? (
          <p style={{ margin: '0.75rem 0 0', fontSize: '0.75rem', color: statusColor }}>{result.warning}</p>
        ) : null}
      </motion.div>

      <FolderDisclosure
        title="Cost breakdown"
        subtitle={`FX buffer ${result.fxBufferUsed.toFixed(2)}% · volatility fallback`}
        open={detailsOpen}
        onToggle={() => setDetailsOpen((v) => !v)}
      >
        <dl
          style={{
            margin: '0.75rem 0 0',
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '0.5rem 1rem',
            fontSize: '0.8125rem',
          }}
        >
          <Row label="Unit freight" value={`$${result.unitFreightCost.toFixed(2)}`} />
          <Row label="Tariff / unit" value={`$${result.tariffPerUnit.toFixed(2)}`} />
          <Row label="Broker fee" value={`$${result.brokerFee.toFixed(2)}`} />
          <Row label="Insurance" value={`$${result.insuranceFee.toFixed(2)}`} />
          <Row label="Actual margin" value={`${result.actualMargin.toFixed(1)}%`} />
          <Row label="Target margin" value={`${sme.targetProfitMargin}%`} />
        </dl>
      </FolderDisclosure>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <label style={{ display: 'block' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '0.375rem',
          fontSize: '0.8125rem',
        }}
      >
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="mono-label" style={{ color: 'var(--text-primary)', fontSize: '0.6875rem' }}>
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: 'var(--accent-premium)' }}
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt style={{ color: 'var(--text-secondary)', margin: 0 }}>{label}</dt>
      <dd
        className="mono-label"
        style={{ margin: 0, color: 'var(--text-primary)', textAlign: 'right', fontSize: '0.6875rem' }}
      >
        {value}
      </dd>
    </>
  );
}
