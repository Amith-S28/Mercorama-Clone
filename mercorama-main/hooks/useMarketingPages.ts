'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type BlockType = 'hero' | 'feature_list' | 'cta' | 'text' | 'pricing_plans' | 'who_it_is_for' | 'faq';

export type MarketingBlock = {
  id: string;
  page_id: string;
  type: BlockType;
  data: Record<string, unknown>;
  position: number;
};

export type MarketingPage = {
  id: string;
  slug: string;
  title: string;
  updated_at: string;
  blocks?: MarketingBlock[];
  content?: string; // rich text HTML, stored as type='rich_text' block
};

// All key marketing pages that should always exist
export const DEFAULT_PAGES = [
  { slug: 'home',       title: 'Home Page' },
  { slug: 'pricing',    title: 'Pricing Page' },
  { slug: 'deal',       title: 'Deal Wizard' },
  { slug: 'incoterms',  title: 'Incoterms Analyzer' },
  { slug: 'hscode',     title: 'HS Code Assistant' },
  { slug: 'contract',   title: 'Deal Summary Generator' },
  { slug: 'blog',       title: 'Blog' },
  { slug: 'contact',    title: 'Contact' },
];

export async function ensureDefaultPages() {
  for (const page of DEFAULT_PAGES) {
    await supabase
      .from('marketing_pages')
      .upsert({ slug: page.slug, title: page.title }, { onConflict: 'slug', ignoreDuplicates: true });
  }
}

export function useMarketingPage(slug: string) {
  return useQuery({
    queryKey: ['marketing', slug],
    queryFn: async () => {
      const { data: page, error: pe } = await supabase
        .from('marketing_pages')
        .select('*')
        .eq('slug', slug)
        .single();
      if (pe) return null;

      const { data: blocks } = await supabase
        .from('marketing_blocks')
        .select('*')
        .eq('page_id', page.id)
        .order('position');

      const allBlocks = (blocks ?? []) as MarketingBlock[];

      // Separate the rich_text content block from structural blocks
      const contentBlock = allBlocks.find((b) => (b.type as string) === 'rich_text');
      const structuralBlocks = allBlocks.filter((b) => (b.type as string) !== 'rich_text');

      return {
        ...page,
        blocks: structuralBlocks,
        content: (contentBlock?.data as { html?: string })?.html ?? '',
      } as MarketingPage;
    },
  });
}

export function useAllMarketingPages() {
  return useQuery({
    queryKey: ['marketing', 'all'],
    queryFn: async () => {
      await ensureDefaultPages();
      const { data, error } = await supabase
        .from('marketing_pages')
        .select('*')
        .order('slug');
      if (error) throw error;
      return data as MarketingPage[];
    },
  });
}

export function useSaveMarketingPage(pageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      blocks,
      content,
    }: {
      blocks: Omit<MarketingBlock, 'id' | 'page_id'>[];
      content: string;
    }) => {
      // Delete all existing blocks for this page
      await supabase.from('marketing_blocks').delete().eq('page_id', pageId);

      const rows: object[] = [];

      // Store rich text content as position 0 block
      if (content) {
        rows.push({
          page_id: pageId,
          type: 'rich_text',
          data: { html: content },
          position: 0,
          updated_at: new Date().toISOString(),
        });
      }

      // Structural blocks start at position 1
      blocks.forEach((b, i) => {
        rows.push({
          ...b,
          page_id: pageId,
          position: i + 1,
          updated_at: new Date().toISOString(),
        });
      });

      if (rows.length > 0) {
        const { error } = await supabase.from('marketing_blocks').insert(rows);
        if (error) throw error;
      }

      // Touch the page updated_at
      await supabase
        .from('marketing_pages')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', pageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing'] });
      toast.success('Page saved');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// Keep old name as alias for backwards compat
export const useSaveMarketingPageBlocks = (pageId: string) => useSaveMarketingPage(pageId);
