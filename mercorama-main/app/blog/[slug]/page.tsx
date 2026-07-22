import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';
import DOMPurify from 'dompurify';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

type Props = { params: Promise<{ slug: string }> };

function createSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function getPost(slug: string) {
  const supabase = createSupabase();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error) return null;
  return data;
}

async function getRelatedPosts(currentId: string, category: string | null) {
  const supabase = createSupabase();
  let q = supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image_url, author_name, category, published_at')
    .eq('status', 'published')
    .neq('id', currentId)
    .limit(3);
  if (category) q = q.eq('category', category);
  const { data } = await q.order('published_at', { ascending: false });
  return data ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post Not Found | Mercorama' };
  return {
    title: `${post.title} | Mercorama Blog`,
    description: post.excerpt ?? undefined,
    openGraph: post.cover_image_url
      ? { images: [{ url: post.cover_image_url }] }
      : undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post.id, post.category);

  // Sanitize HTML content — DOMPurify works in browser; on server we skip for SSR
  const safeContent = typeof window !== 'undefined' && post.content
    ? DOMPurify.sanitize(post.content)
    : post.content ?? '';

  const wordCount = safeContent.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.round(wordCount / 200));

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
          {post.category && (
            <Link
              href={`/blog`}
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4 hover:bg-primary/20 transition-colors"
            >
              {post.category}
            </Link>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{post.excerpt}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-8">
            <span className="font-medium text-foreground">{post.author_name}</span>
            {post.published_at && (
              <>
                <span>·</span>
                <time dateTime={post.published_at}>
                  {format(new Date(post.published_at), 'MMMM d, yyyy')}
                </time>
              </>
            )}
            <span>·</span>
            <span>{readingTime} min read</span>
            {post.tags && post.tags.length > 0 && (
              <>
                <span>·</span>
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag: string) => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cover image */}
        {post.cover_image_url && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-10">
            <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden border">
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        )}

        {/* Article content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div
            className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />
        </div>

        {/* CTA */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
          <div className="rounded-2xl bg-primary/5 border border-primary/20 p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Ready to put this into practice?</h3>
            <p className="text-muted-foreground mb-5 text-sm">
              Use Mercorama's AI-powered tools to analyze Incoterms, classify HS codes, and structure your trade agreements.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/incoterms"
                className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Try Incoterms Analyzer
              </Link>
              <Link
                href="/hscode"
                className="px-5 py-2 rounded-lg border text-sm font-semibold hover:bg-muted transition-colors"
              >
                HS Code Assistant
              </Link>
            </div>
          </div>
        </div>

        {/* Related posts */}
        {related.length > 0 && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
            <h2 className="text-xl font-bold mb-6">Continue learning</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {related.map((rp: {
                id: string;
                title: string;
                slug: string;
                excerpt: string | null;
                cover_image_url: string | null;
                author_name: string;
                category: string | null;
                published_at: string | null;
              }) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="group rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {rp.cover_image_url ? (
                    <div className="relative h-36 w-full overflow-hidden">
                      <Image src={rp.cover_image_url} alt={rp.title} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="h-36 bg-gradient-to-br from-primary/10 to-muted flex items-center justify-center">
                      <span className="text-3xl opacity-30">✦</span>
                    </div>
                  )}
                  <div className="p-4">
                    {rp.category && (
                      <span className="text-xs font-semibold text-primary">{rp.category}</span>
                    )}
                    <h3 className="text-sm font-semibold mt-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {rp.title}
                    </h3>
                    {rp.published_at && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(rp.published_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
