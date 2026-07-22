// app/experts/search/page.tsx
// Public expert search with filters — served on mercorama.com/experts/search
import { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ExpertSearchClient } from './_client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Find a Trade Expert – Mercorama',
  description: 'Connect with verified Canadian trade professionals — customs brokers, CITP/FIBP advisors, freight forwarders, and export finance specialists.',
};

export default function ExpertSearchPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ExpertSearchClient />
      </main>
      <Footer />
    </div>
  );
}
