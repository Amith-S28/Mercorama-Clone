'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Clock, DollarSign, Calendar, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ExpertProfile, ExpertSessionType } from '@/lib/experts';

interface AvailabilitySlot {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

type Step = 'session' | 'datetime' | 'confirm';

export default function BookExpertPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking state
  const [step, setStep] = useState<Step>('session');
  const [selectedSession, setSelectedSession] = useState<ExpertSessionType | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [notes, setNotes] = useState('');

  // Pre-select session from URL param
  const preselectedSession = searchParams.get('session');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/experts/${slug}`);
        if (!res.ok) { setError('Expert not found'); return; }
        const data = await res.json();
        setExpert(data);

        // Pre-select session if specified
        if (preselectedSession && data.session_types) {
          const match = data.session_types.find((s: ExpertSessionType) => s.slug === preselectedSession);
          if (match) { setSelectedSession(match); setStep('datetime'); }
        }

        // Fetch availability
        const slotsRes = await fetch(`/api/experts/${slug}/availability`);
        if (slotsRes.ok) setSlots(await slotsRes.json());
      } catch {
        setError('Failed to load expert');
      } finally {
        setLoading(false);
      }
    }
    if (slug) load();
  }, [slug, preselectedSession]);

  // Group slots by date
  const slotsByDate = slots
    .filter((s) => !s.is_booked)
    .reduce<Record<string, AvailabilitySlot[]>>((acc, s) => {
      (acc[s.slot_date] ??= []).push(s);
      return acc;
    }, {});

  async function handleConfirm() {
    if (!expert || !selectedSession || !selectedSlot) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expert_id: expert.id,
          session_type_id: selectedSession.id,
          slot_id: selectedSlot.id,
          notes: notes ? [{ question: 'Additional notes', answer: notes }] : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Booking failed');
        return;
      }

      // Redirect to Stripe checkout or confirmation page
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.redirect_url) {
        window.location.href = data.redirect_url;
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !expert) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-lg font-semibold">{error}</p>
        <Link href="/experts/search"><Button variant="outline">Back to search</Button></Link>
      </div>
    );
  }

  if (!expert) return null;

  const sessions = expert.session_types ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/experts/${slug}`} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted overflow-hidden shrink-0">
              {expert.avatar_url && (
                <Image src={expert.avatar_url} alt="" width={40} height={40} className="h-full w-full object-cover" />
              )}
            </div>
            <div>
              <div className="font-semibold text-sm">{expert.headline.split('—')[0].trim()}</div>
              <div className="text-xs text-muted-foreground">Book a session</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          {(['session', 'datetime', 'confirm'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              {i > 0 && <div className="w-8 h-px bg-border" />}
              <button
                onClick={() => {
                  if (s === 'session') setStep('session');
                  if (s === 'datetime' && selectedSession) setStep('datetime');
                }}
                disabled={s === 'datetime' && !selectedSession || s === 'confirm' && !selectedSlot}
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  step === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {i + 1}. {s === 'session' ? 'Session' : s === 'datetime' ? 'Date & Time' : 'Confirm'}
              </button>
            </div>
          ))}
        </div>

        {/* Step 1: Choose session */}
        {step === 'session' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Choose a session type</h2>
            {sessions.length === 0 ? (
              <p className="text-muted-foreground">No sessions available.</p>
            ) : (
              <div className="grid gap-3">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setSelectedSession(s); setStep('datetime'); }}
                    className={cn(
                      'rounded-xl border p-4 text-left transition-all hover:shadow-md',
                      selectedSession?.id === s.id ? 'border-primary ring-2 ring-primary/20' : '',
                    )}
                  >
                    <div className="font-semibold">{s.title}</div>
                    <p className="text-sm text-muted-foreground mt-1">{s.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{s.duration_minutes} min</span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {s.price_cents === 0 ? 'Free' : `$${(s.price_cents / 100).toFixed(0)} ${s.currency}`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Pick date and time */}
        {step === 'datetime' && selectedSession && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Pick a date and time</h2>
            <p className="text-sm text-muted-foreground">
              {selectedSession.title} · {selectedSession.duration_minutes} min ·{' '}
              {selectedSession.price_cents === 0 ? 'Free' : `$${(selectedSession.price_cents / 100).toFixed(0)} ${selectedSession.currency}`}
            </p>

            {Object.keys(slotsByDate).length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="font-semibold">No availability yet</p>
                <p className="text-sm text-muted-foreground mt-1">This expert hasn&apos;t set up their availability slots. Check back soon.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(slotsByDate)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([date, dateSlots]) => (
                    <div key={date}>
                      <div className="text-sm font-semibold mb-2">
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {dateSlots
                          .sort((a, b) => a.start_time.localeCompare(b.start_time))
                          .map((slot) => (
                            <button
                              key={slot.id}
                              onClick={() => { setSelectedSlot(slot); setStep('confirm'); }}
                              className={cn(
                                'rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary',
                                selectedSlot?.id === slot.id ? 'border-primary bg-primary/5 text-primary' : '',
                              )}
                            >
                              {slot.start_time.slice(0, 5)}
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <Button variant="outline" onClick={() => setStep('session')}>Back</Button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedSession && selectedSlot && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Confirm your booking</h2>

            {/* Summary card */}
            <div className="rounded-xl border p-5 space-y-3">
              <div className="font-semibold">{selectedSession.title}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />
                  {new Date(selectedSlot.slot_date + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />
                  {selectedSlot.start_time.slice(0, 5)} — {selectedSlot.end_time.slice(0, 5)} ({selectedSession.duration_minutes} min)
                </span>
                <span className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />
                  {selectedSession.price_cents === 0 ? 'Free' : `$${(selectedSession.price_cents / 100).toFixed(0)} ${selectedSession.currency}`}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Anything you&apos;d like the expert to know? (optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="E.g., specific HS codes, trade corridors, or questions..."
                className="resize-none min-h-[80px]"
              />
            </div>

            {/* Disclaimer */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                <p className="font-semibold mb-1">Important</p>
                <p>This session is for informational and educational purposes only. It does not constitute customs brokerage, legal, or financial advice. Results and outcomes are never guaranteed. Always consult qualified professionals for binding decisions.</p>
              </div>
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('datetime')}>Back</Button>
              <Button onClick={handleConfirm} disabled={submitting} className="flex-1">
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />Processing...</>
                ) : selectedSession.price_cents === 0 ? (
                  <><Check className="h-4 w-4 mr-2" />Confirm Booking</>
                ) : (
                  <>Proceed to Payment — ${(selectedSession.price_cents / 100).toFixed(0)} {selectedSession.currency}</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
