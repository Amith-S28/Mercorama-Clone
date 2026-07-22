'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

const sections = [
  {
    n: '1',
    title: 'Acceptance of Terms',
    content: (
      <p>
        By accessing and using Mercorama (the &ldquo;Platform&rdquo;), you accept and agree to be
        bound by these Terms of Service and all applicable laws and regulations. If you do not
        agree with any of these terms, you are prohibited from using this Platform.
      </p>
    ),
  },
  {
    n: '2',
    title: 'Description of Service',
    content: (
      <>
        <p>
          Mercorama is an AI-powered trade intelligence platform that provides tools to assist
          small and medium-sized enterprises (SMEs) with international trade decisions, including
          HS Code classification, Incoterm analysis, deal summary generation, payment alignment,
          risk assessment, FTA market discovery, and export market intelligence.
        </p>
        <p>
          The Platform is an information and planning tool. It does not function as a law firm,
          customs brokerage, freight forwarding agency, or licensed trade representative.
        </p>
      </>
    ),
  },
  {
    n: '3',
    title: 'Not Professional Advice',
    content: (
      <>
        <p>
          Nothing on Mercorama constitutes legal, financial, customs, or professional trade advice.
          All AI-generated outputs — including HS Code classifications, duty rates, Incoterm
          recommendations, deal summary references, and market analyses — are provided for
          informational and planning purposes only.
        </p>
        <p>
          You must independently verify all information with qualified customs brokers, freight
          forwarders, legal counsel, and official government sources before making any business
          decisions or filing any trade documentation.
        </p>
      </>
    ),
  },
  {
    n: '4',
    title: 'User Accounts',
    content: (
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and
        for all activities that occur under your account. You must notify us immediately of any
        unauthorized use of your account. We reserve the right to terminate accounts that violate
        these Terms.
      </p>
    ),
  },
  {
    n: '5',
    title: 'Plans and Payments',
    content: (
      <p>
        Mercorama offers subscription plans with varying feature access. Plan prices and included
        usage quotas are described on the{' '}
        <Link href="/beta" className="text-primary underline underline-offset-2">
          Pricing page
        </Link>{' '}
        and are subject to change with reasonable notice. All payments are processed securely.
        Subscriptions renew monthly or annually as selected at checkout.
      </p>
    ),
  },
  {
    n: '6',
    title: 'Acceptable Use',
    content: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Platform for any unlawful purpose or in violation of any trade laws or sanctions regimes</li>
          <li>Attempt to reverse engineer, copy, or resell any AI outputs or Platform components</li>
          <li>Transmit malicious code, spam, or interfere with the Platform&rsquo;s operation</li>
          <li>Use automated tools to scrape or extract data at scale without written consent</li>
        </ul>
      </>
    ),
  },
  {
    n: '7',
    title: 'Intellectual Property',
    content: (
      <p>
        All content, branding, and software on the Platform is the property of MightyIQ Inc. or
        its licensors. AI-generated outputs provided to you through the Platform may be used for
        your own business purposes, but may not be resold or redistributed as a standalone service.
      </p>
    ),
  },
  {
    n: '8',
    title: 'Limitation of Liability',
    content: (
      <p>
        To the fullest extent permitted by applicable law, MightyIQ Inc. shall not be liable for
        any indirect, incidental, special, consequential, or punitive damages arising from your
        use of the Platform or reliance on any AI-generated output, including but not limited to
        customs penalties, duty liabilities, contractual disputes, or lost profits.
      </p>
    ),
  },
  {
    n: '9',
    title: 'Use of Expert Advice & User Responsibility',
    content: (
      <>
        <p>
          The Platform provides access to independent consultants (&ldquo;Consultants&rdquo;) who may
          offer general information, strategic guidance, or tailored recommendations in areas such as
          market entry, export strategy, trade compliance, and logistics planning.
        </p>
        <p className="mt-3">
          All guidance provided through the Platform — whether through advisory calls, project-based
          engagements, or written deliverables — is for <strong>informational and advisory purposes
          only</strong> and does not constitute legal, financial, customs brokerage, or regulatory
          advice unless the Consultant is explicitly licensed to provide such advice and states so
          in writing.
        </p>
        <p className="mt-3">
          Users are solely responsible for evaluating, interpreting, and applying any advice or
          recommendations based on their specific circumstances. Users should independently verify
          all material information and consult qualified professionals before making binding business,
          legal, or financial decisions.
        </p>
        <p className="mt-3">
          To the maximum extent permitted by law, neither the Consultant nor the Platform shall be
          liable for any decisions made or actions taken by Users, or for any resulting outcomes,
          losses, or damages arising from reliance on guidance provided through the Platform.
        </p>
        <p className="mt-3">
          Users acknowledge that business, trade, and market outcomes are inherently uncertain, and
          no guarantees are made regarding results, revenue, market access, or regulatory outcomes.
        </p>
      </>
    ),
  },
  {
    n: '10',
    title: 'Disclaimer of Warranties',
    content: (
      <p>
        The Platform is provided &ldquo;as is&rdquo; without warranties of any kind, express or
        implied, including warranties of merchantability, fitness for a particular purpose, or
        accuracy of AI outputs. HS Code classifications, duty rates, and trade data are subject
        to change and must be verified with official sources.
      </p>
    ),
  },
  {
    n: '11',
    title: 'Governing Law',
    content: (
      <p>
        These Terms shall be governed by the laws of the Province of Nova Scotia and the federal
        laws of Canada applicable therein, without regard to conflict of law provisions.
      </p>
    ),
  },
  {
    n: '12',
    title: 'Changes to Terms',
    content: (
      <p>
        We reserve the right to modify these Terms at any time. We will notify users of material
        changes by email or by posting a notice on the Platform. Continued use of the Platform
        after such notification constitutes acceptance of the updated Terms.
      </p>
    ),
  },
  {
    n: '13',
    title: 'Contact',
    content: (
      <>
        <p>For questions regarding these Terms, please contact:</p>
        <address className="not-italic mt-3 space-y-0.5">
          <p className="font-semibold text-foreground">MightyIQ Inc.</p>
          <p>42 Lewis Drive, Bedford, Nova Scotia B4B 1C3, Canada</p>
          <p className="mt-1">legal@mercorama.com</p>
        </address>
      </>
    ),
  },
];

export default function TermsContent() {
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
              Terms of Service
            </h1>
            <p className="text-sm text-muted-foreground">
              See also:{' '}
              <Link href="/privacy" className="text-primary underline underline-offset-2 hover:opacity-80">
                Privacy Policy →
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
                  <div className="text-[15px] leading-[1.8] text-muted-foreground space-y-3 [&_ul]:mt-2 [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_ul]:list-disc">
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
