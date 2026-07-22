'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Mail, MapPin, Clock, Send, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Request {
  id: string;
  status: string;
  engagement_type: string;
  description: string;
  target_market: string | null;
  timeline: string | null;
  budget_range: string | null;
  contact_email: string;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  submitted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  proposal_sent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  accepted: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  booked: 'bg-primary/10 text-primary',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const ENG_LABELS: Record<string, string> = {
  advisory_call: 'Advisory Call',
  project_based: 'Project-Based',
  not_sure: 'Not Sure Yet',
};

export default function StudioRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [proposing, setProposing] = useState<string | null>(null);

  const fetchRequests = () =>
    fetch('/api/studio/requests').then((r) => r.json()).then((data) => setRequests(Array.isArray(data) ? data : [])).finally(() => setLoading(false));

  useEffect(() => { fetchRequests(); }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Consultation Requests</h1>
        <p className="text-sm text-muted-foreground">Review incoming requests and send proposals.</p>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No requests yet. When clients submit consultation requests, they&apos;ll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="rounded-xl border p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium capitalize', STATUS_STYLE[r.status] ?? STATUS_STYLE.submitted)}>
                    {r.status.replace('_', ' ')}
                  </span>
                  <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                    {ENG_LABELS[r.engagement_type] ?? r.engagement_type}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('en-CA')}</span>
              </div>

              <p className="text-sm leading-relaxed">{r.description}</p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.contact_email}</span>
                {r.target_market && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{r.target_market}</span>}
                {r.timeline && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{r.timeline}</span>}
                {r.budget_range && <span className="text-xs">Budget: {r.budget_range}</span>}
              </div>

              {r.status === 'submitted' && (
                <div className="pt-2 border-t">
                  {proposing === r.id ? (
                    <ProposalForm requestId={r.id} onSent={() => { setProposing(null); fetchRequests(); }} onCancel={() => setProposing(null)} />
                  ) : (
                    <Button size="sm" onClick={() => setProposing(r.id)} className="gap-1">
                      <Send className="h-3.5 w-3.5" />Send Proposal
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProposalForm({ requestId, onSent, onCancel }: { requestId: string; onSent: () => void; onCancel: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    deliverables: '',
    timeline: '',
    price_cents: 0,
    currency: 'CAD',
    message: '',
  });

  async function handleSubmit() {
    if (!form.title) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      const deliverables = form.deliverables.split('\n').filter(Boolean).map((text) => ({ text }));
      const res = await fetch('/api/studio/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, ...form, deliverables }),
      });
      if (res.ok) { toast.success('Proposal sent'); onSent(); }
      else toast.error('Failed to send proposal');
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4 pt-2">
      <div>
        <label className="text-xs font-medium">Proposal Title</label>
        <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="E.g., EU Market Entry Assessment — Seafood" className="mt-1" />
      </div>
      <div>
        <label className="text-xs font-medium">Deliverables (one per line)</label>
        <Textarea value={form.deliverables} onChange={(e) => setForm((f) => ({ ...f, deliverables: e.target.value }))} placeholder="Market sizing report&#10;Competitor analysis&#10;Distribution strategy memo" className="mt-1 min-h-[80px]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium">Price (cents)</label>
          <Input type="number" value={form.price_cents} onChange={(e) => setForm((f) => ({ ...f, price_cents: parseInt(e.target.value) || 0 }))} className="mt-1" />
          <span className="text-[10px] text-muted-foreground">{form.price_cents === 0 ? 'Free' : `$${(form.price_cents / 100).toFixed(2)} ${form.currency}`}</span>
        </div>
        <div>
          <label className="text-xs font-medium">Timeline</label>
          <Input value={form.timeline} onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))} placeholder="E.g., 2 weeks" className="mt-1" />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium">Message to client</label>
        <Textarea value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Briefly explain your approach..." className="mt-1 min-h-[60px]" />
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={saving} className="gap-1">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Send Proposal
        </Button>
      </div>
    </div>
  );
}
