'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Calendar, Clock, DollarSign, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingDetails {
  id: string;
  status: string;
  scheduled_at: string;
  amount_cents: number;
  currency: string;
  expert: { headline: string; slug: string; avatar_url: string | null };
  session: { title: string; duration_minutes: number };
}

export default function BookingConfirmedPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/bookings/${id}`);
        if (res.ok) setBooking(await res.json());
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-semibold">Booking not found</p>
        <Link href="/dashboard"><Button>Go to Dashboard</Button></Link>
      </div>
    );
  }

  const date = new Date(booking.scheduled_at);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-1">Booking Confirmed</h1>
          <p className="text-muted-foreground text-sm">
            Your session with {booking.expert.headline.split('—')[0].trim()} has been confirmed.
          </p>
        </div>

        <div className="rounded-xl border p-5 text-left space-y-3">
          <div className="font-semibold">{booking.session.title}</div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {date.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })} · {booking.session.duration_minutes} min
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" />
              {booking.amount_cents === 0 ? 'Free' : `$${(booking.amount_cents / 100).toFixed(0)} ${booking.currency}`}
            </span>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 p-4 text-left">
          <p className="text-sm font-semibold mb-2">What happens next?</p>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>You&apos;ll receive a confirmation email with session details.</li>
            <li>A reminder will be sent before your session.</li>
            <li>Prepare any questions or documents you&apos;d like to discuss.</li>
          </ul>
        </div>

        <p className="text-[10px] text-muted-foreground/60 leading-tight">
          This session is for informational purposes only. It does not constitute customs brokerage, legal, or financial advice. Results are never guaranteed.
        </p>

        <div className="flex flex-col gap-2">
          <Link href="/dashboard">
            <Button className="w-full">
              Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link href={`/experts/${booking.expert.slug}`}>
            <Button variant="outline" className="w-full">View Expert Profile</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
