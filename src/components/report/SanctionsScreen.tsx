'use client';

import { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Search, ShieldCheck } from '@/components/ui/icons';
import type { SanctionsScreeningResult } from '@/types';
import { normalizeQuery } from '@/lib/sanctions-checker';
import { snappy } from '@/lib/animation/presets';

export interface SanctionsScreenProps {
  defaultQuery?: string;
}

export function SanctionsScreen({ defaultQuery = '' }: SanctionsScreenProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SanctionsScreeningResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runScreen = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/sandbox/screen?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) throw new Error('Screening request failed');
      const data = (await res.json()) as SanctionsScreeningResult;
      setResult(data);
    } catch {
      setError('Unable to complete sanctions screening.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const normalized = query ? normalizeQuery(query) : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div>
        <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
          Sanctions Screen
        </p>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          SEMA / Consolidated Screening List check
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void runScreen()}
          placeholder="Entity or company name"
          aria-label="Sanctions screening query"
          style={{
            flex: 1,
            padding: '0.625rem 0.875rem',
            borderRadius: '12px',
            border: '1px solid var(--border-low-contrast)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-outfit)',
            fontSize: '0.875rem',
          }}
        />
        <motion.button
          type="button"
          onClick={() => void runScreen()}
          disabled={loading || !query.trim()}
          whileTap={{ scale: 0.98 }}
          transition={snappy}
          aria-label="Run sanctions screen"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.5rem',
            borderRadius: '12px',
            border: '1px solid var(--border-low-contrast)',
            background: 'var(--accent-muted)',
            color: 'var(--accent-premium)',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading || !query.trim() ? 0.5 : 1,
          }}
        >
          <Search size={16} style={{ animation: loading ? 'pulse-glow 2s infinite' : 'none' }} />
        </motion.button>
      </div>

      {normalized ? (
        <p
          className="mono-label"
          style={{ margin: 0, color: 'var(--text-tertiary)', fontSize: '0.625rem' }}
        >
          Normalized: {normalized}
        </p>
      ) : null}

      {error ? (
        <p style={{ margin: 0, fontSize: '0.8125rem', color: '#EF4444' }}>{error}</p>
      ) : null}

      {result ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={snappy}
          style={{
            padding: '1rem',
            borderRadius: '16px',
            border: `1px solid ${result.match ? '#EF4444' : 'var(--border-low-contrast)'}`,
            background: result.match ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-primary)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            {result.match ? (
              <AlertTriangle size={16} color="#EF4444" />
            ) : (
              <ShieldCheck size={16} color="#22C55E" />
            )}
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
              {result.match ? 'Match Found' : 'Clear'}
            </span>
            <span
              className="mono-label"
              style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', fontSize: '0.625rem' }}
            >
              {result.dataOrigin}
            </span>
          </div>

          {result.match ? (
            <ul style={{ margin: 0, paddingLeft: '1.125rem', fontSize: '0.8125rem' }}>
              {result.matchedEntries.map((entry) => (
                <li key={`${entry.name}-${entry.source}`} style={{ color: 'var(--text-secondary)' }}>
                  {entry.name} — {entry.source}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              No matches in {result.source} ({result.sourceVersion})
            </p>
          )}
        </motion.div>
      ) : null}
    </div>
  );
}
