// app/experts/[slug]/page.tsx
// Public expert profile page — served on mercorama.com/experts/{slug}
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  MapPin,
  Globe,
  Clock,
  Linkedin,
  ExternalLink,
  ShieldCheck,
  Shield,
  ArrowLeft,
  Briefcase,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { getExpertBySlug } from '@/lib/experts';
import { ExpertBio } from './_bio';
import { SessionSelector } from './_session-selector';
import { ProfileClient } from './_profile-client';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const BOARD = process.env.NEXT_PUBLIC_BOARD_URL ?? 'https://board.mercorama.com';

const TIER_CONFIG: Record<number, { label: string; color: string; bgColor: string; description: string }> = {
  1: {
    label: 'Licensed & Verified',
    color: 'text-green-800 dark:text-green-300',
    bgColor: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    description: 'This professional holds a verified license or designation from a recognized Canadian trade body.',
  },
  2: {
    label: 'Credentials Verified',
    color: 'text-blue-800 dark:text-blue-300',
    bgColor: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    description: 'Professional credentials have been reviewed and verified. Not a licensed customs broker.',
  },
  3: {
    label: 'Identity Verified',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted border-border',
    description: 'Basic identity verification completed. Peer experience only — not professional trade advice.',
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const expert = await getExpertBySlug(slug);
  if (!expert) return { title: 'Expert Not Found – Mercorama' };
  return {
    title: `${expert.headline} – Trade Expert | Mercorama`,
    description: expert.bio.slice(0, 160),
  };
}

export default async function ExpertProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const expert = await getExpertBySlug(slug);
  if (!expert) notFound();

  const tier = TIER_CONFIG[expert.verification_tier] ?? TIER_CONFIG[3];
  const TierIcon = expert.verification_tier === 1 ? ShieldCheck : Shield;

  // Extract first name for "Why work with" copy
  const firstName = expert.headline.split(' ')[0];

  // Short bio preview (first 120 chars for sidebar)
  const bioPreview = expert.bio.split('\n\n')[0].slice(0, 120);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <ProfileClient expert={expert}>
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 md:py-12">
          {/* Back link */}
          <Link
            href="/experts/search"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to search
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left column: 2/3 width on desktop */}
            <div className="lg:col-span-2 space-y-6">
              {/* 1. Hero card */}
              <div className="rounded-xl border bg-card p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                  {/* Avatar */}
                  <div className="h-24 w-24 shrink-0 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {expert.avatar_url ? (
                      <Image
                        src={expert.avatar_url}
                        alt={expert.headline}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-muted-foreground">
                        {expert.headline.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name, credential, quick facts */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap mb-2">
                      <h1 className="text-2xl sm:text-3xl font-bold">{expert.headline}</h1>
                      {expert.verification_tier === 1 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300 px-2.5 py-0.5 text-xs font-medium">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </div>

                    {/* Quick facts row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-4">
                      {expert.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {expert.location}
                        </span>
                      )}
                      {(expert.languages ?? []).length > 0 && (
                        <span className="flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5" />
                          {(expert.languages ?? [])
                            .map((l) => l.name)
                            .join(', ')}
                        </span>
                      )}
                      {expert.years_experience > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {expert.years_experience}+ years
                        </span>
                      )}
                    </div>

                    {/* Social links */}
                    <div className="flex gap-3">
                      {expert.linkedin_url && (
                        <a
                          href={expert.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {expert.website_url && (
                        <a
                          href={expert.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline CTAs */}
                <div className="flex flex-col sm:flex-row gap-2 mt-6">
                  <Link href={`/experts/request/${expert.slug}`} className="flex-1">
                    <Button className="w-full" size="lg">
                      Book Advisory Call
                    </Button>
                  </Link>
                  <Link href={`/experts/request/${expert.slug}?type=info`} className="flex-1">
                    <Button variant="outline" className="w-full" size="lg">
                      Request Info First
                    </Button>
                  </Link>
                </div>
              </div>

              {/* 2. Why work with section */}
              <div className="rounded-xl border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Why work with {firstName}?</h2>
                <ExpertBio bio={expert.bio} />
              </div>

              {/* 3. Best for SMEs section */}
              {(expert.tags ?? []).length > 0 && (
                <div className="rounded-xl border bg-card p-6">
                  <h2 className="text-xl font-semibold mb-4">Best for SMEs who need help with</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(expert.tags ?? []).map((tag) => (
                      <div key={tag.id} className="flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-[#01696f] dark:text-[#4f98a3] shrink-0 mt-0.5" />
                        <span className="text-sm">{tag.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Credibility highlights */}
              <div className="rounded-xl border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Why this expert stands out</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Years of experience */}
                  {expert.years_experience > 0 && (
                    <div className="flex gap-3">
                      <Clock className="h-5 w-5 text-[#01696f] dark:text-[#4f98a3] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">
                          {expert.years_experience}+ years of export development experience
                        </div>
                      </div>
                    </div>
                  )}

                  {/* License or verification tier */}
                  <div className="flex gap-3">
                    <Award className="h-5 w-5 text-[#01696f] dark:text-[#4f98a3] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">
                        {expert.license_body && expert.license_number
                          ? `${expert.license_body} License`
                          : tier.label}
                      </div>
                      {expert.license_number && (
                        <div className="text-xs text-muted-foreground">{expert.license_number}</div>
                      )}
                    </div>
                  </div>

                  {/* Location */}
                  {expert.location && (
                    <div className="flex gap-3">
                      <MapPin className="h-5 w-5 text-[#01696f] dark:text-[#4f98a3] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">{expert.location}</div>
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {(expert.languages ?? []).length > 0 && (
                    <div className="flex gap-3">
                      <Globe className="h-5 w-5 text-[#01696f] dark:text-[#4f98a3] shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-medium">
                          {(expert.languages ?? [])
                            .map((l) => l.name)
                            .join(', ')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Session selector (left column) */}
              {(expert.session_types ?? []).length > 0 && (
                <div className="rounded-xl border bg-card p-6">
                  <SessionSelector
                    sessions={expert.session_types ?? []}
                    expertSlug={expert.slug}
                  />
                </div>
              )}
            </div>

            {/* Right column: 1/3 width, sticky sidebar on desktop */}
            <div className="lg:block hidden">
              <div className="rounded-xl border bg-card p-6 space-y-6 lg:sticky lg:top-20">
                {/* A. Best suited for */}
                <div>
                  <h3 className="font-semibold text-sm mb-2">Best suited for</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{bioPreview}...</p>
                </div>

                {/* B. Available for */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Available for</h3>
                  <div className="space-y-2">
                    {(expert.session_types ?? []).length > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-[#01696f] dark:text-[#4f98a3]" />
                        <span className="text-xs">Advisory Calls</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-[#01696f] dark:text-[#4f98a3]" />
                      <span className="text-xs">Project-Based Support</span>
                    </div>
                  </div>
                </div>

                {/* C. Session selector (sidebar) */}
                {(expert.session_types ?? []).length > 0 && (
                  <div>
                    <SessionSelector
                      sessions={expert.session_types ?? []}
                      expertSlug={expert.slug}
                    />
                  </div>
                )}

                {/* D. Primary CTA */}
                <Link href={`/experts/request/${expert.slug}`} className="block">
                  <Button className="w-full" size="lg">
                    Continue to Book
                  </Button>
                </Link>

                {/* E. Secondary CTA */}
                <Link href={`/experts/request/${expert.slug}?type=info`} className="block">
                  <Button variant="outline" className="w-full" size="lg">
                    Request Info First
                  </Button>
                </Link>

                {/* F. Reassurance copy */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Not sure which session fits? Request info first and we'll help you choose.
                </p>

                {/* G. Trust microcopy */}
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className={cn('text-xs leading-relaxed', tier.color)}>
                    <strong>{tier.label}</strong>
                    <p className="text-muted-foreground mt-1">{tier.description}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </ProfileClient>
    </div>
  );
}
