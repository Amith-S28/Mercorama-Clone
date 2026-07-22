'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Clock, Loader2, ShieldCheck, Shield, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExpertProfile, ExpertSessionType } from '@/lib/experts';

interface Slot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
}

function formatPrice(cents: number, currency: string) {
  if (cents === 0) return 'Free';
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

function formatSlot(slot: Slot) {
  const date = new Date(`${slot.slot_date}T${slot.start_time}`);
  return date.toLocaleString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
}

const TIER_CONFIG: Record<number, { label: string; color: string; Icon: typeof ShieldCheck }> = {
  1: { label: 'Licensed & Verified', color: 'text-green-700', Icon: ShieldCheck },
  2: { label: 'Credentials Verified', color: 'text-blue-700', Icon: Shield },
  3: { label: 'Identity Verified', color: 'text-muted-foreground', Icon: Shield },
};

export default function BookExpertPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<ExpertSessionType | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`/api/experts/${slug}`).then((r) => r.json()),
      fetch(`/api/experts/${slug}/availability`).then((r) => r.json()),
    ])
      .then(([expertData, slotsData]) => {
        setExpert(expertData?.id ? expertData : null);
        setSlots(Array.isArray(slotsData) ? slotsData : []);
        if (expertData?.session_types?.length) {
          setSelectedSession(expertData.session_types[0]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  async function handleBook() {
    if (!expert || !selectedSession || !selectedSlot) return;
    setBooking(true);
    setError('');
    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expert_id: expert.id,
          session_type_id: selectedSession.id,
          slot_id: selectedSlot.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create booking. Please try again.');
        return;
      }
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.redirect_url) {
        router.push(data.redirect_url);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBooking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!expert) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <p className="text-muted-foreground mb-4">Expert not found.</p>
        <Link href="/dashboard?tool=find-experts"><Button variant="outline">Browse Experts</Button></Link>
      </div>
    );
  }

  const tier = TIER_CONFIG[expert.verification_tier] ?? TIER_CONFIG[3];
  const TierIcon = tier.Icon;
  const canBook = selectedSession && selectedSlot;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 px-4">
      <Link href={`/dashboard?tool=expert-profile&slug=${slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to profile
      </Link>

      {/* Expert header */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 shrink-0 rounded-full bg-muted overflow-hidden">
          {expert.avatar_url ? (
            <Image src={expert.avatar_url} alt="" width={56} height={56} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">{expert.headline.charAt(0)}</span>
          )}
        </div>
        <div>
          <h1 className="text-lg font-bold">{expert.headline}</h1>
          <div className={cn('flex items-center gap-1 text-xs mt-0.5', tier.color)}>
            <TierIcon className="h-3.5 w-3.5" />
            {tier.label}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Step 1: Select session */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">1. Choose Session Type</h2>
          {(expert.session_types ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No session types available.</p>
          ) : (
            <div className="space-y-2">
              {(expert.session_types ?? []).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedSession(s)}
                  className={cn(
                    'w-full text-left rounded-xl border p-4 transition-all',
                    selectedSession?.id === s.id
                      ? 'border-[#01696f] bg-[#01696f]/5 ring-1 ring-[#01696f]'
                      : 'hover:border-muted-foreground/40',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-semibold text-sm">{s.title}</div>
                    <div className="font-bold text-sm text-[#01696f] shrink-0">{formatPrice(s.price_cents, s.currency)}</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {s.duration_minutes} minutes
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Select slot */}
        <div className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">2. Choose a Time Slot</h2>
          {slots.length === 0 ? (
            <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
              No available slots at this time. You can still{' '}
              <Link href={`/dashboard?tool=expert-request&slug=${slug}`} className="underline text-foreground">send a request</Link>{' '}
              and the expert will reach out to schedule.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    'w-full text-left rounded-xl border p-3 text-sm transition-all flex items-center gap-2',
                    selectedSlot?.id === slot.id
                      ? 'border-[#01696f] bg-[#01696f]/5 ring-1 ring-[#01696f]'
                      : 'hover:border-muted-foreground/40',
                  )}
                >
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {formatSlot(slot)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking summary + CTA */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold">Booking Summary</h2>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Session</span>
            <span className="font-medium">{selectedSession?.title ?? '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Duration</span>
            <span>{selectedSession ? `${selectedSession.duration_minutes} min` : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time</span>
            <span>{selectedSlot ? formatSlot(selectedSlot) : '—'}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-[#01696f] text-base">
              {selectedSession ? formatPrice(selectedSession.price_cents, selectedSession.currency) : '—'}
            </span>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          className="w-full"
          size="lg"
          disabled={!canBook || booking}
          onClick={handleBook}
        >
          {booking ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing…</> : selectedSession?.price_cents === 0 ? 'Confirm Booking' : 'Proceed to Payment'}
        </Button>

        <div className="text-center">
          <Link href={`/dashboard?tool=expert-request&slug=${slug}`} className="text-xs text-muted-foreground hover:text-foreground underline">
            Not ready to book? Send a request first
          </Link>
        </div>
      </div>
    </div>
  );
}
