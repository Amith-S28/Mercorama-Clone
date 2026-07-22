// app/admin/cohorts/page.tsx
// Admin cohort management panel — admin only.
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import {
  Loader2, X, ChevronRight, AlertTriangle, CheckCircle2,
  Users, Clock, Send, Ban, RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CohortConfig = {
  cohort_number:  number;
  cohort_status:  'open' | 'reviewing' | 'full' | 'closed';
};

type Metrics = {
  total: number; pending: number; demo_scheduled: number;
  demo_complete: number; accepted: number; activated: number;
  rejected: number; waitlisted: number; on_waitlist: number;
  international_demand: number;
};

type Application = {
  id:                    string;
  created_at:            string;
  full_name:             string;
  email:                 string;
  company_name:          string;
  province:              string;
  website?:              string;
  product_description:   string;
  hs_code?:              string;
  export_experience:     string;
  biggest_challenge:     string;
  selected_plan:         string;
  original_plan_selected?: string;
  admin_assigned_plan?:  string;
  admin_notes?:          string;
  admin_note?:           string;
  referral_source?:      string;
  linkedin_url?:         string;
  cohort_number:         number;
  status:                string;
  reviewed_at?:          string;
  demo_booked_at?:       string;
  demo_held_at?:         string;
  offer_sent_at?:        string;
  activated_at?:         string;
  access_code?:          string;
  stripe_customer_id?:   string;
};

type WaitlistEntry = {
  id:            string;
  created_at:    string;
  full_name:     string;
  email:         string;
  company_name?: string;
  province?:     string;
  cohort_target: number;
  notified_at?:  string;
  converted:     boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatusBadge({ status, activatedAt }: { status: string; activatedAt?: string | null }) {
  if (activatedAt) return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-semibold">Active</span>;
  const map: Record<string, string> = {
    pending:        'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    demo_scheduled: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    demo_complete:  'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    accepted:       'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    rejected:       'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    waitlisted:     'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  };
  const labels: Record<string, string> = {
    pending: 'Pending', demo_scheduled: 'Demo Invited', demo_complete: 'Demo Done',
    accepted: 'Offer Sent', rejected: 'Rejected', waitlisted: 'Waitlisted',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {labels[status] ?? status}
    </span>
  );
}

function CohortStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    open:      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    reviewing: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    full:      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    closed:    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  };
  const icons: Record<string, string> = { open: '🟢', reviewing: '🟡', full: '🔴', closed: '⚫' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${map[status] ?? ''}`}>
      {icons[status] ?? ''} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function MetricTile({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-center ${highlight ? 'border-[#FF6100]/40 bg-[#FF6100]/5' : 'bg-muted/30'}`}>
      <p className={`text-2xl font-bold ${highlight ? 'text-[#FF6100]' : ''}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  message, onConfirm, onCancel, loading,
}: { message: string; onConfirm: () => void; onCancel: () => void; loading?: boolean }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-background rounded-xl border shadow-2xl w-full max-w-sm p-6 space-y-4">
        <p className="text-sm leading-relaxed">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button size="sm" onClick={onConfirm} disabled={loading} className="bg-[#FF6100] hover:bg-[#e55800] text-white">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Application Detail Drawer ────────────────────────────────────────────────

function ApplicationDrawer({
  app, onClose, onRefresh,
}: { app: Application; onClose: () => void; onRefresh: () => void }) {
  const [notes, setNotes]           = useState(app.admin_notes ?? '');
  const [assignedPlan, setAssigned] = useState(app.admin_assigned_plan ?? app.selected_plan ?? '');
  const [adminNote, setAdminNote]   = useState(app.admin_note ?? '');
  const [calendly, setCalendly]     = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('mc_calendly') ?? '';
    return '';
  });
  const [loading, setLoading]       = useState(false);
  const [confirm, setConfirm]       = useState<{ msg: string; fn: () => void } | null>(null);

  function saveCalendly(val: string) {
    setCalendly(val);
    localStorage.setItem('mc_calendly', val);
  }

  const original = app.original_plan_selected ?? app.selected_plan ?? '';
  const planChanged = assignedPlan && assignedPlan !== original;

  async function action(act: string, extra: Record<string, unknown> = {}) {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/cohorts/application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...adminHeaders() },
        body: JSON.stringify({
          action: act, id: app.id,
          admin_assigned_plan: assignedPlan || undefined,
          admin_note: adminNote || undefined,
          ...extra,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Error');
      onRefresh();
      onClose();
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : 'Unknown'));
    } finally {
      setLoading(false);
    }
  }

  async function saveNotes() {
    setLoading(true);
    await fetch('/api/admin/cohorts/application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ action: 'save_notes', id: app.id, admin_note: notes, admin_assigned_plan: assignedPlan }),
    });
    setLoading(false);
    onRefresh();
  }

  const isActivated = app.activated_at != null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Drawer */}
      <div className="w-full max-w-xl bg-background border-l overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-background z-10">
          <div>
            <p className="font-semibold">{app.full_name}</p>
            <p className="text-xs text-muted-foreground">{app.email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 px-6 py-6 space-y-6">

          {/* Status + history */}
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={app.status} activatedAt={app.activated_at} />
              <span className="text-xs text-muted-foreground">Cohort {app.cohort_number}</span>
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Applied: {fmt(app.created_at)}</p>
              {app.reviewed_at    && <p>Reviewed: {fmt(app.reviewed_at)}</p>}
              {app.demo_booked_at && <p>Demo booked: {fmt(app.demo_booked_at)}</p>}
              {app.demo_held_at   && <p>Demo held: {fmt(app.demo_held_at)}</p>}
              {app.offer_sent_at  && <p>Offer sent: {fmt(app.offer_sent_at)}</p>}
              {app.activated_at   && <p>Activated: {fmt(app.activated_at)}</p>}
            </div>
          </section>

          {/* Application fields */}
          <section className="space-y-3 text-sm">
            <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">Application</h3>
            <Row label="Company"   value={app.company_name} />
            <Row label="Province"  value={app.province} />
            {app.website && <Row label="Website" value={app.website} />}
            <Row label="Product"   value={app.product_description} />
            {app.hs_code && <Row label="HS Code" value={app.hs_code} />}
            <Row label="Experience" value={app.export_experience} />
            <Row label="Challenge"  value={app.biggest_challenge} />
            {app.referral_source && <Row label="Referral" value={app.referral_source} />}
            {app.linkedin_url    && <Row label="LinkedIn" value={app.linkedin_url} />}
          </section>

          {/* Plan assignment */}
          {!isActivated && (
            <section className="space-y-3">
              <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">Plan Assignment</h3>
              <p className="text-xs text-muted-foreground">
                Applied for: <strong>{original}</strong>
              </p>
              <div className="space-y-2">
                {['starter', 'growth'].map((p) => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio" name="plan" value={p}
                      checked={assignedPlan === p}
                      onChange={() => setAssigned(p)}
                      className="accent-[#FF6100]"
                    />
                    {p === 'starter'
                      ? 'Starter — $99 CAD/mo founding · $149 CAD/mo public'
                      : 'Growth — $299 CAD/mo founding · $349 CAD/mo public'}
                  </label>
                ))}
              </div>
              {planChanged && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>
                    You are assigning <strong>{assignedPlan}</strong>.
                    The applicant applied for <strong>{original}</strong>.
                    Email 2B will reflect the plan you assign here.
                  </span>
                </div>
              )}
            </section>
          )}

          {/* Personal note to applicant */}
          {!isActivated && (
            <section className="space-y-2">
              <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">
                Personal note to applicant <span className="normal-case font-normal">(optional)</span>
              </h3>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                maxLength={300}
                rows={3}
                placeholder="Add a personal message to include in the activation email..."
                className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-xs text-muted-foreground text-right">{adminNote.length}/300</p>
            </section>
          )}

          {/* Internal admin notes */}
          <section className="space-y-2">
            <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">Internal Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Private notes (not sent to applicant)…"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" variant="outline" onClick={saveNotes} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save Notes'}
            </Button>
          </section>

          {/* Activated read-only panel */}
          {isActivated && (
            <section className="rounded-lg border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 p-4 space-y-1.5 text-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-emerald-800 dark:text-emerald-300">Account activated {fmt(app.activated_at)}</span>
              </div>
              <p>Plan: <strong>{app.admin_assigned_plan ?? app.selected_plan}</strong></p>
              {app.stripe_customer_id && <p className="text-xs text-muted-foreground break-all">Stripe: {app.stripe_customer_id}</p>}
              {app.access_code && <p className="text-xs text-muted-foreground">Code: {app.access_code}</p>}
            </section>
          )}

          {/* Action buttons by status */}
          {!isActivated && <ActionButtons
            app={app} calendly={calendly} setCalendly={saveCalendly}
            assignedPlan={assignedPlan} adminNote={adminNote}
            loading={loading} action={action} confirm={confirm} setConfirm={setConfirm}
          />}

        </div>
      </div>

      {/* Confirm dialog */}
      {confirm && (
        <ConfirmDialog
          message={confirm.msg}
          onConfirm={() => { setConfirm(null); confirm.fn(); }}
          onCancel={() => setConfirm(null)}
          loading={loading}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[100px_1fr] gap-2">
      <span className="text-muted-foreground text-xs pt-0.5">{label}</span>
      <span className="text-sm break-words">{value}</span>
    </div>
  );
}

function ActionButtons({
  app, calendly, setCalendly, loading, action, confirm, setConfirm,
}: {
  app: Application;
  calendly: string;
  setCalendly: (v: string) => void;
  assignedPlan: string;
  adminNote: string;
  loading: boolean;
  action: (act: string, extra?: Record<string, unknown>) => void;
  confirm: { msg: string; fn: () => void } | null;
  setConfirm: (c: { msg: string; fn: () => void } | null) => void;
}) {
  const ask = (msg: string, fn: () => void) => setConfirm({ msg, fn });

  if (app.status === 'pending') {
    return (
      <section className="space-y-3 border-t pt-4">
        <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">Actions</h3>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium">Your demo booking link</label>
          <input
            type="url"
            value={calendly}
            onChange={(e) => setCalendly(e.target.value)}
            placeholder="https://calendly.com/..."
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button
          className="w-full bg-[#FF6100] hover:bg-[#e55800] text-white"
          disabled={loading || !calendly}
          onClick={() => ask(
            `Send demo invite to ${app.full_name} at ${app.email}?`,
            () => action('send_demo_invite', { calendly_link: calendly })
          )}
        >
          <Send className="h-4 w-4 mr-2" /> Send Demo Invite →
        </Button>

        <Button variant="outline" className="w-full" disabled={loading}
          onClick={() => ask(
            `Skip demo and send offer directly to ${app.full_name}? They will receive pricing and activation link now.`,
            () => action('accept_direct')
          )}>
          Accept Direct — Skip Demo
        </Button>

        <Button variant="outline" className="w-full border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          disabled={loading}
          onClick={() => ask(
            `Send rejection email to ${app.full_name}? They will be added to the Cohort ${app.cohort_number + 1} waitlist.`,
            () => action('reject')
          )}>
          <Ban className="h-4 w-4 mr-2" /> Reject + Send Email
        </Button>

        <Button variant="ghost" size="sm" className="w-full text-muted-foreground" disabled={loading}
          onClick={() => ask(
            `Move ${app.full_name} to waitlist without sending an email?`,
            () => action('waitlist_no_email')
          )}>
          Waitlist — No Email
        </Button>
      </section>
    );
  }

  if (app.status === 'demo_scheduled') {
    return (
      <section className="space-y-3 border-t pt-4">
        <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">Actions</h3>
        <Button variant="outline" className="w-full" disabled={loading}
          onClick={() => ask(`Mark demo as complete for ${app.full_name}?`, () => action('mark_demo_complete'))}>
          Mark Demo Complete
        </Button>
        <Button className="w-full bg-[#FF6100] hover:bg-[#e55800] text-white" disabled={loading}
          onClick={() => ask(
            `Send offer to ${app.full_name}?`,
            () => action('send_offer')
          )}>
          <Send className="h-4 w-4 mr-2" /> Send Offer Now →
        </Button>
      </section>
    );
  }

  if (app.status === 'demo_complete') {
    return (
      <section className="space-y-3 border-t pt-4">
        <h3 className="font-semibold text-xs uppercase tracking-widest text-muted-foreground">Actions</h3>
        <Button className="w-full bg-[#FF6100] hover:bg-[#e55800] text-white" disabled={loading}
          onClick={() => ask(`Send offer to ${app.full_name}?`, () => action('send_offer'))}>
          <Send className="h-4 w-4 mr-2" /> Send Offer Now →
        </Button>
      </section>
    );
  }

  if (app.status === 'accepted' && !app.activated_at) {
    return (
      <section className="space-y-3 border-t pt-4">
        <div className="rounded-md bg-muted/40 px-3 py-2 text-xs space-y-1">
          <p>Offer sent: {fmt(app.offer_sent_at)}</p>
          {app.access_code && <p>Access code: <strong>{app.access_code}</strong></p>}
        </div>
        <Button variant="outline" className="w-full" disabled={loading}
          onClick={() => ask(
            `Resend offer email to ${app.full_name}? Same access code will be used.`,
            () => action('resend_offer')
          )}>
          <RefreshCw className="h-4 w-4 mr-2" /> Resend Offer Email
        </Button>
      </section>
    );
  }

  return null;
}

// ─── International Demand Table ───────────────────────────────────────────────

type IntlEntry = {
  id: string;
  email: string;
  country: string | null;
  country_code: string | null;
  source: string | null;
  created_at: string;
};

// ─── Data Flags Section (DT-5) ────────────────────────────────────────────────

type DataFlag = {
  id: string;
  created_at: string;
  table_name: string | null;
  flag_type: string | null;
  details: Record<string, unknown> | null;
  status: string;
  resolved_at: string | null;
  resolved_by: string | null;
};

function DataFlagsSection() {
  const [flags, setFlags]     = useState<DataFlag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/data-flags', { headers: adminHeaders() })
      .then((r) => r.json())
      .then((d: { flags?: DataFlag[] }) => setFlags(d.flags ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    await fetch('/api/admin/data-flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ id, status }),
    });
    setFlags((prev) => prev.filter((f) => f.id !== id));
  }

  return (
    <section className="bg-card border rounded-xl p-6">
      <h2 className="text-base font-semibold mb-4">Data Flags — Open ({flags.length})</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : flags.length === 0 ? (
        <p className="text-sm text-muted-foreground">No open data flags.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left py-2 pr-4">Table</th>
                <th className="text-left py-2 pr-4">Type</th>
                <th className="text-left py-2 pr-4">Details</th>
                <th className="text-left py-2 pr-4">Submitted</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flags.map((f) => (
                <tr key={f.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-mono text-xs">{f.table_name ?? '—'}</td>
                  <td className="py-2 pr-4 text-xs">{f.flag_type ?? '—'}</td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground max-w-xs truncate">
                    {f.details?.reason as string ?? f.details?.field_label as string ?? JSON.stringify(f.details).slice(0, 80)}
                    {f.details?.note ? ` — "${f.details.note as string}"` : ''}
                  </td>
                  <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(f.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateStatus(f.id, 'reviewing')}
                        className="text-xs px-2 py-1 rounded border hover:bg-muted transition-colors"
                      >
                        Reviewing
                      </button>
                      <button
                        onClick={() => updateStatus(f.id, 'resolved')}
                        className="text-xs px-2 py-1 rounded border border-green-300 text-green-700 hover:bg-green-50 transition-colors"
                      >
                        Resolve
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Changelog Section (DT-8) ─────────────────────────────────────────────────

type ChangelogEntry = {
  id: string;
  created_at: string;
  entry_type: string;
  title: string;
  description: string | null;
  affected_tables: string[] | null;
  created_by: string | null;
  severity: string | null;
};

const SEVERITY_STYLE: Record<string, string> = {
  low:      'bg-muted text-muted-foreground',
  medium:   'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
  high:     'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
  critical: 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
};

function ChangelogSection() {
  const [entries, setEntries]   = useState<ChangelogEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ title: '', description: '', entry_type: 'data_correction', severity: 'low' });
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    fetch('/api/admin/changelog', { headers: adminHeaders() })
      .then((r) => r.json())
      .then((d: { entries?: ChangelogEntry[] }) => setEntries(d.entries ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function addEntry() {
    if (!form.title) return;
    setSaving(true);
    await fetch('/api/admin/changelog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify(form),
    });
    const fresh = await fetch('/api/admin/changelog', { headers: adminHeaders() }).then((r) => r.json());
    setEntries(fresh.entries ?? []);
    setShowForm(false);
    setForm({ title: '', description: '', entry_type: 'data_correction', severity: 'low' });
    setSaving(false);
  }

  return (
    <section className="bg-card border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold">Admin Changelog</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs px-3 py-1.5 rounded border hover:bg-muted transition-colors"
        >
          + Add Entry
        </button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-lg border bg-muted/30 p-4 space-y-3">
          <select
            value={form.entry_type}
            onChange={(e) => setForm((p) => ({ ...p, entry_type: e.target.value }))}
            className="w-full rounded border bg-background px-3 py-1.5 text-sm"
          >
            {['data_correction','rate_update','source_change','incident','validation_run'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded border bg-background px-3 py-1.5 text-sm"
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={2}
            className="w-full rounded border bg-background px-3 py-1.5 text-sm resize-none"
          />
          <select
            value={form.severity}
            onChange={(e) => setForm((p) => ({ ...p, severity: e.target.value }))}
            className="w-full rounded border bg-background px-3 py-1.5 text-sm"
          >
            {['low','medium','high','critical'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 rounded border hover:bg-muted">Cancel</button>
            <button
              onClick={addEntry}
              disabled={!form.title || saving}
              className="text-xs px-3 py-1.5 rounded bg-foreground text-background hover:opacity-80 disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No changelog entries yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th className="text-left py-2 pr-4">Date</th>
                <th className="text-left py-2 pr-4">Type</th>
                <th className="text-left py-2 pr-4">Severity</th>
                <th className="text-left py-2 pr-4">Title</th>
                <th className="text-left py-2">By</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(e.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-4 text-xs">{e.entry_type}</td>
                  <td className="py-2 pr-4">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${SEVERITY_STYLE[e.severity ?? 'low'] ?? ''}`}>
                      {e.severity ?? 'low'}
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-xs">{e.title}</td>
                  <td className="py-2 text-xs text-muted-foreground">{e.created_by ?? 'cron'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── International Section ────────────────────────────────────────────────────

function InternationalSection() {
  const [entries, setEntries] = useState<IntlEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/cohorts/international', { headers: adminHeaders() })
      .then((r) => r.json())
      .then((d: { entries?: IntlEntry[] }) => setEntries(d.entries ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="bg-card border rounded-xl p-6">
      <h2 className="text-base font-semibold mb-4">International Demand ({entries.length})</h2>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No international signups yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wide">
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Country</th>
                <th className="pb-2 pr-4">Source</th>
                <th className="pb-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">{e.email}</td>
                  <td className="py-2 pr-4 text-muted-foreground">{e.country ?? e.country_code ?? '—'}</td>
                  <td className="py-2 pr-4 text-muted-foreground text-xs">{e.source ?? '—'}</td>
                  <td className="py-2 text-muted-foreground text-xs">
                    {new Date(e.created_at).toLocaleDateString('en-CA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Waitlist Table ───────────────────────────────────────────────────────────

function WaitlistSection() {
  const [entries, setEntries]     = useState<WaitlistEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [filterCohort, setFC]     = useState('all');
  const [filterNotified, setFN]   = useState('all');
  const [notifying, setNotifying] = useState(false);
  const [confirm, setConfirm]     = useState<{ msg: string; fn: () => void } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterCohort !== 'all')   params.set('cohort_target', filterCohort);
    if (filterNotified !== 'all') params.set('notified', filterNotified);
    const res  = await fetch(`/api/admin/cohorts/waitlist?${params}`, { headers: adminHeaders() });
    const data = await res.json();
    setEntries(data.waitlist ?? []);
    setLoading(false);
  }, [filterCohort, filterNotified]);

  useEffect(() => { load(); }, [load]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function notifySelected() {
    setNotifying(true);
    const res = await fetch('/api/admin/cohorts/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ ids: Array.from(selected), cohort_number: 2 }),
    });
    const data = await res.json();
    setNotifying(false);
    setSelected(new Set());
    setConfirm(null);
    alert(`Sent to ${data.sent} member(s).`);
    load();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold">Waitlist</h2>
        <div className="flex gap-2 flex-wrap">
          <select value={filterCohort} onChange={(e) => setFC(e.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm">
            <option value="all">All cohorts</option>
            {[2,3,4].map((n) => <option key={n} value={n}>Cohort {n}</option>)}
          </select>
          <select value={filterNotified} onChange={(e) => setFN(e.target.value)}
            className="rounded-md border bg-background px-2 py-1.5 text-sm">
            <option value="all">All</option>
            <option value="yes">Notified</option>
            <option value="no">Not notified</option>
          </select>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-[#FF6100]/40 bg-[#FF6100]/5 px-4 py-2">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Button size="sm" className="bg-[#FF6100] hover:bg-[#e55800] text-white"
            disabled={notifying}
            onClick={() => setConfirm({
              msg: `Send cohort invite to ${selected.size} waitlist member(s)? This cannot be undone.`,
              fn: notifySelected,
            })}>
            {notifying ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Send className="h-3.5 w-3.5 mr-1" />}
            Notify Selected
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No waitlist entries.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left w-8">
                  <input type="checkbox"
                    checked={selected.size === entries.length}
                    onChange={() => setSelected(selected.size === entries.length ? new Set() : new Set(entries.map((e) => e.id)))} />
                </th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Company</th>
                <th className="px-3 py-2 text-left">Province</th>
                <th className="px-3 py-2 text-left">Cohort</th>
                <th className="px-3 py-2 text-left">Notified</th>
                <th className="px-3 py-2 text-left">Converted</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2">
                    <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} disabled={!!e.notified_at} />
                  </td>
                  <td className="px-3 py-2 font-medium">{e.full_name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.email}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.company_name ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{e.province ?? '—'}</td>
                  <td className="px-3 py-2">{e.cohort_target}</td>
                  <td className="px-3 py-2">{e.notified_at ? <span className="text-green-600 text-xs">{fmt(e.notified_at)}</span> : <span className="text-muted-foreground text-xs">—</span>}</td>
                  <td className="px-3 py-2">{e.converted ? <span className="text-green-600 text-xs">Yes</span> : <span className="text-muted-foreground text-xs">No</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirm && (
        <ConfirmDialog message={confirm.msg} onConfirm={confirm.fn} onCancel={() => setConfirm(null)} loading={notifying} />
      )}
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function adminHeaders(): HeadersInit {
  return { 'x-admin-email': getAuthUser()?.email ?? '' };
}

export default function AdminCohortsPage() {
  const router = useRouter();

  const [ready, setReady]           = useState(false);
  const [cohort, setCohort]         = useState<CohortConfig | null>(null);
  const [metrics, setMetrics]       = useState<Metrics | null>(null);
  const [apps, setApps]             = useState<Application[]>([]);
  const [loading, setLoading]       = useState(true);
  const [appsLoading, setAppsLoading] = useState(false);
  const [drawer, setDrawer]         = useState<Application | null>(null);
  const [confirm, setConfirm]       = useState<{ msg: string; fn: () => void } | null>(null);
  const [statusChanging, setStatusChanging] = useState(false);

  // Filters
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterPlan, setFilterPlan]       = useState('all');
  const [filterProvince, setFilterProvince] = useState('all');
  const [filterCohort, setFilterCohort]   = useState('all');
  const [search, setSearch]               = useState('');

  // ── Admin gate ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/admin/cohorts/overview', { headers: adminHeaders() })
      .then((r) => {
        if (r.status === 401 || r.status === 403) { router.replace('/dashboard'); return null; }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        setCohort(data.cohort);
        setMetrics(data.metrics);
        setReady(true);
        setLoading(false);
      })
      .catch(() => router.replace('/dashboard'));
  }, [router]);

  const loadApps = useCallback(async () => {
    setAppsLoading(true);
    const params = new URLSearchParams();
    if (filterStatus   !== 'all') params.set('status', filterStatus);
    if (filterPlan     !== 'all') params.set('plan', filterPlan);
    if (filterProvince !== 'all') params.set('province', filterProvince);
    if (filterCohort   !== 'all') params.set('cohort', filterCohort);
    if (search) params.set('search', search);
    const res  = await fetch(`/api/admin/cohorts/applications?${params}`, { headers: adminHeaders() });
    const data = await res.json();
    setApps(data.applications ?? []);
    setAppsLoading(false);
  }, [filterStatus, filterPlan, filterProvince, filterCohort, search]);

  useEffect(() => { if (ready) loadApps(); }, [ready, loadApps]);

  async function updateCohortStatus(newStatus: string) {
    setStatusChanging(true);
    await fetch('/api/admin/cohorts/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...adminHeaders() },
      body: JSON.stringify({ cohort_number: 1, cohort_status: newStatus }),
    });
    setCohort((prev) => prev ? { ...prev, cohort_status: newStatus as CohortConfig['cohort_status'] } : prev);
    setStatusChanging(false);
    setConfirm(null);
  }

  const refresh = () => {
    // Reload overview metrics + apps
    fetch('/api/admin/cohorts/overview', { headers: adminHeaders() }).then((r) => r.json()).then((d) => {
      setCohort(d.cohort); setMetrics(d.metrics);
    });
    loadApps();
  };

  if (!ready || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const provinces = [...new Set(apps.map((a) => a.province).filter(Boolean))].sort();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center justify-between sticky top-0 bg-background z-40">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm font-semibold">Mercorama</Link>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Admin</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">Cohorts</span>
        </div>
        <Link href="/admin/pricing-archive" className="text-xs text-muted-foreground hover:text-foreground underline">
          View Pricing Archive →
        </Link>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-10">

        {/* ── Section 1: Cohort Status ──────────────────────────────────────── */}
        <section className="space-y-4">
          <h1 className="text-xl font-bold">Cohort 1</h1>
          <div className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <CohortStatusBadge status={cohort?.cohort_status ?? 'open'} />
                <span className="text-sm text-muted-foreground">
                  {metrics?.total ?? 0} applications received
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {cohort?.cohort_status !== 'reviewing' && (
                <Button size="sm" variant="outline" disabled={statusChanging}
                  onClick={() => setConfirm({
                    msg: 'Change Cohort 1 status to reviewing? This updates the live badge on /beta immediately.',
                    fn: () => updateCohortStatus('reviewing'),
                  })}>
                  Set to Reviewing
                </Button>
              )}
              {cohort?.cohort_status !== 'full' && (
                <Button size="sm" variant="outline" disabled={statusChanging}
                  onClick={() => setConfirm({
                    msg: 'Change Cohort 1 status to full? This updates the live badge on /beta immediately.',
                    fn: () => updateCohortStatus('full'),
                  })}>
                  Set to Full
                </Button>
              )}
              {cohort?.cohort_status !== 'open' && (
                <Button size="sm" variant="outline" disabled={statusChanging}
                  onClick={() => setConfirm({
                    msg: 'Reopen Cohort 1? This updates the live badge on /beta immediately.',
                    fn: () => updateCohortStatus('open'),
                  })}>
                  Reopen
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* ── Section 2: Metrics ───────────────────────────────────────────── */}
        {metrics && (
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Metrics</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-2">
              <MetricTile label="Total"       value={metrics.total} />
              <MetricTile label="Pending"     value={metrics.pending} />
              <MetricTile label="Demo Invited" value={metrics.demo_scheduled} />
              <MetricTile label="Demo Done"   value={metrics.demo_complete} />
              <MetricTile label="Offer Sent"  value={metrics.accepted} />
              <MetricTile label="Activated"   value={metrics.activated} highlight />
              <MetricTile label="Rejected"    value={metrics.rejected} />
              <MetricTile label="Waitlisted"  value={metrics.waitlisted} />
              <MetricTile label="On Waitlist" value={metrics.on_waitlist} />
              <MetricTile label="Intl Demand" value={metrics.international_demand} />
            </div>
          </section>
        )}

        {/* ── Section 3: Applications Table ────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-base font-semibold">Applications</h2>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, company…"
              className="rounded-md border bg-background px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {[
              { val: filterStatus,   set: setFilterStatus,   opts: ['all','pending','demo_scheduled','demo_complete','accepted','rejected','waitlisted'], label: 'Status' },
              { val: filterPlan,     set: setFilterPlan,     opts: ['all','starter','growth'], label: 'Plan' },
              { val: filterCohort,   set: setFilterCohort,   opts: ['all','1','2'], label: 'Cohort' },
            ].map(({ val, set, opts, label }) => (
              <select key={label} value={val} onChange={(e) => set(e.target.value)}
                className="rounded-md border bg-background px-2 py-1.5 text-sm">
                {opts.map((o) => <option key={o} value={o}>{o === 'all' ? `All ${label}s` : o}</option>)}
              </select>
            ))}
            {provinces.length > 0 && (
              <select value={filterProvince} onChange={(e) => setFilterProvince(e.target.value)}
                className="rounded-md border bg-background px-2 py-1.5 text-sm">
                <option value="all">All Provinces</option>
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            )}
          </div>

          {appsLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : apps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No applications match the current filters.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Name</th>
                    <th className="px-3 py-2 text-left">Company</th>
                    <th className="px-3 py-2 text-left">Province</th>
                    <th className="px-3 py-2 text-left">Applied For</th>
                    <th className="px-3 py-2 text-left">Assigned</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Applied</th>
                    <th className="px-3 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.id} className="border-t hover:bg-muted/20">
                      <td className="px-3 py-2 font-medium whitespace-nowrap">{a.full_name}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{a.company_name}</td>
                      <td className="px-3 py-2 text-muted-foreground">{a.province}</td>
                      <td className="px-3 py-2 capitalize">{a.original_plan_selected ?? a.selected_plan}</td>
                      <td className="px-3 py-2">
                        {a.admin_assigned_plan
                          ? <span className={`text-xs font-medium ${a.admin_assigned_plan !== (a.original_plan_selected ?? a.selected_plan) ? 'text-amber-600' : 'text-muted-foreground'}`}>
                              {a.admin_assigned_plan}
                            </span>
                          : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2">
                        <StatusBadge status={a.status} activatedAt={a.activated_at} />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap text-xs">{fmt(a.created_at)}</td>
                      <td className="px-3 py-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          onClick={() => setDrawer(a)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Section 4: Waitlist Table ─────────────────────────────────────── */}
        <WaitlistSection />

        {/* ── Section 5: International Demand ───────────────────────────────── */}
        <InternationalSection />

        {/* ── Section 6: Data Flags (DT-5) ───────────────────────────────────── */}
        <DataFlagsSection />

        {/* ── Section 7: Admin Changelog (DT-8) ──────────────────────────────── */}
        <ChangelogSection />

      </main>

      {/* Detail drawer */}
      {drawer && (
        <ApplicationDrawer
          app={drawer}
          onClose={() => setDrawer(null)}
          onRefresh={refresh}
        />
      )}

      {/* Global confirm dialog */}
      {confirm && (
        <ConfirmDialog
          message={confirm.msg}
          onConfirm={() => { confirm.fn(); }}
          onCancel={() => setConfirm(null)}
          loading={statusChanging}
        />
      )}
    </div>
  );
}
