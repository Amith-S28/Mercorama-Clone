// app/export-compass/profile/page.tsx
// Deep Market Profile page — server shell, client does the data fetch.
import type { Metadata } from 'next';
import DeepMarketProfileClient from './_client';

export const metadata: Metadata = {
  title: 'Deep Market Profile — Export Compass | Mercorama',
  description: 'Full trade intelligence profile for a target export market.',
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ hs?: string; country?: string; product?: string; back?: string }>;
}) {
  const params = await searchParams;
  const hs      = params.hs      ?? '';
  const country = params.country ?? '';
  const product = params.product ?? 'this product';
  const backHref = params.back   ?? '/export-compass';

  if (!hs || !country) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Missing hs and country parameters.{' '}
        <a href="/export-compass" className="text-primary underline">Back to Export Compass</a>
      </main>
    );
  }

  return (
    <main>
      <DeepMarketProfileClient
        hs={hs}
        country={country}
        product={product}
        backHref={backHref}
      />
    </main>
  );
}
