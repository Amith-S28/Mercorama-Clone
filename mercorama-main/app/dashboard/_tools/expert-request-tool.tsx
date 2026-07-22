'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ExpertProfile } from '@/lib/experts';

export function ExpertRequestTool() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') ?? '';
  const preType = searchParams.get('type') === 'project' ? 'project_based' : '';

  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    description: '',
    target_market: '',
    engagement_type: preType || 'not_sure',
    timeline: '',
    budget_range: '',
    contact_email: '',
  });

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/experts/${slug}`).then((r) => r.json()).then(setExpert).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.contact_email) { setError('Please describe your requirement and provide your email.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/experts/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, expert_slug: slug }),
      });
      if (res.ok) setSubmitted(true);
      else { const d = await res.json(); setError(d.error ?? 'Failed to submit.'); }
    } catch { setError('Something went wrong.'); }
    finally { setSubmitting(false); }
  }

  function update(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  if (submitted) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-12">
        <div className="flex justify-center"><div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"><CheckCircle2 className="h-8 w-8 text-green-600" /></div></div>
        <h2 className="text-2xl font-bold">Request Submitted</h2>
        <p className="text-muted-foreground">Your request has been sent. The expert will respond with a proposal — typically within 1–2 business days.</p>
        <Link href="/dashboard?tool=find-experts"><Button variant="outline" className="w-full">Browse More Experts</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link href={`/dashboard?tool=expert-profile&slug=${slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to profile
      </Link>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h1 className="text-2xl font-bold mb-2">Request a Consultation</h1>
          <p className="text-sm text-muted-foreground mb-6">Describe what you need. The expert will respond with a tailored proposal.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-1.5 block">What do you need help with? *</label>
              <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe your trade challenge..." className="min-h-[120px]" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Target market</label>
              <Input value={form.target_market} onChange={(e) => update('target_market', e.target.value)} placeholder="E.g., EU, Germany, Japan..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Type of engagement</label>
              <select value={form.engagement_type} onChange={(e) => update('engagement_type', e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm">
                <option value="not_sure">Not sure yet</option>
                <option value="advisory_call">Advisory Call</option>
                <option value="project_based">Project-Based</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="text-sm font-medium mb-1.5 block">Timeline</label><Input value={form.timeline} onChange={(e) => update('timeline', e.target.value)} placeholder="E.g., 2 weeks" /></div>
              <div><label className="text-sm font-medium mb-1.5 block">Budget range</label><Input value={form.budget_range} onChange={(e) => update('budget_range', e.target.value)} placeholder="E.g., $500–$2,000" /></div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Your email *</label>
              <Input type="email" value={form.contact_email} onChange={(e) => update('contact_email', e.target.value)} placeholder="you@company.com" required />
            </div>
            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              <input id="ack-advisory-d" type="checkbox" required className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-primary" />
              <label htmlFor="ack-advisory-d" className="cursor-pointer text-xs leading-relaxed text-muted-foreground">
                I acknowledge that any advice provided through Mercorama is for informational purposes only, used at my own discretion and risk.{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Terms</a>
              </label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" size="lg" className="w-full gap-2" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Submit Request
            </Button>
          </form>
        </div>

        <div className="lg:col-span-2">
          {expert && (
            <div className="rounded-xl border bg-card p-5 space-y-4 lg:sticky lg:top-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted overflow-hidden shrink-0">
                  {expert.avatar_url && <Image src={expert.avatar_url} alt="" width={48} height={48} className="h-full w-full object-cover" />}
                </div>
                <div>
                  <div className="font-semibold text-sm">{expert.headline.split('—')[0].trim()}</div>
                  <div className="text-xs text-muted-foreground">{expert.location}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p className="font-medium text-foreground">What happens next?</p>
                <p>1. Expert reviews your request</p>
                <p>2. Sends a tailored proposal with scope and pricing</p>
                <p>3. You decide whether to proceed</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
