'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ToolCrossPromo } from '../_components/tool-cross-promo';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ContractTemplate } from '@/components/ContractTemplate';
import { PaymentTimeline } from '@/components/PaymentTimeline';
import { RiskScorecard } from '@/components/RiskScorecard';
import { FundMyExportPanel } from '@/components/FundMyExportPanel';
import { supabase } from '@/lib/supabase';
import { LoadingState } from '@/components/LoadingState';
import { INCOTERM_OPTIONS, PAYMENT_TERMS_OPTIONS } from '@/lib/incoterms-data';
import { ContractGeneratorResponse } from '@/lib/types';
import { saveAnalysis } from '@/lib/storage';
import { toast } from 'sonner';

const formSchema = z.object({
  incoterm: z.string().min(1, 'Please select an Incoterm'),
  paymentTerms: z.string().min(1, 'Please select payment terms'),
  buyerCountry: z.string().min(2, 'Please enter buyer country'),
  sellerCountry: z.string().min(2, 'Please enter seller country'),
  productCategory: z.string().min(3, 'Please enter product category'),
  contractValue: z.coerce.number().min(1, 'Please enter contract value'),
  specialConditions: z.string().optional(),
});

export function ContractTool() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ContractGeneratorResponse | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isGrowthPlan, setIsGrowthPlan] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from('users')
        .select('plan_tier')
        .eq('id', data.user.id)
        .maybeSingle()
        .then(({ data: profile }) => { if (profile?.plan_tier === 'growth') setIsGrowthPlan(true); });
    });
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      incoterm: '',
      paymentTerms: '',
      buyerCountry: '',
      sellerCountry: '',
      productCategory: '',
      contractValue: 0,
      specialConditions: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'contract',
          payload: values,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate deal summary');
      }

      const data = await response.json();
      setResult(data.result);

      saveAnalysis({
        id: crypto.randomUUID(),
        type: 'contract',
        timestamp: Date.now(),
        inputs: values,
        results: data.result,
      });

      toast.success('Deal Summary generated!');
    } catch (error) {
      console.error('[mercorama] Deal Summary generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate deal summary');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      {/* Archived tool banner */}
      <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5">
        <p className="text-xs text-amber-800 dark:text-amber-200">
          Deal summaries are now generated as the final step of the <a href="/dashboard?tool=deal-wizard" className="font-semibold underline">Deal Wizard</a>. This standalone tool is kept for quick reference.
        </p>
      </div>
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--trade-risk))]/10 px-3 py-1.5">
          <FileText className="h-4 w-4 text-[hsl(var(--trade-risk))]" />
          <span className="text-sm font-medium">International Trade Agreements</span>
        </div>
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-balance sm:text-3xl lg:text-4xl">
          Deal Summary Generator
        </h1>
        <p className="max-w-3xl text-lg leading-relaxed text-muted-foreground text-pretty">
          Generate structured deal summaries aligned to your Incoterm and payment terms.
          Get suggested clause references, payment milestones, and risk assessments — for advisor review.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Deal Summary Parameters</CardTitle>
              <CardDescription>
                Define your trade deal details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="incoterm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incoterm</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select Incoterm" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INCOTERM_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paymentTerms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment terms" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PAYMENT_TERMS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sellerCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seller Country</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Germany" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="buyerCountry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buyer Country</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Brazil" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="productCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Category</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Industrial machinery" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contractValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deal Value (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="250000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="specialConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Special Conditions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g., Quality inspection required, Extended warranty..."
                            className="min-h-[80px] resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Any specific requirements or conditions
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                    <input
                      id="ack-checkbox"
                      type="checkbox"
                      checked={acknowledged}
                      onChange={(e) => setAcknowledged(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-amber-400 accent-amber-600"
                    />
                    <label htmlFor="ack-checkbox" className="cursor-pointer text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                      I understand this Deal Summary is a reference document only and is not a legally binding trade agreement. I will have it reviewed by a qualified legal professional before use.
                    </label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || !acknowledged}>
                    {isLoading ? 'Generating...' : 'Generate Deal Summary'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {isLoading && <LoadingState message="Generating deal summary with AI..." />}

          {!isLoading && !result && (
            <Card className="border-dashed">
              <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-4 py-12 text-center">
                <FileText className="h-16 w-16 text-muted-foreground/50" />
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Ready to Generate</h3>
                  <p className="text-sm text-muted-foreground text-pretty">
                    Fill out the form to receive AI-generated trade agreement clauses,
                    payment timelines, and comprehensive risk analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {!isLoading && result && (
            <div className="space-y-6">
              {/* Non-dismissible legal warning banner */}
              <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
                <p className="text-sm font-semibold leading-relaxed text-amber-700 dark:text-amber-300">
                  ⚠ Reference Document Only — This Deal Summary is not a legally binding trade agreement. Always have trade documents reviewed by a qualified legal professional before signing.
                </p>
              </div>

              <RiskScorecard riskScorecard={result.riskScorecard} />

              <FundMyExportPanel
                context={{
                  dealValue: form.getValues('contractValue'),
                  buyerType: form.getValues('buyerCountry'),
                  targetMarket: form.getValues('buyerCountry'),
                }}
                isGrowthPlan={isGrowthPlan}
              />

              <PaymentTimeline milestones={result.paymentMilestones} />
              <ContractTemplate clauses={result.clauses} />

              {result.redFlags.length > 0 && (
                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Red Flags to Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.redFlags.map((flag, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3"
                        >
                          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
                          <span className="text-sm leading-relaxed">{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Negotiation Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.negotiationChecklist.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3"
                      >
                        <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                        <span className="text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <p className="text-center text-xs text-muted-foreground">
                Mercorama Deal Summaries are AI-generated for informational purposes only and do not constitute legal advice or a binding agreement.
              </p>
            </div>
          )}
        </div>
      </div>
      <ToolCrossPromo currentTool="deal-summary-generator" />
    </div>
  );
}
