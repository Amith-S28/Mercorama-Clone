'use client';

import { useState } from 'react';
import { Copy, Check, AlertTriangle, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HSCodeAnalysisResponse } from '@/lib/types';

interface HSCodeResultProps {
  result: HSCodeAnalysisResponse;
}

const confidenceConfig = {
  high: { color: 'bg-[hsl(var(--trade-success))]', label: 'High Confidence' },
  medium: { color: 'bg-[hsl(var(--trade-risk))]', label: 'Medium Confidence' },
  low: { color: 'bg-destructive', label: 'Low Confidence' },
};

export function HSCodeResult({ result }: HSCodeResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result.hsCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const config = confidenceConfig[result.confidence];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="mb-2">HS Code Classification</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded bg-muted px-3 py-1 text-2xl font-mono font-bold">
                {result.hsCode}
              </code>
              <Badge className={`${config.color} text-white`}>
                {config.label}
              </Badge>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-shrink-0"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="single" collapsible defaultValue="classification">
          {/* Classification Details */}
          <AccordionItem value="classification">
            <AccordionTrigger className="text-base font-semibold">
              Classification Breakdown
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pt-2">
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Chapter
                </p>
                <p className="text-sm leading-relaxed">{result.classification.chapter}</p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Heading
                </p>
                <p className="text-sm leading-relaxed">{result.classification.heading}</p>
              </div>
              <div className="rounded-lg border bg-muted/50 p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Subheading
                </p>
                <p className="text-sm leading-relaxed">{result.classification.subheading}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Reasoning */}
          <AccordionItem value="reasoning">
            <AccordionTrigger className="text-base font-semibold">
              Classification Reasoning
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                {result.reasoning}
              </p>
            </AccordionContent>
          </AccordionItem>

          {/* Misclassification Risks */}
          <AccordionItem value="risks">
            <AccordionTrigger className="text-base font-semibold">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--trade-risk))]" />
                Misclassification Risks
              </span>
            </AccordionTrigger>
            <AccordionContent className="space-y-2 pt-2">
              {result.misclassificationRisks.map((risk, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-lg border border-[hsl(var(--trade-risk))]/20 bg-[hsl(var(--trade-risk))]/5 p-3"
                >
                  <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[hsl(var(--trade-risk))]" />
                  <p className="text-sm leading-relaxed">{risk}</p>
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>

          {/* Duty Rates */}
          {result.dutyRates && result.dutyRates.length > 0 && (
            <AccordionItem value="duties">
              <AccordionTrigger className="text-base font-semibold">
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Duty Rates by Country
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-2 pt-2">
                {result.dutyRates.map((duty, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex-1">
                      <p className="font-medium">{duty.country}</p>
                      {duty.notes && (
                        <p className="text-sm text-muted-foreground">{duty.notes}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-base font-semibold">
                      {duty.rate}
                    </Badge>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Trade Agreements */}
          {result.tradeAgreements && result.tradeAgreements.length > 0 && (
            <AccordionItem value="agreements">
              <AccordionTrigger className="text-base font-semibold">
                Applicable Trade Agreements
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="flex flex-wrap gap-2">
                  {result.tradeAgreements.map((agreement, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {agreement}
                    </Badge>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* WCO official description if available */}
        {result.wcoDescription && (
          <div className="rounded-md border-l-4 border-primary/40 bg-muted/30 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              WCO Official Description
            </p>
            <p className="text-sm leading-relaxed text-foreground/80">{result.wcoDescription}</p>
          </div>
        )}

        {/* Source attribution */}
        <p className="text-[11px] text-muted-foreground/50 leading-snug">
          Classification based on the{' '}
          <a
            href="https://www.wcoomd.org/en/topics/nomenclature/instrument-and-tools/hs-nomenclature-2022-edition.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-muted-foreground"
          >
            WCO Harmonized System 2022 (HS 2022) nomenclature
          </a>
          . AI-assisted classification — always verify with a licensed customs broker before filing.
        </p>

        {/* Cross-tool CTAs */}
        <div className="rounded-lg border bg-muted/30 px-4 py-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Use HS {result.hsCode} in other tools
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            <a
              href={`/export-compass?hsCode=${encodeURIComponent(result.hsCode)}`}
              className="flex flex-col gap-0.5 rounded-md border bg-card px-3 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-semibold">Export Compass</span>
              <span className="text-xs text-muted-foreground">Find global markets</span>
            </a>
            <a
              href={`/fta-diversify?hsCode=${encodeURIComponent(result.hsCode)}`}
              className="flex flex-col gap-0.5 rounded-md border bg-card px-3 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-semibold">FTA Diversifier</span>
              <span className="text-xs text-muted-foreground">Check FTA coverage</span>
            </a>
            <a
              href={`/deal?hsCode=${encodeURIComponent(result.hsCode)}`}
              className="flex flex-col gap-0.5 rounded-md border bg-card px-3 py-2.5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <span className="text-sm font-semibold">Deal Wizard</span>
              <span className="text-xs text-muted-foreground">Structure a trade deal</span>
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
