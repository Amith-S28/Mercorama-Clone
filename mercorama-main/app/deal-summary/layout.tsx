import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Deal Summary Generator | Mercorama',
  description: 'Generate structured deal summaries aligned to your Incoterm and payment terms. Get payment timelines, risk assessments, and clause references — for advisor review.',
  keywords: ['deal summary', 'trade reference document', 'international trade', 'payment terms', 'incoterm clauses', 'risk assessment'],
};

export default function ContractLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
