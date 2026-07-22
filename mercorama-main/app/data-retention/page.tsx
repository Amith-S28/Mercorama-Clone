// app/data-retention/page.tsx
import { Metadata } from 'next';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'Data Retention Policy – Mercorama',
  description: 'How Mercorama handles, stores, and retains data processed by AI language models including Anthropic Claude, Ollama, and other providers.',
};

const AI_PROVIDERS = [
  {
    name: 'Anthropic — Claude (Haiku & Sonnet)',
    role: 'Primary AI engine for trade analysis, deal document generation, HS code classification, Incoterm recommendations, and Export Compass results.',
    inputRetention: 'Not used for model training by default. Anthropic may retain API inputs and outputs for up to 30 days for trust & safety review. No data is used to train or fine-tune models. Exception: the Deal Summary Generator sends seller and buyer party names to Claude — these are required to draft a valid trade agreement and are the only business identifiers included in any prompt.',
    outputRetention: 'Responses are returned in real time and are not stored by Anthropic beyond the 30-day safety review window.',
    dataLocation: 'Processed on Anthropic infrastructure (United States). Anthropic is SOC 2 Type II certified.',
    userControl: 'Account data (email, password) is never included in prompts. Most tools send only product/trade descriptions. The Deal Summary Generator sends party names (seller, buyer) as these are required to draft the trade agreement.',
    policyUrl: 'https://www.anthropic.com/legal/privacy',
  },
  {
    name: 'Ollama — Local SLM (Mistral / Phi-4 Mini)',
    role: 'On-premise small language model for lightweight definitional queries (Incoterm definitions, HS heading lookups, clause templates). Planned — not yet live.',
    inputRetention: 'Zero. The model runs entirely on the Mercorama Hetzner VPS. No data is transmitted to any external service.',
    outputRetention: 'Zero. Inference is local; no logs leave the server unless Mercorama\'s own application logging captures them (see Platform Logs below).',
    dataLocation: 'Mercorama production server — Hetzner VPS (Germany, EU). Data never leaves this server.',
    userControl: 'Full. Because processing is local, Mercorama has complete control over what is logged and how long it is kept.',
    policyUrl: 'https://ollama.com',
  },
];

const PLATFORM_DATA = [
  {
    category: 'Account Data',
    what: 'Email address, name, password hash (via Supabase Auth), plan tier, beta cohort.',
    retention: 'Held for the lifetime of your account. Deleted within 30 days of account deletion request.',
    legal: 'Contract performance (account access) · Legitimate interest (fraud prevention)',
  },
  {
    category: 'Tool Inputs & Outputs',
    what: 'Text entered into Mercorama tools (HS code descriptions, trade agreement clauses, Incoterm queries) and the AI-generated responses returned to you.',
    retention: 'Session data is not persisted to the database by default. If saved results are introduced in future, the retention period will be stated at the point of save.',
    legal: 'Legitimate interest (service improvement, error diagnosis)',
  },
  {
    category: 'Usage Logs',
    what: 'API route hits, tool run counts, feature access timestamps. No prompt content is stored in logs.',
    retention: 'Rolling 90-day window. Logs older than 90 days are purged automatically.',
    legal: 'Legitimate interest (rate limiting, abuse prevention, billing verification)',
  },
  {
    category: 'Billing & Payment Data',
    what: 'Stripe customer ID, subscription status, plan history. Card details are held exclusively by Stripe — Mercorama never stores raw card numbers.',
    retention: 'Retained for 7 years to comply with Canadian financial record-keeping obligations.',
    legal: 'Legal obligation (CRA record-keeping) · Contract performance',
  },
  {
    category: 'Export Compass Reports',
    what: 'Market intelligence results generated for your product–country combination.',
    retention: 'Not currently persisted. If report saving is introduced, results will be held for 12 months or until you delete them — whichever comes first.',
    legal: 'Contract performance',
  },
];

