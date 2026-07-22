import { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ShieldCheck, Shield, UserCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Expert Verification Policy – Mercorama',
  description: 'How Mercorama verifies trade experts across three tiers — licensed professionals, credentialed advisors, and peer mentors.',
};

const TIERS = [
  {
    tier: 1,
    icon: ShieldCheck,
    label: 'Licensed & Verified',
    color: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
    iconColor: 'text-green-700 dark:text-green-400',
    who: 'CITP/FIBP designees, Licensed Customs Brokers (CSCB), CIFFA-certified Freight Forwarders',
    process: [
      'Designation or license number collected during onboarding.',
      'Verified against the public registry of the issuing body (FITT, CSCB, CIFFA).',
      'License number displayed on the expert\'s profile with a link to the registry.',
      'Re-verified annually or when the registry updates.',
    ],
  },
  {
    tier: 2,
    icon: Shield,
    label: 'Credentials Verified',
    color: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
    iconColor: 'text-blue-700 dark:text-blue-400',
    who: 'Trade compliance officers, FTA advisors, export finance consultants, logistics specialists',
    process: [
      'Professional credentials and relevant certifications reviewed by Mercorama admin.',
      'LinkedIn profile cross-referenced for employment history and endorsements.',
      'Identity verified via government-issued ID.',
      'Not a licensed customs broker — profile clearly states this.',
    ],
  },
  {
    tier: 3,
    icon: UserCheck,
    label: 'Identity Verified',
    color: 'border-border bg-muted/30',
    iconColor: 'text-muted-foreground',
    who: 'Experienced exporters, peer mentors, industry practitioners',
    process: [
      'Basic identity verification via government-issued ID.',
      'Self-declared experience and expertise areas.',
      'Profile marked as peer experience only — not professional trade advice.',
    ],
  },
];

export default function VerificationPolicyPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16 md:py-24 space-y-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Expert Verification Policy</h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Mercorama operates a three-tier verification system for trade experts listed on our marketplace.
            Each expert&apos;s verification level is displayed on their profile so you can make informed decisions
            about who to work with.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Last updated: April 2026</p>
        </div>

        <div className="space-y-6">
          {TIERS.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.tier} className={`rounded-xl border p-6 space-y-4 ${t.color}`}>
                <div className="flex items-center gap-3">
                  <Icon className={`h-6 w-6 ${t.iconColor}`} />
                  <div>
                    <div className="font-semibold text-lg">Tier {t.tier} — {t.label}</div>
                    <p className="text-sm text-muted-foreground">{t.who}</p>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">Verification process:</div>
                  <ul className="space-y-1.5">
                    {t.process.map((step, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex gap-2">
                        <span className="text-xs font-mono text-muted-foreground/60 mt-0.5 shrink-0">{i + 1}.</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <section className="rounded-xl border bg-muted/30 p-6">
          <h2 className="text-lg font-semibold mb-2">Important Disclaimers</h2>
          <div className="text-sm text-muted-foreground space-y-2 leading-relaxed">
            <p>Mercorama facilitates discovery and booking only. We are not a customs brokerage, law firm, or financial institution.</p>
            <p>Verification confirms the expert&apos;s identity and stated credentials — it does not guarantee the quality, accuracy, or outcome of any advice provided during a session.</p>
            <p>Sessions are for informational and educational purposes only. Always consult qualified professionals for binding customs, legal, or financial decisions.</p>
            <p>If you believe an expert&apos;s credentials are misrepresented, contact us at <a href="mailto:trust@mercorama.com" className="text-primary hover:underline">trust@mercorama.com</a>.</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
