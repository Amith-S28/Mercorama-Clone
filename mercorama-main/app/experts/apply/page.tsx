import { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ExpertApplyForm } from './_form';

export const metadata: Metadata = {
  title: 'Apply as a Trade Expert – Mercorama',
  description: 'Join Canada\'s premier trade expert network. Connect with Canadian SMEs navigating global markets.',
};

export default function ExpertApplyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <ExpertApplyForm />
      </main>
      <Footer />
    </div>
  );
}
