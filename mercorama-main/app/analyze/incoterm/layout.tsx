import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mercorama | AI-Powered Trade Intelligence - Incoterms Analyzer',
};

export default function IncotermLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

