// app/dashboard/_tools/incoterms-tool.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { ToolCrossPromo } from '../_components/tool-cross-promo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Ship, AlertCircle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ResponsibilityTable } from '@/components/ResponsibilityTable';
import { LoadingState } from '@/components/LoadingState';
import { KEY_PORTS } from '@/lib/ports';
import { IncotermAnalysisResponse } from '@/lib/types';
import { saveAnalysis } from '@/lib/storage';
import { toast } from 'sonner';

const formSchema = z.object({
  portOfLoading: z.string().min(2, 'Please enter port of loading'),
  portOfDischarge: z.string().min(2, 'Please enter port of discharge'),
  cargoType: z.string().min(3, 'Please describe the cargo'),
  cargoValue: z.coerce.number().min(1, 'Please enter cargo value'),
});

interface IncotermOption {
  code: string;
  label: string;
  confidence: string;
  summary: string;
  reasons: string[];
}

interface Recommendation {
  primaryIncoterm: IncotermOption;
  secondaryIncoterm: IncotermOption;
  notes: string[];
}

function PortAutocomplete({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = KEY_PORTS.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <label className="text-sm font-medium leading-none">{label}</label>
      <Input
        className="mt-2"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          {filtered.map((port) => (
            <div
              key={port.name}
              className="cursor-pointer px-3 py-2 text-sm hover:bg-accent"
              onMouseDown={() => {
                setQuery(port.name);
                onChange(port.name);
                setOpen(false);
              }}
            >
              {port.name}
              <span className="ml-2 text-xs text-muted-foreground">{port.countryCode}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IncotermRecommendCard({
  title,
  incoterm,
  isSelected,
}: {
  title: string;
  incoterm: IncotermOption;
  isSelected: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        {isSelected && (
          <span className="flex items-center gap-1 text-xs text-primary">
            <CheckCircle2 className="h-3 w-3" /> Used for analysis
          </span>
        )}
      </div>
      <p className="font-semibold">{incoterm.label}</p>
      <p className="mt-1 text-sm text-muted-foreground">{incoterm.summary}</p>
      <ul className="mt-2 space-y-1">
        {incoterm.reasons.map((r) => (
          <li key={r} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function IncotermsTool() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<IncotermAnalysisResponse | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [chosenIncoterm, setChosenIncoterm] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      portOfLoading: '',
      portOfDischarge: '',
      cargoType: '',
      cargoValue: 0,
    },
  });

  function deriveCountry(portName: string): string {
    const port = KEY_PORTS.find(
      (p) => p.name.toLowerCase() === portName.toLowerCase()
    );
    return port ? port.countryCode : portName;
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);
    setRecommendation(null);
    setChosenIncoterm(null);

    const originCountry = deriveCountry(values.portOfLoading);
    const destinationCountry = deriveCountry(values.portOfDischarge);

    try {
      const recRes = await fetch('/api/incoterm/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portOfLoading: values.portOfLoading,
          portOfDischarge: values.portOfDischarge,
          originCountry,
          destinationCountry,
          cargoType: values.cargoType,
          cargoValue: values.cargoValue,
          mode: 'sea',
        }),
      });

      const recData: Recommendation = await recRes.json();
      const primaryCode = recData.primaryIncoterm?.code || 'FCA';

      const analysisRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'incoterm',
          payload: {
            incoterm: primaryCode,
            originCountry,
            destinationCountry,
            portOfLoading: values.portOfLoading,
            portOfDischarge: values.portOfDischarge,
            cargoType: values.cargoType,
            cargoValue: values.cargoValue,
          },
        }),
      });

      if (!analysisRes.ok) {
        const error = await analysisRes.json();
        throw new Error(error.error || 'Failed to analyze');
      }

      const analysisData = await analysisRes.json();

      setRecommendation(recData);
      setChosenIncoterm(primaryCode);
      setResult(analysisData.result);

      saveAnalysis({
        id: crypto.randomUUID(),
        type: 'incoterm',
        timestamp: Date.now(),
        inputs: { ...values, incoterm: primaryCode },
        results: analysisData.result,
      });

      toast.success('Analysis complete!');
    } catch (error) {
      console.error('[mercorama] Analysis error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to analyze Incoterm');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {/* Archived tool banner */}
      <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          This tool is now part of Mercorama&apos;s Incoterm Intelligence system. For best results, use it within your <a href="/dashboard" className="font-semibold underline">growth workflow</a>.
        </p>
      </div>
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--trade-seller))]/10 px-3 py-1.5">
          <Ship className="h-4 w-4 text-[hsl(var(--trade-seller))]" />
          <span className="text-sm font-medium">Incoterms 2020</span>
        </div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl">
          Incoterms Analyzer
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground text-pretty">
          Enter your ports and cargo details. We will recommend the right Incoterm and provide
          a full AI-powered analysis with responsibility breakdowns and risk transfer points.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Trade Scenario</CardTitle>
              <CardDescription>
                Enter your shipment details for personalized analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="portOfLoading"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <PortAutocomplete
                            label="Port of Loading"
                            placeholder="e.g., Shanghai"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="portOfDischarge"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <PortAutocomplete
                            label="Port of Discharge"
                            placeholder="e.g., Halifax"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cargoType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo Type</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Electronics components" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cargoValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo Value (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="50000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Analyzing...' : 'Analyze Incoterm'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {isLoading && <LoadingState message="Analyzing Incoterm with AI..." />}

          {!isLoading && !result && (
            <Card className="border-dashed">
              <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-4 py-12 text-center">
                <Ship className="h-16 w-16 text-muted-foreground/50" />
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Ready to Analyze</h3>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Enter your ports and cargo details to get AI-powered Incoterm analysis
                    with responsibility breakdowns and expert recommendations.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && result && (
            <div className="space-y-6">
              {recommendation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Recommended Incoterms
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2">
                    <IncotermRecommendCard
                      title="Primary"
                      incoterm={recommendation.primaryIncoterm}
                      isSelected={chosenIncoterm === recommendation.primaryIncoterm.code}
                    />
                    <IncotermRecommendCard
                      title="Secondary"
                      incoterm={recommendation.secondaryIncoterm}
                      isSelected={false}
                    />
                    {recommendation.notes.length > 0 && (
                      <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 px-4 py-3">
                        <ul className="space-y-1">
                          {recommendation.notes.map((note) => (
                            <li key={note} className="text-xs text-amber-800 dark:text-amber-200">
                              ⚠ {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Analysis Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line leading-relaxed text-pretty">
                    {result.explanation}
                  </p>
                </CardContent>
              </Card>

              <ResponsibilityTable responsibilities={result.responsibilities} />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-[hsl(var(--trade-risk))]" />
                    Risk Transfer Point
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-[hsl(var(--trade-risk))]/20 bg-[hsl(var(--trade-risk))]/5 p-4">
                    <p className="leading-relaxed text-pretty">{result.riskTransferPoint}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Common Mistakes to Avoid</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.commonMistakes.map((mistake, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                      >
                        <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-destructive" />
                        <span className="text-sm leading-relaxed">{mistake}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Alternative Incoterms to Consider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.alternatives.map((alt, index) => (
                      <div key={index} className="rounded-lg border bg-muted/30 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <code className="rounded bg-primary/10 px-2 py-1 font-mono text-sm font-semibold text-primary">
                            {alt.incoterm}
                          </code>
                        </div>
                        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                          {alt.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      <ToolCrossPromo currentTool="incoterms-analyzer" />
    </div>
  );
}
