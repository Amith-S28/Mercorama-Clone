// app/admin/funding-sync/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingChange {
  id: string;
  program_id: string;
  change_type: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  detected_at: string;
  funding_programs: { name: string } | null;
}

interface SyncLog {
  id: string;
  started_at: string;
  finished_at: string | null;
  programs_checked: number | null;
  changes_found: number | null;
  status: string;
  error_message: string | null;
}

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function changedFields(change: PendingChange): { field: string; old: string; next: string }[] {
  if (!change.old_data || !change.new_data) return [];
  const keys = Array.from(
    new Set([...Object.keys(change.old_data), ...Object.keys(change.new_data)])
  );
  return keys
    .filter((k) => JSON.stringify(change.old_data?.[k]) !== JSON.stringify(change.new_data?.[k]))
    .map((k) => ({
      field: k,
      old: String(change.old_data?.[k] ?? '—'),
      next: String(change.new_data?.[k] ?? '—'),
    }));
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FundingSyncAdminPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [pending, setPending] = useState<PendingChange[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // ─── Auth check ────────────────────────────────────────────────────────────
  useEffect(() => {
    async function checkAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/dashboard'); return; }

      const { data: profile } = await supabase
        .from('users')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.is_admin) { router.push('/dashboard'); return; }

      setUserEmail(user.email ?? '');
      setAuthLoading(false);
    }
    void checkAdmin();
  }, [router]);

  // ─── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const [pendingRes, logsRes] = await Promise.all([
      supabase
        .from('funding_program_changes')
        .select('*, funding_programs(name)')
        .eq('approved', false)
        .order('detected_at', { ascending: false }),
      supabase
        .from('funding_sync_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10),
    ]);

    if (pendingRes.data) setPending(pendingRes.data as PendingChange[]);
    if (logsRes.data) setSyncLogs(logsRes.data as SyncLog[]);
  }, []);

  useEffect(() => {
    if (!authLoading) void loadData();
  }, [authLoading, loadData]);

  // ─── Actions ───────────────────────────────────────────────────────────────
  async function runSync() {
    setSyncing(true);
    try {
      const secret = process.env.NEXT_PUBLIC_FUNDING_SYNC_SECRET ?? '';
      const res = await fetch('/api/cron/funding-sync', {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (res.ok) {
        const data = await res.json() as { changes_detected?: number };
        toast.success(`Sync complete — ${data.changes_detected ?? 0} changes detected`, { duration: 4000 });
      } else {
        toast.error('Sync failed — check logs');
      }
      await loadData();
    } catch {
      toast.error('Sync request failed');
    } finally {
      setSyncing(false);
    }
  }

  async function handleAction(changeId: string, action: 'approve' | 'dismiss') {
    const programName = pending.find((p) => p.id === changeId)?.funding_programs?.name ?? 'Program';
    setActionInProgress(changeId);
    try {
      const res = await fetch('/api/admin/funding-sync-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, change_id: changeId }),
      });
      if (res.ok) {
        if (action === 'approve') {
          toast.success(`${programName} updated successfully`, { duration: 3000 });
        } else {
          toast.success(`Change dismissed`, { duration: 2000 });
        }
      } else {
        toast.error(`Action failed`);
      }
      await loadData();
    } catch {
      toast.error(`Action failed`);
    } finally {
      setActionInProgress(null);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const lastSync = syncLogs[0];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fund My Export — Sync Review</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pending.length} change{pending.length !== 1 ? 's' : ''} pending review
            {lastSync && ` · Last sync: ${fmt(lastSync.started_at)}`}
          </p>
        </div>
        <Button
          onClick={runSync}
          disabled={syncing}
          variant="outline"
          className="gap-2"
        >
          {syncing
            ? <><Loader2 className="h-4 w-4 animate-spin" />Running...</>
            : <><RefreshCw className="h-4 w-4" />Run Manual Sync</>}
        </Button>
      </div>

      {/* Pending changes */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Pending Changes</h2>
        {pending.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            No pending changes — all programs are up to date.
          </div>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {['Program Name', 'Field Changed', 'Old Value', 'New Value', 'Detected At', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {pending.map((change) => {
                  const fields = changedFields(change);
                  const firstField = fields[0];
                  const isActing = actionInProgress === change.id;

                  return (
                    <tr key={change.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        {change.funding_programs?.name ?? change.program_id.slice(0, 8)}
                        <span className="ml-2 rounded-full bg-muted px-1.5 py-0.5 text-[10px] capitalize">
                          {change.change_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {fields.length > 1
                          ? `${firstField?.field} +${fields.length - 1} more`
                          : (firstField?.field ?? '—')}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[180px] truncate">
                        {firstField?.old ?? '—'}
                      </td>
                      <td className="px-4 py-3 max-w-[180px] truncate">
                        {firstField?.next ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {fmt(change.detected_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1.5 text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
                            disabled={isActing}
                            onClick={() => handleAction(change.id, 'approve')}
                          >
                            {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1.5 text-xs border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                            disabled={isActing}
                            onClick={() => handleAction(change.id, 'dismiss')}
                          >
                            <XCircle className="h-3 w-3" />
                            Dismiss
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sync log */}
      <section>
        <h2 className="mb-4 text-base font-semibold">Sync History</h2>
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {['Synced At', 'Programs Checked', 'Changes Detected', 'Status', 'Notes'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {syncLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No sync runs yet.
                  </td>
                </tr>
              ) : syncLogs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 whitespace-nowrap">{fmt(log.started_at)}</td>
                  <td className="px-4 py-3 tabular-nums">{log.programs_checked ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums">{log.changes_found ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={
                      log.status === 'success'
                        ? 'text-green-700 dark:text-green-400 font-medium'
                        : log.status === 'failed'
                          ? 'text-red-600 dark:text-red-400 font-medium'
                          : 'text-amber-600 dark:text-amber-400'
                    }>
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[220px] truncate">
                    {log.error_message ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Signed in as {userEmail}</p>
      </section>
    </div>
  );
}
