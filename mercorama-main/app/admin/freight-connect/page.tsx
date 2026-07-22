// app/admin/freight-connect/page.tsx
// Mercorama admin panel for Freight Connect — 6-tab interface
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users, DollarSign, BarChart3, Mail, Award, FileSearch,
  AlertTriangle, CheckCircle2, XCircle, Loader2, RefreshCw,
  ChevronDown, Filter, Download, AlertCircle, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface AdminForwarder {
  id: string;
  company_name: string;
  state: string;
  subscription_tier: string;
  ciffa_membership_number: string | null;
  provinces: string[];
  is_suspended: boolean;
  consecutive_missed_responses: number;
  is_founding_partner: boolean;
  leads_this_month: number;
  response_rate: number | null;
}

interface RevenueData {
  mrr_verified: number; mrr_featured: number; total_mrr: number;
  lead_rev_quote_only: number; lead_rev_anonymised: number; total_lead_rev: number;
  refunds_this_month: number; net_revenue: number; subscriber_count: number;
  projected_mrr_6mo: { label: string; mrr: number }[];
}

interface OverviewData {
  sme_counts: { starter: number; growth: number; total_with_fc: number };
  quotes_this_month: number; active_sme_users: number; avg_quotes_per_sme: string;
  founding_partners: Array<{ id: string; company_name: string; claimed_at: string; founding_partner_lock_expiry: string | null; subscription_tier: string }>;
  founding_partner_spots: number;
}

interface UnclaimedForwarder {
  id: string; company_name: string; ciffa_membership_number: string | null;
  provinces: string[]; lanes: string[]; last_invite_sent: string | null;
}

interface AdminQuote {
  id: string; state: string; created_at: string; response_deadline: string;
  product_category: string; hs_chapter: string; target_market: string;
  shipping_mode: string; lead_tier: string; lead_fee: number;
  lead_charged: boolean; lead_refunded: boolean; is_bulk: boolean;
  freight_forwarders: { company_name: string; state: string; subscription_tier: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'forwarders',       label: 'Forwarders',      icon: Users },
  { id: 'revenue',          label: 'Revenue',         icon: DollarSign },
  { id: 'sme',              label: 'SME Overview',    icon: BarChart3 },
  { id: 'unclaimed',        label: 'Unclaimed',       icon: Mail },
  { id: 'founding',         label: 'Founding Partners', icon: Award },
  { id: 'quotes',           label: 'Quote Monitor',   icon: FileSearch },
] as const;
type TabId = typeof TABS[number]['id'];

function CAD(n: number) { return `$${n.toLocaleString('en-CA')}` }

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-primary/30 bg-primary/5' : ''}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function StateChip({ state, tier, suspended }: { state: string; tier: string; suspended: boolean }) {
  if (suspended) return <span className="rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 text-xs font-medium">Suspended</span>;
  if (tier === 'featured') return <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 text-xs font-medium">Featured</span>;
  if (tier === 'verified')  return <span className="rounded-full bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400 px-2 py-0.5 text-xs font-medium">Verified</span>;
  if (state === 'claimed')  return <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs font-medium">Claimed</span>;
  return <span className="rounded-full bg-muted/50 text-muted-foreground px-2 py-0.5 text-xs font-medium">Unclaimed</span>;
}

// ─── TAB: Forwarder Management ────────────────────────────────────────────────

