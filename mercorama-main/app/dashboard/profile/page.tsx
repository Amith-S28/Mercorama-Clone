// app/dashboard/profile/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Building2, Briefcase, Phone, Globe, ShieldCheck, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { setAuthUser, type AuthUser } from '@/lib/auth-store';
import { getProfile, saveProfile, type UserProfile } from '@/lib/profile-store';
import { createClient } from '@/lib/supabase/client';
import { ADMIN_EMAILS } from '@/lib/admin';
import { toast } from 'sonner';

const MAX_AVATAR_BYTES = 512 * 1024; // 512 KB

const PLAN_LABEL: Record<string, string> = {
  pro:        'Starter',
  team:       'Growth',
  enterprise: 'Advisory',
};

const PLAN_BADGE: Record<string, string> = {
  pro:        'bg-primary/10 text-primary',
  team:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  enterprise: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<UserProfile>({});
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Image must be smaller than 512 KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfile((p) => ({ ...p, avatarUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setProfile((p) => ({ ...p, avatarUrl: undefined }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: sbUser } }) => {
      if (!sbUser) {
        router.replace('/auth/signin?callbackUrl=/dashboard/profile');
        return;
      }
      const email = sbUser.email ?? '';

      let plan: AuthUser['plan'] = ADMIN_EMAILS.includes(email.toLowerCase()) ? 'enterprise' : 'pro';
      if (plan !== 'enterprise') {
        try {
          const res = await fetch('/api/me');
          if (res.ok) {
            const me = await res.json();
            plan = me.plan ?? plan;
          }
        } catch { /* keep default */ }
      }

      const savedProfile = getProfile();
      const authUser: AuthUser = {
        id: sbUser.id,
        email,
        name: sbUser.user_metadata?.full_name ?? sbUser.user_metadata?.name ?? savedProfile.name ?? email,
        plan,
        isVerified: true,
      };
      setUser(authUser);
      setName(authUser.name);
      setProfile(savedProfile);
    });
  }, [router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const savedName = name.trim() || user.name;
    const updatedUser: AuthUser = { ...user, name: savedName };
    setUser(updatedUser);
    saveProfile({ ...profile, name: savedName });

    // Persist name to Supabase user_metadata so it survives page reloads
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { full_name: savedName } });
    } catch { /* non-critical */ }

    setSaving(false);
    toast.success('Profile saved');
  };

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const planKey = user.plan ?? 'free';
  const initials = name
    ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : user.email.slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your personal details and account information.
        </p>
      </div>

      {/* Avatar + plan */}
      <Card className="mb-6">
        <CardContent className="flex items-center gap-5 pt-6">
          {/* Avatar with upload overlay */}
          <div className="relative shrink-0 group">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt="Profile"
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold select-none">
                {initials}
              </div>
            )}
            {/* Upload overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Change photo"
            >
              <Camera className="h-5 w-5 text-white" />
            </button>
            {/* Remove button */}
            {profile.avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow"
                aria-label="Remove photo"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          <div>
            <p className="text-lg font-semibold">{name || user.email}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${PLAN_BADGE[planKey] ?? PLAN_BADGE.free}`}>
              {PLAN_LABEL[planKey] ?? planKey} Plan
            </span>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Hover the avatar to change photo · Max 512 KB
            </p>
          </div>
          {planKey !== 'enterprise' && (
            <Link href="/beta" className="ml-auto">
              <Button variant="outline" size="sm">Upgrade Plan</Button>
            </Link>
          )}
        </CardContent>
      </Card>

      {/* Personal details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Personal Details
          </CardTitle>
          <CardDescription>Update your name and contact information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                value={user.email}
                readOnly
                disabled
                className="pl-10 bg-muted/50 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-muted-foreground">Email cannot be changed here.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                value={profile.phone ?? ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="+1 555 000 0000"
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional details */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4" />
            Professional Details
          </CardTitle>
          <CardDescription>Used to personalise your trade analysis experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="company">Company</Label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="company"
                value={profile.company ?? ''}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                placeholder="Your company name"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="jobTitle">Job Title</Label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="jobTitle"
                value={profile.jobTitle ?? ''}
                onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                placeholder="e.g. Trade Compliance Manager"
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="country">Country</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="country"
                value={profile.country ?? ''}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                placeholder="e.g. Canada"
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PLAN_BADGE[planKey] ?? PLAN_BADGE.free}`}>
              {PLAN_LABEL[planKey] ?? planKey}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Account status</span>
            <span className="text-green-600 font-medium">Verified</span>
          </div>
          {planKey !== 'portfolio' && (
            <div className="pt-2 border-t">
              <Link href="/beta">
                <Button variant="outline" size="sm" className="w-full">
                  View upgrade options
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="px-8">
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
