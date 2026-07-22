'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { checkIsAdmin } from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, ChevronDown, ChevronUp, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Application {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  linkedin_url: string;
  website_url: string | null;
  location_country: string;
  location_province: string | null;
  location_city: string;
  expert_type: string;
  credentials: string[];
  additional_certifications: string | null;
  notable_achievements: string | null;
  video_intro_url: string;
  specializations: string[];
  years_experience: string;
  regions_served: string[];
  languages: string[];
  bio: string;
  engagement_types: string[];
  session_ideas: string | null;
  collaboration_types: string[];
  availability: string;
  referral_source: string | null;
  additional_notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  reviewing: 'bg-blue-100 text-blue-800 border-blue-200',
  approved:  'bg-green-100 text-green-800 border-green-200',
  rejected:  'bg-red-100 text-red-800 border-red-200',
};

export default function ExpertApplicationsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    checkIsAdmin().then((ok) => {
      if (!ok) { router.replace('/dashboard'); return; }
      setReady(true);
      fetchApps();
    });
  }, [router]);

  function fetchApps() {
    setLoading(true);
    fetch('/api/admin/experts/applications')
      .then((r) => r.json())
      .then((data) => {
        setApps(data);
        const n: Record<string, string> = {};
        data.forEach((a: Application) => { n[a.id] = a.admin_notes ?? ''; });
        setNotes(n);
      })
      .finally(() => setLoading(false));
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const res = await fetch('/api/admin/experts/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, admin_notes: notes[id] ?? '' }),
    });
    if (res.ok) {
      setApps((prev) => prev.map((a) => a.id === id ? { ...a, status, admin_notes: notes[id] ?? a.admin_notes } : a));
      toast.success(`Status updated to ${status}`);
    } else {
      toast.error('Failed to update status');
    }
    setUpdating(null);
  }

  const counts = apps.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtered = filter === 'all' ? apps : apps.filter((a) => a.status === filter);

  if (!ready) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin/experts">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" /> Expert Profiles
            </Button>
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="text-xl font-bold">Expert Applications</h1>
            <p className="text-sm text-muted-foreground">{apps.length} total · {counts.pending ?? 0} pending review</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['all', 'pending', 'reviewing', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors',
                filter === s
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {s !== 'all' && counts[s] ? ` (${counts[s]})` : s === 'all' ? ` (${apps.length})` : ''}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground text-sm">No applications found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((app) => (
              <div key={app.id} className="bg-background border border-border rounded-xl overflow-hidden">

                {/* Row summary */}
                <button
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                  onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{app.full_name}</div>
                      <div className="text-xs text-muted-foreground truncate">{app.email} · {app.expert_type} · {app.location_city}, {app.location_country}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full border', STATUS_COLORS[app.status] ?? STATUS_COLORS.pending)}>
                      {app.status}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(app.created_at).toLocaleDateString()}</span>
                    {expanded === app.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === app.id && (
                  <div className="border-t border-border px-5 py-5 space-y-5">

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Phone">{app.phone ?? '—'}</Field>
                      <Field label="Years Experience">{app.years_experience}</Field>
                      <Field label="LinkedIn">
                        <a href={app.linkedin_url} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">
                          View Profile <ExternalLink className="h-3 w-3" />
                        </a>
                      </Field>
                      {app.website_url && (
                        <Field label="Website">
                          <a href={app.website_url} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">
                            Visit <ExternalLink className="h-3 w-3" />
                          </a>
                        </Field>
                      )}
                      <Field label="Availability">{app.availability}</Field>
                      <Field label="Referral Source">{app.referral_source ?? '—'}</Field>
                    </div>

                    <Field label="Video Introduction">
                      <a href={app.video_intro_url} target="_blank" rel="noopener" className="text-primary hover:underline inline-flex items-center gap-1">
                        Watch Video <ExternalLink className="h-3 w-3" />
                      </a>
                    </Field>

                    <Field label="Bio">
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{app.bio}</p>
                    </Field>

                    {app.notable_achievements && (
                      <Field label="Notable Achievements">
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{app.notable_achievements}</p>
                      </Field>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Credentials">{app.credentials?.join(', ') || '—'}</Field>
                      {app.additional_certifications && <Field label="Additional Certifications">{app.additional_certifications}</Field>}
                      <Field label="Specializations">{app.specializations?.join(', ') || '—'}</Field>
                      <Field label="Regions Served">{app.regions_served?.join(', ') || '—'}</Field>
                      <Field label="Languages">{app.languages?.join(', ') || '—'}</Field>
                      <Field label="Engagement Types">{app.engagement_types?.join(', ') || '—'}</Field>
                      <Field label="Collaboration Types">{app.collaboration_types?.join(', ') || '—'}</Field>
                    </div>

                    {app.session_ideas && <Field label="Session Ideas"><p className="text-sm text-muted-foreground whitespace-pre-line">{app.session_ideas}</p></Field>}
                    {app.additional_notes && <Field label="Additional Notes"><p className="text-sm text-muted-foreground whitespace-pre-line">{app.additional_notes}</p></Field>}

                    {/* Admin notes + status controls */}
                    <div className="border-t border-border pt-4 space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Admin Notes</label>
                        <textarea
                          value={notes[app.id] ?? ''}
                          onChange={(e) => setNotes((n) => ({ ...n, [app.id]: e.target.value }))}
                          placeholder="Internal notes — not visible to applicant"
                          rows={2}
                          className="w-full rounded-lg border bg-muted/30 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(['pending', 'reviewing', 'approved', 'rejected'] as const).map((s) => (
                          <Button
                            key={s}
                            size="sm"
                            variant={app.status === s ? 'default' : 'outline'}
                            disabled={updating === app.id}
                            onClick={() => updateStatus(app.id, s)}
                            className="text-xs h-8"
                          >
                            {updating === app.id && app.status !== s ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}
