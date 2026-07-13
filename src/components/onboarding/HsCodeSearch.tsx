'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Check, Loader2, Search, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonSpring, snappy } from '@/lib/animation/presets';

export interface HsCodeResult {
  code: string;
  description: string;
}

export interface HsClassification {
  hsCode: string;
  confidence: number;
  reasoning: string;
}

export interface HsCodeSearchProps {
  productDescription: string;
  value: string;
  onChange: (code: string, description: string) => void;
  onConfirmedChange?: (confirmed: boolean) => void;
  disabled?: boolean;
  showComplianceWarning?: boolean;
}

const PAGE_SIZE = 60;

function formatHsCode(code: string): string {
  const digits = code.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}.${digits.slice(4)}`;
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${digits.slice(6)}`;
}

export function HsCodeSearch({
  productDescription,
  value,
  onChange,
  onConfirmedChange,
  disabled,
  showComplianceWarning = false,
}: HsCodeSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HsCodeResult[]>([]);
  const [selectedDescription, setSelectedDescription] = useState('');
  const [searching, setSearching] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [classification, setClassification] = useState<HsClassification | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const skipNextSearchRef = useRef(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  // An empty query returns the entire nomenclature so the dropdown is
  // browsable before the user types anything.
  const runSearch = useCallback(async (q: string) => {
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/sandbox/hscode-search?q=${encodeURIComponent(q.trim())}`);
      if (!res.ok) throw new Error('Search failed');
      const data = (await res.json()) as HsCodeResult[];
      setResults(data);
      setSearched(true);
      setVisibleCount(PAGE_SIZE);
    } catch {
      setError('Unable to search HS nomenclature. Try again.');
      setResults([]);
      setSearched(false);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      void runSearch(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!comboboxRef.current?.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (!value) {
      setConfirmed(false);
      setSelectedDescription('');
      onConfirmedChange?.(false);
    }
  }, [value, onConfirmedChange]);

  const handleSelect = (result: HsCodeResult) => {
    onChange(result.code, result.description);
    setSelectedDescription(result.description);
    setClassification(null);
    setConfirmed(false);
    onConfirmedChange?.(false);
    skipNextSearchRef.current = true;
    setQuery(formatHsCode(result.code));
    setDropdownOpen(false);
  };

  const handleClassify = async () => {
    if (!productDescription.trim()) {
      setError('Enter a product description before using AI classification.');
      return;
    }
    setClassifying(true);
    setError(null);
    try {
      const res = await fetch('/api/hscode/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productDescription: productDescription.trim() }),
      });
      if (!res.ok) throw new Error('Classification failed');
      const data = (await res.json()) as HsClassification;
      setClassification(data);
      onChange(data.hsCode, data.reasoning);
      setSelectedDescription(data.reasoning);
      setConfirmed(false);
      onConfirmedChange?.(false);
      setQuery(data.hsCode);
    } catch {
      setError('AI classification unavailable. Search manually or try again.');
    } finally {
      setClassifying(false);
    }
  };

  const handleConfirm = () => {
    if (!value) return;
    setConfirmed(true);
    onConfirmedChange?.(true);
  };

  const lowConfidence = classification !== null && classification.confidence < 0.7;
  const needsConfirmation = Boolean(value) && !confirmed;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1" ref={comboboxRef}>
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          />
          <input
            type="search"
            role="combobox"
            aria-expanded={dropdownOpen}
            aria-controls="hs-code-listbox"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setDropdownOpen(true);
            }}
            onFocus={() => setDropdownOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setDropdownOpen(false);
            }}
            disabled={disabled}
            placeholder="Browse all HS codes or search by code / description…"
            className="w-full rounded-[var(--radius-card)] border border-[var(--border-low-contrast)] bg-[var(--bg-elevated)] py-2.5 pl-9 pr-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-premium)] focus:outline-none"
          />

          <AnimatePresence>
            {dropdownOpen && (results.length > 0 || (searched && !searching)) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={snappy}
                className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-medium-contrast)] bg-[var(--bg-secondary)] shadow-[var(--shadow-elevated)]"
              >
                {results.length > 0 ? (
                  <>
                    <ul
                      id="hs-code-listbox"
                      role="listbox"
                      aria-label="HS code suggestions"
                      className="max-h-72 overflow-y-auto"
                      onScroll={(e) => {
                        const el = e.currentTarget;
                        if (
                          visibleCount < results.length &&
                          el.scrollTop + el.clientHeight >= el.scrollHeight - 120
                        ) {
                          setVisibleCount((c) => Math.min(c + PAGE_SIZE, results.length));
                        }
                      }}
                    >
                      {results.slice(0, visibleCount).map((result) => (
                        <li key={`${result.code}-${result.description}`} role="option" aria-selected={value === result.code}>
                          <button
                            type="button"
                            disabled={disabled}
                            onClick={() => handleSelect(result)}
                            className={cn(
                              'flex w-full items-start gap-3 border-b border-[var(--border-low-contrast)] px-3 py-2.5 text-left last:border-b-0 hover:bg-[var(--bg-elevated)]',
                              value === result.code &&
                                'bg-[color-mix(in_srgb,var(--accent-premium)_10%,transparent)]'
                            )}
                          >
                            <span className="shrink-0 pt-0.5 font-mono text-xs text-[var(--accent-premium)]">
                              {formatHsCode(result.code)}
                            </span>
                            <span className="text-sm text-[var(--text-primary)]">
                              {result.description}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="border-t border-[var(--border-low-contrast)] px-3 py-1.5 font-mono text-[0.625rem] uppercase tracking-wider text-[var(--text-muted)]">
                      {results.length.toLocaleString()} code{results.length === 1 ? '' : 's'}
                      {query.trim() ? ' matching' : ' in nomenclature'}
                    </p>
                  </>
                ) : searched && !error ? (
                  <p className="px-3 py-2.5 text-sm text-[var(--text-secondary)]">
                    No matches for “{query.trim()}”. Try a broader term (e.g. “coffee”,
                    “rice”) or a partial HS code, or use AI Classify.
                  </p>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <motion.button
          type="button"
          disabled={disabled || classifying}
          onClick={() => void handleClassify()}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-[var(--radius-card)] border border-[var(--accent-premium)] px-4 py-2.5 text-sm font-medium text-[var(--accent-premium)]',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          {...buttonSpring}
        >
          {classifying ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          AI Classify
        </motion.button>
      </div>

      {error && (
        <p className="text-sm text-[var(--accent-danger)]" role="alert">
          {error}
        </p>
      )}

      <AnimatePresence mode="popLayout">
        {searching && (
          <motion.p
            key="searching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-xs text-[var(--text-muted)]"
          >
            <Loader2 size={12} className="animate-spin" />
            Searching nomenclature…
          </motion.p>
        )}
      </AnimatePresence>

      {classification && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={snappy}
          className="rounded-[var(--radius-card)] border border-[var(--border-medium-contrast)] bg-[var(--bg-elevated)] p-3"
        >
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">AI suggestion</p>
          <p className="mt-1 font-mono text-sm text-[var(--accent-premium)]">
            {formatHsCode(classification.hsCode)}
          </p>
          <p className="mt-1 text-sm text-[var(--text-primary)]">{classification.reasoning}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Confidence: {Math.round(classification.confidence * 100)}%
          </p>
        </motion.div>
      )}

      {value && (
        <div className="rounded-[var(--radius-card)] border border-[var(--border-low-contrast)] bg-[var(--bg-elevated)] p-3">
          <p className="text-xs uppercase tracking-wide text-[var(--text-secondary)]">Selected HS code</p>
          <p className="mt-1 font-mono text-lg text-[var(--accent-premium)]">{formatHsCode(value)}</p>
          {selectedDescription && (
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{selectedDescription}</p>
          )}
        </div>
      )}

      {(showComplianceWarning || lowConfidence) && (
        <div
          className="flex items-start gap-3 rounded-[var(--radius-card)] border border-[var(--accent-warning)] bg-[color-mix(in_srgb,var(--accent-warning)_12%,transparent)] p-3"
          role="alert"
        >
          <AlertTriangle size={18} className="shrink-0 text-[var(--accent-warning)]" />
          <div className="text-sm text-[var(--text-primary)]">
            <p className="font-medium">Compliance review recommended</p>
            <p className="mt-1 text-[var(--text-secondary)]">
              {showComplianceWarning
                ? 'Defence and dual-use products may require export permits. Verify classification with CBSA and Global Affairs Canada before shipping.'
                : 'AI confidence is below 70%. Confirm the HS code with a licensed customs broker or CBSA tariff finder.'}
            </p>
          </div>
        </div>
      )}

      {needsConfirmation && (
        <motion.button
          type="button"
          disabled={disabled}
          onClick={handleConfirm}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] bg-[var(--accent-premium)] px-4 py-2.5 text-sm font-semibold text-[var(--bg-primary)]"
          {...buttonSpring}
        >
          <Check size={16} />
          Confirm HS code selection
        </motion.button>
      )}

      {confirmed && (
        <p className="flex items-center gap-2 text-sm text-[var(--accent-success)]">
          <Check size={16} />
          HS code confirmed for export filing
        </p>
      )}

      <input type="hidden" name="hsCodeConfirmed" value={confirmed ? 'true' : 'false'} />
    </div>
  );
}

export function isHsCodeConfirmed(value: string, confirmed: boolean): boolean {
  return Boolean(value) && confirmed;
}
