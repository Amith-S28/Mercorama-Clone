import type { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { MarketingCmsSection } from '@/components/marketing/MarketingCmsSection';
import { createClient } from '@supabase/supabase-js';
import { BlogListClient } from './_components/BlogListClient';

export const metadata: Metadata = {
  title: 'Blog | Mercorama',
  description: 'Trade intelligence insights, export playbooks, how-to guides, and stories from the Mercorama team.',
};

async function getPublishedPosts() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, author_name, category, tags, featured, published_at, status')
    .eq('status', 'published')
    .order('featured', { ascending: false })
    .order('published_at', { ascending: false });
  if (error) {
    console.error('[blog] fetch error:', error.message);
    return [];
  }
  return data ?? [];
}

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              Mercorama Blog
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Trade intelligence insights, export playbooks, and practical guides for international commerce professionals.
            </p>
          </div>
          <BlogListClient posts={posts} />
        </div>
      </main>
      <MarketingCmsSection slug="blog" />
      <Footer />
    </div>
  );
}
