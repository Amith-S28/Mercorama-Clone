'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MapPin, Star, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExpertCardData {
  id: string;
  slug: string;
  name: string;
  credentials: string[];
  title: string;
  specializations: string[];
  country: string;
  city: string;
  bio: string;
  languages: string[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  avatar_url?: string | null;
}

interface ExpertCardProps {
  expert: ExpertCardData;
  variant?: 'compact' | 'featured' | 'ghost';
  profileHref?: string;
  requestHref?: string;
}

function Initials({ name, verified, size = 48 }: { name: string; verified: boolean; size?: number }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full bg-[#01696f] flex items-center justify-center w-full h-full"
      >
        <span className="font-bold text-white" style={{ fontSize: size * 0.35 }}>{initials}</span>
      </div>
      {verified && (
        <CheckCircle2
          className="absolute -bottom-0.5 -right-0.5 h-4 w-4 text-[#01696f] bg-background rounded-full"
          fill="currentColor"
          stroke="white"
          strokeWidth={2}
        />
      )}
    </div>
  );
}

function CredentialBadges({ credentials }: { credentials: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {credentials.map((c) => (
        <span key={c} className="inline-flex items-center rounded-full bg-[#01696f]/10 text-[#01696f] dark:bg-[#4f98a3]/15 dark:text-[#4f98a3] px-2 py-0.5 text-[10px] font-semibold tracking-wide">
          {c}
        </span>
      ))}
    </div>
  );
}

function RatingDisplay({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  if (reviewCount === 0) return null;
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
      {rating.toFixed(1)} <span className="text-muted-foreground/60">· {reviewCount} review{reviewCount !== 1 ? 's' : ''}</span>
    </span>
  );
}

// ── Compact variant ───────────────────────────────────────────────────────────

function CompactCard({ expert, profileHref }: { expert: ExpertCardData; profileHref: string }) {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-start gap-3">
        <Initials name={expert.name} verified={expert.verified} size={48} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-1">{expert.name}</h3>
          <CredentialBadges credentials={expert.credentials} />
        </div>
      </div>

      <p className="text-sm font-medium line-clamp-1">{expert.title}</p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{expert.city}, {expert.country}</span>
        <RatingDisplay rating={expert.rating} reviewCount={expert.reviewCount} />
      </div>

      <Link href={profileHref}>
        <Button variant="outline" size="sm" className="w-full">View Profile</Button>
      </Link>
    </div>
  );
}

// ── Featured variant ──────────────────────────────────────────────────────────

function FeaturedCard({ expert, profileHref, requestHref }: { expert: ExpertCardData; profileHref: string; requestHref: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row gap-4">
        <Initials name={expert.name} verified={expert.verified} size={72} />
        <div className="flex-1 min-w-0 space-y-2">
          <div>
            <h3 className="font-semibold text-base">{expert.name}</h3>
            <CredentialBadges credentials={expert.credentials} />
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{expert.bio}</p>
        </div>
      </div>

      {/* Specialization tags */}
      <div className="flex flex-wrap gap-1.5">
        {expert.specializations.slice(0, 4).map((s) => (
          <span key={s} className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{s}</span>
        ))}
        {expert.specializations.length > 4 && (
          <span className="text-[11px] text-muted-foreground">+{expert.specializations.length - 4} more</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{expert.city}, {expert.country}</span>
        {expert.languages.length > 0 && <span>{expert.languages.join(', ')}</span>}
        <RatingDisplay rating={expert.rating} reviewCount={expert.reviewCount} />
      </div>

      <div className="flex gap-2">
        <Link href={requestHref} className="flex-1">
          <Button size="sm" className="w-full">Request Consultation</Button>
        </Link>
        <Link href={profileHref}>
          <Button variant="ghost" size="sm">View Profile</Button>
        </Link>
      </div>
    </div>
  );
}

// ── Ghost variant ─────────────────────────────────────────────────────────────

function GhostCard() {
  return (
    <div
      className="rounded-xl border bg-card p-4 space-y-3 select-none"
      style={{ filter: 'blur(6px)', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="flex gap-1">
            <div className="h-4 w-12 bg-muted rounded-full animate-pulse" />
            <div className="h-4 w-10 bg-muted rounded-full animate-pulse" />
          </div>
        </div>
      </div>
      <div className="h-4 w-40 bg-muted rounded animate-pulse" />
      <div className="flex gap-3">
        <div className="h-3 w-24 bg-muted rounded animate-pulse" />
        <div className="h-3 w-16 bg-muted rounded animate-pulse" />
      </div>
      <div className="h-8 w-full bg-muted rounded-lg animate-pulse" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ExpertCard({ expert, variant = 'compact', profileHref, requestHref }: ExpertCardProps) {
  const pHref = profileHref ?? `/experts/${expert.slug}`;
  const rHref = requestHref ?? `/experts/request/${expert.slug}`;

  if (variant === 'ghost') return <GhostCard />;
  if (variant === 'featured') return <FeaturedCard expert={expert} profileHref={pHref} requestHref={rHref} />;
  return <CompactCard expert={expert} profileHref={pHref} />;
}
