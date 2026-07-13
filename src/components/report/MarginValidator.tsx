'use client';

import { useMemo } from 'react';
import { motion } from 'motion/react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import type { LandedCostResult, SmeRecord } from '@/types';
import { calculateLandedCost } from '@/lib/landed-cost-calculator';
import { getCountryFallback } from '@/lib/mock-fallback-data';
import { snappy } from '@/lib/animation/presets';

export interface MarginValidatorProps {
  sme: SmeRecord;
  landedResult?: LandedCostResult;
}

export function MarginValidator({ sme, landedResult }: MarginValidatorProps) {
  const fallback = getCountryFallback(sme.targetCountry);

  const result =
    landedResult ??
    calculateLandedCost({
      productionCost: sme.productionCost,
      unitPrice: sme.unitPrice,
      exportQuantity: sme.exportQuantity,
      targetProfitMargin: sme.targetProfitMargin,
      containerRateCad: fallback.freightRateCadPerFeu,
      tariffRate: fallback.tariffRateDefault,
      volatility30d: fallback.volatility30d,
      volatility90d: fallback.volatility90d,
    });

  const checks = useMemo(
    () => [
      {
        label: 'Unit price covers landed cost',
        pass: !result.insolvent,
        detail: result.insolvent
          ? 'Sale price is below total landed cost per unit.'
          : `$${(sme.unitPrice - result.landedCost).toFixed(2)} headroom per unit.`,
      },
      {
        label: 'Meets target profit margin',
        pass: result.meetsTarget,
        detail: `Target ${sme.targetProfitMargin}% · FX-adjusted ${result.currencyAdjustedMargin.toFixed(1)}%`,
      },
      {
        label: 'FX volatility buffer applied',
        pass: result.fxBufferUsed <= 5 || result.meetsTarget,
        detail: `${result.fxBufferUsed.toFixed(2)}% buffer from ${fallback.volatility30d ? '30d' : '90d'} volatility`,
      },
    ],
    [result, sme, fallback.volatility30d]
  );

  const allPass = checks.every((c) => c.pass);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
          Margin Validator
        </p>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Profitability gate for {sme.name}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={snappy}
        style={{
          padding: '0.875rem 1rem',
          borderRadius: '14px',
          border: `1px solid ${allPass ? '#22C55E' : '#F59E0B'}`,
          background: allPass ? 'rgba(34, 197, 94, 0.06)' : 'rgba(245, 158, 11, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        {allPass ? <CheckCircle2 size={16} color="#22C55E" /> : <AlertCircle size={16} color="#F59E0B" />}
        <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
          {allPass ? 'Margin validation passed' : 'Margin validation needs review'}
        </span>
      </motion.div>

      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
        {checks.map((check) => (
          <li
            key={check.label}
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              border: '1px solid var(--border-low-contrast)',
              background: 'var(--bg-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              {check.pass ? (
                <CheckCircle2 size={14} color="#22C55E" />
              ) : (
                <AlertCircle size={14} color="#F59E0B" />
              )}
              <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>{check.label}</span>
            </div>
            <p style={{ margin: 0, paddingLeft: '1.375rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {check.detail}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