export default function DataRetentionPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-16 md:py-24 space-y-16">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Data Retention Policy</h1>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            Mercorama is an AI-powered platform. Every query you submit may be processed by one or
            more language models. This page explains exactly which AI providers we use, what data
            they receive, how long they hold it, and what Mercorama itself retains.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">Last updated: March 2026 · Operated by MightyIQ Inc., Bedford, NS, Canada</p>
        </div>

        {/* Principle */}
        <section className="rounded-xl border bg-muted/30 p-6">
          <h2 className="text-lg font-semibold mb-2">Our Core Principle</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your account data — email address, password, and billing details — is never included in
            AI prompts. Most tools send only product descriptions, HS codes, and trade parameters.
            The one exception is the Deal Summary Generator, which sends seller and buyer party names
            to Claude because a trade agreement cannot be drafted without them. Where processing can be
            handled locally (via Ollama), we prefer that over sending data to an external service.
          </p>
        </section>

        {/* AI Provider Policies */}
        <section>
          <h2 className="text-xl font-semibold mb-1">AI Provider Data Handling</h2>
          <p className="text-sm text-muted-foreground mb-6">
            The following covers every language model Mercorama uses or has planned.
          </p>
          <div className="space-y-6">
            {AI_PROVIDERS.map((p) => (
              <div key={p.name} className="rounded-xl border p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-base">{p.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{p.role}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium text-foreground mb-0.5">Input retention</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.inputRetention}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-foreground mb-0.5">Output retention</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.outputRetention}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-foreground mb-0.5">Data location</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.dataLocation}</p>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-foreground mb-0.5">PII in prompts</div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.userControl}</p>
                  </div>
                </div>
                <a
                  href={p.policyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs"
                >
                  {p.name.split('—')[0].trim()} privacy policy →
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Platform Data */}
        <section>
          <h2 className="text-xl font-semibold mb-1">What Mercorama Stores</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Separate from AI providers, Mercorama&apos;s own platform retains the following categories of data.
          </p>
          <div className="space-y-3">
            {PLATFORM_DATA.map((d) => (
              <div key={d.category} className="rounded-xl border p-4 space-y-2">
                <div className="font-semibold text-sm">{d.category}</div>
                <p className="text-xs text-muted-foreground leading-relaxed">{d.what}</p>
                <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1">
                  <div>
                    <span className="text-xs font-medium text-foreground">Retention: </span>
                    <span className="text-xs text-muted-foreground">{d.retention}</span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-foreground">Legal basis: </span>
                    <span className="text-xs text-muted-foreground">{d.legal}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Third-party services */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Other Third-Party Services</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { name: 'Supabase', role: 'Authentication & database (Postgres)', note: 'Hosted on AWS ca-central-1 (Canada). SOC 2 Type II.' },
              { name: 'Stripe', role: 'Payment processing', note: 'PCI DSS Level 1. Card data never touches Mercorama servers.' },
              { name: 'Resend', role: 'Transactional email delivery', note: 'Used to send Export Compass and FTA Diversify PDF reports to the email address you provide. Only your email address and the report content are transmitted. Resend does not use this data for marketing.' },
              { name: 'Hetzner', role: 'VPS hosting (application server)', note: 'Located in Germany (EU). GDPR-compliant data centre.' },
              { name: 'UN Comtrade / Statistics Canada / USITC / CBSA', role: 'Public trade datasets', note: 'Read-only API access. No user data is sent to these sources.' },
            ].map((s) => (
              <div key={s.name} className="rounded-xl border p-4 space-y-1">
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-xs text-muted-foreground">{s.role}</div>
                <div className="text-xs text-muted-foreground/80">{s.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* User Rights */}
        <section>
          <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            As a Canadian resident you have rights under PIPEDA. As an EU/UK resident you have rights
            under GDPR/UK GDPR. These include the right to access, correct, and delete personal data
            we hold about you.
          </p>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            {[
              { right: 'Access', desc: 'Request a copy of all personal data we hold about you.' },
              { right: 'Deletion', desc: 'Request deletion of your account and associated data. We action deletion requests within 30 days.' },
              { right: 'Correction', desc: 'Ask us to correct inaccurate data. Account details can be updated directly in your profile.' },
            ].map((r) => (
              <div key={r.right} className="rounded-xl border p-4">
                <div className="font-semibold mb-1">{r.right}</div>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            To exercise any of these rights, email{' '}
            <a href="mailto:privacy@mercorama.com" className="text-primary hover:underline">
              privacy@mercorama.com
            </a>
            . We will respond within 30 days.
          </p>
        </section>

        {/* Updates */}
        <section className="rounded-xl border bg-muted/30 p-6">
          <h2 className="text-lg font-semibold mb-2">Policy Updates</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We will update this page whenever we add a new AI provider, change a retention period,
            or modify how we handle data. Material changes will be communicated by email to registered
            users at least 14 days before taking effect. The &ldquo;Last updated&rdquo; date at the
            top of this page always reflects the most recent revision.
          </p>
        </section>

      </main>

      <Footer />
    </div>
  );
}
