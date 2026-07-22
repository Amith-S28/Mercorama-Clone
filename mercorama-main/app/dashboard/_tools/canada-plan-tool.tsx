'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Loader2, ArrowRight, Store, Truck, ShieldCheck, TrendingUp, Clock, CheckCircle2, AlertTriangle, Users, Globe, ExternalLink, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CanadaPlan {
  provinceName: string;
  productSummary: string;
  retailStrategy: {
    phase1: { chain: string; rationale: string; timeline: string }[];
    phase2: { chain: string; rationale: string; timeline: string }[];
  };
  distributorStrategy: {
    recommended: { name: string; model: string; rationale: string }[];
    approach: string;
  };
  pricingGuidance: string;
  regulatorySteps: string[];
  timeline: { milestone: string; timeframe: string }[];
  risks: string[];
  investmentEstimate: string;
}

export function CanadaPlanTool() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState<CanadaPlan | null>(null);
  const [provinceData, setProvinceData] = useState<Record<string, unknown> | null>(null);
  const [provinceName, setProvinceName] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [product, setProduct] = useState('');
  const [error, setError] = useState('');

  // Read context from localStorage
  useEffect(() => {
    let prov = '';
    let prod = '';
    let code = '';

    try {
      const focus = localStorage.getItem('mercorama_canada_focus');
      if (focus) {
        const parsed = JSON.parse(focus);
        prov = parsed.province ?? '';
      }
    } catch {}

    try {
      const snap = localStorage.getItem('mercorama_snapshot');
      if (snap) {
        const parsed = JSON.parse(snap);
        prod = parsed.productDescription ?? '';
      }
    } catch {}

    // Map province name to code
    const codeMap: Record<string, string> = {
      'Nova Scotia': 'NS', 'Ontario': 'ON', 'British Columbia': 'BC', 'Alberta': 'AB',
    };
    code = codeMap[prov] ?? '';

    setProvinceName(prov);
    setProvinceCode(code);
    setProduct(prod);

    if (!prov || !prod) {
      setError('Complete your business profile and select a Canada market first.');
      setLoading(false);
      return;
    }

    // Check for cached plan
    try {
      const cached = localStorage.getItem('mercorama_canada_plan');
      if (cached) {
        const { key, plan: cachedPlan, ts } = JSON.parse(cached);
        if (Date.now() - ts < 24 * 60 * 60 * 1000 && key === `${prov}:${prod}`) {
          setPlan(cachedPlan);
          setLoading(false);
          return;
        }
      }
    } catch {}

    // Fetch province data (chains + distributors)
    if (code) {
      fetch(`/api/canada/provinces/${code}`)
        .then((r) => r.ok ? r.json() : null)
        .then((d) => { if (d) setProvinceData(d); })
        .catch(() => {});
    }

    setLoading(false);
  }, []);

  async function generatePlan() {
    setGenerating(true);
    setError('');

    try {
      // 1. Fetch province deep dive data
      const provinceRes = await fetch(`/api/canada/provinces/${provinceCode}`);
      const provinceData = provinceRes.ok ? await provinceRes.json() : null;

      // 2. Build context for Claude
      const intel = provinceData?.intelligence?.[0];
      const chains = provinceData?.retail_chains ?? [];
      const distributors = provinceData?.distributors ?? [];
      const profile = provinceData?.consumer_profile;

      const context = {
        province: provinceName,
        product,
        population: provinceData?.population,
        gdp: provinceData?.gdp_billions,
        consumerProfile: profile,
        retailChains: chains.map((c: Record<string, unknown>) => `${c.name} (${c.tier}, ${c.category}, ${c.store_count} stores)`).join('; '),
        distributors: distributors.map((d: Record<string, unknown>) => `${d.name} (${d.model})`).join('; '),
        intelligence: intel?.key_insights ?? '',
        entryStrategy: intel?.recommended_entry_channel ?? '',
        competition: intel?.competition_intensity ?? '',
        regulatory: intel?.regulatory_notes ?? '',
      };

      // 3. Call API to generate plan
      const res = await fetch('/api/canada/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      if (!res.ok) throw new Error('Plan generation failed');
      const data = await res.json();
      setPlan(data);

      // Cache
      try {
        localStorage.setItem('mercorama_canada_plan', JSON.stringify({
          key: `${provinceName}:${product}`,
          plan: data,
          ts: Date.now(),
        }));
      } catch {}

      toast.success('Canada go-to-market plan generated!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan.');
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (error && !plan) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <div className="text-center space-y-4 max-w-sm">
          <MapPin className="h-10 w-10 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Pre-generation state
  if (!plan) {
    return (
      <div>
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[#01696f]/10 px-3 py-1.5">
            <MapPin className="h-4 w-4 text-[#01696f]" />
            <span className="text-sm font-medium text-[#01696f]">Canada Go-to-Market</span>
          </div>
          <h1 className="mb-3 text-2xl font-bold tracking-tight sm:text-3xl">
            {provinceName} Market Entry Plan
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
            Generate a complete go-to-market plan for <strong>{product}</strong> in {provinceName},
            including retail channel strategy, distributor recommendations, pricing, and regulatory steps.
          </p>
        </div>

        <Card className="max-w-lg">
          <CardContent className="py-6 space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#01696f]" />
                <span><strong>Province:</strong> {provinceName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-[#01696f]" />
                <span><strong>Product:</strong> {product}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              This plan uses real province data from our Canada Market Intelligence system —
              including verified retail chains, distributors, and market intelligence.
            </p>
            <Button size="lg" className="w-full gap-2" onClick={generatePlan} disabled={generating}>
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generating plan...</>
              ) : (
                <>Generate Go-to-Market Plan <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Plan display
  return (
    <div>
      <div className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-[#01696f]/10 px-3 py-1.5">
          <MapPin className="h-4 w-4 text-[#01696f]" />
          <span className="text-sm font-medium text-[#01696f]">Canada Go-to-Market Plan</span>
        </div>
        <h1 className="text-2xl font-bold">{provinceName} — {product}</h1>
        <p className="text-sm text-muted-foreground mt-1">{plan.productSummary}</p>
      </div>

      <div className="space-y-6">
        {/* Retail Strategy */}
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-4 w-4 text-[#01696f]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">Retail Channel Strategy</h2>
            </div>
            {plan.retailStrategy.phase1.length > 0 && (
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">Phase 1 — Entry</h3>
                <div className="space-y-2">
                  {plan.retailStrategy.phase1.map((r, i) => (
                    <div key={i} className="rounded-md border px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{r.chain}</span>
                        <span className="text-[10px] text-muted-foreground">{r.timeline}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {plan.retailStrategy.phase2.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">Phase 2 — Scale</h3>
                <div className="space-y-2">
                  {plan.retailStrategy.phase2.map((r, i) => (
                    <div key={i} className="rounded-md border border-dashed px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{r.chain}</span>
                        <span className="text-[10px] text-muted-foreground">{r.timeline}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distributor Strategy */}
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center gap-2 mb-4">
              <Truck className="h-4 w-4 text-[#01696f]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">Distribution Strategy</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{plan.distributorStrategy.approach}</p>
            <div className="space-y-2">
              {plan.distributorStrategy.recommended.map((d, i) => (
                <div key={i} className="rounded-md border px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{d.name}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{d.model}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.rationale}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing + Regulatory side by side */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-[#01696f]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide">Pricing Guidance</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{plan.pricingGuidance}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-4 w-4 text-[#01696f]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide">Regulatory Steps</h2>
              </div>
              <ul className="space-y-1.5">
                {plan.regulatorySteps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-[#01696f]" />
                    {step}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card>
          <CardContent className="py-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-[#01696f]" />
              <h2 className="text-sm font-semibold uppercase tracking-wide">Market Entry Timeline</h2>
            </div>
            <div className="space-y-2">
              {plan.timeline.map((t, i) => (
                <div key={i} className="flex items-center gap-3 rounded-md border px-3 py-2.5">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#01696f] text-white text-[10px] font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-medium">{t.milestone}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{t.timeframe}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Risks + Investment */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wide">Key Risks</h2>
              </div>
              <ul className="space-y-1.5">
                {plan.risks.map((risk, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" />
                    {risk}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-[#01696f]/20 bg-[#01696f]/5">
            <CardContent className="py-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-[#01696f]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide">Investment Estimate</h2>
              </div>
              <p className="text-sm leading-relaxed">{plan.investmentEstimate}</p>
            </CardContent>
          </Card>
        </div>

        {/* Verified Retail Chains in Province */}
        {provinceData && Array.isArray((provinceData as Record<string, unknown>).retail_chains) && (
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-2 mb-4">
                <Store className="h-4 w-4 text-[#01696f]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide">Verified Retail Chains in {provinceName}</h2>
              </div>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2 font-semibold">Chain</th>
                      <th className="text-left px-3 py-2 font-semibold">Tier</th>
                      <th className="text-left px-3 py-2 font-semibold">Category</th>
                      <th className="text-right px-3 py-2 font-semibold">Stores</th>
                      <th className="text-right px-3 py-2 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {((provinceData as Record<string, unknown>).retail_chains as Record<string, unknown>[]).map((c, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium">{c.name as string}</td>
                        <td className="px-3 py-2">
                          <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
                            c.tier === 'national' ? 'bg-blue-100 text-blue-700' : 'bg-muted text-muted-foreground',
                          )}>{c.tier as string}</span>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{c.category as string}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{c.store_count as number}</td>
                        <td className="px-3 py-2 text-right">
                          {c.website && (
                            <a href={c.website as string} target="_blank" rel="noopener noreferrer" className="text-[#01696f] hover:underline">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Verified Distributors in Province */}
        {provinceData && Array.isArray((provinceData as Record<string, unknown>).distributors) && (
          <Card>
            <CardContent className="py-5">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="h-4 w-4 text-[#01696f]" />
                <h2 className="text-sm font-semibold uppercase tracking-wide">Verified Distributors in {provinceName}</h2>
              </div>
              <div className="space-y-2">
                {((provinceData as Record<string, unknown>).distributors as Record<string, unknown>[]).map((d, i) => (
                  <div key={i} className="rounded-md border px-3 py-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{d.name as string}</span>
                      <span className="text-xs text-muted-foreground ml-2">{(d.model as string)?.replace(/_/g, ' ')}</span>
                      {Array.isArray(d.category_specialties) && (d.category_specialties as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(d.category_specialties as string[]).map((s) => (
                            <span key={s} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {d.website && (
                      <a href={d.website as string} target="_blank" rel="noopener noreferrer" className="text-[#01696f] hover:underline shrink-0">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Talk to an Expert CTA */}
        <Card className="border-[#01696f]/30 bg-gradient-to-r from-[#01696f]/5 to-background">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#01696f]/10">
                <MessageSquare className="h-6 w-6 text-[#01696f]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold">Talk to a Canada Market Expert</h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Get personalized guidance from a verified trade professional who knows the {provinceName} market.
                  They can help with distributor introductions, retail pitches, and regulatory compliance.
                </p>
              </div>
              <Link href="/dashboard?view=find-experts" className="shrink-0">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  <Users className="h-4 w-4" />
                  Find an Expert
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">What&apos;s Next</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href="/dashboard?view=find-experts">
              <div className="rounded-lg border p-4 hover:border-[#01696f]/40 hover:bg-[#01696f]/5 transition-all cursor-pointer h-full">
                <Users className="h-5 w-5 text-[#01696f] mb-2" />
                <p className="text-sm font-semibold">Talk to an Expert</p>
                <p className="text-xs text-muted-foreground mt-1">Get introductions to distributors and retailers</p>
              </div>
            </Link>
            <Link href="/dashboard?view=canada-markets">
              <div className="rounded-lg border p-4 hover:border-[#01696f]/40 hover:bg-[#01696f]/5 transition-all cursor-pointer h-full">
                <MapPin className="h-5 w-5 text-[#01696f] mb-2" />
                <p className="text-sm font-semibold">Explore Another Province</p>
                <p className="text-xs text-muted-foreground mt-1">Compare opportunities across Canada</p>
              </div>
            </Link>
            <Link href="/dashboard">
              <div className="rounded-lg border p-4 hover:border-[#01696f]/40 hover:bg-[#01696f]/5 transition-all cursor-pointer h-full">
                <Globe className="h-5 w-5 text-[#01696f] mb-2" />
                <p className="text-sm font-semibold">Back to Dashboard</p>
                <p className="text-xs text-muted-foreground mt-1">Review your growth progress</p>
              </div>
            </Link>
          </div>
        </div>

        <Button variant="outline" size="sm" className="gap-2" onClick={() => {
          setPlan(null);
          try { localStorage.removeItem('mercorama_canada_plan'); } catch {}
        }}>
          Regenerate Plan
        </Button>
      </div>
    </div>
  );
}
