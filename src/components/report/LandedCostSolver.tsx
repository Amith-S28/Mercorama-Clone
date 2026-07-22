'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCcw, RotateCcw } from '@/components/ui/icons';
import type { SmeRecord } from '@/types';
import { calculateLandedCost } from '@/lib/landed-cost-calculator';
import { getCountryFallback } from '@/lib/mock-fallback-data';
import { FolderDisclosure } from '@/components/shared/FolderDisclosure';
import { snappy } from '@/lib/animation/presets';
import { FormattedNumberInput } from '@/components/ui/FormattedNumberInput';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { Slider } from '@/components/ui/Slider';

export interface LandedCostSolverProps {
  sme: SmeRecord;
}

export function LandedCostSolver({ sme }: LandedCostSolverProps) {
  const fallback = getCountryFallback(sme.targetCountry);
  const [freight, setFreight] = useState(fallback.freightRateCadPerFeu);
  const [tariffPct, setTariffPct] = useState(fallback.tariffRateDefault * 100);
  const [quantity, setQuantity] = useState(sme.exportQuantity);
  
  const [apiFreight, setApiFreight] = useState<number | null>(null);
  const [apiTariffPct, setApiTariffPct] = useState<number | null>(null);
  
  const [volatility30d, setVolatility30d] = useState<number | null>(fallback.volatility30d);
  const [volatility90d, setVolatility90d] = useState<number | null>(fallback.volatility90d);
  const [dataOrigin, setDataOrigin] = useState('structured-fallback');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadMarketInputs() {
      setLoading(true);
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
        if (origins.includes('live') || origins.includes('live-usda-agtransport')) setDataOrigin('live');
        else if (origins.includes('mock-fallback')) setDataOrigin('mock-fallback');
        else if (origins.includes('historical-offline')) setDataOrigin('historical-offline');

        if (freightRes.ok) {
          const freightData = (await freightRes.json()) as { containerRateCad?: number };
          if (freightData.containerRateCad) {
            setFreight(freightData.containerRateCad);
            setApiFreight(freightData.containerRateCad);
          }
        }
        if (tariffRes.ok) {
          const tariffData = (await tariffRes.json()) as { rate?: number };
          if (typeof tariffData.rate === 'number') {
            setTariffPct(tariffData.rate * 100);
            setApiTariffPct(tariffData.rate * 100);
          }
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
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMarketInputs();
    return () => {
      cancelled = true;
    };
  }, [sme.targetCountry, sme.hsCode, fallback.currency, refreshKey]);

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

  const freightModified = apiFreight !== null && freight !== apiFreight;
  const tariffModified = apiTariffPct !== null && tariffPct !== apiTariffPct;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
            Landed Cost Solver
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {sme.targetCountryName} · HS {sme.hsCode}
            </span>
            <LiveIndicator origin={dataOrigin} />
          </div>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '-0.25rem' }}>
           <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Container freight (CAD)</span>
           {freightModified && (
              <button 
                onClick={() => setFreight(apiFreight)}
                className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-[var(--accent-vivid)] hover:text-[var(--accent-hover)] transition-colors"
              >
                <RotateCcw size={10} />
                Revert to ${apiFreight.toLocaleString()}
              </button>
           )}
        </div>
        <FormattedNumberInput
          value={freight}
          onChange={setFreight}
          prefix="$"
        />
        <Slider
          value={Math.max(500, Math.min(25000, freight))}
          onChange={setFreight}
          min={500}
          max={25000}
          step={100}
          className="mb-2"
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '-0.25rem' }}>
           <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Tariff rate (%)</span>
           {tariffModified && (
              <button 
                onClick={() => setTariffPct(apiTariffPct)}
                className="flex items-center gap-1 text-[10px] uppercase font-mono tracking-wider text-[var(--accent-vivid)] hover:text-[var(--accent-hover)] transition-colors"
              >
                <RotateCcw size={10} />
                Revert to {apiTariffPct.toFixed(1)}%
              </button>
           )}
        </div>
        <FormattedNumberInput
          value={tariffPct}
          onChange={setTariffPct}
          suffix="%"
          step={0.1}
          max={100}
        />
        <Slider
          value={Math.max(0, Math.min(100, tariffPct))}
          onChange={setTariffPct}
          min={0}
          max={100}
          step={0.5}
          className="mb-2"
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '-0.25rem' }}>
           <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>Export quantity (units)</span>
        </div>
        <FormattedNumberInput
          value={quantity}
          onChange={setQuantity}
          min={1}
        />
        <Slider
          value={Math.max(1, Math.min(50000, quantity))}
          onChange={setQuantity}
          min={1}
          max={50000}
          step={100}
          className="mb-2"
        />
      </div>

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
