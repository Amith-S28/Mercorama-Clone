'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ProfileData {
  headline: string;
  bio: string;
  location: string;
  timezone: string;
  years_experience: number;
  linkedin_url: string;
  website_url: string;
  avatar_url: string;
  types: { name: string }[];
  verticals: { name: string }[];
  tags: { name: string }[];
  languages: { name: string }[];
  verification_tier: number;
  license_number: string | null;
  license_body: string | null;
}

export default function StudioProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/studio/profile')
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      const res = await fetch('/api/studio/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: profile.headline,
          bio: profile.bio,
          location: profile.location,
          timezone: profile.timezone,
          years_experience: profile.years_experience,
          linkedin_url: profile.linkedin_url,
          website_url: profile.website_url,
        }),
      });
      if (res.ok) toast.success('Profile updated');
      else toast.error('Failed to update profile');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!profile) return <p className="text-muted-foreground">No profile found.</p>;

  function update(field: string, value: string | number) {
    setProfile((p) => p ? { ...p, [field]: value } : p);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Edit Profile</h1>
        <p className="text-sm text-muted-foreground">Update your public expert profile. Changes are visible after admin approval.</p>
      </div>

      {/* Verification status (read-only) */}
      <div className="rounded-lg border p-4 bg-muted/30">
        <div className="text-sm font-medium mb-1">Verification Status</div>
        <div className="text-xs text-muted-foreground">
          Tier {profile.verification_tier} — {profile.license_body ? `${profile.license_body}: ${profile.license_number}` : 'Contact admin to update verification'}
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {profile.types.map((t) => (
            <span key={t.name} className="rounded-full bg-[#01696f]/10 text-[#01696f] px-2 py-0.5 text-xs font-medium">{t.name}</span>
          ))}
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Headline</label>
          <Input value={profile.headline} onChange={(e) => update('headline', e.target.value)} />
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Bio</label>
          <Textarea value={profile.bio} onChange={(e) => update('bio', e.target.value)} className="min-h-[160px]" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Location</label>
            <Input value={profile.location} onChange={(e) => update('location', e.target.value)} placeholder="Halifax, NS" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Timezone</label>
            <Input value={profile.timezone} onChange={(e) => update('timezone', e.target.value)} placeholder="America/Halifax" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Years of Experience</label>
            <Input type="number" value={profile.years_experience} onChange={(e) => update('years_experience', parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">LinkedIn URL</label>
            <Input value={profile.linkedin_url ?? ''} onChange={(e) => update('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-1.5 block">Website URL</label>
          <Input value={profile.website_url ?? ''} onChange={(e) => update('website_url', e.target.value)} placeholder="https://..." />
        </div>

        {/* Read-only tags */}
        {profile.tags.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-1.5 block">Expertise Tags</label>
            <div className="flex flex-wrap gap-1">
              {profile.tags.map((t) => <span key={t.name} className="rounded-md bg-muted px-2 py-1 text-xs">{t.name}</span>)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Contact admin to update tags and verticals.</p>
          </div>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save Changes
      </Button>
    </div>
  );
}
