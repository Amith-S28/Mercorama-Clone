'use client';

import { useMarketingPage } from '@/hooks/useMarketingPages';
import { BlockRenderer } from './BlockRenderer';

interface Props {
  slug: string;
}

export function MarketingCmsSection({ slug }: Props) {
  const { data: page, isLoading } = useMarketingPage(slug);

  if (isLoading || !page) return null;

  // Combine rich_text block with structural blocks for rendering
  const allBlocks = [];

  if (page.content) {
    allBlocks.push({
      id: `${slug}-rich-text`,
      type: 'rich_text' as const,
      data: { html: page.content },
      position: 0,
    });
  }

  if (page.blocks && page.blocks.length > 0) {
    allBlocks.push(...page.blocks);
  }

  if (allBlocks.length === 0) return null;

  return <BlockRenderer blocks={allBlocks} />;
}
