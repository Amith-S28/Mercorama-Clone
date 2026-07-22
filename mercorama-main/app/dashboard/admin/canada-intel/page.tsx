'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Map, CheckCircle2, Clock, Circle, RefreshCw, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const PROVINCES = ['NS', 'ON', 'BC', 'AB'];
const PROVINCE_NAMES: Record<string, string> = { NS: 'Nova Scotia', ON: 'Ontario', BC: 'British Columbia', AB: 'Alberta' };
const CATEGORIES = ['specialty_food', 'health_wellness', 'fmcg'];
const CATEGORY_LABELS: Record<string, string> = { specialty_food: 'Specialty Food', health_wellness: 'Health & Wellness', fmcg: 'FMCG' };

interface IntelRow { province_code: string; category: string; key_insights: string | null; last_updated: string }

function getStatus(rows: IntelRow[], code: string, cat: string): 'complete' | 'in_progress' | 'not_started' {
  const row = rows.find((r) => r.province_code === code && r.category === cat);
  if (!row) return 'not_started';
  return row.key_insights ? 'complete' : 'in_progress';
}

const STATUS_CONFIG = {
  complete: { label: 'Complete', icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  in_progress: { label: 'In Progress', icon: Clock, className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  not_started: { label: 'Not Started', icon: Circle, className: 'bg-muted text-muted-foreground' },
};

export default function CanadaIntelAdminPage() {
  const [rows, setRows] = useState<IntelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  function load() {
    setLoading(true);
    fetch('/api/admin/province-intel')
      .then((r) => r.json())
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Map className="h-5 w-5 text-[#01696f]" />
          <h1 className="text-xl font-bold">Canada Market Intelligence</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={async () => {
            setRefreshing(true);
            try {
              const res = await fetch('/api/cron/canada-intel-refresh');
              const data = await res.json();
              if (data.success) {
                toast.success(`Intelligence refreshed for ${data.updated?.length ?? 0} provinces`);
                load();
              } else {
                toast.error('Refresh failed');
              }
            } catch { toast.error('Refresh failed'); }
            finally { setRefreshing(false); }
          }} disabled={refreshing}>
            {refreshing ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 mr-1.5" />}
            Refresh Intelligence
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn('h-3.5 w-3.5 mr-1.5', loading && 'animate-spin')} /> Reload
          </Button>
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Province</th>
              {CATEGORIES.map((cat) => (
                <th key={cat} className="text-center px-4 py-3 font-semibold text-muted-foreground">{CATEGORY_LABELS[cat]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PROVINCES.map((code) => (
              <tr key={code} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{PROVINCE_NAMES[code]} ({code})</td>
                {CATEGORIES.map((cat) => {
                  const status = getStatus(rows, code, cat);
                  const cfg = STATUS_CONFIG[status];
                  const Icon = cfg.icon;
                  return (
                    <td key={cat} className="px-4 py-3 text-center">
                      <Link href={`/dashboard/admin/canada-intel/provinces/${code}/${cat}`}>
                        <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity', cfg.className)}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/dashboard/admin/canada-intel/provinces/NS/specialty_food">
          <Button variant="outline" size="sm">Quick: Edit NS Specialty Food</Button>
        </Link>
      </div>
    </div>
  );
}
