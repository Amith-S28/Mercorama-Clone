'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Sparkles, Database, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import Link from 'next/link';

const PROVINCE_NAMES: Record<string, string> = { NS: 'Nova Scotia', ON: 'Ontario', BC: 'British Columbia', AB: 'Alberta' };
const CATEGORY_LABELS: Record<string, string> = { specialty_food: 'Specialty Food', health_wellness: 'Health & Wellness', fmcg: 'FMCG' };

interface IntelForm {
  market_size: string;
  consumer_profile: string;
  top_retail_chains: string;
  top_distributors: string;
  recommended_entry_channel: string;
  competition_intensity: string;
  regulatory_notes: string;
  key_insights: string;
}

const EMPTY: IntelForm = {
  market_size: '', consumer_profile: '', top_retail_chains: '[]', top_distributors: '[]',
  recommended_entry_channel: '', competition_intensity: '', regulatory_notes: '', key_insights: '',
};

export default function ProvinceIntelEditorPage() {
  const params = useParams();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();
  const category = params.category as string;
  const provinceName = PROVINCE_NAMES[code] ?? code;
  const categoryLabel = CATEGORY_LABELS[category] ?? category;

  const [form, setForm] = useState<IntelForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [embedding, setEmbedding] = useState(false);
  const [isExisting, setIsExisting] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/province-intel?province_code=${code}&category=${category}`)
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error && (Array.isArray(data) ? data.length > 0 : data.province_code)) {
          const row = Array.isArray(data) ? data[0] : data;
          setForm({
            market_size: row.market_size ?? '',
            consumer_profile: typeof row.consumer_profile === 'string' ? row.consumer_profile : JSON.stringify(row.consumer_profile ?? {}, null, 2),
            top_retail_chains: typeof row.top_retail_chains === 'string' ? row.top_retail_chains : JSON.stringify(row.top_retail_chains ?? [], null, 2),
            top_distributors: typeof row.top_distributors === 'string' ? row.top_distributors : JSON.stringify(row.top_distributors ?? [], null, 2),
            recommended_entry_channel: row.recommended_entry_channel ?? '',
            competition_intensity: row.competition_intensity ?? '',
            regulatory_notes: row.regulatory_notes ?? '',
            key_insights: row.key_insights ?? '',
          });
          setIsExisting(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [code, category]);

  function set(key: keyof IntelForm, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      let parsedProfile: unknown = form.consumer_profile;
      let parsedChains: unknown = form.top_retail_chains;
      let parsedDistributors: unknown = form.top_distributors;
      try { parsedProfile = JSON.parse(form.consumer_profile); } catch {}
      try { parsedChains = JSON.parse(form.top_retail_chains); } catch {}
      try { parsedDistributors = JSON.parse(form.top_distributors); } catch {}

      const res = await fetch('/api/admin/province-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          province_code: code,
          category,
          market_size: form.market_size,
          consumer_profile: parsedProfile,
          top_retail_chains: parsedChains,
          top_distributors: parsedDistributors,
          recommended_entry_channel: form.recommended_entry_channel,
          competition_intensity: form.competition_intensity,
          regulatory_notes: form.regulatory_notes,
          key_insights: form.key_insights,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setIsExisting(true);
      toast.success('Intelligence saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/admin/province-intel/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          province_name: provinceName,
          category: categoryLabel,
          market_size: form.market_size,
          consumer_profile: form.consumer_profile,
          competition_intensity: form.competition_intensity,
          top_retail_chains: form.top_retail_chains,
          top_distributors: form.top_distributors,
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json();
      if (data.summary) {
        set('key_insights', data.summary);
        toast.success('AI summary generated — review and save');
      }
    } catch {
      toast.error('AI generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function handleEmbed() {
    if (!form.key_insights) { toast.error('Save key_insights first'); return; }
    setEmbedding(true);
    try {
      const res = await fetch('/api/admin/province-intel/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ province_code: code, category }),
      });
      if (!res.ok) throw new Error('Embedding failed');
      toast.success('Embedding generated and stored');
    } catch {
      toast.error('Embedding failed — is Ollama running?');
    } finally {
      setEmbedding(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-3xl">
      <Link href="/dashboard/admin/canada-intel" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3 w-3" /> Back to overview
      </Link>

      <h1 className="text-xl font-bold mb-1">{provinceName} — {categoryLabel}</h1>
      <p className="text-sm text-muted-foreground mb-6">{isExisting ? 'Edit existing intelligence record' : 'Create new intelligence record'}</p>

      <div className="space-y-5">
        <Field label="Market Size" value={form.market_size} onChange={(v) => set('market_size', v)} rows={2} />
        <Field label="Consumer Profile (JSON)" value={form.consumer_profile} onChange={(v) => set('consumer_profile', v)} rows={4} mono />
        <Field label="Top Retail Chains (JSON array)" value={form.top_retail_chains} onChange={(v) => set('top_retail_chains', v)} rows={6} mono />
        <Field label="Top Distributors (JSON array)" value={form.top_distributors} onChange={(v) => set('top_distributors', v)} rows={4} mono />
        <Field label="Recommended Entry Channel" value={form.recommended_entry_channel} onChange={(v) => set('recommended_entry_channel', v)} rows={3} />
        <Field label="Competition Intensity" value={form.competition_intensity} onChange={(v) => set('competition_intensity', v)} rows={2} />
        <Field label="Regulatory Notes" value={form.regulatory_notes} onChange={(v) => set('regulatory_notes', v)} rows={2} />

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium">Key Insights (RAG-indexed)</label>
            <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Generate AI Summary
            </Button>
          </div>
          <Textarea value={form.key_insights} onChange={(e) => set('key_insights', e.target.value)} rows={6} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button className="gap-2" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Intelligence
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleEmbed} disabled={embedding || !isExisting}>
            {embedding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Embed for RAG
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, rows = 2, mono }: { label: string; value: string; onChange: (v: string) => void; rows?: number; mono?: boolean }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={mono ? 'font-mono text-xs' : ''}
      />
    </div>
  );
}
