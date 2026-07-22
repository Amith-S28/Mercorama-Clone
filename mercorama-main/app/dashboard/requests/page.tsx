'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Clock, MapPin, DollarSign, Check, FileText, Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Proposal {
  id: string;
  title: string;
  deliverables: { text: string }[];
  timeline: string | null;
  price_cents: number;
  currency: string;
  message: string | null;
  is_accepted: boolean;
  created_at: string;
}

interface Request {
  id: string;
  status: string;
  engagement_type: string;
  description: string;
  target_market: string | null;
  timeline: string | null;
  budget_range: string | null;
  created_at: string;
  expert: { headline: string; slug: string; avatar_url: string | null };
  proposals: Proposal[];
}

const STATUS_STYLE: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  proposal_sent: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  booked: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const STATUS_LABEL: Record<string, string> = {
  submitted: 'Awaiting Review',
  reviewed: 'Under Review',
  proposal_sent: 'Proposal Received',
  accepted: 'Accepted',
  booked: 'Booked',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const ENG_LABEL: Record<string, string> = {
  advisory_call: 'Advisory Call',
  project_based: 'Project-Based',
  not_sure: 'Not Sure Yet',
};

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState<string | null>(null);

  const fetchRequests = () =>
    fetch('/api/bookings/my-requests')
      .then((r) => r.json())
      .then((data) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => { fetchRequests(); }, []);

  async function handleAccept(proposalId: string) {
    setAccepting(proposalId);
    try {
      const res = await fetch('/api/bookings/accept-proposal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposal_id: proposalId }),
      });
      const data = await res.json();
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        toast.success('Proposal accepted');
        fetchRequests();
      }
    } catch {
      toast.error('Failed to accept proposal');
    } finally {
      setAccepting(null);
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">My Requests</h1>
        <p className="text-sm text-muted-foreground">Your consultation requests and expert proposals.</p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center space-y-3">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="font-semibold">No requests yet</p>
          <p className="text-sm text-muted-foreground">When you request a consultation with an expert, it will appear here.</p>
          <Link href="/dashboard?tool=find-experts">
            <Button size="sm">Find an Expert</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const expertName = r.expert?.headline?.split('—')[0]?.trim() ?? 'Expert';
            return (
              <div key={r.id} className="rounded-xl border p-5 space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted overflow-hidden shrink-0">
                      {r.expert?.avatar_url && (
                        <Image src={r.expert.avatar_url} alt="" width={40} height={40} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{expertName}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[r.status] ?? STATUS_STYLE.submitted)}>
                          {STATUS_LABEL[r.status] ?? r.status}
                        </span>
                        <span className="text-xs text-muted-foreground">{ENG_LABEL[r.engagement_type] ?? r.engagement_type}</span>
                        <span className="text-xs text-muted-foreground sm:hidden">{new Date(r.created_at).toLocaleDateString('en-CA')}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{new Date(r.created_at).toLocaleDateString('en-CA')}</span>
                </div>

                {/* Request description */}
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm leading-relaxed">{r.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                    {r.target_market && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.target_market}</span>}
                    {r.timeline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.timeline}</span>}
                    {r.budget_range && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{r.budget_range}</span>}
                  </div>
                </div>

                {/* Proposals */}
                {r.proposals.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-primary" />
                      {r.proposals.length === 1 ? 'Proposal' : `${r.proposals.length} Proposals`}
                    </h3>
                    {r.proposals.map((p) => (
                      <div key={p.id} className={cn('rounded-xl border p-4 space-y-3', p.is_accepted && 'border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10')}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2">
                          <div>
                            <div className="font-semibold text-sm">{p.title}</div>
                            {p.is_accepted && (
                              <span className="inline-flex items-center gap-1 text-xs text-green-700 dark:text-green-400 font-medium mt-0.5">
                                <Check className="h-3 w-3" />Accepted
                              </span>
                            )}
                          </div>
                          <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                            <div className="font-semibold text-sm">
                              {p.price_cents === 0 ? 'Free' : `$${(p.price_cents / 100).toFixed(0)} ${p.currency}`}
                            </div>
                            {p.timeline && <div className="text-xs text-muted-foreground">{p.timeline}</div>}
                          </div>
                        </div>

                        {p.message && <p className="text-sm text-muted-foreground">{p.message}</p>}

                        {(p.deliverables ?? []).length > 0 && (
                          <div>
                            <div className="text-xs font-medium text-muted-foreground mb-1">Deliverables:</div>
                            <ul className="space-y-1">
                              {(p.deliverables ?? []).map((d, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm">
                                  <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                  <span>{d.text}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {!p.is_accepted && r.status !== 'accepted' && r.status !== 'booked' && r.status !== 'completed' && (
                          <Button
                            onClick={() => handleAccept(p.id)}
                            disabled={accepting === p.id}
                            className="w-full gap-2"
                          >
                            {accepting === p.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : p.price_cents === 0 ? (
                              <><Check className="h-4 w-4" />Accept Proposal</>
                            ) : (
                              <>Accept & Pay — ${(p.price_cents / 100).toFixed(0)} {p.currency}</>
                            )}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Waiting state */}
                {r.status === 'submitted' && r.proposals.length === 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 p-3">
                    <Send className="h-4 w-4 text-amber-600 shrink-0" />
                    <span>Your request has been sent. The expert will review and respond — typically within 1–2 business days.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
