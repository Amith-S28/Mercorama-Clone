// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/beta',
          '/about',
          '/contact',
          '/blog',
          '/hscode',
          '/incoterms',
          '/deal',
          '/deal-summary',
          '/export-compass',
          '/fta-diversify',
          '/fund-my-export',
          '/freight-connect',
          '/experts',
          '/experts/search',
          '/experts/collections',
          '/verification-policy',
          '/terms',
          '/privacy',
          '/data-sources',
          '/data-retention',
        ],
        disallow: [
          '/dashboard',
          '/dashboard/',
          '/admin',
          '/admin/',
          '/studio',
          '/studio/',
          '/book',
          '/book/',
          '/booking',
          '/booking/',
          '/auth',
          '/auth/',
          '/activate',
          '/activate/',
          '/beta/confirmed',
          '/waitlist/confirmed',
          '/api/',
          '/checkout/',
        ],
      },
      // Allow AI crawlers (GEO/AEO)
      {
        userAgent: 'GPTBot',
        allow: [
          '/',
          '/experts',
          '/experts/search',
          '/blog',
          '/hscode',
          '/incoterms',
          '/deal',
          '/export-compass',
          '/fta-diversify',
          '/data-sources',
          '/verification-policy',
        ],
        disallow: ['/dashboard', '/admin', '/api/', '/auth'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/'],
        disallow: ['/dashboard', '/admin', '/api/', '/auth'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/'],
        disallow: ['/dashboard', '/admin', '/api/', '/auth'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: ['/'],
        disallow: ['/dashboard', '/admin', '/api/', '/auth'],
      },
    ],
    sitemap: 'https://mercorama.com/sitemap.xml',
  };
}
