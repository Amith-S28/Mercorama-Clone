'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { checkIsAdmin } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Loader2, Check, X, ShieldCheck, Shield, UserCheck, Star, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Expert {
  id: string;
  slug: string;
  expert_code: string | null;
  headline: string;
  location: string;
  verification_tier: number;
  is_approved: boolean;
  is_active: boolean;
  featured: boolean;
  created_at: string;
  expert_profile_types: { expert_types: { name: string; slug: string } }[];
}

interface ExpertType { id: string; name: string; slug: string }
interface ExpertVertical { id: string; name: string; slug: string }
interface ExpertLanguage { id: string; name: string }
interface ExpertTag { id: string; name: string }

const TIER_ICON: Record<number, typeof ShieldCheck> = { 1: ShieldCheck, 2: Shield, 3: UserCheck };
const TIER_LABEL: Record<number, string> = { 1: 'Licensed', 2: 'Credentialed', 3: 'Basic' };

export default function AdminExpertsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Lookup data for create form
  const [types, setTypes] = useState<ExpertType[]>([]);
  const [verticals, setVerticals] = useState<ExpertVertical[]>([]);
  const [languages, setLanguages] = useState<ExpertLanguage[]>([]);
  const [tags, setTags] = useState<ExpertTag[]>([]);

  useEffect(() => {
    checkIsAdmin().then((ok) => {
      if (!ok) { router.replace('/dashboard'); return; }
      setReady(true);
      fetchExperts();
      fetchLookups();
    });
  }, [router]);

  function fetchExperts() {
    fetch('/api/admin/experts').then((r) => r.json()).then(setExperts).finally(() => setLoading(false));
  }

  function fetchLookups() {
    fetch('/api/experts/search?type=&vertical=&language=').then((r) => r.json()).then((data) => {
      setTypes(data.filters?.types ?? []);
      setVerticals(data.filters?.verticals ?? []);
      setLanguages(data.filters?.languages ?? []);
    });
    // Tags from a separate fetch
    fetch('/api/experts/search').then((r) => r.json()).then(() => {
      // Tags aren't in the search response filters — fetch from first expert or add endpoint later
    });
  }

  async function toggleApproval(expert: Expert) {
    const res = await fetch('/api/admin/experts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: expert.id, is_approved: !expert.is_approved }),
    });
    if (res.ok) { toast.success(expert.is_approved ? 'Unapproved' : 'Approved'); fetchExperts(); }
  }

  async function toggleFeatured(expert: Expert) {
    const res = await fetch('/api/admin/experts', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: expert.id, featured: !expert.featured }),
    });
    if (res.ok) { toast.success(expert.featured ? 'Unfeatured' : 'Featured'); fetchExperts(); }
  }

  async function deactivate(expert: Expert) {
    if (!window.confirm(`Deactivate ${expert.headline}?`)) return;
    const res = await fetch('/api/admin/experts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: expert.id }),
    });
    if (res.ok) { toast.success('Deactivated'); fetchExperts(); }
  }

  if (!ready) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expert Management</h1>
          <p className="text-sm text-muted-foreground">{experts.length} experts total</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/experts/applications">
            <Button variant="outline" size="sm">View Applications</Button>
          </Link>
          <Button onClick={() => setShowCreate(true)} size="sm"><Plus className="h-4 w-4 mr-1" />Onboard Expert</Button>
        </div>
      </div>

      {showCreate && (
        <CreateExpertForm
          types={types}
          verticals={verticals}
          languages={languages}
          onCreated={() => { setShowCreate(false); fetchExperts(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-3">
          {experts.map((e) => {
            const TierIcon = TIER_ICON[e.verification_tier] ?? UserCheck;
            const typeNames = (e.expert_profile_types ?? []).map((t) => t.expert_types?.name).filter(Boolean);
            return (
              <div key={e.id} className="rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{e.headline}</span>
                    {e.expert_code && <span className="text-xs text-muted-foreground font-mono">{e.expert_code}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TierIcon className="h-3 w-3" />{TIER_LABEL[e.verification_tier]}
                    </span>
                    {typeNames.map((n) => (
                      <span key={n} className="rounded-full bg-muted px-2 py-0.5 text-xs">{n}</span>
                    ))}
                    <span className="text-xs text-muted-foreground">{e.location}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant={e.is_approved ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleApproval(e)}
                    className="gap-1"
                  >
                    {e.is_approved ? <><Check className="h-3 w-3" />Approved</> : <><X className="h-3 w-3" />Pending</>}
                  </Button>
                  <Button
                    variant={e.featured ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => toggleFeatured(e)}
                  >
                    <Star className={cn('h-3.5 w-3.5', e.featured && 'fill-current')} />
                  </Button>
                  <Link href={`/dashboard/experts/${e.slug}/sessions`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Briefcase className="h-3 w-3" />Sessions
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => deactivate(e)}>
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateExpertForm({
  types, verticals, languages, onCreated, onCancel,
}: {
  types: ExpertType[]; verticals: ExpertVertical[]; languages: ExpertLanguage[];
  onCreated: () => void; onCancel: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    headline: '', bio: '', location: '', email: '',
    timezone: 'America/Toronto', years_experience: 0,
    linkedin_url: '', verification_tier: 3,
    license_number: '', license_body: '',
    type_ids: [] as string[], vertical_ids: [] as string[], language_ids: [] as string[],
    is_approved: true,
  });

  function toggleArray(field: 'type_ids' | 'vertical_ids' | 'language_ids', id: string) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(id) ? f[field].filter((x) => x !== id) : [...f[field], id],
    }));
  }

  async function handleSubmit() {
    if (!form.headline) { toast.error('Headline required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/experts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { toast.success('Expert created'); onCreated(); }
      else { const d = await res.json(); toast.error(d.error ?? 'Failed'); }
    } catch { toast.error('Failed'); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-xl border p-6 space-y-5 bg-card">
      <h2 className="text-lg font-semibold">Onboard New Expert</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-medium">Headline</label>
          <Input value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} placeholder="Name — Title" className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium">Email (for Cal.com provisioning)</label>
          <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="expert@email.com" className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium">Location</label>
          <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Halifax, NS" className="mt-1" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-medium">Bio</label>
          <Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className="mt-1 min-h-[100px]" />
        </div>
        <div>
          <label className="text-xs font-medium">Verification Tier</label>
          <select value={form.verification_tier} onChange={(e) => setForm((f) => ({ ...f, verification_tier: parseInt(e.target.value) }))} className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm">
            <option value={1}>Tier 1 — Licensed (CITP, CSCB, CIFFA)</option>
            <option value={2}>Tier 2 — Credentials Verified</option>
            <option value={3}>Tier 3 — Identity Only</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium">Years Experience</label>
          <Input type="number" value={form.years_experience} onChange={(e) => setForm((f) => ({ ...f, years_experience: parseInt(e.target.value) || 0 }))} className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium">License Body (FITT, CSCB, CIFFA)</label>
          <Input value={form.license_body} onChange={(e) => setForm((f) => ({ ...f, license_body: e.target.value }))} className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium">License Number</label>
          <Input value={form.license_number} onChange={(e) => setForm((f) => ({ ...f, license_number: e.target.value }))} className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium">LinkedIn URL</label>
          <Input value={form.linkedin_url} onChange={(e) => setForm((f) => ({ ...f, linkedin_url: e.target.value }))} className="mt-1" />
        </div>
      </div>

      {/* Multi-select: Types */}
      <div>
        <label className="text-xs font-medium block mb-1.5">Expert Types</label>
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <button key={t.id} onClick={() => toggleArray('type_ids', t.id)}
              className={cn('rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                form.type_ids.includes(t.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted')}>
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-select: Verticals */}
      <div>
        <label className="text-xs font-medium block mb-1.5">Industries</label>
        <div className="flex flex-wrap gap-2">
          {verticals.map((v) => (
            <button key={v.id} onClick={() => toggleArray('vertical_ids', v.id)}
              className={cn('rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                form.vertical_ids.includes(v.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted')}>
              {v.name}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-select: Languages */}
      <div>
        <label className="text-xs font-medium block mb-1.5">Languages</label>
        <div className="flex flex-wrap gap-2">
          {languages.map((l) => (
            <button key={l.id} onClick={() => toggleArray('language_ids', l.id)}
              className={cn('rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                form.language_ids.includes(l.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted')}>
              {l.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2 border-t">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Create Expert
        </Button>
      </div>
    </div>
  );
}
