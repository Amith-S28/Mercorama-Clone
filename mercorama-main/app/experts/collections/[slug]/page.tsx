// app/experts/collections/[slug]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { createServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

async function getCollection(slug: string) {
  const db = createServiceClient();
  const { data } = await db
    .from('expert_collections')
    .select('*, expert_profiles!expert_collections_expert_id_fkey(headline, slug, avatar_url)')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  return data;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCollection(slug);
  if (!c) return { title: 'Guide Not Found – Mercorama' };
  return { title: `${c.title} – Mercorama`, description: c.summary?.slice(0, 160) };
}

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getCollection(slug);
  if (!c) notFound();

  const expert = c.expert_profiles as { headline: string; slug: string; avatar_url: string | null };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 md:py-12">
        <Link href="/experts/search" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />Back to experts
        </Link>

        {c.cover_image && (
          <div className="rounded-xl overflow-hidden mb-6 aspect-[3/1]">
            <Image src={c.cover_image} alt={c.title} width={900} height={300} className="w-full h-full object-cover" />
          </div>
        )}

        <h1 className="text-3xl font-bold mb-3">{c.title}</h1>
        {c.summary && <p className="text-lg text-muted-foreground mb-6">{c.summary}</p>}

        {/* Author */}
        <Link href={`/experts/${expert.slug}`} className="inline-flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors mb-8">
          <div className="h-8 w-8 rounded-full bg-muted overflow-hidden">
            {expert.avatar_url && <Image src={expert.avatar_url} alt="" width={32} height={32} className="h-full w-full object-cover" />}
          </div>
          <div className="text-sm">
            <span className="font-medium">{expert.headline.split('—')[0].trim()}</span>
            <span className="text-muted-foreground"> · View profile</span>
          </div>
        </Link>

        {/* Content */}
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-line">
          {c.content}
        </div>
      </main>
      <Footer />
    </div>
  );
}
