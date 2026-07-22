import type { Metadata } from 'next';
import PrivacyContent from './_client';

export const metadata: Metadata = {
  title: 'Privacy Policy | Mercorama',
  description:
    "How MightyIQ Inc. collects, uses, and protects your personal data when you use Mercorama, in compliance with Canada's PIPEDA.",
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
