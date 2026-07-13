'use client';

import { motion } from 'motion/react';
import { getCountryByIso3, TIER_COLORS } from '@/lib/country-risk-data';
import { getCountryFallback } from '@/lib/mock-fallback-data';
import { snappy } from '@/lib/animation/presets';

export interface CountryPlaybookProps {
  iso3: string | null;
}

export function CountryPlaybook({ iso3 }: CountryPlaybookProps) {
  if (!iso3) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
          Country Playbook
        </p>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Select a country on the map to view FTA status, tariff defaults, and market signals.
        </p>
      </div>
    );
  }

  const risk = getCountryByIso3(iso3);
  const profile = getCountryFallback(iso3);
  const tier = risk?.tier ?? 'no-data';
  const tierColor = TIER_COLORS[tier === 'restricted' || tier === 'blocked' ? 'restricted' : tier] ?? TIER_COLORS['no-data'];

  return (
    <motion.div
      key={iso3}
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={snappy}
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}
    >
      <div>
        <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
          Country Playbook
        </p>
        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>{profile.name}</h3>
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 0.625rem',
          borderRadius: '9999px',
          border: `1px solid ${tierColor}`,
          alignSelf: 'flex-start',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: tierColor }} />
        <span className="mono-label" style={{ fontSize: '0.625rem', color: tierColor }}>
          {tier}
        </span>
      </div>

      <dl style={{ margin: 0, display: 'grid', gap: '0.625rem', fontSize: '0.8125rem' }}>
        <PlaybookRow label="FTA" value={risk?.fta ?? 'None'} />
        <PlaybookRow label="Region" value={risk?.region ?? '—'} />
        <PlaybookRow label="Default tariff" value={`${(profile.tariffRateDefault * 100).toFixed(1)}%`} />
        <PlaybookRow label="Freight (FEU)" value={`$${profile.freightRateCadPerFeu.toLocaleString()} CAD`} />
        <PlaybookRow label="Import volume" value={`$${(profile.comtradeImportVolumeUsd / 1e6).toFixed(0)}M`} />
        <PlaybookRow
          label="YoY change"
          value={`${profile.comtradeYoYChange >= 0 ? '+' : ''}${(profile.comtradeYoYChange * 100).toFixed(1)}%`}
        />
        <PlaybookRow label="Sanctions" value={profile.sanctionsClear ? 'Clear' : 'Review required'} />
      </dl>

      {risk?.ftaNotes ? (
        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.6 }}>
          {risk.ftaNotes}
        </p>
      ) : null}
    </motion.div>
  );
}

function PlaybookRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
      <dt style={{ color: 'var(--text-secondary)', margin: 0 }}>{label}</dt>
      <dd
        className="mono-label"
        style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.6875rem', textAlign: 'right' }}
      >
        {value}
      </dd>
    </div>
  );
}
