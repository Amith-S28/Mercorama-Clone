// app/freight-connect/quotes/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Loader2, Clock, CheckCircle2, XCircle, Shield,
  User, AlertTriangle, Package, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import type { QuoteRequest, QuoteRequestState } from '@/lib/freightConnectQuotes';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EnrichedQuote extends QuoteRequest {
  forwarder: {
    id: string;
    company_name: string;
    state: string;
    logo_url: string | null;
  } | null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function useCountdown(deadline: string): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    function update() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setLabel('Expired'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setLabel(`${h}h ${m}m remaining`);
    }
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  return label;
}

function stateBadge(state: QuoteRequestState) {
  const map: Record<QuoteRequestState, { label: string; icon: React.ReactNode; className: string }> = {
    pending:            { label: 'Pending',        icon: <Clock className="h-3.5 w-3.5" />,        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    sent_to_forwarder:  { label: 'Sent',           icon: <Clock className="h-3.5 w-3.5" />,        className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    responded:          { label: 'Quote Received', icon: <CheckCircle2 className="h-3.5 w-3.5" />, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
    expired:            { label: 'Expired',        icon: <XCircle className="h-3.5 w-3.5" />,      className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    refunded:           { label: 'Refunded',       icon: <XCircle className="h-3.5 w-3.5" />,      className: 'bg-muted text-muted-foreground' },
  };
  const { label, icon, className } = map[state] ?? map.pending;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', className)}>
      {icon}{label}
    </span>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Single quote card ─────────────────────────────────────────────────────────

function QuoteCard({ quote, onReveal }: { quote: EnrichedQuote; onReveal: (id: string) => Promise<void> }) {
  const countdown = useCountdown(quote.response_deadline);
  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState(quote.user_identity_revealed);

  const isPending  = quote.state === 'pending' || quote.state === 'sent_to_forwarder';
  const isExpired  = quote.state === 'expired' || quote.state === 'refunded';
  const isReceived = quote.state === 'responded';

  async function handleReveal() {
    setRevealing(true);
    try {
      await onReveal(quote.id);
      setRevealed(true);
      trackEvent('fc_identity_revealed', { quote_id: quote.id });
    } finally {
      setRevealing(false);
    }
  }

  return (
    <div className={cn(
      'rounded-xl border bg-card p-5 space-y-4',
      isReceived && 'border-green-200 dark:border-green-800',
      isExpired && 'opacity-60',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          {quote.forwarder?.logo_url ? (
            <img src={quote.forwarder.logo_url} alt="" className="h-8 w-8 rounded-md object-contain border bg-white shrink-0" />
          ) : (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 font-bold text-primary text-sm">
              {quote.forwarder?.company_name.charAt(0) ?? 'F'}
            </div>
          )}
          <div>
            <p className="font-semibold leading-tight">
              {quote.forwarder?.company_name ?? 'Freight Forwarder'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {quote.target_market} · {quote.shipping_mode} · HS {quote.hs_chapter}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {quote.is_bulk && (
            <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
              <Package className="h-3 w-3" /> Bulk
            </span>
          )}
          {stateBadge(quote.state)}
        </div>
      </div>

      {/* Shipment summary */}
      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
        {[
          { label: 'Product',  value: quote.product_category },
          { label: 'From',     value: quote.origin_province },
          { label: 'To',       value: quote.target_market },
          { label: 'Volume',   value: `${quote.estimated_volume} shipment${quote.estimated_volume === '1' ? '' : 's'}/yr` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg bg-muted/50 p-2">
            <p className="text-muted-foreground mb-0.5">{label}</p>
            <p className="font-medium truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Countdown (pending) */}
      {isPending && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{countdown || 'Calculating...'}</span>
          <span className="text-muted-foreground">· Submitted {fmt(quote.created_at)}</span>
        </div>
      )}

      {/* Quote received */}
      {isReceived && quote.forwarder_response_text && (
        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4 space-y-3">
          <p className="text-xs font-semibold text-green-800 dark:text-green-300 uppercase tracking-wide">
            Forwarder's Quote
          </p>
          <p className="text-sm leading-relaxed text-green-900 dark:text-green-200">
            {quote.forwarder_response_text}
          </p>

          {!revealed ? (
            <div className="border-t border-green-200 dark:border-green-700 pt-3 space-y-2">
              {/* Privacy notice — non-dismissable */}
              <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-2.5">
                <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  Your company name and contact details are never shared with freight
                  forwarders without your permission.
                </p>
              </div>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleReveal}
                disabled={revealing}
              >
                {revealing
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Sharing...</>
                  : <><User className="h-3.5 w-3.5" />Reveal my identity to this forwarder</>
                }
              </Button>
            </div>
          ) : (
            <div className="rounded-lg bg-green-100 dark:bg-green-900/30 p-3 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-400 shrink-0 mt-0.5" />
              <p className="text-sm text-green-800 dark:text-green-300">
                Your contact details have been shared. The forwarder will reach out directly.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Expired */}
      {isExpired && (
        <div className="rounded-lg border border-dashed p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground space-y-0.5">
            <p>This forwarder did not respond in time.{quote.lead_refunded ? ' A refund has been issued.' : ''}</p>
            <Link href="/freight-connect" className="text-primary hover:underline text-xs font-medium">
              Try another forwarder →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

type TabFilter = 'all' | 'pending' | 'responded' | 'expired';

export default function QuoteInboxPage() {
  const [quotes, setQuotes] = useState<EnrichedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/freight-connect/quotes');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json() as { quotes: EnrichedQuote[] };
      setQuotes(data.quotes);
    } catch {
      toast.error('Could not load quote inbox');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleReveal(quoteId: string) {
    const res = await fetch('/api/freight-connect/reveal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote_request_id: quoteId }),
    });
    if (!res.ok) throw new Error('Reveal failed');
    toast.success('Your contact details have been shared with the forwarder.', { duration: 5000 });
  }

  const TABS: { id: TabFilter; label: string }[] = [
    { id: 'all',       label: 'All' },
    { id: 'pending',   label: 'Pending' },
    { id: 'responded', label: 'Received' },
    { id: 'expired',   label: 'Expired' },
  ];

  const filtered = quotes.filter((q) => {
    if (tab === 'all')       return true;
    if (tab === 'pending')   return q.state === 'pending' || q.state === 'sent_to_forwarder';
    if (tab === 'responded') return q.state === 'responded';
    if (tab === 'expired')   return q.state === 'expired' || q.state === 'refunded';
    return true;
  });

  // Group bulk quotes together
  const bulkGroups = new Map<string, EnrichedQuote[]>();
  const singles: EnrichedQuote[] = [];
  for (const q of filtered) {
    if (q.is_bulk && q.bulk_group_id) {
      const g = bulkGroups.get(q.bulk_group_id) ?? [];
      bulkGroups.set(q.bulk_group_id, [...g, q]);
    } else {
      singles.push(q);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quote Inbox</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {quotes.length} quote request{quotes.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/freight-connect">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ChevronRight className="h-4 w-4 rotate-180" />
            Find More Forwarders
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {TABS.map((t) => {
          const count = t.id === 'all'
            ? quotes.length
            : quotes.filter((q) => {
                if (t.id === 'pending')   return q.state === 'pending' || q.state === 'sent_to_forwarder';
                if (t.id === 'responded') return q.state === 'responded';
                if (t.id === 'expired')   return q.state === 'expired' || q.state === 'refunded';
                return false;
              }).length;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                tab === t.id ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-dashed p-10 text-center space-y-2">
          <p className="text-muted-foreground">No quote requests in this category.</p>
          <Link href="/freight-connect">
            <Button variant="outline" size="sm">Find a Forwarder →</Button>
          </Link>
        </div>
      )}

      {!loading && (
        <div className="space-y-4">
          {/* Bulk groups */}
          {Array.from(bulkGroups.entries()).map(([groupId, group]) => (
            <div key={groupId} className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Bulk request — {group.length} forwarders
                </p>
              </div>
              {group.map((q) => (
                <QuoteCard key={q.id} quote={q} onReveal={handleReveal} />
              ))}
            </div>
          ))}

          {/* Singles */}
          {singles.map((q) => (
            <QuoteCard key={q.id} quote={q} onReveal={handleReveal} />
          ))}
        </div>
      )}
    </div>
  );
}
