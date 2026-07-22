// app/freight-connect/page.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Truck, Star, ExternalLink, CheckCircle2, Shield, Clock,
  Search, ChevronDown, X, AlertTriangle, Loader2, Package,
  Users, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import { getAuthUser } from '@/lib/auth-store';
import { checkFreightConnectLimit, incrementFreightConnectUsage } from '@/lib/freight-connect-usage';
import {
  FC_PROVINCES, FC_TARGET_MARKETS, FC_HS_CHAPTERS,
  FC_SHIPPING_MODES, FC_VOLUME_OPTIONS, BULK_QUOTE_MAX,
} from '@/lib/freightConnectConstants';
import type { PublicForwarder, ForwarderWithTestimonials } from '@/lib/freightConnect';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ForwarderWithTestimonialsMaybe = PublicForwarder & {
  testimonials?: ForwarderWithTestimonials['testimonials'];
};

const FIRST_VISIT_KEY = 'mercorama_fc_intro_seen';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function stateBadge(state: string) {
  if (state === 'verified' || state === 'featured')
    return <span className="rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 text-[10px] font-semibold">CIFFA Verified ✓</span>;
  return <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 text-[10px] font-semibold">CIFFA Member</span>;
}

// ─── Upgrade prompt ────────────────────────────────────────────────────────────

