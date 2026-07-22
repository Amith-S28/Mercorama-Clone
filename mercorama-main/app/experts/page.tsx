import { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ExpertsLanding } from './_components/experts-landing';

export const metadata: Metadata = {
  title: 'Connect with MERCORAMA Trade Experts | MERCORAMA',
  description: 'Canadian SME? Work with a MERCORAMA trade expert to unlock CETA, CPTPP, and your first export deal.',
  openGraph: {
    title: 'Connect with MERCORAMA Trade Experts | MERCORAMA',
    description: 'Canadian SME? Work with a MERCORAMA trade expert to unlock CETA, CPTPP, and your first export deal.',
    url: 'https://mercorama.com/experts',
  },
};

export default function ExpertsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ExpertsLanding />
      </main>
      <Footer />
    </div>
  );
}
