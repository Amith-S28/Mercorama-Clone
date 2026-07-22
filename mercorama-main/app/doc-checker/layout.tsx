import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Smart Doc Checker | Mercorama',
  description: 'Validate export and import documents before shipping. Detect missing fields, LC discrepancies, and compliance risks instantly.',
};

export default function DocCheckerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