function UpgradePrompt({ onClose }: { onClose: () => void }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Zap className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            Available on the Growth plan ($249/mo)
          </p>
        </div>
        <button onClick={onClose} className="text-amber-600 hover:text-amber-800">
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="text-xs text-amber-700 dark:text-amber-400 pl-6">
        Upgrade to unlock bulk quotes, saved shortlists, and shipment analytics.
      </p>
      <div className="pl-6">
        <Link href="/beta">
          <Button size="sm" className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white">
            Upgrade to Growth →
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── First-visit intro modal ────────────────────────────────────────────────────

function IntroModal({ onDone }: { onDone: () => void }) {
  function dismiss() {
    try { localStorage.setItem(FIRST_VISIT_KEY, 'true'); } catch {}
    onDone();
  }
  return (
    <Dialog open onOpenChange={dismiss}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck className="h-5 w-5 text-primary" />
            Freight Connect
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Find a freight forwarder for your export — matched to your product, market, and shipping mode.
        </p>
        <div className="space-y-2">
          {[
            { icon: CheckCircle2, text: 'CIFFA-certified members only' },
            { icon: Shield,       text: 'Vetted for the lanes you\'re targeting' },
            { icon: Clock,        text: 'Accountable — rated on response time' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm">
              <Icon className="h-4 w-4 text-green-600 shrink-0" />
              {text}
            </div>
          ))}
        </div>
        <div className="rounded-lg bg-muted/50 p-4 space-y-2.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">How it works</p>
          {[
            ['1', 'Search by product, destination, and mode'],
            ['2', 'Request a quote — your identity stays private'],
            ['3', 'Review the quote, then choose to connect'],
          ].map(([n, step]) => (
            <div key={n} className="flex items-start gap-2.5 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">{n}</span>
              {step}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center border-t pt-3">
          Your company details are never shared without your permission.
        </p>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={dismiss}>Find a Forwarder →</Button>
          <Button variant="ghost" size="sm" onClick={dismiss}>Don't show again</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Quote request form ─────────────────────────────────────────────────────────

interface QuoteFormValues {
  product_category:  string;
  hs_chapter:        string;
  origin_province:   string;
  target_market:     string;
  estimated_volume:  string;
  shipping_mode:     string;
  additional_notes:  string;
}

const EMPTY_FORM: QuoteFormValues = {
  product_category: '',
  hs_chapter: '',
  origin_province: '',
  target_market: '',
  estimated_volume: '',
  shipping_mode: '',
  additional_notes: '',
};

function QuoteForm({
  forwarders,
  isBulk,
  onClose,
  isGrowth,
}: {
  forwarders: PublicForwarder[];
  isBulk: boolean;
  onClose: () => void;
  isGrowth: boolean;
}) {
  const [values, setValues] = useState<QuoteFormValues>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const user = getAuthUser();

  function set(k: keyof QuoteFormValues, v: string) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  const isValid =
    values.product_category &&
    values.hs_chapter &&
    values.origin_province &&
    values.target_market &&
    values.estimated_volume &&
    values.shipping_mode;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid || !user) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/freight-connect/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forwarder_ids: forwarders.map((f) => f.id),
          is_bulk: isBulk && forwarders.length > 1,
          ...values,
          lead_tier: 'quote_only',
          user_plan: user.plan,
        }),
      });

      if (res.status === 403) {
        toast.error('Bulk quotes require the Growth plan.');
        setSubmitting(false);
        return;
      }

      if (!res.ok) {
        toast.error('Failed to submit quote request. Please try again.');
        setSubmitting(false);
        return;
      }

      const label = forwarders.length > 1
        ? `Quote requests sent to ${forwarders.length} forwarders`
        : `Quote request sent to ${forwarders[0]?.company_name ?? 'forwarder'}`;

      toast.success(label + ' — check your quote inbox for responses.', { duration: 6000 });
      trackEvent('fc_quote_submitted', {
        forwarder_count: forwarders.length,
        is_bulk: isBulk,
        target_market: values.target_market,
        shipping_mode: values.shipping_mode,
      });
      onClose();
    } catch {
      toast.error('Request failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Non-dismissable privacy notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 p-3 flex gap-2">
        <Shield className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
          Your company name and contact details are never shared with freight forwarders without
          your permission. Mercorama sends an anonymised shipment profile only.
          You choose when to make contact.
        </p>
      </div>

      {forwarders.length > 1 && (
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-semibold mb-1">Requesting quotes from:</p>
          {forwarders.map((f) => (
            <p key={f.id} className="text-xs text-muted-foreground">{f.company_name}</p>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Product category</label>
        <Input
          placeholder="e.g. Cold-pressed organic apple cider vinegar"
          value={values.product_category}
          onChange={(e) => set('product_category', e.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">HS Chapter</label>
          <Select value={values.hs_chapter} onValueChange={(v) => set('hs_chapter', v)}>
            <SelectTrigger><SelectValue placeholder="Select chapter" /></SelectTrigger>
            <SelectContent>
              {FC_HS_CHAPTERS.map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Shipping mode</label>
          <Select value={values.shipping_mode} onValueChange={(v) => set('shipping_mode', v)}>
            <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
            <SelectContent>
              {FC_SHIPPING_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Origin province</label>
          <Select value={values.origin_province} onValueChange={(v) => set('origin_province', v)}>
            <SelectTrigger><SelectValue placeholder="Province" /></SelectTrigger>
            <SelectContent>
              {FC_PROVINCES.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Target market</label>
          <Select value={values.target_market} onValueChange={(v) => set('target_market', v)}>
            <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              {FC_TARGET_MARKETS.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Estimated annual shipments</label>
        <Select value={values.estimated_volume} onValueChange={(v) => set('estimated_volume', v)}>
          <SelectTrigger><SelectValue placeholder="How many shipments per year?" /></SelectTrigger>
          <SelectContent>
            {FC_VOLUME_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Additional notes <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Textarea
          rows={2}
          placeholder="e.g. Temperature-controlled, hazmat, special dimensions, preferred incoterm..."
          value={values.additional_notes}
          onChange={(e) => set('additional_notes', e.target.value)}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!isValid || submitting}
      >
        {submitting
          ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
          : `Submit Quote Request${forwarders.length > 1 ? ` (${forwarders.length} forwarders)` : ''} →`
        }
      </Button>
    </form>
  );
}

// ─── Forwarder card — UNCLAIMED ────────────────────────────────────────────────

function UnclaimedCard({ ff }: { ff: PublicForwarder }) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3 opacity-80">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{ff.company_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Unclaimed listing</p>
        </div>
        {stateBadge('unclaimed')}
      </div>
      <div className="flex gap-2 pt-1">
        {ff.website_url ? (
          <a href={ff.website_url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
              Visit Website <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        ) : null}
        <Link href="/freight-connect/claim">
          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground">
            Claim this listing →
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Forwarder card — CLAIMED ──────────────────────────────────────────────────

function ClaimedCard({
  ff,
  onQuote,
  isSelected,
  isBulkMode,
  onToggleSelect,
}: {
  ff: PublicForwarder;
  onQuote: (ff: PublicForwarder) => void;
  isSelected: boolean;
  isBulkMode: boolean;
  onToggleSelect: (ff: PublicForwarder) => void;
}) {
  return (
    <div className={cn(
      'rounded-xl border bg-card p-5 space-y-3 transition-all',
      isSelected && 'border-primary ring-1 ring-primary/30'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {isBulkMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(ff)}
              className="mr-2 accent-primary"
            />
          )}
          <span className="font-semibold">{ff.company_name}</span>
        </div>
        {stateBadge('claimed')}
      </div>

      {ff.lanes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {ff.lanes.slice(0, 4).map((lane) => (
            <span key={lane} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{lane}</span>
          ))}
        </div>
      )}
      {ff.shipping_modes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {ff.shipping_modes.map((m) => (
            <span key={m} className="rounded-full border px-2 py-0.5 text-xs capitalize">{m}</span>
          ))}
        </div>
      )}

      <div className="pt-1">
        <Button size="sm" className="h-8 text-xs" onClick={() => onQuote(ff)}>
          Request a Quote →
        </Button>
      </div>
    </div>
  );
}

// ─── Forwarder card — VERIFIED ─────────────────────────────────────────────────

function VerifiedCard({
  ff,
  onQuote,
  isSelected,
  isBulkMode,
  onToggleSelect,
  isGrowth,
  onUpgradePrompt,
}: {
  ff: ForwarderWithTestimonialsMaybe;
  onQuote: (ff: PublicForwarder) => void;
  isSelected: boolean;
  isBulkMode: boolean;
  onToggleSelect: (ff: PublicForwarder) => void;
  isGrowth: boolean;
  onUpgradePrompt: () => void;
}) {
  const [showTestimonials, setShowTestimonials] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    if (!isGrowth) { onUpgradePrompt(); return; }
    setSaved(true);
    toast.success(`${ff.company_name} saved to your shortlist`);
    trackEvent('fc_forwarder_saved', { forwarder_id: ff.id });
  }

  return (
    <div className={cn(
      'rounded-xl border-2 bg-card p-5 space-y-3 transition-all',
      ff.state === 'featured' ? 'border-amber-300 dark:border-amber-700' : 'border-green-200 dark:border-green-800',
      isSelected && 'ring-2 ring-primary/30'
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {isBulkMode && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(ff)}
              className="mt-1 accent-primary shrink-0"
            />
          )}
          {ff.logo_url ? (
            <img src={ff.logo_url} alt={ff.company_name} className="h-9 w-9 rounded-md object-contain border bg-white shrink-0" />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 font-bold text-primary text-sm">
              {ff.company_name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold leading-tight">{ff.company_name}</p>
            {ff.provinces.length > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">{ff.provinces.slice(0, 2).join(', ')}</p>
            )}
          </div>
        </div>
        {stateBadge(ff.state)}
      </div>

      {ff.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{ff.description}</p>
      )}

      <div className="space-y-2">
        {ff.lanes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ff.lanes.map((lane) => (
              <span key={lane} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{lane}</span>
            ))}
          </div>
        )}
        {ff.shipping_modes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ff.shipping_modes.map((m) => (
              <span key={m} className="rounded-full border px-2 py-0.5 text-xs capitalize">{m}</span>
            ))}
          </div>
        )}
        {ff.hs_chapters.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ff.hs_chapters.map((c) => (
              <span key={c} className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-mono">HS {c}</span>
            ))}
          </div>
        )}
      </div>

      {/* Testimonials */}
      {ff.testimonials && ff.testimonials.length > 0 && (
        <div className="border-t pt-3">
          <button
            type="button"
            onClick={() => setShowTestimonials((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Users className="h-3.5 w-3.5" />
            {ff.testimonials.length} client review{ff.testimonials.length !== 1 ? 's' : ''}
            <ChevronDown className={cn('h-3 w-3 transition-transform', showTestimonials && 'rotate-180')} />
          </button>
          {showTestimonials && (
            <div className="mt-2 space-y-2">
              {ff.testimonials.map((t) => (
                <blockquote key={t.id} className="rounded-lg bg-muted/50 p-3 text-sm">
                  <p className="text-muted-foreground italic">"{t.body}"</p>
                  <p className="mt-1.5 text-xs font-medium">{t.author_name} · {t.author_company}</p>
                </blockquote>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1 border-t flex-wrap">
        <Button size="sm" className="h-8 text-xs" onClick={() => onQuote(ff)}>
          Request a Quote →
        </Button>
        <Button
          size="sm"
          variant="outline"
          className={cn('h-8 text-xs gap-1.5', saved && 'border-amber-300 text-amber-700')}
          onClick={handleSave}
        >
          <Star className={cn('h-3.5 w-3.5', saved && 'fill-amber-400 text-amber-500')} />
          {saved ? 'Saved' : 'Save'}
        </Button>
        {ff.website_url && (
          <a href={ff.website_url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-muted-foreground">
              Website <ExternalLink className="h-3 w-3" />
            </Button>
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export default function FreightConnectPage() {
  const user = getAuthUser();
  const isGrowth = user?.plan === 'team' || user?.plan === 'enterprise';

  // First-visit intro
  const [showIntro, setShowIntro] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(FIRST_VISIT_KEY)) setShowIntro(true);
    } catch {}
    trackEvent('fc_page_viewed', { plan: isGrowth ? 'growth' : 'starter' });
  }, [isGrowth]);

  // Search filters
  const [province, setProvince] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [hsChapter, setHsChapter] = useState('');
  const [shippingModes, setShippingModes] = useState<string[]>([]);
  const [cifraOnly, setCifraOnly] = useState(false);

  // Results
  const [forwarders, setForwarders] = useState<ForwarderWithTestimonialsMaybe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Bulk quote
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedForwarders, setSelectedForwarders] = useState<PublicForwarder[]>([]);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Quote modal
  const [quoteTarget, setQuoteTarget] = useState<PublicForwarder[] | null>(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const toggleMode = (mode: string) => {
    setShippingModes((prev) =>
      prev.includes(mode) ? prev.filter((m) => m !== mode) : [...prev, mode]
    );
  };

  const doSearch = useCallback(async () => {
    // Check monthly run limit before searching
    const plan = user?.plan ?? 'pro';
    const { allowed, usage } = checkFreightConnectLimit(plan);
    if (!allowed) {
      toast.error(`Monthly search limit reached (${usage.used}/${usage.limit}). Resets ${new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const body: Record<string, unknown> = {
        states: ['claimed', 'verified', 'featured'],
      };
      if (province) body.province = province;
      if (targetMarket) body.target_market = targetMarket;
      if (hsChapter) body.hs_chapter = hsChapter;
      if (shippingModes.length === 1) body.shipping_mode = shippingModes[0];

      const res = await fetch('/api/freight-connect/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json() as { forwarders: ForwarderWithTestimonialsMaybe[] };
      setForwarders(data.forwarders);
      incrementFreightConnectUsage();
      trackEvent('fc_search', { province, targetMarket, hsChapter, shippingModes: shippingModes.join(',') });
    } catch {
      toast.error('Search failed — please try again');
    } finally {
      setLoading(false);
    }
  }, [province, targetMarket, hsChapter, shippingModes]);

  function openQuoteModal(ff: PublicForwarder) {
    setQuoteTarget([ff]);
    setQuoteModalOpen(true);
    trackEvent('fc_quote_modal_opened', { forwarder_id: ff.id, state: ff.state });
  }

  function openBulkQuoteModal() {
    if (!isGrowth) { setShowUpgradePrompt(true); return; }
    if (selectedForwarders.length === 0) {
      toast.info('Select at least one forwarder to bulk quote');
      return;
    }
    setQuoteTarget(selectedForwarders);
    setQuoteModalOpen(true);
  }

  function toggleSelectForwarder(ff: PublicForwarder) {
    setSelectedForwarders((prev) => {
      if (prev.find((f) => f.id === ff.id)) return prev.filter((f) => f.id !== ff.id);
      if (prev.length >= BULK_QUOTE_MAX) {
        toast.warning(`Bulk quotes are limited to ${BULK_QUOTE_MAX} forwarders per request.`);
        return prev;
      }
      return [...prev, ff];
    });
  }

  const featured: typeof forwarders = [];
  const rest = forwarders;

  return (
    <div className="min-h-screen">
      {showIntro && <IntroModal onDone={() => setShowIntro(false)} />}

      {/* Hero */}
      <div className="border-b bg-muted/20 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
            <Truck className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Freight Connect</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl mb-2">
            Find the right freight forwarder for your export
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Matched to your product, market, and shipping mode — CIFFA-certified forwarders only.
          </p>

          {/* Filters */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-3">
              <Select value={province || 'all'} onValueChange={(v) => setProvince(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Origin province" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All provinces</SelectItem>
                  {FC_PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={targetMarket || 'all'} onValueChange={(v) => setTargetMarket(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Target market" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All markets</SelectItem>
                  {FC_TARGET_MARKETS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={hsChapter || 'all'} onValueChange={(v) => setHsChapter(v === 'all' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="HS chapter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All chapters</SelectItem>
                  {FC_HS_CHAPTERS.map((c) => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>

              <Button onClick={doSearch} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Find Forwarders
              </Button>
            </div>

            {/* Shipping mode multi-select */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Mode:</span>
              {FC_SHIPPING_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => toggleMode(m.value)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    shippingModes.includes(m.value)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'text-muted-foreground hover:border-primary/50'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

        {/* Growth bulk quote bar */}
        {searched && forwarders.length > 0 && (
          <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={bulkMode}
                  onChange={(e) => {
                    if (e.target.checked && !isGrowth) { setShowUpgradePrompt(true); return; }
                    setBulkMode(e.target.checked);
                    setSelectedForwarders([]);
                  }}
                  className="accent-primary"
                />
                <span className="font-medium">Bulk quote mode</span>
                {!isGrowth && (
                  <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-1.5 py-0.5 text-[10px] font-semibold">Growth</span>
                )}
              </label>
              {bulkMode && (
                <span className="text-xs text-muted-foreground">
                  {selectedForwarders.length} / {BULK_QUOTE_MAX} selected
                </span>
              )}
            </div>
            {bulkMode && selectedForwarders.length > 0 && (
              <Button size="sm" onClick={openBulkQuoteModal} className="gap-1.5">
                <Package className="h-3.5 w-3.5" />
                Request {selectedForwarders.length} Quotes →
              </Button>
            )}
          </div>
        )}

        {showUpgradePrompt && (
          <UpgradePrompt onClose={() => setShowUpgradePrompt(false)} />
        )}

        {/* Featured Partners */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
              <h2 className="text-base font-semibold">Mercorama Partners</h2>
              <span className="text-xs text-muted-foreground">— Sponsored placement</span>
              {isGrowth && (
                <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 text-[10px] font-semibold">
                  ✓ Priority routing active
                </span>
              )}
            </div>
            <div className="space-y-4">
              {featured.map((ff) => (
                <VerifiedCard
                  key={ff.id}
                  ff={ff}
                  onQuote={openQuoteModal}
                  isSelected={selectedForwarders.some((s) => s.id === ff.id)}
                  isBulkMode={bulkMode}
                  onToggleSelect={toggleSelectForwarder}
                  isGrowth={isGrowth}
                  onUpgradePrompt={() => setShowUpgradePrompt(true)}
                />
              ))}
            </div>
          </section>
        )}

        {/* All results */}
        {!loading && searched && (
          <section>
            {featured.length > 0 && rest.length > 0 && (
              <h2 className="text-base font-semibold mb-4">All Forwarders</h2>
            )}
            {rest.length === 0 && featured.length === 0 ? (
              <div className="rounded-xl border border-dashed p-10 text-center space-y-2">
                <Truck className="h-10 w-10 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground">No forwarders matched your filters.</p>
                <p className="text-xs text-muted-foreground">Try broadening your search or removing a filter.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {rest.map((ff) => {
                  if (ff.state === 'unclaimed') {
                    return <UnclaimedCard key={ff.id} ff={ff} />;
                  }
                  if (ff.state === 'claimed') {
                    return (
                      <ClaimedCard
                        key={ff.id}
                        ff={ff}
                        onQuote={openQuoteModal}
                        isSelected={selectedForwarders.some((s) => s.id === ff.id)}
                        isBulkMode={bulkMode}
                        onToggleSelect={toggleSelectForwarder}
                      />
                    );
                  }
                  return (
                    <VerifiedCard
                      key={ff.id}
                      ff={ff}
                      onQuote={openQuoteModal}
                      isSelected={selectedForwarders.some((s) => s.id === ff.id)}
                      isBulkMode={bulkMode}
                      onToggleSelect={toggleSelectForwarder}
                      isGrowth={isGrowth}
                      onUpgradePrompt={() => setShowUpgradePrompt(true)}
                    />
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Initial state */}
        {!loading && !searched && (
          <div className="rounded-xl border border-dashed p-12 text-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <Truck className="h-8 w-8 text-primary" />
            </div>
            <p className="font-semibold">Search for a freight forwarder</p>
            <p className="text-sm text-muted-foreground">
              Use the filters above to find CIFFA-certified forwarders matched to your export lane.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Quote request modal */}
      <Dialog open={quoteModalOpen} onOpenChange={(v) => { if (!v) setQuoteModalOpen(false); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {quoteTarget && quoteTarget.length > 1
                ? `Request Quotes from ${quoteTarget.length} Forwarders`
                : `Request a Quote — ${quoteTarget?.[0]?.company_name ?? ''}`}
            </DialogTitle>
          </DialogHeader>
          {quoteTarget && (
            <QuoteForm
              forwarders={quoteTarget}
              isBulk={quoteTarget.length > 1}
              onClose={() => setQuoteModalOpen(false)}
              isGrowth={isGrowth}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
