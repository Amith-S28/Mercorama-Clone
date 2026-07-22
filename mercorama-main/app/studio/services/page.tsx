'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, Clock, DollarSign, Save } from 'lucide-react';
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

export default function StudioServicesPage() {
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchSessions = () =>
    fetch('/api/studio/services').then((r) => r.json()).then(setSessions).finally(() => setLoading(false));

  useEffect(() => { fetchSessions(); }, []);

  async function handleCreate() {
    try {
      const res = await fetch('/api/studio/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Session', duration_minutes: 30, price_cents: 0, description: '' }),
      });
      if (res.ok) { toast.success('Session created'); fetchSessions(); }
    } catch { toast.error('Failed to create session'); }
  }

  async function handleSave(session: SessionType) {
    setSaving(session.id);
    try {
      const res = await fetch('/api/studio/services', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      if (res.ok) toast.success('Saved');
      else toast.error('Save failed');
    } catch { toast.error('Save failed'); }
    finally { setSaving(null); }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this session type?')) return;
    try {
      await fetch('/api/studio/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      toast.success('Deleted');
      fetchSessions();
    } catch { toast.error('Delete failed'); }
  }

  function updateSession(id: string, field: string, value: string | number | boolean) {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Session Types</h1>
          <p className="text-sm text-muted-foreground">Create and manage your bookable session offerings.</p>
        </div>
        <Button onClick={handleCreate} size="sm"><Plus className="h-4 w-4 mr-1" />Add Session</Button>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-3">No sessions yet.</p>
          <Button onClick={handleCreate} size="sm"><Plus className="h-4 w-4 mr-1" />Create Your First Session</Button>
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
              <div className="grid grid-cols-2 gap-4">
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
