'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { checkIsAdmin } from '@/lib/admin';
import { Calendar, Clock, DollarSign, Mail, Loader2, Users, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  status: string;
  scheduled_at: string;
  amount_cents: number;
  currency: string;
  created_at: string;
  client_email: string;
  stripe_payment_intent_id: string | null;
  expert: { headline: string; slug: string; expert_code: string | null };
  session: { title: string; duration_minutes: number };
}

interface Stats {
  total: number;
  confirmed: number;
  pending: number;
  revenue: number;
}

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  pending:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  no_show:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function AdminBookingsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, confirmed: 0, pending: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkIsAdmin().then((ok) => {
      if (!ok) { router.replace('/dashboard'); return; }
      setReady(true);
      fetch('/api/admin/experts/bookings')
        .then((r) => r.json())
        .then((data) => {
          setBookings(data.bookings ?? []);
          setStats(data.stats ?? { total: 0, confirmed: 0, pending: 0, revenue: 0 });
        })
        .finally(() => setLoading(false));
    });
  }, [router]);

  if (!ready) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Expert Bookings</h1>
        <p className="text-sm text-muted-foreground">Platform-wide booking overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total Bookings</div>
        </div>
        <div className="rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          <div className="text-xs text-muted-foreground">Confirmed</div>
        </div>
        <div className="rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div className="rounded-xl border p-4 text-center">
          <div className="text-2xl font-bold">${(stats.revenue / 100).toFixed(0)}</div>
          <div className="text-xs text-muted-foreground">Revenue (CAD)</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const date = new Date(b.scheduled_at);
            const expertName = b.expert?.headline?.split('—')[0]?.trim() ?? 'Unknown';
            return (
              <div key={b.id} className="rounded-xl border p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{b.session?.title ?? 'Session'}</div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{expertName}</span>
                      {b.expert?.expert_code && <span className="font-mono">{b.expert.expert_code}</span>}
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{b.client_email}</span>
                    </div>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize shrink-0', STATUS_STYLE[b.status] ?? STATUS_STYLE.pending)}>
                    {b.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })} · {b.session?.duration_minutes ?? 0} min</span>
                  <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{b.amount_cents === 0 ? 'Free' : `$${(b.amount_cents / 100).toFixed(0)} ${b.currency}`}</span>
                  {b.stripe_payment_intent_id && (
                    <span className="flex items-center gap-1"><CreditCard className="h-3 w-3" />Stripe: {b.stripe_payment_intent_id.slice(0, 12)}...</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
