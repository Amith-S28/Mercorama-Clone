'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { checkIsAdmin } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, Save, Clock, DollarSign, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

interface SessionType {
  id: string;
  title: string;
  slug: string;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  description: string;
  is_active: boolean;
  sort_order: number;
}

interface ExpertInfo {
  id: string;
  headline: string;
  slug: string;
}

export default function AdminExpertSessionsPage() {
  const router = useRouter();
  const params = useParams();
  const expertSlug = typeof params.slug === 'string' ? params.slug : '';

  const [ready, setReady] = useState(false);
  const [expert, setExpert] = useState<ExpertInfo | null>(null);
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    checkIsAdmin().then((ok) => {
      if (!ok) { router.replace('/dashboard'); return; }
      setReady(true);
      loadData();
    });
  }, [router, expertSlug]);

  async function loadData() {
    try {
      const expertRes = await fetch(`/api/experts/${expertSlug}`);
      if (!expertRes.ok) { setLoading(false); return; }
      const expertData = await expertRes.json();
      setExpert({ id: expertData.id, headline: expertData.headline, slug: expertData.slug });

      const sessRes = await fetch(`/api/admin/experts/sessions?expert_id=${expertData.id}`);
      if (sessRes.ok) setSessions(await sessRes.json());
    } catch {} finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!expert) return;
    try {
      const res = await fetch('/api/admin/experts/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expert_id: expert.id, title: 'New Session' }),
      });
      if (res.ok) { toast.success('Session created'); loadData(); }
    } catch { toast.error('Failed'); }
  }

  async function handleSave(session: SessionType) {
    setSaving(session.id);
    try {
      const res = await fetch('/api/admin/experts/sessions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      if (res.ok) toast.success('Saved');
      else toast.error('Save failed');
    } catch { toast.error('Failed'); }
    finally { setSaving(null); }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this session?')) return;
    try {
      await fetch('/api/admin/experts/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      toast.success('Deleted');
      loadData();
    } catch { toast.error('Failed'); }
  }

  function updateSession(id: string, field: string, value: string | number | boolean) {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }

  if (!ready) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link href="/dashboard/experts/manage" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to Expert Profiles
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Sessions</h1>
          {expert && <p className="text-sm text-muted-foreground">{expert.headline.split('—')[0].trim()}</p>}
        </div>
        <Button onClick={handleCreate} size="sm"><Plus className="h-4 w-4 mr-1" />Add Session</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-3">No sessions yet.</p>
          <Button onClick={handleCreate} size="sm"><Plus className="h-4 w-4 mr-1" />Create Session</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s.id} className="rounded-xl border p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <Input value={s.title} onChange={(e) => updateSession(s.id, 'title', e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <Textarea value={s.description} onChange={(e) => updateSession(s.id, 'description', e.target.value)} className="mt-1 min-h-[60px]" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />Duration (min)</label>
                  <Input type="number" value={s.duration_minutes} onChange={(e) => updateSession(s.id, 'duration_minutes', parseInt(e.target.value) || 0)} className="mt-1" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" />Price (cents)</label>
                  <Input type="number" value={s.price_cents} onChange={(e) => updateSession(s.id, 'price_cents', parseInt(e.target.value) || 0)} className="mt-1" />
                  <span className="text-[10px] text-muted-foreground">{s.price_cents === 0 ? 'Free' : `$${(s.price_cents / 100).toFixed(2)} ${s.currency}`}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={s.is_active} onChange={(e) => updateSession(s.id, 'is_active', e.target.checked)} className="rounded" />
                  Active
                </label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  <Button size="sm" onClick={() => handleSave(s)} disabled={saving === s.id}>
                    {saving === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" />Save</>}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
