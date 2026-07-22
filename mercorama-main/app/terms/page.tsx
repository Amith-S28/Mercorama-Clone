import type { Metadata } from 'next';
import TermsContent from './_client';

export const metadata: Metadata = {
  title: 'Terms of Service | Mercorama',
  description:
    'Terms of Service for Mercorama, the AI-powered trade intelligence platform operated by MightyIQ Inc.',
};

export default function TermsPage() {
  return <TermsContent />;
}