function ForwarderManagement() {
  const [rows, setRows]   = useState<AdminForwarder[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ state: '', tier: '', low_response: false });
  const [acting, setActing] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<AdminForwarder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.state) params.set('state', filters.state);
    if (filters.tier)  params.set('tier', filters.tier);
    if (filters.low_response) params.set('low_response', '1');
    const res = await fetch(`/api/admin/freight-connect/forwarders?${params}`);
    const d = await res.json() as { forwarders: AdminForwarder[]; total: number };
    setRows(d.forwarders ?? []);
    setTotal(d.total ?? 0);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  async function doAction(forwarder_id: string, action: string, tier?: string) {
    setActing(forwarder_id);
    await fetch('/api/admin/freight-connect/forwarders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forwarder_id, action, tier }),
    });
    setActing(null);
    setActionTarget(null);
    load();
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <select value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All states</option>
          <option value="unclaimed">Unclaimed</option>
          <option value="claimed">Claimed</option>
          <option value="verified">Verified</option>
          <option value="featured">Featured</option>
        </select>
        <select value={filters.tier} onChange={(e) => setFilters((f) => ({ ...f, tier: e.target.value }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All tiers</option>
          <option value="none">None (pay-per-lead)</option>
          <option value="verified">Verified</option>
          <option value="featured">Featured</option>
        </select>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={filters.low_response} onChange={(e) => setFilters((f) => ({ ...f, low_response: e.target.checked }))} className="rounded" />
          <span className="text-muted-foreground">Response rate &lt; 50%</span>
        </label>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5 ml-auto">
          <RefreshCw className="h-3.5 w-3.5" />Refresh
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mb-3">{total} forwarders total</p>

      {/* Action modal */}
      {actionTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-xl border shadow-xl max-w-sm w-full p-5">
            <p className="font-semibold mb-4">{actionTarget.company_name}</p>
            <div className="space-y-2">
              {!actionTarget.is_suspended && actionTarget.state !== 'unclaimed' && (
                <Button variant="destructive" className="w-full" disabled={!!acting} onClick={() => doAction(actionTarget.id, 'suspend')}>
                  {acting === actionTarget.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Suspend Listing
                </Button>
              )}
              {actionTarget.is_suspended && (
                <Button variant="outline" className="w-full" disabled={!!acting} onClick={() => doAction(actionTarget.id, 'reinstate')}>Reinstate</Button>
              )}
              {actionTarget.subscription_tier !== 'verified' && actionTarget.state !== 'unclaimed' && (
                <Button variant="outline" className="w-full" disabled={!!acting} onClick={() => doAction(actionTarget.id, 'promote', 'verified')}>Promote to Verified</Button>
              )}
              {actionTarget.subscription_tier !== 'featured' && actionTarget.state !== 'unclaimed' && (
                <Button variant="outline" className="w-full" disabled={!!acting} onClick={() => doAction(actionTarget.id, 'promote', 'featured')}>Promote to Featured</Button>
              )}
              {actionTarget.subscription_tier !== 'none' && (
                <Button variant="outline" className="w-full text-muted-foreground" disabled={!!acting} onClick={() => doAction(actionTarget.id, 'demote', 'claimed')}>Demote to Claimed</Button>
              )}
              <Button variant="ghost" className="w-full" onClick={() => setActionTarget(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Company</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">State / Tier</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">CIFFA #</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Leads (mo)</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Response %</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ff) => (
                <tr key={ff.id} className="border-t hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{ff.company_name}</p>
                    {ff.is_founding_partner && <span className="text-xs text-amber-600 dark:text-amber-400">★ Founding Partner</span>}
                  </td>
                  <td className="px-4 py-3">
                    <StateChip state={ff.state} tier={ff.subscription_tier} suspended={ff.is_suspended} />
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{ff.ciffa_membership_number ?? '—'}</td>
                  <td className="px-4 py-3 text-sm">{ff.leads_this_month}</td>
                  <td className="px-4 py-3 text-sm">
                    {ff.response_rate === null ? <span className="text-muted-foreground">—</span> : (
                      <span className={ff.response_rate < 50 ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>
                        {ff.response_rate}%
                      </span>
                    )}
                    {ff.consecutive_missed_responses >= 2 && (
                      <span className="ml-1.5 text-xs text-red-600 dark:text-red-400">({ff.consecutive_missed_responses} missed)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setActionTarget(ff)} className="text-xs gap-1">
                      Actions <ChevronDown className="h-3 w-3" />
                    </Button>
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

// ─── TAB: Revenue Overview ────────────────────────────────────────────────────

function RevenueOverview() {
  const [data, setData]   = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/freight-connect/revenue')
      .then((r) => r.json())
      .then((d: RevenueData) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!data)   return <p className="text-sm text-muted-foreground py-8 text-center">Failed to load revenue data.</p>;

  const maxMrr = Math.max(...data.projected_mrr_6mo.map((m) => m.mrr), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total MRR" value={CAD(data.total_mrr)} sub={`${data.subscriber_count} active subscribers`} accent />
        <StatCard label="MRR — Verified" value={CAD(data.mrr_verified)} />
        <StatCard label="MRR — Featured" value={CAD(data.mrr_featured)} />
        <StatCard label="Net Revenue (mo)" value={CAD(data.net_revenue)} sub={`after ${CAD(data.refunds_this_month)} refunds`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Lead Rev — Quote Only" value={CAD(data.lead_rev_quote_only)} />
        <StatCard label="Lead Rev — Anonymised" value={CAD(data.lead_rev_anonymised)} />
        <StatCard label="Total Lead Revenue" value={CAD(data.total_lead_rev)} />
      </div>

      {/* Projected MRR bar chart */}
      <div className="rounded-xl border p-5">
        <p className="text-sm font-semibold mb-4">Projected MRR — Next 6 Months (based on current subscribers)</p>
        <div className="flex items-end gap-3 h-32">
          {data.projected_mrr_6mo.map((m) => (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex flex-col justify-end" style={{ height: '100px' }}>
                <div
                  className="w-full rounded-t bg-primary/60"
                  style={{ height: `${(m.mrr / maxMrr) * 100}%`, minHeight: '4px' }}
                  title={CAD(m.mrr)}
                />
              </div>
              <span className="text-xs text-muted-foreground">{m.label}</span>
              <span className="text-xs font-medium">{CAD(m.mrr)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TAB: SME Overview ───────────────────────────────────────────────────────

function SmeOverview() {
  const [data, setData]   = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/freight-connect/overview')
      .then((r) => r.json())
      .then((d: OverviewData) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!data)   return <p className="text-sm text-muted-foreground py-8 text-center">Failed to load SME data.</p>;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Starter Users (FC)" value={data.sme_counts.starter} sub="$99/mo plan" />
        <StatCard label="Growth Users (FC)" value={data.sme_counts.growth} sub="$249/mo plan" />
        <StatCard label="Quotes This Month" value={data.quotes_this_month} />
        <StatCard label="Avg Quotes / Active SME" value={data.avg_quotes_per_sme} sub={`${data.active_sme_users} active users`} />
      </div>

      <div className="rounded-xl border bg-muted/10 p-4">
        <p className="text-xs text-muted-foreground">
          <strong>Read-only context panel.</strong> All plan data is sourced from the <code>users</code> table. No SME PII is shown here.
        </p>
      </div>
    </div>
  );
}

// ─── TAB: Unclaimed Listings Manager ─────────────────────────────────────────

function UnclaimedManager() {
  const [rows, setRows]       = useState<UnclaimedForwarder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState<{ sent: string[]; errors: string[] } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/freight-connect/unclaimed');
    const d = await res.json() as { forwarders: UnclaimedForwarder[] };
    setRows(d.forwarders ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  async function sendInvites(ids: string[]) {
    setSending(true); setResult(null);
    const res = await fetch('/api/admin/freight-connect/unclaimed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forwarder_ids: ids }),
    });
    const d = await res.json() as typeof result;
    setResult(d);
    setSending(false);
    setSelected(new Set());
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">{rows.length} unclaimed listings</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setSelected(new Set(rows.map((r) => r.id)))} disabled={sending}>
            Select All
          </Button>
          <Button size="sm" disabled={selected.size === 0 || sending} onClick={() => sendInvites([...selected])} className="gap-1.5">
            {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
            Send Invite ({selected.size})
          </Button>
        </div>
      </div>

      {result && (
        <div className={`rounded-lg border p-3 mb-4 text-sm ${result.errors.length > 0 ? 'border-amber-200 bg-amber-50 dark:bg-amber-900/10' : 'border-green-200 bg-green-50 dark:bg-green-900/10'}`}>
          <p className="font-medium">{result.sent.length} invites sent{result.errors.length > 0 ? `, ${result.errors.length} failed` : ''}</p>
          {result.errors.map((e) => <p key={e} className="text-xs text-muted-foreground">{e}</p>)}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="px-4 py-2.5 w-8"></th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Company</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">CIFFA #</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Provinces</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Last Invite</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((ff) => (
                <tr key={ff.id} className="border-t hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(ff.id)} onChange={() => toggle(ff.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3 font-medium text-sm">{ff.company_name}</td>
                  <td className="px-4 py-3 text-xs font-mono text-muted-foreground hidden sm:table-cell">{ff.ciffa_membership_number ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{ff.provinces.slice(0, 3).join(', ')}{ff.provinces.length > 3 ? '…' : ''}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {ff.last_invite_sent
                      ? new Date(ff.last_invite_sent).toLocaleDateString('en-CA', { dateStyle: 'medium' })
                      : <span className="text-muted-foreground/50">Never</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" disabled={sending} onClick={() => sendInvites([ff.id])} className="text-xs gap-1">
                      <Mail className="h-3 w-3" /> Invite
                    </Button>
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

// ─── TAB: Founding Partners ───────────────────────────────────────────────────

function FoundingPartnersPanel() {
  const [data, setData]   = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [addId, setAddId] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/freight-connect/overview');
    const d = await res.json() as OverviewData;
    setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function addManually() {
    if (!addId.trim()) return;
    setAdding(true); setAddError('');
    const res = await fetch('/api/admin/freight-connect/overview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forwarder_id: addId.trim(), is_founding_partner: true, lock_months: 12 }),
    });
    const d = await res.json() as { error?: string };
    if (!res.ok) { setAddError(d.error ?? 'Failed'); setAdding(false); return; }
    setAddId('');
    setAdding(false);
    load();
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const fps = data?.founding_partners ?? [];
  const spots = data?.founding_partner_spots ?? 3;

  return (
    <div className="space-y-6">
      {/* Status */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="rounded-xl border p-4 flex items-center gap-3">
          <Award className="h-5 w-5 text-amber-500" />
          <div>
            <p className="text-xs text-muted-foreground">Founding Partner Spots</p>
            <p className="font-bold text-lg">{fps.length} / {spots}</p>
          </div>
        </div>
        <div className={`rounded-full px-3 py-1 text-sm font-medium ${fps.length < spots ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
          {fps.length < spots ? 'Offer Active' : 'Spots Full'}
        </div>
      </div>

      {/* Table */}
      {fps.length > 0 && (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Company</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Claimed</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Rate Lock Expiry</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Rollover Date</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Tier</th>
              </tr>
            </thead>
            <tbody>
              {fps.map((fp) => {
                const lockExpiry  = fp.founding_partner_lock_expiry ? new Date(fp.founding_partner_lock_expiry) : null;
                const rolloverDate = lockExpiry ? new Date(lockExpiry.getTime() + 30 * 86400000) : null;
                return (
                  <tr key={fp.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-sm">{fp.company_name}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{fp.claimed_at ? new Date(fp.claimed_at).toLocaleDateString('en-CA', { dateStyle: 'medium' }) : '—'}</td>
                    <td className="px-4 py-3 text-xs">{lockExpiry ? lockExpiry.toLocaleDateString('en-CA', { dateStyle: 'medium' }) : '—'}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{rolloverDate ? rolloverDate.toLocaleDateString('en-CA', { dateStyle: 'medium' }) : '—'}</td>
                    <td className="px-4 py-3 text-xs capitalize">{fp.subscription_tier}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual add */}
      <div className="rounded-xl border p-5">
        <p className="text-sm font-semibold mb-1">Manually Add Founding Partner</p>
        <p className="text-xs text-muted-foreground mb-3">For forwarders signed up offline (e.g. conference). Paste the forwarder UUID from the Forwarders table.</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={addId}
            onChange={(e) => setAddId(e.target.value)}
            placeholder="Forwarder UUID…"
            className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button size="sm" onClick={addManually} disabled={adding || !addId.trim()}>
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
          </Button>
        </div>
        {addError && <p className="text-xs text-destructive mt-1.5">{addError}</p>}
      </div>
    </div>
  );
}

// ─── TAB: Quote Monitor ───────────────────────────────────────────────────────

function QuoteMonitor() {
  const [quotes, setQuotes]   = useState<AdminQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ state: '', lead_tier: '', forwarder_tier: '' });
  const [refunding, setRefunding] = useState<string | null>(null);
  const [refundResult, setRefundResult] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.state)         params.set('state',         filters.state);
    if (filters.lead_tier)     params.set('lead_tier',     filters.lead_tier);
    if (filters.forwarder_tier) params.set('forwarder_tier', filters.forwarder_tier);
    const res = await fetch(`/api/admin/freight-connect/quotes?${params}`);
    const d = await res.json() as { quotes: AdminQuote[] };
    setQuotes(d.quotes ?? []);
    setLoading(false);
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  async function manualRefund(quote_request_id: string) {
    setRefunding(quote_request_id);
    const res = await fetch('/api/admin/freight-connect/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quote_request_id }),
    });
    const d = await res.json() as { refunded?: boolean; error?: string };
    setRefundResult((r) => ({ ...r, [quote_request_id]: d.refunded ?? false }));
    setRefunding(null);
    if (d.refunded) load();
  }

  function exportCsv() {
    const headers = ['id', 'state', 'created_at', 'product_category', 'hs_chapter', 'target_market', 'shipping_mode', 'lead_tier', 'lead_fee', 'lead_charged', 'lead_refunded', 'is_bulk', 'forwarder'];
    const rows = quotes.map((q) => [
      q.id, q.state, q.created_at, q.product_category, q.hs_chapter,
      q.target_market, q.shipping_mode, q.lead_tier, q.lead_fee,
      q.lead_charged, q.lead_refunded, q.is_bulk,
      q.freight_forwarders?.company_name ?? '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `fc-quotes-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const flagged = quotes.filter((q) => (q.state === 'expired' || q.lead_refunded) && !refundResult[q.id]);

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <select value={filters.state} onChange={(e) => setFilters((f) => ({ ...f, state: e.target.value }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All states</option>
          <option value="pending">Pending</option>
          <option value="responded">Responded</option>
          <option value="expired">Expired</option>
        </select>
        <select value={filters.lead_tier} onChange={(e) => setFilters((f) => ({ ...f, lead_tier: e.target.value }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All lead tiers</option>
          <option value="quote_only">Quote only</option>
          <option value="anonymised_profile">Anonymised profile</option>
        </select>
        <select value={filters.forwarder_tier} onChange={(e) => setFilters((f) => ({ ...f, forwarder_tier: e.target.value }))} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">All forwarder tiers</option>
          <option value="none">Claimed (pay-per-lead)</option>
          <option value="verified">Verified</option>
          <option value="featured">Featured</option>
        </select>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" />Refresh</Button>
        <Button variant="outline" size="sm" onClick={exportCsv} className="gap-1.5 ml-auto"><Download className="h-3.5 w-3.5" />Export CSV</Button>
      </div>

      {flagged.length > 0 && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700 dark:text-amber-400">
            <strong>{flagged.length} flagged</strong> — expired or refunded leads visible below. Review for quality signals.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Date</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">HS</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Market</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Mode</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Lead Tier</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Forwarder</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">State</th>
                <th className="px-4 py-2.5 text-xs font-medium text-muted-foreground">Refund</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id} className={`border-t ${(q.state === 'expired' || q.lead_refunded) ? 'bg-amber-50/30 dark:bg-amber-900/5' : 'hover:bg-muted/10'}`}>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(q.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                    {q.is_bulk && <span className="ml-1 text-xs bg-muted rounded px-1">Bulk</span>}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono">{q.hs_chapter}</td>
                  <td className="px-4 py-2.5 text-xs">{q.target_market}</td>
                  <td className="px-4 py-2.5 text-xs">{q.shipping_mode}</td>
                  <td className="px-4 py-2.5 text-xs capitalize">{q.lead_tier.replace('_', ' ')}</td>
                  <td className="px-4 py-2.5 text-xs">
                    <p className="font-medium">{q.freight_forwarders?.company_name ?? '—'}</p>
                    <p className="text-muted-foreground capitalize">{q.freight_forwarders?.subscription_tier ?? '—'}</p>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {q.state === 'expired'   && <span className="text-red-600 dark:text-red-400">Expired</span>}
                    {q.state === 'responded' && <span className="text-green-600 dark:text-green-400">Responded</span>}
                    {q.state === 'pending'   && <span className="text-amber-600 dark:text-amber-400">Pending</span>}
                    {q.lead_refunded && <span className="ml-1 text-muted-foreground">(Refunded)</span>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {q.lead_charged && !q.lead_refunded && !refundResult[q.id] ? (
                      <Button size="sm" variant="ghost" className="text-xs" disabled={refunding === q.id} onClick={() => manualRefund(q.id)}>
                        {refunding === q.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refund'}
                      </Button>
                    ) : q.lead_refunded || refundResult[q.id] ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminFreightConnectPage() {
  const [tab, setTab]         = useState<TabId>('forwarders');
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin]   = useState(false);

  useEffect(() => {
    // Quick admin check — the API routes enforce it server-side, but show a gate here too
    fetch('/api/admin/freight-connect/forwarders?limit=1')
      .then((r) => {
        if (r.status === 401) { setIsAdmin(false); }
        else { setIsAdmin(true); }
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Admin Access Required</h1>
        <p className="text-muted-foreground">You don&apos;t have admin access. Contact support@mercorama.com to request access.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg">Freight Connect — Admin Panel</h1>
          <p className="text-xs text-muted-foreground">Mercorama internal tools · Admin only</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
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

      {tab === 'forwarders' && <ForwarderManagement />}
      {tab === 'revenue'    && <RevenueOverview />}
      {tab === 'sme'        && <SmeOverview />}
      {tab === 'unclaimed'  && <UnclaimedManager />}
      {tab === 'founding'   && <FoundingPartnersPanel />}
      {tab === 'quotes'     && <QuoteMonitor />}
    </div>
  );
}
