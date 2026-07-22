// app/freight-connect/claim/page.tsx
// 5-step forwarder claim wizard: Find → Verify CIFFA → Profile → Terms → Payment
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Truck, Search, CheckCircle2, ChevronRight, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  FC_PROVINCES,
  FC_TARGET_MARKETS,
  FC_HS_CHAPTERS,
  FC_SHIPPING_MODES,
} from '@/lib/freightConnectConstants';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

// ─── Types ─────────────────────────────────────────────────────────────────────

interface UnclaimedForwarder {
  id:                      string;
  company_name:            string;
  ciffa_membership_number: string | null;
  logo_url:                string | null;
  provinces:               string[];
  shipping_modes:          string[];
  lanes:                   string[];
  hs_chapters:             string[];
  website_url:             string | null;
  description:             string | null;
}

interface ProfileForm {
  contact_name:  string;
  contact_email: string;
  website_url:   string;
  description:   string;
  provinces:     string[];
  lanes:         string[];
  hs_chapters:   string[];
  shipping_modes: string[];
  logo_url:      string;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['Find Listing', 'Verify CIFFA', 'Profile', 'Terms', 'Payment'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                i < current
                  ? 'bg-primary text-primary-foreground'
                  : i === current
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i === current ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mt-[-10px] ${i < current ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1: Find Listing ─────────────────────────────────────────────────────

function Step1FindListing({
  onSelect,
}: {
  onSelect: (ff: UnclaimedForwarder) => void;
}) {
  const [query, setQuery]       = useState('');
  const [results, setResults]   = useState<UnclaimedForwarder[]>([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError]       = useState('');

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(false);

    try {
      const res = await fetch('/api/freight-connect/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ states: ['unclaimed'], limit: 20 }),
      });
      const data = await res.json() as { forwarders: UnclaimedForwarder[] };
      const q = query.toLowerCase();
      const filtered = (data.forwarders ?? []).filter(
        (f) =>
          f.company_name.toLowerCase().includes(q) ||
          (f.ciffa_membership_number ?? '').toLowerCase().includes(q)
      );
      setResults(filtered);
      setSearched(true);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Find Your Listing</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Search for your company by name or CIFFA membership number. Only unclaimed listings are shown.
      </p>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Company name or CIFFA number…"
          className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button onClick={search} disabled={loading || !query.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          <span className="ml-2">Search</span>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {searched && results.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No unclaimed listings found for &ldquo;{query}&rdquo;.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Not listed yet? Email <a href="mailto:support@mercorama.com" className="underline">support@mercorama.com</a> to add your company.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {results.map((ff) => (
          <Card key={ff.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onSelect(ff)}>
            <CardContent className="pt-4 pb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {ff.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ff.logo_url} alt={ff.company_name} className="h-10 w-10 rounded object-contain border" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm">{ff.company_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ff.ciffa_membership_number
                      ? `CIFFA: ${ff.ciffa_membership_number}`
                      : 'CIFFA number pending'
                    }
                    {ff.provinces.length > 0 && ` · ${ff.provinces.slice(0, 2).join(', ')}${ff.provinces.length > 2 ? '…' : ''}`}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline">
                This is my company <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Step 2: Verify CIFFA ─────────────────────────────────────────────────────

function Step2VerifyCiffa({
  forwarder,
  onVerified,
  onBack,
}: {
  forwarder: UnclaimedForwarder;
  onVerified: (ciffa: string) => void;
  onBack: () => void;
}) {
  const [ciffa, setCiffa]     = useState(forwarder.ciffa_membership_number ?? '');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function verify() {
    const trimmed = ciffa.trim();
    if (!trimmed) {
      setError('Please enter your CIFFA membership number.');
      return;
    }

    // Basic format check: CIFFA numbers are typically 5–10 alphanumeric chars
    if (!/^[A-Za-z0-9-]{3,15}$/.test(trimmed)) {
      setError('Invalid CIFFA membership number format.');
      return;
    }

    setLoading(true);
    setError('');

    // If the forwarder already has a CIFFA number on file, require it to match
    if (forwarder.ciffa_membership_number) {
      if (trimmed.toLowerCase() !== forwarder.ciffa_membership_number.toLowerCase()) {
        setError('This CIFFA number does not match our records for this listing. Contact support@mercorama.com if this is an error.');
        setLoading(false);
        return;
      }
    }

    // Small artificial delay to feel like verification
    await new Promise((r) => setTimeout(r, 600));
    setLoading(false);
    onVerified(trimmed);
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Verify CIFFA Membership</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Confirm your CIFFA membership number for <strong>{forwarder.company_name}</strong>. Only CIFFA-certified members can list on Freight Connect.
      </p>

      <div className="mb-6 p-4 rounded-lg bg-muted/40 border flex items-center gap-3">
        <Truck className="h-5 w-5 text-muted-foreground shrink-0" />
        <div>
          <p className="font-semibold text-sm">{forwarder.company_name}</p>
          {forwarder.ciffa_membership_number && (
            <p className="text-xs text-muted-foreground">On file: {forwarder.ciffa_membership_number}</p>
          )}
        </div>
      </div>

      <label className="block text-sm font-medium mb-1.5">
        CIFFA Membership Number
      </label>
      <input
        type="text"
        value={ciffa}
        onChange={(e) => setCiffa(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && verify()}
        placeholder="e.g. CIFFA-12345"
        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring mb-2"
      />

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive mb-4">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={verify} disabled={loading} className="flex-1">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Verifying…</> : 'Confirm Membership →'}
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Complete Profile ─────────────────────────────────────────────────

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  max,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  function toggle(v: string) {
    if (selected.includes(v)) {
      onChange(selected.filter((x) => x !== v));
    } else {
      if (max && selected.length >= max) return;
      onChange([...selected, v]);
    }
  }

  return (
    <div className="mb-5">
      <label className="block text-sm font-medium mb-1.5">
        {label}
        {max && <span className="ml-1 text-xs text-muted-foreground">(select up to {max})</span>}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              selected.includes(opt.value)
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-input text-muted-foreground hover:border-primary/50'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Step3Profile({
  forwarder,
  form,
  onChange,
  onNext,
  onBack,
}: {
  forwarder: UnclaimedForwarder;
  form: ProfileForm;
  onChange: (updates: Partial<ProfileForm>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  function set(key: keyof ProfileForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ [key]: e.target.value });
  }

  const fieldCls = 'w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring';
  const labelCls = 'block text-sm font-medium mb-1.5';

  function canProceed() {
    return (
      form.contact_name.trim().length > 0 &&
      form.contact_email.trim().includes('@') &&
      form.provinces.length > 0 &&
      form.shipping_modes.length > 0 &&
      form.hs_chapters.length > 0
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Complete Your Profile</h2>
      <p className="text-sm text-muted-foreground mb-6">
        This information appears on your listing and is shared with SMEs (except private contact details).
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        <div>
          <label className={labelCls}>Contact Name <span className="text-destructive">*</span></label>
          <input type="text" value={form.contact_name} onChange={set('contact_name')} placeholder="Jane Smith" className={fieldCls} />
        </div>
        <div>
          <label className={labelCls}>Contact Email <span className="text-destructive">*</span></label>
          <input type="email" value={form.contact_email} onChange={set('contact_email')} placeholder="jane@company.com" className={fieldCls} />
          <p className="text-xs text-muted-foreground mt-1">Never shared with SMEs until you reveal it.</p>
        </div>
      </div>

      <div className="mb-5">
        <label className={labelCls}>Website URL</label>
        <input type="url" value={form.website_url} onChange={set('website_url')} placeholder="https://yourcompany.com" className={fieldCls} />
      </div>

      <div className="mb-5">
        <label className={labelCls}>Company Description</label>
        <textarea
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          placeholder="Specialist in ocean freight from Western Canada to Asia-Pacific markets, 15+ years CIFFA member…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="mb-5">
        <label className={labelCls}>Logo URL <span className="text-xs text-muted-foreground">(optional — square PNG or SVG preferred)</span></label>
        <input type="url" value={form.logo_url} onChange={set('logo_url')} placeholder="https://yourcompany.com/logo.png" className={fieldCls} />
      </div>

      <MultiSelect
        label="Origin Provinces *"
        options={FC_PROVINCES.map((p) => ({ value: p, label: p }))}
        selected={form.provinces}
        onChange={(v) => onChange({ provinces: v })}
      />

      <MultiSelect
        label="Target Markets (Lanes) *"
        options={FC_TARGET_MARKETS.map((m) => ({ value: m, label: m }))}
        selected={form.lanes}
        onChange={(v) => onChange({ lanes: v })}
        max={15}
      />

      <MultiSelect
        label="HS Chapters Served *"
        options={FC_HS_CHAPTERS.map((c) => ({ value: c.code, label: c.label }))}
        selected={form.hs_chapters}
        onChange={(v) => onChange({ hs_chapters: v })}
        max={20}
      />

      <MultiSelect
        label="Shipping Modes *"
        options={FC_SHIPPING_MODES.map((m) => ({ value: m.value, label: m.label }))}
        selected={form.shipping_modes}
        onChange={(v) => onChange({ shipping_modes: v })}
      />

      <div className="flex gap-3 mt-6">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={!canProceed()} className="flex-1">
          Continue to Terms →
        </Button>
      </div>

      {!canProceed() && (
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Contact name, email, provinces, shipping modes, and at least one HS chapter are required.
        </p>
      )}
    </div>
  );
}

// ─── Step 4: Partner Terms ────────────────────────────────────────────────────

const PARTNER_TERMS = `
MERCORAMA FREIGHT CONNECT — PARTNER TERMS

Last updated: March 2026

1. ELIGIBILITY
   1.1 Only CIFFA-certified freight forwarders in good standing may claim a listing on Mercorama Freight Connect.
   1.2 You represent that your CIFFA membership is current and that all information provided during onboarding is accurate.

2. SERVICES
   2.1 By claiming a listing, you gain access to anonymised freight quote requests from Canadian SME exporters.
   2.2 Pay-per-lead forwarders (Claimed tier) are charged $99 CAD (quote_only) or $149 CAD (anonymised_profile) per quote request delivered. These fees are non-refundable unless you fail to respond within the SLA window.
   2.3 Verified and Featured tier forwarders receive leads at no per-lead charge in exchange for their subscription commitment.

3. SERVICE LEVEL AGREEMENT (SLA)
   3.1 You commit to responding to every quote request within 48 hours of receipt.
   3.2 Failure to respond within the SLA window will count as a missed response.
   3.3 Three consecutive missed responses will result in automatic suspension of your listing.
   3.4 Mercorama will refund any lead fee charged for a missed-response quote.

4. PRIVACY AND DATA HANDLING
   4.1 The SME's identity (name, email, company) is never disclosed to you until the SME explicitly chooses to reveal it.
   4.2 You agree not to attempt to identify the SME through HS chapter, province, or shipment volume data.
   4.3 Upon identity reveal, you may contact the SME solely for the purpose of progressing the freight arrangement described in the quote request.
   4.4 You will not use SME contact details for marketing, resale, or any purpose unrelated to the specific quote request.

5. BILLING
   5.1 Pay-per-lead charges are processed at the time a quote request is assigned to your listing.
   5.2 Subscriptions (Verified/Featured) are billed monthly or annually as selected at checkout.
   5.3 Annual subscriptions are non-refundable after the 7-day grace period.
   5.4 Founding Partner pricing (if applicable) locks in the discounted rate for 12 months from the subscription start date.

6. CONDUCT
   6.1 You agree to provide accurate rate estimates and transit times in your quote responses.
   6.2 You will not solicit alternative business unrelated to the requested shipment during the anonymised phase of the interaction.
   6.3 Mercorama reserves the right to remove listings that generate repeated SME complaints or fail SLA requirements.

7. INTELLECTUAL PROPERTY
   7.1 Your company logo and profile description remain your property. You grant Mercorama a licence to display them on the platform.
   7.2 Quote request data generated through the platform is confidential and may not be exported or shared with third parties.

8. LIMITATION OF LIABILITY
   8.1 Mercorama is a matching platform only and is not a party to any freight contract between you and an SME.
   8.2 Mercorama's liability to you is limited to refunding any lead fees charged in error.

9. CHANGES TO TERMS
   9.1 Mercorama may update these terms with 30 days' notice by email to your registered contact address.
   9.2 Continued use of the platform after the notice period constitutes acceptance.

10. GOVERNING LAW
    10.1 These terms are governed by the laws of the Province of Ontario and the federal laws of Canada applicable therein.

By completing the claim process, you confirm that you have read, understood, and agree to these Partner Terms.
`.trim();

function Step4Terms({
  onAgree,
  onBack,
}: {
  onAgree: () => void;
  onBack: () => void;
}) {
  const scrollRef        = useRef<HTMLDivElement>(null);
  const [reached, setReached] = useState(false);
  const [agreed, setAgreed]   = useState(false);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (atBottom) setReached(true);
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Partner Terms</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Read the Partner Terms in full before proceeding. Scroll to the bottom to enable the agreement checkbox.
      </p>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="h-80 overflow-y-auto rounded-lg border bg-muted/20 p-5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono mb-4"
      >
        {PARTNER_TERMS}
      </div>

      {!reached && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          Scroll to the bottom to enable the checkbox.
        </p>
      )}

      <label className={`flex items-start gap-2.5 cursor-pointer mb-6 ${!reached ? 'opacity-40 pointer-events-none' : ''}`}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          disabled={!reached}
          className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
        />
        <span className="text-sm leading-snug">
          I have read and agree to the Mercorama Freight Connect Partner Terms, including the 48-hour SLA requirement and pay-per-lead billing policy.
        </span>
      </label>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onAgree} disabled={!agreed} className="flex-1">
          Agree &amp; Continue to Payment →
        </Button>
      </div>
    </div>
  );
}

// ─── Step 5: Payment (Stripe Elements inner component) ───────────────────────

function PaymentForm({
  forwarder,
  profile,
  onSuccess,
  onBack,
}: {
  forwarder: UnclaimedForwarder;
  profile:   ProfileForm;
  onSuccess: () => void;
  onBack:    () => void;
}) {
  const stripe   = useStripe();
  const elements = useElements();

  const [clientSecret, setClientSecret] = useState('');
  const [customerId,   setCustomerId]   = useState('');
  const [loading,      setLoading]      = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [error,        setError]        = useState('');

  const fetchSetupIntent = useCallback(async () => {
    setSetupLoading(true);
    try {
      const res = await fetch('/api/freight-connect/stripe/setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forwarder_id:  forwarder.id,
          company_name:  forwarder.company_name,
          contact_email: profile.contact_email,
        }),
      });
      const data = await res.json() as { clientSecret: string; customerId: string };
      setClientSecret(data.clientSecret);
      setCustomerId(data.customerId);
    } catch {
      setError('Failed to initialize payment. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  }, [forwarder.id, forwarder.company_name, profile.contact_email]);

  useEffect(() => {
    fetchSetupIntent();
  }, [fetchSetupIntent]);

  async function handleSubmit() {
    if (!stripe || !elements || !clientSecret) return;

    setLoading(true);
    setError('');

    const cardEl = elements.getElement(CardElement);
    if (!cardEl) {
      setError('Card element not found.');
      setLoading(false);
      return;
    }

    // Confirm the SetupIntent to save the card
    const { error: stripeError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: cardEl,
        billing_details: {
          name:  profile.contact_name,
          email: profile.contact_email,
        },
      },
    });

    if (stripeError || !setupIntent?.payment_method) {
      setError(stripeError?.message ?? 'Card setup failed. Please check your details.');
      setLoading(false);
      return;
    }

    const paymentMethodId = typeof setupIntent.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent.payment_method.id;

    // Submit claim to backend
    const claimRes = await fetch('/api/freight-connect/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        forwarder_id:              forwarder.id,
        contact_name:              profile.contact_name,
        contact_email:             profile.contact_email,
        website_url:               profile.website_url || undefined,
        description:               profile.description || undefined,
        provinces:                 profile.provinces,
        lanes:                     profile.lanes,
        hs_chapters:               profile.hs_chapters,
        shipping_modes:            profile.shipping_modes,
        logo_url:                  profile.logo_url || undefined,
        stripe_customer_id:        customerId,
        stripe_payment_method_id:  paymentMethodId,
      }),
    });

    const claimData = await claimRes.json() as { state?: string; error?: string };

    if (!claimRes.ok) {
      if (claimData.error === 'listing_already_claimed') {
        setError('This listing has already been claimed. If you believe this is an error, contact support@mercorama.com.');
      } else {
        setError(claimData.error ?? 'Claim failed. Please try again.');
      }
      setLoading(false);
      return;
    }

    onSuccess();
  }

  const CARD_STYLE = {
    style: {
      base: {
        fontSize:       '14px',
        color:          '#0f172a',
        fontFamily:     'system-ui, sans-serif',
        '::placeholder': { color: '#94a3b8' },
      },
    },
  };

  if (setupLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-1">Add Payment Method</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Your card is saved securely for pay-per-lead charges ($99–$149 CAD per quote request). No charge today.
      </p>

      <div className="mb-6 rounded-lg border bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800 p-4">
        <p className="text-sm font-semibold text-sky-800 dark:text-sky-300 mb-1">Pay-per-lead billing</p>
        <ul className="text-xs text-sky-700 dark:text-sky-400 space-y-1">
          <li>• $99 CAD per quote request (quote only)</li>
          <li>• $149 CAD per quote request (anonymised profile)</li>
          <li>• Charged only when a matching SME submits a request to you</li>
          <li>• Automatically refunded if you miss the 48-hour SLA</li>
          <li>• Upgrade to Verified / Featured for free leads + subscription model</li>
        </ul>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Card Details</label>
        <div className="rounded-md border border-input bg-background px-3 py-3">
          <CardElement options={CARD_STYLE} />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 mb-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={onBack} disabled={loading}>Back</Button>
        <Button onClick={handleSubmit} disabled={loading || !stripe} className="flex-1">
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Claiming listing…</>
            : 'Claim My Listing →'
          }
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-3">
        Secured by Stripe. Mercorama never stores your card details.
      </p>
    </div>
  );
}

// ─── Step 5 wrapper (Stripe Elements provider) ───────────────────────────────

function Step5Payment(props: {
  forwarder: UnclaimedForwarder;
  profile:   ProfileForm;
  onSuccess: () => void;
  onBack:    () => void;
}) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function ClaimSuccess({ companyName }: { companyName: string }) {
  const router = useRouter();

  return (
    <div className="text-center py-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mx-auto mb-4">
        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <h2 className="text-2xl font-bold mb-2">You&apos;re live on Freight Connect</h2>
      <p className="text-muted-foreground mb-2">
        <strong>{companyName}</strong> is now an active listing. SME exporters can find and request quotes from you.
      </p>
      <p className="text-sm text-muted-foreground mb-8">
        We&apos;ve sent a confirmation to your contact email. Check your inbox for next steps.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={() => router.push('/freight-connect/upgrade')}>
          Upgrade to Verified / Featured →
        </Button>
        <Button variant="outline" onClick={() => router.push('/freight-connect')}>
          View Freight Connect Directory
        </Button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const DEFAULT_PROFILE: ProfileForm = {
  contact_name:  '',
  contact_email: '',
  website_url:   '',
  description:   '',
  provinces:     [],
  lanes:         [],
  hs_chapters:   [],
  shipping_modes: [],
  logo_url:      '',
};

export default function ClaimPage() {
  const [step,      setStep]     = useState(0);
  const [forwarder, setForwarder] = useState<UnclaimedForwarder | null>(null);
  const [profile,   setProfile]  = useState<ProfileForm>(DEFAULT_PROFILE);
  const [success,   setSuccess]  = useState(false);

  function handleSelectForwarder(ff: UnclaimedForwarder) {
    setForwarder(ff);
    // Pre-populate profile from existing listing data
    setProfile({
      contact_name:  '',
      contact_email: '',
      website_url:   ff.website_url ?? '',
      description:   ff.description ?? '',
      provinces:     ff.provinces ?? [],
      lanes:         ff.lanes ?? [],
      hs_chapters:   ff.hs_chapters ?? [],
      shipping_modes: (ff.shipping_modes as string[]) ?? [],
      logo_url:      ff.logo_url ?? '',
    });
    setStep(1);
  }

  if (success && forwarder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <ClaimSuccess companyName={forwarder.company_name} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-lg bg-sky-100 dark:bg-sky-900/30 px-3 py-1.5 mb-4">
          <Truck className="h-4 w-4 text-sky-700 dark:text-sky-400" />
          <span className="text-sm font-medium text-sky-700 dark:text-sky-400">Freight Connect</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Claim Your Listing</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Receive freight quote requests from Canadian SME exporters. CIFFA members only.
        </p>
      </div>

      <StepBar current={step} />

      {step === 0 && (
        <Step1FindListing onSelect={handleSelectForwarder} />
      )}

      {step === 1 && forwarder && (
        <Step2VerifyCiffa
          forwarder={forwarder}
          onVerified={() => setStep(2)}
          onBack={() => { setStep(0); setForwarder(null); }}
        />
      )}

      {step === 2 && forwarder && (
        <Step3Profile
          forwarder={forwarder}
          form={profile}
          onChange={(u) => setProfile((p) => ({ ...p, ...u }))}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && (
        <Step4Terms
          onAgree={() => setStep(4)}
          onBack={() => setStep(2)}
        />
      )}

      {step === 4 && forwarder && (
        <Step5Payment
          forwarder={forwarder}
          profile={profile}
          onSuccess={() => setSuccess(true)}
          onBack={() => setStep(3)}
        />
      )}
    </div>
  );
}
