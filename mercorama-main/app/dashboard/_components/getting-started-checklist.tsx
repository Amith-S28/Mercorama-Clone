// app/dashboard/_components/getting-started-checklist.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, Circle, X, ChevronDown, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingState {
  dismissed: boolean;
  minimised: boolean;
  completed: {
    hs: boolean;
    deal: boolean;
    fta: boolean;
  };
}

const STORAGE_KEY = 'mercorama_onboarding_v1';

const DEFAULT_STATE: OnboardingState = {
  dismissed: false,
  minimised: false,
  completed: { hs: false, deal: false, fta: false },
};

// ─── Checklist items ──────────────────────────────────────────────────────────

const CHECKLIST_ITEMS = [
  {
    key: 'hs' as const,
    title: 'Build your first export plan',
    description: 'Build an export plan from HS classification through Incoterms to a complete export-ready deal summary.',
    href: '/dashboard?view=export-plan',
    cta: 'Start Export Plan',
  },
  {
    key: 'deal' as const,
    title: 'Discover your best markets',
    description: 'Rank global markets by demand, trade agreements, and strategic fit for your product.',
    href: '/dashboard?view=global-markets',
    cta: 'Explore Global Markets',
  },
  {
    key: 'fta' as const,
    title: 'Find trade advantages',
    description: 'Discover FTA-backed export markets with preferential tariff rates for Canadian exporters.',
    href: '/dashboard?view=trade-advantage',
    cta: 'Check Trade Advantage',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function GettingStartedChecklist() {
  const [state, setState] = useState<OnboardingState | null>(null);

  // Load from localStorage after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setState(raw ? (JSON.parse(raw) as OnboardingState) : DEFAULT_STATE);
    } catch {
      setState(DEFAULT_STATE);
    }
  }, []);

  function save(next: OnboardingState) {
    setState(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  function toggleItem(key: keyof OnboardingState['completed']) {
    if (!state) return;
    save({ ...state, completed: { ...state.completed, [key]: !state.completed[key] } });
  }

  function dismiss() {
    if (!state) return;
    save({ ...state, dismissed: true });
  }

  function toggleMinimise() {
    if (!state) return;
    save({ ...state, minimised: !state.minimised });
  }

  // Don't render until hydrated
  if (!state) return null;
  if (state.dismissed) return null;

  const completedCount = Object.values(state.completed).filter(Boolean).length;
  const allDone = completedCount === CHECKLIST_ITEMS.length;

  return (
    <div className={cn(
      'mb-8 rounded-xl border bg-gradient-to-r from-primary/5 to-primary/2 transition-all',
      allDone && 'border-green-300 dark:border-green-800 from-green-50 dark:from-green-900/20 to-background',
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <button
          onClick={toggleMinimise}
          className="flex items-center gap-2.5 group"
        >
          <div className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg shrink-0',
            allDone ? 'bg-green-100 dark:bg-green-900/40' : 'bg-primary/10',
          )}>
            <Rocket className={cn('h-3.5 w-3.5', allDone ? 'text-green-600 dark:text-green-400' : 'text-primary')} />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
              {allDone ? 'You\'re all set! 🎉' : 'Getting started'}
            </p>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{CHECKLIST_ITEMS.length} steps complete
            </p>
          </div>
        </button>

        <div className="flex items-center gap-1">
          {/* Progress pill */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            {CHECKLIST_ITEMS.map((item) => (
              <div
                key={item.key}
                className={cn(
                  'h-1.5 w-8 rounded-full transition-colors',
                  state.completed[item.key]
                    ? 'bg-green-500'
                    : 'bg-border',
                )}
              />
            ))}
          </div>
          <button
            onClick={toggleMinimise}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={state.minimised ? 'Expand' : 'Minimise'}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', state.minimised && 'rotate-180')} />
          </button>
          <button
            onClick={dismiss}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Items */}
      {!state.minimised && (
        <div className="border-t px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHECKLIST_ITEMS.map((item) => {
              const done = state.completed[item.key];
              return (
                <div
                  key={item.key}
                  className={cn(
                    'rounded-lg border bg-background p-3.5 transition-all',
                    done && 'opacity-60',
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => toggleItem(item.key)}
                      className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
                      title={done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {done
                        ? <CheckCircle2 className="h-4 w-4 text-green-500" />
                        : <Circle className="h-4 w-4" />
                      }
                    </button>
                    <div className="min-w-0">
                      <p className={cn('text-xs font-semibold leading-tight mb-1', done && 'line-through text-muted-foreground')}>
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {item.description}
                      </p>
                      <Link
                        href={item.href}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {item.cta} →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {allDone && (
            <p className="mt-3 text-xs text-center text-muted-foreground">
              You've completed all steps.{' '}
              <button onClick={dismiss} className="text-primary hover:underline font-medium">
                Dismiss this panel
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
