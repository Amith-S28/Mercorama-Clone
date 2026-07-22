'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface Collection {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  is_published: boolean;
  created_at: string;
}

export default function StudioCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchAll = () =>
    fetch('/api/studio/collections').then((r) => r.json()).then(setCollections).finally(() => setLoading(false));

  useEffect(() => { fetchAll(); }, []);

  async function handleCreate() {
    try {
      const res = await fetch('/api/studio/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Guide' }),
      });
      if (res.ok) { toast.success('Guide created'); fetchAll(); }
    } catch { toast.error('Failed'); }
  }

  async function handleSave(c: Collection) {
    setSaving(c.id);
    try {
      const res = await fetch('/api/studio/collections', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      });
      if (res.ok) toast.success('Saved');
      else toast.error('Save failed');
    } catch { toast.error('Save failed'); }
    finally { setSaving(null); }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this guide?')) return;
    try {
      await fetch('/api/studio/collections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      toast.success('Deleted');
      fetchAll();
    } catch { toast.error('Delete failed'); }
  }

  function updateCollection(id: string, field: string, value: string | boolean) {
    setCollections((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">Resource Guides</h1>
          <p className="text-sm text-muted-foreground">Free guides visible on your expert profile.</p>
        </div>
        <Button onClick={handleCreate} size="sm"><Plus className="h-4 w-4 mr-1" />New Guide</Button>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground mb-3">No guides yet.</p>
          <Button onClick={handleCreate} size="sm"><Plus className="h-4 w-4 mr-1" />Create Your First Guide</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {collections.map((c) => (
            <div key={c.id} className="rounded-xl border p-5 space-y-4">
              {editing === c.id ? (
                <>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Title</label>
                    <Input value={c.title} onChange={(e) => updateCollection(c.id, 'title', e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Summary</label>
                    <Textarea value={c.summary} onChange={(e) => updateCollection(c.id, 'summary', e.target.value)} className="mt-1 min-h-[60px]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Content (Markdown)</label>
                    <Textarea value={c.content} onChange={(e) => updateCollection(c.id, 'content', e.target.value)} className="mt-1 min-h-[200px] font-mono text-xs" />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={c.is_published} onChange={(e) => updateCollection(c.id, 'is_published', e.target.checked)} className="rounded" />
                      {c.is_published ? <><Eye className="h-3.5 w-3.5" />Published</> : <><EyeOff className="h-3.5 w-3.5" />Draft</>}
                    </label>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                      <Button size="sm" onClick={() => { handleSave(c); setEditing(null); }} disabled={saving === c.id}>
                        {saving === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" />Save</>}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-sm">{c.title}</div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.summary || 'No summary'}</p>
                    <span className="text-[10px] text-muted-foreground mt-1 inline-block">
                      {c.is_published ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setEditing(c.id)}>Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
