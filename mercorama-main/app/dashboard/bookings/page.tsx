'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, DollarSign, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  status: string;
  scheduled_at: string;
  amount_cents: number;
  currency: string;
  expert: { headline: string; slug: string; avatar_url: string | null };
  session: { title: string; duration_minutes: number };
}

const STATUS_STYLE: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  pending:   'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  no_show:   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function BookingCard({ booking }: { booking: Booking }) {
  const date = new Date(booking.scheduled_at);
  const expertName = booking.expert.headline.split('—')[0].trim();

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-muted overflow-hidden">
          {booking.expert.avatar_url ? (
            <Image src={booking.expert.avatar_url} alt="" width={40} height={40} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-bold text-muted-foreground">
              {expertName.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm">{booking.session.title}</div>
          <div className="text-xs text-muted-foreground">with {expertName}</div>
        </div>
        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLE[booking.status] ?? STATUS_STYLE.pending)}>
          {booking.status}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })} · {booking.session.duration_minutes} min
        </span>
        <span className="flex items-center gap-1">
          <DollarSign className="h-3 w-3" />
          {booking.amount_cents === 0 ? 'Free' : `$${(booking.amount_cents / 100).toFixed(0)} ${booking.currency}`}
        </span>
      </div>

      <div className="flex gap-2 pt-1">
        <Link href={`/booking/confirmed/${booking.id}`}>
          <Button variant="outline" size="sm">View Details</Button>
        </Link>
        <Link href={`/experts/${booking.expert.slug}`}>
          <Button variant="ghost" size="sm">Expert Profile</Button>
        </Link>
      </div>
    </div>
  );
}

export default function MyBookingsPage() {
  const [upcoming, setUpcoming] = useState<Booking[]>([]);
  const [past, setPast] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/bookings/my')
      .then((r) => r.json())
      .then((data) => {
        setUpcoming(data.upcoming ?? []);
        setPast(data.past ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">My Bookings</h1>
        <p className="text-muted-foreground text-sm">Your upcoming and past expert sessions.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Upcoming</h2>
            {upcoming.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">No upcoming sessions.</p>
                <Link href="/experts/search">
                  <Button size="sm">
                    Find an Expert <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Past Sessions</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {past.map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
