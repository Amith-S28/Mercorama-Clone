'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

const sections = [
  {
    n: '1',
    title: 'Information We Collect',
    content: (
      <>
        <p>We collect the following types of information:</p>
        <ul>
          <li>
            <strong>Account information:</strong> Your name, email address, and company name when
            you register for an account.
          </li>
          <li>
            <strong>Tool inputs:</strong> Product descriptions, trade corridors, HS Codes, deal
            summary details, Incoterm selections, and other information you enter when using
            Mercorama&rsquo;s analysis tools — including the HS Code Assistant, Incoterm Analyzer,
            Deal Wizard, Export Compass, and FTA Diversify Wizard.
          </li>
          <li>
            <strong>Usage data:</strong> Page views, feature usage, session duration, and
            interaction data collected to improve the Platform.
          </li>
          <li>
            <strong>Payment information:</strong> Billing details processed securely through our
            payment provider. We do not store full card numbers.
          </li>
          <li>
            <strong>Communications:</strong> Messages you send us via the contact form or email.
          </li>
        </ul>
      </>
    ),
  },
  {
    n: '2',
    title: 'How We Use Your Information',
    content: (
      <>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide and improve the Mercorama Platform and its AI-powered tools</li>
          <li>Process payments and manage your subscription</li>
          <li>Send transactional emails (account verification, analysis reports, invoices)</li>
          <li>Respond to support and contact form inquiries</li>
          <li>Analyse usage patterns to improve Platform performance and features</li>
          <li>Comply with legal obligations</li>
        </ul>
      </>
    ),
  },
  {
    n: '3',
    title: 'Data Security',
    content: (
      <p>
        All data transmitted to and from Mercorama is encrypted in transit using TLS. Data stored
        in our systems is protected using industry-standard security measures, including encryption
        at rest. We regularly review our security practices to protect your information.
      </p>
    ),
  },
  {
    n: '4',
    title: 'We Do Not Sell Your Data',
    content: (
      <p>
        We do not sell, rent, or trade your personal information to third parties. We do not share
        your trade inputs, analysis results, or business data with any government authority,
        employer, competitor, or external entity without your explicit consent, except where
        required by law.
      </p>
    ),
  },
  {
    n: '5',
    title: 'Third-Party Services',
    content: (
      <>
        <p>We use the following third-party services to operate the Platform:</p>
        <ul>
          <li>
            <strong>Anthropic API:</strong> Processes your tool inputs to generate AI analysis.
            Inputs are not used to train Anthropic&rsquo;s models under our enterprise agreement.
          </li>
          <li>
            <strong>Supabase:</strong> Hosts our database for account management and stored analyses.
          </li>
          <li>
            <strong>Stripe:</strong> Processes payments securely.
          </li>
          <li>
            <strong>Google Analytics:</strong> Collects anonymised usage statistics.
          </li>
        </ul>
        <p>Each service operates under its own privacy policy and data processing agreement.</p>
      </>
    ),
  },
  {
    n: '6',
    title: 'Data Retention',
    content: (
      <p>
        We retain your account information for as long as your account is active. Analysis inputs
        and outputs are retained to support your saved history feature and may be deleted upon
        account deletion. PDF reports generated and emailed to you remain available for 30 days
        after generation.
      </p>
    ),
  },
  {
    n: '7',
    title: 'Your Rights',
    content: (
      <>
        <p>Under PIPEDA and applicable provincial privacy laws, you have the right to:</p>
        <ul>
          <li>Access the personal information we hold about you</li>
          <li>Request correction of inaccurate information</li>
          <li>Request deletion of your account and associated data</li>
          <li>Withdraw consent to data processing (subject to contractual obligations)</li>
          <li>Lodge a complaint with the Office of the Privacy Commissioner of Canada</li>
        </ul>
        <p>To exercise these rights, contact us at privacy@mercorama.com.</p>
      </>
    ),
  },
  {
    n: '8',
    title: 'Cookies',
    content: (
      <p>
        We use cookies and similar technologies to maintain your session, remember preferences,
        and collect anonymous usage statistics via Google Analytics. You may disable non-essential
        cookies in your browser settings; this may affect some Platform functionality.
      </p>
    ),
  },
  {
    n: '9',
    title: 'Changes to This Policy',
    content: (
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material
        changes by email or by posting a prominent notice on the Platform. The date at the top
        of this page indicates when the policy was last revised.
      </p>
    ),
  },
  {
    n: '10',
    title: 'Contact',
    content: (
      <>
        <p>For privacy-related questions or to exercise your rights, contact our Privacy Officer:</p>
        <address className="not-italic mt-3 space-y-0.5">
          <p className="font-semibold text-foreground">Privacy Officer, MightyIQ Inc.</p>
          <p>42 Lewis Drive, Bedford, Nova Scotia B4B 1C3, Canada</p>
          <p className="mt-1">privacy@mercorama.com</p>
        </address>
      </>
    ),
  },
];

