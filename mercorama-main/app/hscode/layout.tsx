import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HS Code Assistant | Mercorama',
  description: 'Accurate HS Code classification powered by AI. Get duty rates, misclassification warnings, and trade agreement insights for your products.',
  keywords: ['HS Code', 'Harmonized System', 'customs classification', 'duty rates', 'tariff code', 'product classification'],
};

export default function HSCodeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
