'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'Product Updates', label: 'Product Updates' },
  { key: 'Export Playbooks', label: 'Export Playbooks' },
  { key: 'How-To Guides', label: 'How-To Guides' },
  { key: 'Stories', label: 'Stories' },
];

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image_url: string | null;
  author_name: string;
  category: string | null;
  tags: string[] | null;
  featured: boolean;
  published_at: string | null;
  status: string;
};

export function BlogListClient({ posts }: { posts: BlogPost[] }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filtered = activeCategory === 'all'
    ? posts
    : posts.filter((p) => p.category === activeCategory);

  const featuredPost = filtered.find((p) => p.featured);
  const gridPosts = featuredPost ? filtered.filter((p) => p.id !== featuredPost.id) : filtered;

  return (
    <div>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border transition-colors',
              activeCategory === cat.key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Featured post hero */}
      {featuredPost && (
        <Link href={`/blog/${featuredPost.slug}`} className="block mb-10 group">
          <div className="relative rounded-2xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
            {featuredPost.cover_image_url ? (
              <div className="relative h-72 sm:h-96 w-full">
                <Image
                  src={featuredPost.cover_image_url}
                  alt={featuredPost.title}
                  fill
                  className="object-cover group-hover:scale-[1.01] transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>
            ) : (
              <div className="h-72 sm:h-96 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <span className="text-6xl">✦</span>
              </div>
            )}
            <div className={cn(
              'p-6',
              featuredPost.cover_image_url && 'absolute bottom-0 left-0 right-0 text-white'
            )}>
              {featuredPost.category && (
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary/90 text-primary-foreground mb-3">
                  {featuredPost.category}
                </span>
              )}
              <h2 className="text-2xl sm:text-3xl font-bold mb-2 group-hover:underline underline-offset-2">
                {featuredPost.title}
              </h2>
              {featuredPost.excerpt && (
                <p className={cn(
                  'text-sm leading-relaxed line-clamp-2',
                  featuredPost.cover_image_url ? 'text-white/80' : 'text-muted-foreground'
                )}>
                  {featuredPost.excerpt}
                </p>
              )}
              <div className={cn(
                'flex items-center gap-2 mt-3 text-xs',
                featuredPost.cover_image_url ? 'text-white/70' : 'text-muted-foreground'
              )}>
                <span>{featuredPost.author_name}</span>
                {featuredPost.published_at && (
                  <>
                    <span>·</span>
                    <span>{format(new Date(featuredPost.published_at), 'MMM d, yyyy')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Grid */}
      {gridPosts.length === 0 && !featuredPost ? (
        <div className="text-center py-24 text-muted-foreground">
          <p className="text-lg font-medium mb-2">No posts yet</p>
          <p className="text-sm">Check back soon for new content.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {gridPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
      {post.cover_image_url ? (
        <div className="relative h-44 w-full overflow-hidden">
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-44 bg-gradient-to-br from-primary/10 via-primary/5 to-muted flex items-center justify-center">
          <span className="text-4xl opacity-30">✦</span>
        </div>
      )}
      <div className="p-5">
        {post.category && (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-3">
            {post.category}
          </span>
        )}
        <h3 className="font-semibold text-base leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{post.author_name}</span>
          {post.published_at && (
            <>
              <span>·</span>
              <span>{format(new Date(post.published_at), 'MMM d, yyyy')}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