export default function PrivacyContent() {
  const [activeSection, setActiveSection] = useState<string>('1');
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.id.replace('section-', '');
          setActiveSection(id);
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach((s) => {
      const el = document.getElementById(`section-${s.n}`);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2 sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              See also:{' '}
              <Link href="/terms" className="text-primary underline underline-offset-2 hover:opacity-80">
                Terms of Service →
              </Link>
            </p>
          </div>

          {/* Company intro block */}
          <div className="mb-10 rounded-lg border border-border bg-muted/40 px-5 py-4 text-[14px] leading-[1.75] text-muted-foreground">
            <p>
              MightyIQ Inc. (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;,
              &ldquo;our&rdquo;) is a corporation registered in Nova Scotia, Canada under
              Corporation Number 784042103, with its registered office at 42 Lewis Drive, Bedford,
              Nova Scotia, B4B&nbsp;1C3, Canada. The Company operates the website{' '}
              <a
                href="https://www.mercorama.com"
                className="text-primary underline underline-offset-2"
              >
                www.mercorama.com
              </a>{' '}
              (the &ldquo;Website&rdquo;) and the Mercorama platform (the &ldquo;Platform&rdquo;).
            </p>
            <p className="mt-3 text-xs text-muted-foreground/70">
              Last updated: March 17, 2026&nbsp;&nbsp;·&nbsp;&nbsp;Effective date: March 17, 2026
            </p>
          </div>

          <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-16">

            {/* Sticky sidebar */}
            <aside className="hidden lg:block">
              <nav className="sticky top-8 rounded-lg border border-border bg-card p-3">
                <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Contents
                </p>
                <ul className="space-y-0.5">
                  {sections.map((s) => {
                    const isActive = activeSection === s.n;
                    return (
                      <li key={s.n}>
                        <a
                          href={`#section-${s.n}`}
                          onClick={() => setActiveSection(s.n)}
                          className={[
                            'flex items-baseline gap-2 rounded-md py-1.5 text-[13px] leading-snug transition-all duration-150 border-l-2 px-2',
                            isActive
                              ? 'font-semibold border-[#FF6100]'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground border-transparent',
                          ].join(' ')}
                          style={isActive ? { color: '#FF6100', backgroundColor: '#FF610014' } : undefined}
                        >
                          <span className={['font-mono text-[11px] shrink-0', isActive ? 'opacity-70' : 'opacity-40'].join(' ')}>
                            {s.n}.
                          </span>
                          <span>{s.title}</span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </aside>

            {/* Main content */}
            <div className="space-y-10 min-w-0">
              {sections.map((s) => (
                <section key={s.n} id={`section-${s.n}`} className="scroll-mt-8">
                  <h2 className="text-[19px] font-bold text-foreground mb-3 leading-snug">
                    {s.n}. {s.title}
                  </h2>
                  <div className="text-[15px] leading-[1.8] text-muted-foreground space-y-3 [&_ul]:mt-2 [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:list-disc [&_strong]:text-foreground [&_strong]:font-semibold">
                    {s.content}
                  </div>
                </section>
              ))}
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
