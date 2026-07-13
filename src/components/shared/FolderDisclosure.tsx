'use client';

import { useId, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { smooth } from '@/lib/animation/presets';

export interface FolderDisclosureProps {
  title: string;
  subtitle?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function FolderDisclosure({
  title,
  subtitle,
  open,
  onToggle,
  children,
}: FolderDisclosureProps) {
  const panelId = useId();

  return (
    <div
      style={{
        border: '1px solid var(--border-low-contrast)',
        borderRadius: '16px',
        overflow: 'hidden',
        background: 'var(--bg-primary)',
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          padding: '0.875rem 1rem',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          fontFamily: 'var(--font-outfit)',
          textAlign: 'left',
        }}
      >
        <span>
          <span style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600 }}>{title}</span>
          {subtitle ? (
            <span
              style={{
                display: 'block',
                marginTop: '0.125rem',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              {subtitle}
            </span>
          ) : null}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={smooth}
          style={{ display: 'flex', color: 'var(--text-tertiary)' }}
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={smooth}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 1rem 1rem',
                borderTop: '1px solid var(--border-low-contrast)',
              }}
            >
              {children}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
