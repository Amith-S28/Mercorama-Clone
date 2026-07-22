import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Incoterms Translator | Mercorama',
  description: 'AI-powered Incoterms 2020 analysis. Get instant responsibility breakdowns, risk transfer points, and expert recommendations for international trade.',
  keywords: ['Incoterms', 'Incoterms 2020', 'FOB', 'CIF', 'EXW', 'international trade', 'shipping terms'],
};

export default function IncotermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
