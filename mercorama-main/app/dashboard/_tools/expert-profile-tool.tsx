'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Globe, Clock, ShieldCheck, Shield, ArrowLeft,
  Loader2, Briefcase, Award, CheckCircle2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExpertProfile, ExpertSessionType } from '@/lib/experts';

const TIER_CONFIG: Record<number, { label: string; color: string; bgColor: string; description: string }> = {
  1: { label: 'Licensed & Verified', color: 'text-green-800 dark:text-green-300', bgColor: 'bg-green-50 border-green-200', description: 'Verified license from a recognized Canadian trade body.' },
  2: { label: 'Credentials Verified', color: 'text-blue-800 dark:text-blue-300', bgColor: 'bg-blue-50 border-blue-200', description: 'Professional credentials reviewed. Not a licensed customs broker.' },
  3: { label: 'Identity Verified', color: 'text-muted-foreground', bgColor: 'bg-muted border-border', description: 'Basic identity verified. Peer experience only.' },
};

function CollapsibleBio({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const paras = bio.split('\n\n').filter(Boolean);
  const rest = paras.slice(1);
  return (
    <div>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
        <p>{paras[0]}</p>
        {expanded && rest.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {rest.length > 0 && (
        <button onClick={() => setExpanded(v => !v)} className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          {expanded ? <><ChevronUp className="h-3.5 w-3.5" />Show less</> : <><ChevronDown className="h-3.5 w-3.5" />Read more</>}
        </button>
      )}
    </div>
  );
}

function SessionSelector({ sessions, expertSlug }: { sessions: ExpertSessionType[]; expertSlug: string }) {
  const [selected, setSelected] = useState(sessions[0]?.id ?? '');
  if (!sessions.length) return null;
  return (
    <div>
      <h3 className="font-semibold text-sm mb-3">Select Session Type</h3>
      <div className="space-y-2 mb-4">
        {sessions.map((s) => (
          <button key={s.id} onClick={() => setSelected(s.id)}
            className={cn('w-full rounded-lg border-2 p-3 text-left transition-all',
              selected === s.id ? 'border-[#01696f] bg-[#01696f]/5' : 'border-border bg-card hover:border-[#01696f]/40')}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{s.title}</div>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />{s.duration_minutes} min
                </div>
              </div>
              <div className="font-semibold text-sm text-[#01696f] shrink-0">
                ${(s.price_cents / 100).toFixed(0)}
              </div>
            </div>
            {s.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{s.description}</p>}
          </button>
        ))}
      </div>
      <Link href={`/dashboard/book/${expertSlug}?session=${selected}`} className="block">
        <Button className="w-full" size="lg">Continue to Book</Button>
      </Link>
      <Link href={`/dashboard?tool=expert-request&slug=${expertSlug}`} className="block mt-2">
        <Button variant="outline" className="w-full" size="sm">Request Info First</Button>
      </Link>
    </div>
  );
}

export function ExpertProfileTool() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug') ?? '';
  const [expert, setExpert] = useState<ExpertProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/experts/${slug}`)
      .then((r) => r.json())
      .then(setExpert)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!expert) return <p className="text-muted-foreground">Expert not found.</p>;

  const tier = TIER_CONFIG[expert.verification_tier] ?? TIER_CONFIG[3];
  const TierIcon = expert.verification_tier === 1 ? ShieldCheck : Shield;
  const firstName = expert.headline.split(' ')[0];
  const sessions = expert.session_types ?? [];
  const tags = expert.tags ?? [];
  const languages = (expert.languages ?? []).map(l => l.name).join(', ');

  return (
    <div className="max-w-5xl space-y-6">
      <Link href="/dashboard?tool=find-experts" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />Back to search
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Left column ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* 1. Hero card */}
          <div className="rounded-xl border bg-card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
              <div className="h-20 w-20 shrink-0 rounded-full bg-muted overflow-hidden">
                {expert.avatar_url
                  ? <Image src={expert.avatar_url} alt={expert.headline} width={80} height={80} className="h-full w-full object-cover" />
                  : <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-muted-foreground">{expert.headline.charAt(0)}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap mb-1">
                  <h1 className="text-xl sm:text-2xl font-bold">{expert.headline}</h1>
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border', tier.bgColor, tier.color)}>
                    <TierIcon className="h-3 w-3" />{tier.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
                  {expert.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{expert.location}</span>}
                  {languages && <span className="flex items-center gap-1"><Globe className="h-3.5 w-3.5" />{languages}</span>}
                  {expert.years_experience > 0 && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{expert.years_experience}+ years</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/dashboard/book/${expert.slug}`}>
                    <Button size="sm">Book Advisory Call</Button>
                  </Link>
                  <Link href={`/dashboard?tool=expert-request&slug=${expert.slug}`}>
                    <Button variant="outline" size="sm">Request Info First</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Why work with */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold mb-3">Why work with {firstName}?</h2>
            <CollapsibleBio bio={expert.bio} />
          </div>

          {/* 3. Best for */}
          {tags.length > 0 && (
            <div className="rounded-xl border bg-card p-5">
              <h2 className="text-base font-semibold mb-3">Best for SMEs who need help with</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tags.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-[#01696f] shrink-0" />
                    {t.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Credibility */}
          <div className="rounded-xl border bg-card p-5">
            <h2 className="text-base font-semibold mb-3">Why this expert stands out</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {expert.years_experience > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Clock className="h-4 w-4 text-[#01696f] shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{expert.years_experience}+ years of experience</span>
                </div>
              )}
              {expert.license_body && (
                <div className="flex items-start gap-2 text-sm">
                  <Award className="h-4 w-4 text-[#01696f] shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{expert.license_body}{expert.license_number ? ` · ${expert.license_number}` : ''}</span>
                </div>
              )}
              {expert.location && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-[#01696f] shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Based in {expert.location}</span>
                </div>
              )}
              {languages && (
                <div className="flex items-start gap-2 text-sm">
                  <Globe className="h-4 w-4 text-[#01696f] shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">Languages: {languages}</span>
                </div>
              )}
            </div>
          </div>

          {/* 5. Session selector (mobile / left col) */}
          {sessions.length > 0 && (
            <div className="rounded-xl border bg-card p-5 lg:hidden">
              <SessionSelector sessions={sessions} expertSlug={expert.slug} />
            </div>
          )}
        </div>

        {/* ── Right sidebar (desktop only) ── */}
        <div className="hidden lg:block">
          <div className="rounded-xl border bg-card p-5 space-y-5 sticky top-4">
            {/* Best suited for */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Best suited for</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {expert.bio.split('\n\n')[0].slice(0, 120)}…
              </p>
            </div>

            {/* Available for */}
            <div>
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Available for</div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-[#01696f]" />Advisory Calls
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5 text-[#01696f]" />Project-Based Support
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              {sessions.length > 0
                ? <SessionSelector sessions={sessions} expertSlug={expert.slug} />
                : (
                  <div className="space-y-2">
                    <Link href={`/dashboard/book/${expert.slug}`} className="block">
                      <Button className="w-full" size="lg">Book Advisory Call</Button>
                    </Link>
                    <Link href={`/dashboard?tool=expert-request&slug=${expert.slug}`} className="block">
                      <Button variant="outline" className="w-full" size="sm">Request Info First</Button>
                    </Link>
                  </div>
                )}
            </div>

            <p className="text-[10px] text-muted-foreground/60 leading-tight text-center">
              Not sure which session fits? Request info first and we'll help you choose.
            </p>
            <p className="text-[10px] text-muted-foreground/60 leading-tight text-center">
              {tier.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
