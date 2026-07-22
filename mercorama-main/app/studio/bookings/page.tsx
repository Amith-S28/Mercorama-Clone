'use client';

import { useEffect, useState } from 'react';
import { Calendar, Clock, DollarSign, Mail, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  status: string;
  scheduled_at: string;
  amount_cents: number;
  currency: string;
  notes: { question: string; answer: string }[] | null;
  client_email: string;
  session: { title: string; duration_minutes: number };
}

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  pending:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  no_show:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function StudioBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/studio/bookings')
      .then((r) => r.json())
      .then((data) => setBookings(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const now = new Date().toISOString();
  const upcoming = bookings.filter((b) => b.scheduled_at >= now && b.status !== 'cancelled');
  const past = bookings.filter((b) => b.scheduled_at < now || b.status === 'cancelled');

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Bookings</h1>
        <p className="text-sm text-muted-foreground">Your incoming client sessions.</p>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No bookings yet. Once clients book sessions, they&apos;ll appear here.</p>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Upcoming ({upcoming.length})</h2>
              <div className="space-y-3">
                {upcoming.map((b) => <BookingRow key={b.id} booking={b} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Past</h2>
              <div className="space-y-3">
                {past.map((b) => <BookingRow key={b.id} booking={b} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  const date = new Date(booking.scheduled_at);
  return (
    <div className="rounded-xl border p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-sm">{booking.session.title}</div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <Mail className="h-3 w-3" />{booking.client_email}
          </div>
        </div>
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize shrink-0', STATUS_STYLE[booking.status] ?? STATUS_STYLE.pending)}>
          {booking.status}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })} · {booking.session.duration_minutes} min</span>
        <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{booking.amount_cents === 0 ? 'Free' : `$${(booking.amount_cents / 100).toFixed(0)} ${booking.currency}`}</span>
      </div>
      {booking.notes && booking.notes.length > 0 && (
        <div className="text-xs bg-muted/50 rounded-lg p-2 mt-1">
          <span className="font-medium">Client notes:</span> {booking.notes.map((n) => n.answer).join('; ')}
        </div>
      )}
    </div>
  );
}
