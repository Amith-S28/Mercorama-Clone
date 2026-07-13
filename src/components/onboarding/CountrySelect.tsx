'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Search, X } from 'lucide-react';
import { COUNTRY_OPTIONS, type CountryOption } from '@/lib/countries';
import { cn } from '@/lib/cn';
import { snappy } from '@/lib/animation/presets';

export interface CountrySelectProps {
  value: string;
  onChange: (iso3: string, name: string) => void;
  disabled?: boolean;
  label?: string;
}

export function CountrySelect({
  value,
  onChange,
  disabled,
  label = 'Target market',
}: CountrySelectProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = COUNTRY_OPTIONS.find((c) => c.iso3 === value);

  const filtered = COUNTRY_OPTIONS.filter((country) => {
    const haystack = `${country.iso3} ${country.name} ${country.region}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const selectCountry = useCallback(
    (country: CountryOption) => {
      onChange(country.iso3, country.name);
      setQuery('');
      setOpen(false);
    },
    [onChange]
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-[var(--radius-card)] border border-[var(--border-low-contrast)] bg-[var(--bg-elevated)] px-3 py-2.5 text-left text-sm text-[var(--text-primary)]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-premium)]',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected ? (
            <>
              <span className="font-mono text-xs text-[var(--accent-premium)]">{selected.iso3}</span>
              <span className="truncate">{selected.name}</span>
            </>
          ) : (
            <span className="text-[var(--text-muted)]">Select destination country</span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-[var(--text-secondary)] transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={snappy}
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-medium-contrast)] bg-[var(--bg-secondary)] shadow-[var(--shadow-elevated)]"
          >
            <div className="flex items-center gap-2 border-b border-[var(--border-low-contrast)] px-3 py-2">
              <Search size={14} className="shrink-0 text-[var(--text-muted)]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ISO3, country, or region…"
                className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <ul id={listboxId} role="listbox" className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-[var(--text-muted)]">No countries match</li>
              ) : (
                filtered.map((country) => (
                  <li key={country.iso3} role="option" aria-selected={country.iso3 === value}>
                    <button
                      type="button"
                      onClick={() => selectCountry(country)}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--bg-elevated)]',
                        country.iso3 === value && 'bg-[color-mix(in_srgb,var(--accent-premium)_10%,transparent)]'
                      )}
                    >
                      <span className="w-10 font-mono text-xs text-[var(--accent-premium)]">
                        {country.iso3}
                      </span>
                      <span className="flex-1 text-[var(--text-primary)]">{country.name}</span>
                      <span className="text-xs text-[var(--text-muted)]">{country.region}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
