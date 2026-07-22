'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, ShieldCheck, AlertTriangle, FileText, CheckCircle2, ArrowRight, Info, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnhancedHsResult, IncotermInsight } from '@/lib/types';

// ── HS Enhancement Panel (renders below Step2 HS result) ──────────────────────

export function HsEnhancementPanel({ hsCode, hsDescription, productDescription, destinationCountry }: {
  hsCode: string; hsDescription?: string; productDescription: string; destinationCountry?: string;
}) {
  const [data, setData] = useState<Partial<EnhancedHsResult> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!hsCode) return;
    fetch('/api/enhance-hs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hsCode, hsDescription, productDescription, destinationCountry }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [hsCode, hsDescription, productDescription, destinationCountry]);

  if (loading) {
    return (
      <Card className="mt-4 border-dashed">
        <CardContent className="flex items-center gap-3 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Analyzing classification implications...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) return null;

  const confidenceColor = (data.confidence ?? 0) >= 80 ? 'text-green-600' : (data.confidence ?? 0) >= 60 ? 'text-amber-600' : 'text-red-600';

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#01696f]" />
          Classification Intelligence
          <span className={cn('ml-auto text-xs font-mono', confidenceColor)}>
            {data.confidence ?? '—'}% confidence
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Explanation */}
        {data.explanation && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm leading-relaxed">{data.explanation}</p>
          </div>
        )}

        <Accordion type="multiple" className="w-full">
          {/* Risk flags */}
          {(data.riskFlags ?? []).length > 0 && (
            <AccordionItem value="risks">
              <AccordionTrigger className="text-sm py-2">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  Risk Flags ({data.riskFlags?.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1.5">
                  {data.riskFlags?.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Alternative codes */}
          {(data.alternativeCodes ?? []).length > 0 && (
            <AccordionItem value="alternatives">
              <AccordionTrigger className="text-sm py-2">Alternative HS Codes</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-wrap gap-2">
                  {data.alternativeCodes?.map((c) => (
                    <span key={c} className="rounded-md bg-muted px-2.5 py-1 text-xs font-mono">{c}</span>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Trade implications */}
          {data.tradeImplications && (
            <AccordionItem value="implications">
              <AccordionTrigger className="text-sm py-2">What This Classification Affects</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {data.tradeImplications.tariffImpact && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-0.5">Tariff Impact</div>
                      <p className="text-sm">{data.tradeImplications.tariffImpact}</p>
                    </div>
                  )}
                  {data.tradeImplications.complianceImpact && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-0.5">Compliance</div>
                      <p className="text-sm">{data.tradeImplications.complianceImpact}</p>
                    </div>
                  )}
                  {data.tradeImplications.documentationImpact && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-0.5">Documentation</div>
                      <p className="text-sm">{data.tradeImplications.documentationImpact}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}

// ── Incoterm Insight Panel (renders below Step3 Incoterm selector) ─────────────

export function IncotermInsightPanel({ incoterm, productDescription, buyerCountry, unitPrice, quantity, currency }: {
  incoterm: string; productDescription: string; buyerCountry?: string; unitPrice?: number; quantity?: number; currency?: string;
}) {
  const [data, setData] = useState<IncotermInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!incoterm) return;
    setLoading(true);
    setError(false);
    fetch('/api/incoterm-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ incoterm, productDescription, buyerCountry, unitPrice, quantity, currency }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [incoterm, productDescription, buyerCountry, unitPrice, quantity, currency]);

  if (!incoterm) return null;
  if (loading) {
    return (
      <Card className="mt-4 border-dashed">
        <CardContent className="flex items-center gap-3 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Analyzing Incoterm implications...</span>
        </CardContent>
      </Card>
    );
  }
  if (error || !data) return null;

  const riskColor = data.riskLevel === 'low' ? 'text-green-600 bg-green-100 dark:bg-green-900/30' : data.riskLevel === 'medium' ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' : 'text-red-600 bg-red-100 dark:bg-red-900/30';

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Info className="h-4 w-4 text-[#01696f]" />
          Incoterm Intelligence
          <span className={cn('ml-auto rounded-full px-2 py-0.5 text-xs font-medium', riskColor)}>
            {data.riskLevel} risk
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recommended */}
        {data.recommended !== incoterm && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
            <p className="text-sm"><span className="font-semibold">Recommended:</span> {data.recommended} — {data.rationale}</p>
          </div>
        )}
        {data.recommended === incoterm && (
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-sm">{data.rationale}</p>
          </div>
        )}

        {/* Margin impact */}
        <div>
          <div className="text-xs font-semibold text-muted-foreground mb-1">Margin Impact</div>
          <p className="text-sm">{data.marginImpact}</p>
        </div>

        {/* Responsibilities */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1.5">Seller Responsibilities</div>
            <ul className="space-y-1">
              {(data.responsibilitySplit?.seller ?? []).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-[#01696f] mt-0.5 shrink-0" />{r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground mb-1.5">Buyer Responsibilities</div>
            <ul className="space-y-1">
              {(data.responsibilitySplit?.buyer ?? []).map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-muted-foreground/50 mt-0.5 shrink-0" />{r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Warning */}
        {data.warning && (
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 dark:text-amber-200">{data.warning}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Deal Playbook (renders in Step4 / final view) ─────────────────────────────

interface PlaybookResult {
  productSummary: string;
  compliance: string[];
  documentation: string[];
  risks: string[];
  nextActions: { action?: string; text?: string; priority: string; category: string }[];
}

export function DealPlaybookPanel({ deal, dealId, onGenerated }: {
  deal: { productDescription: string; hsCode: string; hsDescription?: string; hsRiskLevel?: string; incoterm: string; incotermPlace?: string; buyerCountry?: string; buyerName?: string; sellerName?: string; currency?: string; unitPrice?: number; quantity?: number; paymentMethod?: string; paymentTerms?: string; freightResponsibility?: string; insuranceResponsibility?: string; dealIntent?: string };
  dealId?: string;
  onGenerated?: (playbook: PlaybookResult) => void;
}) {
  const [data, setData] = useState<PlaybookResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/generate-deal-playbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deal),
    })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((result) => {
        setData(result);
        onGenerated?.(result);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [deal]);

  if (loading) {
    return (
      <Card className="border-[#01696f]/30">
        <CardContent className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#01696f]" />
          <span className="text-sm text-muted-foreground">Generating your Export Execution Playbook...</span>
          <span className="text-xs text-muted-foreground/60">This uses advanced AI analysis and may take 10–15 seconds.</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground">Playbook generation unavailable. Your deal summary is still complete above.</p>
        </CardContent>
      </Card>
    );
  }

  const priorityStyle: Record<string, string> = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  };

  // Group actions by priority
  const highActions = (data.nextActions ?? []).filter((a) => a.priority === 'high');
  const medActions = (data.nextActions ?? []).filter((a) => a.priority === 'medium');
  const lowActions = (data.nextActions ?? []).filter((a) => a.priority === 'low');

  // Determine verdict border color
  const hasRisks = (data.risks ?? []).length > 0;
  const hasCritical = (data.risks ?? []).some((r) => r.toLowerCase().includes('critical') || r.toLowerCase().includes('block'));
  const verdictBorder = hasCritical ? 'border-l-red-500' : hasRisks ? 'border-l-amber-500' : 'border-l-green-500';

  function renderActionGroup(actions: typeof highActions, startNum: number) {
    return actions.map((a, i) => (
      <div key={startNum + i} className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
        <span className="h-5 w-5 rounded-full bg-[#01696f] text-white flex items-center justify-center text-[10px] font-bold shrink-0">{startNum + i}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm">{a.text ?? a.action}</p>
          <div className="flex gap-2 mt-1">
            <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', priorityStyle[a.priority] ?? priorityStyle.medium)}>
              {a.priority}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{a.category}</span>
          </div>
        </div>
      </div>
    ));
  }

  return (
    <div className="space-y-4">
      {/* SECTION A — Deal Verdict */}
      <Card className={cn('border-l-4', verdictBorder)}>
        <CardContent className="py-4">
          <p className="text-sm font-medium leading-relaxed">{data.productSummary}</p>
        </CardContent>
      </Card>

      {/* SECTION B — Next Actions (MOST IMPORTANT — top) */}
      {(data.nextActions ?? []).length > 0 && (
        <Card className="border-[#01696f]/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-[#01696f]" />
              Start here — your prioritised checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {highActions.length > 0 && renderActionGroup(highActions, 1)}
            {medActions.length > 0 && highActions.length > 0 && <div className="border-t my-2" />}
            {medActions.length > 0 && renderActionGroup(medActions, highActions.length + 1)}
            {lowActions.length > 0 && (highActions.length > 0 || medActions.length > 0) && <div className="border-t my-2" />}
            {lowActions.length > 0 && renderActionGroup(lowActions, highActions.length + medActions.length + 1)}
          </CardContent>
        </Card>
      )}

      {/* SECTION C — Intelligence Summary (collapsed) */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="intelligence">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">
              <Info className="h-4 w-4 text-muted-foreground" />
              Deal Intelligence
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-xs text-muted-foreground mb-2">Detailed classification and Incoterm analysis for this deal.</p>
            <p className="text-xs text-muted-foreground">Expand the HS and Incoterm panels above (Steps 2 & 3) for full details.</p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* SECTION D — Compliance + Documentation + Risks */}
      <Accordion type="multiple" defaultValue={['compliance', 'docs', 'risks']} className="w-full">
        {/* Compliance */}
        <AccordionItem value="compliance">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
              Compliance Requirements ({data.compliance?.length ?? 0})
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1.5">
              {(data.compliance ?? []).map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />{c}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Documentation */}
        <AccordionItem value="docs">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-violet-500" />
              Documentation Checklist ({data.documentation?.length ?? 0})
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1.5">
              {(data.documentation ?? []).map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <FileText className="h-3.5 w-3.5 text-violet-500 mt-0.5 shrink-0" />{d}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Risks */}
        <AccordionItem value="risks">
          <AccordionTrigger className="text-sm font-semibold">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Deal Risks ({data.risks?.length ?? 0})
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1.5">
              {(data.risks ?? []).map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />{r}
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
