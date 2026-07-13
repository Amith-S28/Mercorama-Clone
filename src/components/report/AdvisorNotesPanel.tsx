'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { AdvisorNote, PillarKey } from '@/types';
import { PILLAR_LABELS } from '@/lib/scoring-engine';
import { snappy } from '@/lib/animation/presets';

const PILLARS = Object.keys(PILLAR_LABELS) as PillarKey[];

interface AdvisorNotesPanelProps {
  assessmentId: string;
}

export function AdvisorNotesPanel({ assessmentId }: AdvisorNotesPanelProps) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [active, setActive] = useState<PillarKey>('management');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/advisor-notes?assessmentId=${encodeURIComponent(assessmentId)}`
        );
        if (!res.ok) return;
        const rows = (await res.json()) as AdvisorNote[];
        if (cancelled) return;
        const map: Record<string, string> = {};
        for (const note of rows) {
          map[note.pillar] = note.content;
        }
        setNotes(map);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [assessmentId]);

  const persistNote = useCallback(
    async (pillar: string, content: string) => {
      const res = await fetch('/api/advisor-notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId, pillar, content }),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
      }
    },
    [assessmentId]
  );

  useEffect(() => {
    if (loading) return;
    const content = notes[active] ?? '';
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void persistNote(active, content);
    }, 700);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [notes, active, loading, persistNote]);

  return (
    <section className="bento-card" style={{ padding: '1.5rem' }}>
      <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
        Advisor Workspace
      </p>
      <h3 style={{ fontWeight: 300, fontSize: '1.25rem', marginBottom: '1rem' }}>Pillar Notes</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {PILLARS.map((pillar) => (
          <motion.button
            key={pillar}
            type="button"
            whileTap={{ scale: 0.98 }}
            transition={snappy}
            onClick={() => setActive(pillar)}
            style={{
              border: `1px solid ${active === pillar ? 'var(--accent-premium)' : 'var(--border-low-contrast)'}`,
              background: active === pillar ? 'var(--accent-premium-glow)' : 'transparent',
              color: 'var(--text-primary)',
              borderRadius: '999px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.7rem',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
            }}
          >
            {PILLAR_LABELS[pillar].split(' ')[0]}
          </motion.button>
        ))}
      </div>
      <textarea
        value={notes[active] ?? ''}
        onChange={(e) => setNotes((prev) => ({ ...prev, [active]: e.target.value }))}
        rows={6}
        disabled={loading}
        aria-label={`Notes for ${PILLAR_LABELS[active]}`}
        style={{
          width: '100%',
          resize: 'vertical',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-low-contrast)',
          borderRadius: 'var(--radius-interactive)',
          color: 'var(--text-primary)',
          padding: '1rem',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.9375rem',
          lineHeight: 1.6,
          opacity: loading ? 0.6 : 1,
        }}
      />
      <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginTop: '0.75rem' }}>
        {loading ? 'Loading notes…' : savedAt ? `Saved ${savedAt}` : 'Saving…'} · Assessment{' '}
        {assessmentId.slice(0, 8)}
      </p>
    </section>
  );
}
