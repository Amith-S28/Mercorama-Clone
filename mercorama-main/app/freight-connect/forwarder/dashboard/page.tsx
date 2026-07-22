// app/freight-connect/forwarder/dashboard/page.tsx
// Forwarder dashboard — Overview · Lead Inbox · Profile · Analytics · Billing
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Truck, BarChart3, Inbox, User, CreditCard,
  CheckCircle2, XCircle, Clock, AlertTriangle, AlertCircle,
  Loader2, ChevronRight, ArrowUpRight, RefreshCw, Send,
  TrendingUp, Eye, MessageSquare, Award,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Forwarder {
  id: string;
  company_name: string;
  state: 'unclaimed' | 'claimed' | 'verified' | 'featured';
  subscription_tier: 'none' | 'verified' | 'featured';
  is_suspended: boolean;
  consecutive_missed_responses: number;
  is_founding_partner: boolean;
  founding_partner_lock_expiry: string | null;
  primary_contact_email: string;
  primary_contact_name: string | null;
  website_url: string | null;
  description: string | null;
  logo_url: string | null;
  provinces: string[];
  lanes: string[];
  hs_chapters: string[];
  shipping_modes: string[];
}

interface Subscription {
  id: string;
  tier: string;
  billing_period: 'monthly' | 'annual';
  status: string;
  current_period_end: string;
  stripe_subscription_id: string;
}

interface Lead {
  id: string;
  state: 'pending' | 'responded' | 'expired';
  created_at: string;
  response_deadline: string;
  responded_at: string | null;
  product_category: string;
  hs_chapter: string;
  origin_province: string;
  target_market: string;
  estimated_volume: string;
  shipping_mode: string;
  additional_notes: string | null;
  lead_tier: 'quote_only' | 'anonymised_profile';
  lead_fee: number;
  lead_charged: boolean;
  lead_refunded: boolean;
  forwarder_response_text: string | null;
  is_bulk: boolean;
  bulk_group_id: string | null;
  sme_contact: { email: string; company_name?: string } | null;
}

interface Analytics {
  last_30_days: { leads_received: number; leads_responded: number; response_rate: number; identity_reveals: number; profile_views: number };
  last_90_days: { leads_received: number; leads_responded: number; response_rate: number; identity_reveals: number; profile_views: number };
  six_month_leads: { label: string; count: number; responded: number }[];
  six_month_response_rate: { label: string; rate: number }[];
  total_all_time: number;
  response_rate_all_time: number;
}

interface BillingData {
  subscription: Subscription | null;
  lead_charges: {
    id: string; amount: number; lead_tier: string; refunded: boolean;
    created_at: string; stripe_charge_id: string;
    quote_requests: { hs_chapter: string; target_market: string; shipping_mode: string; product_category: string } | null;
  }[];
  invoices: {
    id: string; number: string; status: string; amount_due: number;
    amount_paid: number; currency: string; created: number;
    hosted_invoice_url: string | null; invoice_pdf: string | null;
  }[];
  is_founding_partner: boolean;
  founding_partner_lock_expiry: string | null;
  subscription_tier: string;
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview',  label: 'Overview',  icon: Truck },
  { id: 'leads',     label: 'Lead Inbox', icon: Inbox },
  { id: 'profile',   label: 'Profile',   icon: User },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'billing',   label: 'Billing',   icon: CreditCard },
] as const;
type TabId = typeof TABS[number]['id'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function StateBadge({ state, tier, suspended }: { state: string; tier: string; suspended: boolean }) {
  if (suspended) return <span className="rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2.5 py-0.5 text-xs font-semibold">Suspended</span>;
  if (tier === 'featured') return <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-0.5 text-xs font-semibold">Featured</span>;
  if (tier === 'verified') return <span className="rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-2.5 py-0.5 text-xs font-semibold">Verified</span>;
  return <span className="rounded-full bg-muted text-muted-foreground px-2.5 py-0.5 text-xs font-semibold">Claimed</span>;
}

function Countdown({ deadline }: { deadline: string }) {
  const [remaining, setRemaining] = useState('');
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    function update() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setRemaining('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m`);
      setUrgent(h < 6);
    }
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [deadline]);

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${urgent ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
      <Clock className="h-3 w-3" />{remaining}
    </span>
  );
}

