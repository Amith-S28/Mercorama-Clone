'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowRight, Clock, Briefcase } from 'lucide-react';
import type { ExpertProfile } from '@/lib/experts';

// Fallback data if DB fetch fails
const FALLBACK: { slug: string; name: string; title: string; credentials: string; location: string; specializations: string; bio: string }[] = [
  {
    slug: 'toufik-amrani',
    name: 'Toufik Amrani',
    title: 'International Trade & Dry Bulk Chartering Specialist',
    credentials: 'CITP | FIBP\u00AE',
    location: 'Halifax, Nova Scotia, Canada',
    specializations: 'Dry Bulk Chartering \u00B7 Market Entry \u00B7 Trade Strategy',
    bio: 'Toufik is a bilingual logistics and maritime operations specialist with expertise in dry bulk chartering, laytime calculations, and international trade documentation.',
  },
  {
    slug: 'scott-bronson',
    name: 'Scott Bronson',
    title: 'Senior Market Intelligence Strategist',
    credentials: 'CITP/FIBP (in progress) \u00B7 B.Sc. Agricultural Economics',
    location: 'Windsor, Nova Scotia, Canada',
    specializations: 'Competitive Intelligence \u00B7 Market Entry Strategy \u00B7 Trade Data Analysis',
    bio: 'Scott is a senior market intelligence strategist with 23+ years helping companies identify global market opportunities in food, seafood, and agriculture industries.',
  },
];

function FeaturedCard({ expert }: { expert: ExpertProfile | null; }) {
  // Use DB data if available, otherwise this shouldn't render
  if (!expert) return null;

  const name = expert.headline.split('—')[0].trim();
  const credentials = (expert.types ?? []).map((t) => t.name).join(' \u00B7 ');
  const specs = (expert.tags ?? []).slice(0, 4).map((t) => t.name);
  const hasAdvisory = (expert.session_types ?? []).length > 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 hover:bg-white/[0.08] hover:border-white/20 transition-all">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-[#01696f] flex items-center justify-center shrink-0 overflow-hidden">
          {expert.avatar_url ? (
            <Image src={expert.avatar_url} alt={name} width={56} height={56} className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-white">
              {name.split(' ').map((w) => w[0]).join('').slice(0, 2)}
            </span>
          )}
        </div>
        <div>
          <div className="font-semibold text-white">{name}</div>
          {credentials && (
            <span className="inline-flex items-center rounded-full bg-[#01696f]/30 border border-[#01696f]/50 px-2 py-0.5 text-[11px] font-medium text-[#4f98a3]">
              {credentials}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="text-sm font-medium text-white/90 line-clamp-2">{expert.headline}</div>

      {/* Location */}
      <div className="flex items-center gap-1.5 text-xs text-white/50">
        <MapPin className="h-3 w-3" />
        {expert.location}
      </div>

      {/* Specializations */}
      <div className="flex flex-wrap gap-1.5">
        {specs.map((s) => (
          <span key={s} className="rounded-md bg-white/10 px-2 py-0.5 text-[11px] text-white/70">{s}</span>
        ))}
        {(expert.tags ?? []).length > 4 && (
          <span className="text-[11px] text-white/40">+{(expert.tags ?? []).length - 4} more</span>
        )}
      </div>

      {/* Engagement types */}
      <div className="flex flex-wrap gap-2 text-xs">
        {hasAdvisory && (
          <span className="inline-flex items-center gap-1 text-white/60">
            <Clock className="h-3 w-3" />Advisory Calls
          </span>
        )}
        <span className="inline-flex items-center gap-1 text-white/60">
          <Briefcase className="h-3 w-3" />Project-Based
        </span>
      </div>

      {/* Bio */}
      <p className="text-sm text-white/50 leading-relaxed line-clamp-2">{expert.bio}</p>

      {/* CTA */}
      <Link href={`/experts/${expert.slug}`}>
        <Button variant="outline" size="sm" className="w-full border-[#4f98a3] text-[#4f98a3] bg-transparent hover:bg-[#4f98a3]/10">
          View Profile
        </Button>
      </Link>
    </div>
  );
}

function FallbackCard({ data }: { data: typeof FALLBACK[0] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-[#01696f] flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-white">{data.name.split(' ').map((w) => w[0]).join('')}</span>
        </div>
        <div>
          <div className="font-semibold text-white">{data.name}</div>
          <span className="inline-flex items-center rounded-full bg-[#01696f]/30 border border-[#01696f]/50 px-2 py-0.5 text-[11px] font-medium text-[#4f98a3]">{data.credentials}</span>
        </div>
      </div>
      <div className="text-sm font-medium text-white/90">{data.title}</div>
      <div className="flex items-center gap-1.5 text-xs text-white/50"><MapPin className="h-3 w-3" />{data.location}</div>
      <div className="text-xs text-white/60">{data.specializations}</div>
      <p className="text-sm text-white/50 leading-relaxed line-clamp-2">{data.bio}</p>
      <Link href={`/experts/${data.slug}`}>
        <Button variant="outline" size="sm" className="w-full border-[#4f98a3] text-[#4f98a3] bg-transparent hover:bg-[#4f98a3]/10">View Profile</Button>
      </Link>
    </div>
  );
}

export function FeaturedExperts() {
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/experts/search?sort=featured')
      .then((r) => r.json())
      .then((data) => {
        const all = data.experts ?? [];
        // Filter to our two real experts
        const featured = all.filter((e: ExpertProfile) =>
          e.slug === 'toufik-amrani' || e.slug === 'scott-bronson'
        );
        setExperts(featured);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <section className="bg-[#0d1117] py-10 md:py-14 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Featured Trade Experts</h2>
          <p className="mt-2 text-base text-white/50 max-w-2xl mx-auto">
            Verified professionals ready to help you navigate customs, market entry, and export logistics.
          </p>
        </div>

        {/* Expert cards — 2 real profiles */}
        <div className="grid gap-4 sm:grid-cols-2">
          {experts.length > 0
            ? experts.map((e) => <FeaturedCard key={e.id} expert={e} />)
            : loaded
              ? FALLBACK.map((f) => <FallbackCard key={f.slug} data={f} />)
              : [1, 2].map((i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 h-64 animate-pulse" />
                ))
          }
        </div>

        {/* Banner */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-8 text-center space-y-4">
          <p className="text-base sm:text-lg font-medium text-white/90">
            We&apos;re actively growing our network of verified trade experts. Know a customs broker, CITP advisor, or freight specialist who should be listed here?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/experts/apply">
              <Button size="lg" className="gap-2 w-full sm:w-auto bg-[#01696f] hover:bg-[#01696f]/90 text-white">
                Apply as an Expert <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/experts/search">
              <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto border-[#4f98a3] text-[#4f98a3] bg-transparent hover:bg-[#4f98a3]/10">
                Browse All Experts
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
