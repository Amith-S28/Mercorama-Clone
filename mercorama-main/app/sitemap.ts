// app/sitemap.ts
import { MetadataRoute } from 'next';
import { createServiceClient } from '@/lib/supabase';

const BASE = 'https://mercorama.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,                  lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/beta`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/about`,             lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/contact`,           lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/blog`,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },

    // Tool marketing pages
    { url: `${BASE}/hscode`,            lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/incoterms`,         lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/deal-summary`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/deal`,              lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/export-compass`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/fta-diversify`,     lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/fund-my-export`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/freight-connect`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },

    // Experts
    { url: `${BASE}/experts`,           lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/experts/search`,    lastModified: new Date(), changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/verification-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },

    // Legal / Compliance
    { url: `${BASE}/terms`,             lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/privacy`,           lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/data-sources`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/data-retention`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  // Dynamic: expert profiles
  let expertPages: MetadataRoute.Sitemap = [];
  try {
    const db = createServiceClient();
    const { data: experts } = await db
      .from('expert_profiles')
      .select('slug, updated_at')
      .eq('is_approved', true)
      .eq('is_active', true);

    expertPages = (experts ?? []).map((e) => ({
      url: `${BASE}/experts/${e.slug}`,
      lastModified: new Date(e.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch {
    // DB unavailable at build — skip dynamic pages
  }

  // Dynamic: blog posts
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const db = createServiceClient();
    const { data: posts } = await db
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published');

    blogPages = (posts ?? []).map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch {
    // skip
  }

  return [...staticPages, ...expertPages, ...blogPages];
}