function LeadStatusBadge({ lead }: { lead: Lead }) {
  if (lead.lead_refunded) return <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">💸 Refunded</span>;
  if (lead.state === 'expired')   return <span className="rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 text-xs font-medium">❌ Expired</span>;
  if (lead.state === 'responded') return <span className="rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 text-xs font-medium">✅ Responded</span>;
  return <span className="rounded-full bg-red-500 text-white px-2 py-0.5 text-xs font-semibold animate-pulse">🔴 New</span>;
}

// ─── PANEL: Overview ──────────────────────────────────────────────────────────

function OverviewPanel({ ff, sub }: { ff: Forwarder; sub: Subscription | null }) {
  const isSubscribed = ff.subscription_tier !== 'none';
  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('en-CA', { dateStyle: 'medium' })
    : null;

  const PRICE: Record<string, string> = { verified: '$499/mo', featured: '$999/mo' };

  return (
    <div className="space-y-6">
      {/* Suspension warning */}
      {ff.is_suspended && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-300">Your listing is suspended</p>
            <p className="text-sm text-red-700 dark:text-red-400">Contact <a href="mailto:support@mercorama.com" className="underline">support@mercorama.com</a> to reinstate your listing.</p>
          </div>
        </div>
      )}

      {/* Missed response warning */}
      {ff.consecutive_missed_responses >= 2 && !ff.is_suspended && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              {ff.consecutive_missed_responses} consecutive missed responses
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              One more missed response will trigger an automatic suspension. Respond to all pending leads within 48 hours.
            </p>
          </div>
        </div>
      )}

      {/* Status cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-2">Listing Tier</p>
            <StateBadge state={ff.state} tier={ff.subscription_tier} suspended={ff.is_suspended} />
            {ff.is_founding_partner && (
              <div className="mt-2 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <Award className="h-3 w-3" /> Founding Partner
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Subscription</p>
            {isSubscribed && sub ? (
              <>
                <p className="font-semibold text-sm capitalize">{sub.tier} — {sub.billing_period}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sub.status === 'active' ? `Renews ${periodEnd}` : `Status: ${sub.status}`}
                </p>
                {PRICE[sub.tier] && <p className="text-xs font-medium text-primary mt-1">{PRICE[sub.tier]}</p>}
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Pay-per-lead</p>
                <p className="text-xs text-muted-foreground">$99–$149 / quote request</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-muted-foreground mb-1">Missed Responses</p>
            <p className={`text-2xl font-bold ${ff.consecutive_missed_responses >= 2 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
              {ff.consecutive_missed_responses}
            </p>
            <p className="text-xs text-muted-foreground">Suspension at 3 consecutive</p>
          </CardContent>
        </Card>

        {ff.is_founding_partner && ff.founding_partner_lock_expiry ? (
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Founding Rate Lock</p>
              <p className="font-semibold text-sm">$299/mo</p>
              <p className="text-xs text-muted-foreground">
                Locked until {new Date(ff.founding_partner_lock_expiry).toLocaleDateString('en-CA', { dateStyle: 'medium' })}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-muted-foreground mb-1">Lead Cost</p>
              {isSubscribed
                ? <><p className="font-semibold text-sm text-green-600 dark:text-green-400">Free</p><p className="text-xs text-muted-foreground">Included in subscription</p></>
                : <><p className="font-semibold text-sm">$99 – $149</p><p className="text-xs text-muted-foreground">Per quote request</p></>
              }
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upgrade CTA for claimed */}
      {!isSubscribed && (
        <div className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/10 p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-sky-800 dark:text-sky-300 mb-0.5">Upgrade for free leads + priority placement</p>
            <p className="text-sm text-sky-700 dark:text-sky-400">Verified ($499/mo) — Featured ($999/mo)</p>
          </div>
          <Link href={`/freight-connect/upgrade?forwarder_id=${ff.id}`}>
            <Button className="bg-sky-700 hover:bg-sky-800 text-white shrink-0">
              Upgrade <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Manage billing */}
      {isSubscribed && (
        <div className="flex gap-3 flex-wrap">
          <Link href={`/freight-connect/upgrade?forwarder_id=${ff.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              Manage Billing <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── PANEL: Lead Inbox ────────────────────────────────────────────────────────

function RespondModal({
  lead,
  onClose,
  onSuccess,
}: {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [rateEstimate, setRate]    = useState('');
  const [transitTime, setTransit]  = useState('');
  const [notes, setNotes]          = useState('');
  const [loading, setLoading]      = useState(false);
  const [error, setError]          = useState('');

  async function submit() {
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/freight-connect/forwarder/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote_request_id: lead.id, rate_estimate: rateEstimate, transit_time: transitTime, notes }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Submission failed'); return; }
      onSuccess();
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  const fieldCls = 'w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl border shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <p className="font-semibold">Respond to Quote Request</p>
            <p className="text-xs text-muted-foreground">{lead.target_market} · {lead.shipping_mode}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Lead summary */}
          <div className="rounded-lg bg-muted/30 p-3 text-xs grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Product</span><span className="font-medium">{lead.product_category}</span>
            <span className="text-muted-foreground">HS Chapter</span><span className="font-medium">{lead.hs_chapter}</span>
            <span className="text-muted-foreground">Market</span><span className="font-medium">{lead.target_market}</span>
            <span className="text-muted-foreground">Mode</span><span className="font-medium">{lead.shipping_mode}</span>
            <span className="text-muted-foreground">Volume</span><span className="font-medium">{lead.estimated_volume}/yr</span>
            {lead.additional_notes && <><span className="text-muted-foreground col-span-2">Notes</span><span className="col-span-2">{lead.additional_notes}</span></>}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1.5">Rate Estimate</label>
              <input type="text" value={rateEstimate} onChange={(e) => setRate(e.target.value)} placeholder="e.g. $2,400–$2,800 CAD per 20ft" className={fieldCls} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Transit Time</label>
              <input type="text" value={transitTime} onChange={(e) => setTransit(e.target.value)} placeholder="e.g. 18–22 days" className={fieldCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Insurance options, port of loading, value-added services…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={loading}>Cancel</Button>
            <Button onClick={submit} disabled={loading || (!rateEstimate && !transitTime && !notes)} className="flex-1">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending…</> : <><Send className="h-4 w-4 mr-2" />Submit Response</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadInboxPanel({ forwarderId, refresh }: { forwarderId: string; refresh: number }) {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [respondTo, setRespondTo] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'responded' | 'expired'>('all');

  const loadLeads = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/freight-connect/forwarder/leads');
    const data = await res.json() as { leads: Lead[] };
    setLeads(data.leads ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadLeads(); }, [loadLeads, refresh]);

  const filtered = leads.filter((l) => {
    if (activeTab === 'new')       return l.state === 'pending';
    if (activeTab === 'responded') return l.state === 'responded';
    if (activeTab === 'expired')   return l.state === 'expired' || l.lead_refunded;
    return true;
  });

  const newCount = leads.filter((l) => l.state === 'pending').length;

  return (
    <div>
      {respondTo && (
        <RespondModal
          lead={respondTo}
          onClose={() => setRespondTo(null)}
          onSuccess={() => { setRespondTo(null); loadLeads(); }}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {(['all', 'new', 'responded', 'expired'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t}{t === 'new' && newCount > 0 && ` (${newCount})`}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={loadLeads} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <Inbox className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No {activeTab === 'all' ? '' : activeTab} leads yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Date</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">HS</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Market</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Mode</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs hidden md:table-cell">Volume</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs hidden lg:table-cell">Tier</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id} className="border-t hover:bg-muted/10">
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(lead.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                    {lead.is_bulk && <span className="ml-1.5 rounded bg-muted px-1 text-xs">Bulk</span>}
                  </td>
                  <td className="px-4 py-3 text-xs font-mono">{lead.hs_chapter}</td>
                  <td className="px-4 py-3 text-xs font-medium">{lead.target_market}</td>
                  <td className="px-4 py-3 text-xs">{lead.shipping_mode}</td>
                  <td className="px-4 py-3 text-xs hidden md:table-cell">{lead.estimated_volume}/yr</td>
                  <td className="px-4 py-3 text-xs hidden lg:table-cell capitalize">{lead.lead_tier.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <LeadStatusBadge lead={lead} />
                      {lead.state === 'pending' && <Countdown deadline={lead.response_deadline} />}
                      {lead.state === 'expired' && lead.lead_refunded && (
                        <span className="text-xs text-muted-foreground">Refund issued</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {lead.state === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => setRespondTo(lead)} className="text-xs whitespace-nowrap">
                        Respond
                      </Button>
                    )}
                    {lead.state === 'responded' && lead.sme_contact && (
                      <a href={`mailto:${lead.sme_contact.email}`} className="text-xs text-primary hover:underline whitespace-nowrap">
                        Contact SME
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── PANEL: Profile Editor ────────────────────────────────────────────────────

function ProfilePanel({ ff }: { ff: Forwarder }) {
  const isSubscribed = ff.subscription_tier !== 'none';

  const [form, setForm] = useState({
    website_url:  ff.website_url  ?? '',
    description:  ff.description  ?? '',
    logo_url:     ff.logo_url     ?? '',
    provinces:    [...ff.provinces],
    lanes:        [...ff.lanes],
    hs_chapters:  [...ff.hs_chapters],
    shipping_modes: [...ff.shipping_modes],
  });
  const [testimonials, setTestimonials] = useState<Array<{ author_name: string; author_company: string; body: string }>>([]);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState('');
  const MAX_TESTIMONIALS = ff.subscription_tier === 'featured' ? 10 : 3;

  useEffect(() => {
    fetch('/api/freight-connect/forwarder/profile')
      .then((r) => r.json())
      .then((d: { testimonials: typeof testimonials }) => { if (d.testimonials) setTestimonials(d.testimonials); });
  }, []);

  async function save() {
    setSaving(true); setSaved(false); setError('');
    try {
      const res = await fetch('/api/freight-connect/forwarder/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, testimonials: isSubscribed ? testimonials : undefined }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Save failed'); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  }

  const fieldCls = 'w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  function toggleChip(key: keyof typeof form, val: string) {
    const arr = form[key] as string[];
    setForm((f) => ({ ...f, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] }));
  }

  return (
    <div className="space-y-6">
      {!isSubscribed && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-4">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Profile editing is available on Claimed tier.</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Testimonials and live card preview unlock on Verified / Featured.</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1.5">Website URL</label>
        <input type="url" value={form.website_url} onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))} placeholder="https://yourcompany.com" className={fieldCls} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Company Description</label>
        <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Logo URL</label>
        <input type="url" value={form.logo_url} onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))} placeholder="https://yourcompany.com/logo.png" className={fieldCls} />
      </div>

      {/* Testimonials — subscribed only */}
      {isSubscribed && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Testimonials ({testimonials.length}/{MAX_TESTIMONIALS})</label>
            {testimonials.length < MAX_TESTIMONIALS && (
              <Button size="sm" variant="outline" onClick={() => setTestimonials((t) => [...t, { author_name: '', author_company: '', body: '' }])}>
                + Add
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-3">Use a descriptive company type (e.g. "Atlantic Canada food manufacturer") — no real company names or PII.</p>
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-lg border p-4 mb-3 space-y-2">
              <div className="flex gap-2">
                <input type="text" value={t.author_name} onChange={(e) => { const n = [...testimonials]; n[i] = { ...n[i], author_name: e.target.value }; setTestimonials(n); }} placeholder="Contact role (e.g. Owner)" className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
                <input type="text" value={t.author_company} onChange={(e) => { const n = [...testimonials]; n[i] = { ...n[i], author_company: e.target.value }; setTestimonials(n); }} placeholder="Company type (e.g. Food manufacturer, BC)" className="flex-1 h-9 rounded-md border border-input bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring" />
                <button onClick={() => setTestimonials((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><XCircle className="h-4 w-4" /></button>
              </div>
              <textarea value={t.body} onChange={(e) => { const n = [...testimonials]; n[i] = { ...n[i], body: e.target.value }; setTestimonials(n); }} rows={2} placeholder="Testimonial text…" className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>
        {saved && <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Saved</span>}
      </div>
    </div>
  );
}

// ─── PANEL: Analytics ─────────────────────────────────────────────────────────

function AnalyticsPanel({ ff }: { ff: Forwarder }) {
  const isSubscribed = ff.subscription_tier !== 'none';
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [window, setWindow] = useState<'30' | '90'>('30');

  useEffect(() => {
    if (!isSubscribed) { setLoading(false); return; }
    fetch('/api/freight-connect/forwarder/analytics')
      .then((r) => r.json())
      .then((d: Analytics) => setData(d))
      .finally(() => setLoading(false));
  }, [isSubscribed]);

  if (!isSubscribed) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium mb-1">Analytics requires a subscription</p>
        <p className="text-sm text-muted-foreground mb-4">Upgrade to Verified or Featured to unlock lane analytics, response rate tracking, and identity reveal stats.</p>
        <Link href={`/freight-connect/upgrade?forwarder_id=${ff.id}`}>
          <Button>Upgrade to Verified →</Button>
        </Link>
      </div>
    );
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!data)  return <p className="text-sm text-muted-foreground text-center py-8">Failed to load analytics.</p>;

  const stats = window === '30' ? data.last_30_days : data.last_90_days;
  const chartData = data.six_month_leads;
  const maxCount = Math.max(...chartData.map((m) => m.count), 1);

  return (
    <div className="space-y-6">
      {/* Window toggle */}
      <div className="flex items-center gap-2">
        {(['30', '90'] as const).map((w) => (
          <button key={w} onClick={() => setWindow(w)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${window === w ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            Last {w} days
          </button>
        ))}
      </div>

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Profile Views" value={stats.profile_views} />
        <StatCard label="Leads Received" value={stats.leads_received} />
        <StatCard label="Leads Responded" value={stats.leads_responded} />
        <StatCard label="Response Rate" value={`${stats.response_rate}%`} />
        <StatCard label="Identity Reveals" value={stats.identity_reveals} sub="SMEs who opened direct contact" />
      </div>

      {/* Bar chart — monthly lead volume */}
      <div className="rounded-xl border p-5">
        <p className="text-sm font-semibold mb-4">Monthly Lead Volume (Last 6 Months)</p>
        <div className="flex items-end gap-3 h-32">
          {chartData.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: '100px' }}>
                <div
                  className="w-full rounded-t bg-primary/20"
                  style={{ height: `${(m.count / maxCount) * 100}%`, minHeight: m.count > 0 ? '4px' : '0' }}
                  title={`${m.count} leads`}
                />
              </div>
              <span className="text-xs text-muted-foreground">{m.label}</span>
              <span className="text-xs font-medium">{m.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Line chart — response rate */}
      <div className="rounded-xl border p-5">
        <p className="text-sm font-semibold mb-4">Response Rate Trend (Last 6 Months)</p>
        <div className="relative h-24">
          <svg viewBox={`0 0 ${data.six_month_response_rate.length * 60} 80`} className="w-full h-full" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              points={data.six_month_response_rate.map((m, i) => `${i * 60 + 30},${80 - (m.rate / 100) * 70}`).join(' ')}
            />
            {data.six_month_response_rate.map((m, i) => (
              <circle key={i} cx={i * 60 + 30} cy={80 - (m.rate / 100) * 70} r="3" fill="hsl(var(--primary))" />
            ))}
          </svg>
        </div>
        <div className="flex justify-between mt-1">
          {data.six_month_response_rate.map((m) => (
            <span key={m.label} className="text-xs text-muted-foreground">{m.rate}%</span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" />
        All-time: {data.total_all_time} leads · {data.response_rate_all_time}% response rate
      </div>
    </div>
  );
}

// ─── PANEL: Billing ───────────────────────────────────────────────────────────

function BillingPanel({ ff }: { ff: Forwarder }) {
  const [data, setData]     = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetch('/api/freight-connect/forwarder/billing')
      .then((r) => r.json())
      .then((d: BillingData) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!data)   return <p className="text-sm text-muted-foreground py-8 text-center">Failed to load billing data.</p>;

  const sub = data.subscription;
  const TIER_PRICE: Record<string, Record<string, string>> = {
    verified: { monthly: '$499/mo', annual: '$4,990/yr' },
    featured: { monthly: '$999/mo', annual: '$9,990/yr' },
  };
  const planPrice = sub ? (TIER_PRICE[sub.tier]?.[sub.billing_period] ?? '—') : null;

  const periodEnd = sub?.current_period_end
    ? new Date(sub.current_period_end).toLocaleDateString('en-CA', { dateStyle: 'medium' })
    : null;

  const lockExpiry = data.founding_partner_lock_expiry
    ? new Date(data.founding_partner_lock_expiry).toLocaleDateString('en-CA', { dateStyle: 'medium' })
    : null;

  // Compute rollover (13 months after subscription start — approximate)
  const rolloverDate = data.founding_partner_lock_expiry
    ? new Date(new Date(data.founding_partner_lock_expiry).getTime() + 30 * 86400000).toLocaleDateString('en-CA', { dateStyle: 'medium' })
    : null;

  return (
    <div className="space-y-6">
      {/* Cancel confirm modal */}
      {showCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border shadow-xl max-w-md w-full p-6">
            <p className="font-semibold text-lg mb-2">Cancel subscription?</p>
            <p className="text-sm text-muted-foreground mb-4">
              Your listing will downgrade to <strong>Claimed (pay-per-lead)</strong> at the end of your current billing period on <strong>{periodEnd}</strong>. You will continue receiving leads at $99–$149 per request.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowCancel(false)} className="flex-1">Keep Plan</Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={cancelling}
                onClick={async () => {
                  setCancelling(true);
                  // Redirect to Stripe billing portal — simplest path
                  window.open('https://billing.stripe.com', '_blank');
                  setShowCancel(false);
                  setCancelling(false);
                }}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Current plan */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <p className="text-xs text-muted-foreground mb-1">Current Plan</p>
          {sub ? (
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-bold text-lg capitalize">{sub.tier} — {sub.billing_period}</p>
                {planPrice && <p className="text-sm text-muted-foreground">{planPrice}</p>}
                <p className="text-xs text-muted-foreground mt-1">
                  Status: <span className={sub.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-amber-600'}>{sub.status}</span>
                  {periodEnd && ` · Next renewal: ${periodEnd}`}
                </p>
                {data.is_founding_partner && lockExpiry && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    <Award className="h-3 w-3 inline mr-1" />
                    Founding Partner rate ($299/mo) locked until {lockExpiry}
                    {rolloverDate && ` — rolls to standard rate on ${rolloverDate}`}
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link href={`/freight-connect/upgrade?forwarder_id=${ff.id}`}>
                  <Button size="sm" variant="outline">Upgrade Plan</Button>
                </Link>
                {sub.billing_period === 'monthly' && (
                  <Link href={`/freight-connect/upgrade?forwarder_id=${ff.id}`}>
                    <Button size="sm" variant="outline">Switch to Annual</Button>
                  </Link>
                )}
                <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setShowCancel(true)}>
                  Cancel Subscription
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <p className="font-bold text-lg">Pay-per-lead</p>
                <p className="text-sm text-muted-foreground">$99–$149 per quote request · No subscription</p>
              </div>
              <Link href={`/freight-connect/upgrade?forwarder_id=${ff.id}`}>
                <Button size="sm">Upgrade to Verified →</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stripe invoices */}
      {data.invoices.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Invoices</h3>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Invoice #</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((inv) => (
                  <tr key={inv.id} className="border-t">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(inv.created * 1000).toLocaleDateString('en-CA', { dateStyle: 'medium' })}</td>
                    <td className="px-4 py-2.5 text-xs font-mono">{inv.number ?? inv.id.slice(-8)}</td>
                    <td className="px-4 py-2.5 text-xs font-medium">${(inv.amount_paid / 100).toFixed(2)} {inv.currency.toUpperCase()}</td>
                    <td className="px-4 py-2.5 text-xs capitalize">{inv.status}</td>
                    <td className="px-4 py-2.5 text-right">
                      {inv.invoice_pdf && <a href={inv.invoice_pdf} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">PDF</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lead charges */}
      {data.lead_charges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Lead Charges</h3>
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Product</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Market</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Tier</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.lead_charges.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString('en-CA', { dateStyle: 'medium' })}</td>
                    <td className="px-4 py-2.5 text-xs hidden sm:table-cell">{c.quote_requests?.product_category ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs">{c.quote_requests?.target_market ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs hidden md:table-cell capitalize">{c.lead_tier.replace('_', ' ')}</td>
                    <td className="px-4 py-2.5 text-xs font-medium">${Number(c.amount).toFixed(2)} CAD</td>
                    <td className="px-4 py-2.5 text-xs">
                      {c.refunded
                        ? <span className="text-green-600 dark:text-green-400">Refunded</span>
                        : <span className="text-muted-foreground">Charged</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.lead_charges.length === 0 && data.invoices.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No billing history yet.</p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ForwarderDashboardPage() {
  const [tab, setTab]           = useState<TabId>('overview');
  const [ff, setFf]             = useState<Forwarder | null>(null);
  const [sub, setSub]           = useState<Subscription | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [refreshLeads, setRefreshLeads] = useState(0);

  useEffect(() => {
    fetch('/api/freight-connect/forwarder/me')
      .then((r) => r.json())
      .then((d: { forwarder?: Forwarder; subscription?: Subscription; error?: string }) => {
        if (d.error) { setError(d.error); return; }
        if (d.forwarder) setFf(d.forwarder);
        if (d.subscription) setSub(d.subscription);
      })
      .catch(() => setError('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error === 'no_forwarder_found') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Truck className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">No forwarder listing found</h1>
        <p className="text-muted-foreground mb-6">
          Your account email is not linked to a freight forwarder listing. Make sure you&apos;re signed in with the same email you used during the claim process.
        </p>
        <Link href="/freight-connect/claim">
          <Button>Claim Your Listing →</Button>
        </Link>
      </div>
    );
  }

  if (error || !ff) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">{error || 'Failed to load dashboard. Please refresh.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {ff.logo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={ff.logo_url} alt={ff.company_name} className="h-10 w-10 rounded object-contain border" />
            : <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-900/40"><Truck className="h-5 w-5 text-sky-700 dark:text-sky-400" /></div>
          }
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg">{ff.company_name}</h1>
              <StateBadge state={ff.state} tier={ff.subscription_tier} suspended={ff.is_suspended} />
            </div>
            <p className="text-xs text-muted-foreground">Freight Connect Dashboard</p>
          </div>
        </div>
        <Link href="/freight-connect">
          <Button variant="outline" size="sm" className="gap-1.5">
            <Eye className="h-3.5 w-3.5" /> View Public Listing
          </Button>
        </Link>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setTab(id); if (id === 'leads') setRefreshLeads((n) => n + 1); }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview'  && <OverviewPanel ff={ff} sub={sub} />}
      {tab === 'leads'     && <LeadInboxPanel forwarderId={ff.id} refresh={refreshLeads} />}
      {tab === 'profile'   && <ProfilePanel ff={ff} />}
      {tab === 'analytics' && <AnalyticsPanel ff={ff} />}
      {tab === 'billing'   && <BillingPanel ff={ff} />}
    </div>
  );
}
