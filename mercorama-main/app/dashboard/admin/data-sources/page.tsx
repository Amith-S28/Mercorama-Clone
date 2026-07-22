'use client';

import { useEffect, useState } from 'react';
import { Database, RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Zap, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DataSource {
  id: string;
  name: string;
  description: string;
  cronEndpoint: string;
  schedule: string;
  frequency: string;
  url?: string;
  category: 'trade_data' | 'market_intel' | 'compliance' | 'internal';
  defaultParams?: string;
  fullBatchEndpoint?: string;
  note?: string;
}

interface RunLog {
  source: string;
  status: 'success' | 'error' | 'running';
  timestamp: string;
  details?: string;
  rawData?: Record<string, unknown>;
  duration?: number;
}

const DATA_SOURCES: DataSource[] = [
  {
    id: 'comtrade-sync',
    name: 'UN Comtrade',
    description: '73 HS codes × 15 destinations — trade flow values. HS code list is static reference data.',
    cronEndpoint: '/api/cron/comtrade-sync',
    schedule: '0 3 1-3 * *',
    frequency: 'Monthly (3-day cycle)',
    url: 'https://comtradeplus.un.org',
    category: 'trade_data',
    defaultParams: '?quick=1',
    fullBatchEndpoint: '/api/cron/comtrade-sync?day=1',
    note: 'Quick: 5×5. Full: 3-day cycle (day=1/2/3, ~345 calls each). API limit: 500/day.',
  },
  {
    id: 'statcan-sync',
    name: 'Statistics Canada',
    description: 'Canadian provincial export values by top 20 HS codes',
    cronEndpoint: '/api/cron/statcan-sync',
    schedule: '0 4 1 * *',
    frequency: 'Monthly (1st)',
    url: 'https://www150.statcan.gc.ca',
    category: 'trade_data',
    defaultParams: '?quick=1',
    fullBatchEndpoint: '/api/cron/statcan-sync',
    note: 'Quick: 3 codes. Full: 20 codes.',
  },
  {
    id: 'usitc-ingest',
    name: 'US International Trade Commission',
    description: 'US HTS tariff rates — rates change infrequently, quarterly refresh sufficient',
    cronEndpoint: '/api/cron/usitc-ingest',
    schedule: '0 2 1 1,4,7,10 *',
    frequency: 'Quarterly',
    url: 'https://www.usitc.gov',
    category: 'trade_data',
    defaultParams: '?quick=1',
    fullBatchEndpoint: '/api/cron/usitc-ingest',
    note: 'Quick: 5 chapters. Full: 22 chapters. Tariff rates are mostly static.',
  },
  {
    id: 'canada-intel-refresh',
    name: 'Canada Market Intelligence',
    description: 'Province intelligence refresh — market signals, entry strategies, competitive analysis',
    cronEndpoint: '/api/cron/canada-intel-refresh',
    schedule: '0 2 * * 1,4',
    frequency: 'Mon + Thu',
    category: 'market_intel',
    defaultParams: '?quick=1',
    fullBatchEndpoint: '/api/cron/canada-intel-refresh',
    note: 'Quick: 2 provinces (NS, ON). Full: all 4 provinces.',
  },
  {
    id: 'province-backfill',
    name: 'Province Trade Backfill',
    description: 'Province-level trade data backfill from StatCan + Comtrade (rotating NS→ON→BC→AB)',
    cronEndpoint: '/api/cron/province-backfill',
    schedule: '0 5 * * 1-4',
    frequency: 'Mon–Thu (rotating)',
    category: 'trade_data',
    defaultParams: '?province=NS',
    note: 'Requires province param. Default: NS',
  },
  {
    id: 'funding-sync',
    name: 'EDC / BDC Funding Programs',
    description: 'Export financing programs from Export Development Canada and Business Development Bank',
    cronEndpoint: '/api/cron/funding-sync',
    schedule: '0 5 * * 0',
    frequency: 'Weekly (Sun)',
    url: 'https://www.edc.ca',
    category: 'compliance',
  },
  {
    id: 'data-validation',
    name: 'Data Validation Pipeline',
    description: 'Cross-validates trade data integrity, flags anomalies, checks for stale records',
    cronEndpoint: '/api/cron/data-validation',
    schedule: '0 6 * * *',
    frequency: 'Daily',
    category: 'internal',
  },
  {
    id: 'log-purge',
    name: 'Log Purge',
    description: 'Removes analysis logs older than 90 days to maintain database performance',
    cronEndpoint: '/api/cron/log-purge',
    schedule: '0 3 * * 1',
    frequency: 'Weekly (Mon)',
    category: 'internal',
  },
];

const CATEGORY_STYLE: Record<string, { label: string; className: string }> = {
  trade_data:  { label: 'Trade Data',     className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  market_intel: { label: 'Market Intel',  className: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  compliance:  { label: 'Compliance',     className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  internal:    { label: 'Internal',       className: 'bg-muted text-muted-foreground' },
};

const LOG_KEY = 'mercorama_data_source_logs';

function loadLogs(): RunLog[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLogs(logs: RunLog[]) {
  try { localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(0, 200))); } catch {}
}

export default function DataSourcesAdminPage() {
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [running, setRunning] = useState<Set<string>>(new Set());

  useEffect(() => { setLogs(loadLogs()); }, []);

  function getLastRun(sourceId: string): RunLog | undefined {
    return logs.find((l) => l.source === sourceId);
  }

  async function triggerSync(source: DataSource) {
    setRunning((s) => new Set(s).add(source.id));

    const startLog: RunLog = {
      source: source.id,
      status: 'running',
      timestamp: new Date().toISOString(),
    };

    const t0 = Date.now();

    try {
      const endpoint = source.cronEndpoint + (source.defaultParams ?? '');
      const res = await fetch('/api/admin/trigger-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
      const wrapper = await res.json().catch(() => ({}));
      const duration = Date.now() - t0;
      const isOk = wrapper.ok ?? res.ok;
      const data = wrapper.data ?? wrapper;

      const log: RunLog = {
        source: source.id,
        status: isOk ? 'success' : 'error',
        timestamp: new Date().toISOString(),
        rawData: typeof data === 'object' ? data : undefined,
        details: !isOk ? (data.error ?? wrapper.error ?? `HTTP ${wrapper.status ?? res.status}`) : undefined,
        duration,
      };

      const updated = [log, ...logs.filter((l) => l.source !== source.id || l.status !== 'running')].slice(0, 200);
      setLogs(updated);
      saveLogs(updated);

      if (isOk) {
        toast.success(`${source.name} synced in ${(duration / 1000).toFixed(1)}s`);
      } else {
        toast.error(`${source.name} failed: ${data.error ?? wrapper.error ?? 'Unknown error'}`);
      }
    } catch (err) {
      const duration = Date.now() - t0;
      const log: RunLog = {
        source: source.id,
        status: 'error',
        timestamp: new Date().toISOString(),
        details: `Network error: ${err instanceof Error ? err.message : 'unknown'}`,
        duration,
      };
      const updated = [log, ...logs.filter((l) => l.source !== source.id || l.status !== 'running')].slice(0, 200);
      setLogs(updated);
      saveLogs(updated);
      toast.error(`${source.name} failed`);
    } finally {
      setRunning((s) => { const n = new Set(s); n.delete(source.id); return n; });
    }
  }

  async function triggerFullBatch(source: DataSource) {
    if (!source.fullBatchEndpoint) return;
    if (!confirm(`Run full batch for ${source.name}? This will take a long time and runs in the background.`)) return;

    const t0 = Date.now();
    setRunning((s) => new Set(s).add(source.id + '-full'));

    try {
      // Fire-and-forget for long-running full batches
      fetch('/api/admin/trigger-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: source.fullBatchEndpoint }),
      }).then(() => {}).catch(() => {});

      const log: RunLog = {
        source: source.id,
        status: 'success',
        timestamp: new Date().toISOString(),
        rawData: { message: `Full batch triggered. Running in background — check server logs for results.` },
        duration: Date.now() - t0,
      };
      const updated = [log, ...logs].slice(0, 200);
      setLogs(updated);
      saveLogs(updated);
      toast.success(`${source.name} full batch triggered — running in background`);
    } finally {
      setRunning((s) => { const n = new Set(s); n.delete(source.id + '-full'); return n; });
    }
  }

  function formatDetails(log: RunLog): string {
    // Try rawData first, then parse details string
    let d: Record<string, unknown> | null = log.rawData ?? null;
    if (!d && log.details) {
      try { d = JSON.parse(log.details); } catch { return log.details; }
    }
    if (!d) return '—';
    try {

      // Comtrade
      if (d.total_fetched !== undefined) {
        return `${d.mode === 'quick' ? 'Quick' : 'Full'} sync: ${d.total_fetched} trade flows fetched across ${d.hs_codes} HS codes × ${d.destinations} countries. ${d.total_errors ? `${d.total_errors} errors.` : 'No errors.'}`;
      }
      // StatCan
      if (d.totalRows !== undefined) {
        return `${d.mode === 'quick' ? 'Quick' : 'Full'} sync: ${d.totalRows} rows written across ${d.codes} HS codes. ${d.errors?.length ? `${d.errors.length} errors.` : 'No errors.'}`;
      }
      // Canada Intel
      if (d.updated && Array.isArray(d.updated)) {
        return `${d.updated.length} provinces updated (${d.updated.join(', ')}). ${d.errors?.length ? `${d.errors.length} failed.` : 'No errors.'}`;
      }
      // Data Validation
      if (d.checks !== undefined) {
        return `${d.checks?.length ?? 0} checks run. ${d.errors ?? 0} errors, ${d.warnings ?? 0} warnings.`;
      }
      // Funding sync
      if (d.changes_detected !== undefined) {
        return `${d.changes_detected} changes detected. ${d.cache_entries_purged ?? 0} cache entries purged.`;
      }
      // USITC
      if (d.inserted !== undefined) {
        return `${d.inserted} new, ${d.updated} updated, ${d.changes} rate changes. ${d.errors?.length ? `${d.errors.length} errors.` : ''}`;
      }
      // Province backfill
      if (d.province) {
        return `Province ${d.province}: ${d.rows_written ?? d.fetched ?? 0} rows. ${d.errors?.length ? `${d.errors.length} errors.` : ''}`;
      }
      // Log purge
      if (d.total_deleted !== undefined) {
        return `${d.total_deleted} old records purged (retention: ${d.retention_days} days).`;
      }
      // Trigger message
      if (d.message) {
        return d.message;
      }
      // Error
      if (d.error) {
        return `Error: ${d.error}`;
      }
      return log.details ?? JSON.stringify(d).slice(0, 120);
    } catch {
      return log.details ?? '—';
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-[#01696f]" />
          <h1 className="text-xl font-bold">Data Sources</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          DATA_SOURCES.forEach((s) => triggerSync(s));
        }} disabled={running.size > 0}>
          <Zap className="h-3.5 w-3.5 mr-1.5" /> Refresh All
        </Button>
      </div>

      {/* Status overview */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          { label: 'Total Sources', value: DATA_SOURCES.length, color: 'text-foreground' },
          { label: 'Last 24h Success', value: logs.filter((l) => l.status === 'success' && Date.now() - new Date(l.timestamp).getTime() < 86400000).length, color: 'text-green-600' },
          { label: 'Last 24h Errors', value: logs.filter((l) => l.status === 'error' && Date.now() - new Date(l.timestamp).getTime() < 86400000).length, color: 'text-red-600' },
          { label: 'Running Now', value: running.size, color: 'text-amber-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="py-4 text-center">
              <p className={cn('text-2xl font-bold', stat.color)}>{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Source table */}
      <div className="rounded-lg border overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Source</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Schedule</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Last Run</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {DATA_SOURCES.map((source) => {
              const last = getLastRun(source.id);
              const isRunning = running.has(source.id);
              const cat = CATEGORY_STYLE[source.category];
              return (
                <tr key={source.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{source.name}</span>
                      {source.url && (
                        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-[#01696f]">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">{source.description}</p>
                    {source.note && <p className="text-[10px] text-amber-600 mt-0.5">{source.note}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cat.className)}>{cat.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs">{source.frequency}</span>
                    <span className="text-[10px] text-muted-foreground block font-mono">{source.schedule}</span>
                  </td>
                  <td className="px-4 py-3">
                    {last ? (
                      <div>
                        <span className="text-xs">{new Date(last.timestamp).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {last.duration && <span className="text-[10px] text-muted-foreground block">{(last.duration / 1000).toFixed(1)}s</span>}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Never</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isRunning ? (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-600"><Loader2 className="h-3 w-3 animate-spin" /> Running</span>
                    ) : last?.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="h-3 w-3" /> OK</span>
                    ) : last?.status === 'error' ? (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600" title={last.details}><XCircle className="h-3 w-3" /> Error</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => triggerSync(source)} disabled={isRunning}>
                        {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Quick
                      </Button>
                      {source.fullBatchEndpoint && (
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-amber-600 hover:text-amber-700" onClick={() => triggerFullBatch(source)} disabled={running.has(source.id + '-full')}>
                          {running.has(source.id + '-full') ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                          Full
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Run history (collapsible) */}
      {logs.length > 0 && (
        <details className="mt-2">
          <summary className="flex items-center justify-between cursor-pointer group">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide group-hover:text-foreground transition-colors">
                Run History
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {logs.length}
              </span>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-muted-foreground" onClick={(e) => {
              e.preventDefault();
              setLogs([]);
              saveLogs([]);
              toast.success('History cleared');
            }}>
              Clear
            </Button>
          </summary>
          <div className="rounded-lg border overflow-x-auto mt-3">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Time</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Source</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Status</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Duration</th>
                  <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.slice(0, 20).map((log, i) => {
                  const sourceName = DATA_SOURCES.find((s) => s.id === log.source)?.name ?? log.source;
                  return (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-3 py-2 font-medium">{sourceName}</td>
                      <td className="px-3 py-2">
                        {log.status === 'success' ? (
                          <span className="text-green-600">Success</span>
                        ) : log.status === 'error' ? (
                          <span className="text-red-600">Error</span>
                        ) : (
                          <span className="text-amber-600">Running</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {log.duration ? `${(log.duration / 1000).toFixed(1)}s` : '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground max-w-md" title={log.details}>
                        {formatDetails(log)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
