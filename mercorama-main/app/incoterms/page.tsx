'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { MarketingCmsSection } from '@/components/marketing/MarketingCmsSection';
import { ArrowRight, Ship, AlertCircle, CheckCircle2 } from 'lucide-react';
import { INCOTERMS_DATA } from '@/lib/incoterms-data';
import { getAuthUser } from '@/lib/auth-store';

export default function IncotermsEducationalPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => { setIsLoggedIn(!!getAuthUser()); }, []);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-background to-secondary/20 px-4 py-12 sm:py-16 md:px-6 lg:py-20">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Ship className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                What Are Incoterms® — And Why Do They Cost Businesses Millions?
              </h1>
              <p className="max-w-3xl text-pretty text-lg text-muted-foreground md:text-xl">
                11 trade rules govern every international shipment. Most exporters get at least one wrong. 
                Here's what you need to know.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={isLoggedIn ? '/dashboard?tool=incoterms-analyzer' : '/auth/signin?callbackUrl=/dashboard?tool=incoterms-analyzer'}>
                  <Button size="lg" className="gap-2">
                    {isLoggedIn ? 'Open Incoterms Analyzer' : 'Analyze My Incoterm'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                {!isLoggedIn && (
                  <Link href="/auth/signin">
                    <Button size="lg" variant="outline">
                      Already have an account? Sign in
                    </Button>
                  </Link>
                )}
              </div>
              <p className="text-sm text-muted-foreground">Available on Starter and above — join today.</p>
            </div>
          </div>
        </section>

        {/* What are Incoterms Section */}
        <section className="px-4 py-10 md:px-6 lg:py-16">
          <div className="container mx-auto max-w-4xl">
            <h2 className="mb-8 text-3xl font-bold">What are Incoterms®?</h2>
            <div className="prose prose-gray max-w-none dark:prose-invert">
              <p className="text-lg leading-relaxed text-muted-foreground">
                The International Chamber of Commerce (ICC) created Incoterms in 1936 to standardize 
                international trade terms. The current 2020 revision includes 11 rules that define:
              </p>
              <ul className="my-6 space-y-2">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-accent" />
                  <span>Where and when delivery occurs</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-accent" />
                  <span>When risk transfers from seller to buyer</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-accent" />
                  <span>Who pays for freight, insurance, and customs clearance</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-accent" />
                  <span>Documentation and notification obligations</span>
                </li>
              </ul>
            </div>
            
            <Card className="mt-8 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <CardTitle className="text-amber-900 dark:text-amber-100">
                    Important: What Incoterms Do NOT Cover
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-amber-800 dark:text-amber-200">
                Incoterms do NOT govern payment terms, title transfer, or what happens if goods are 
                damaged after delivery. These must be specified separately in your sales contract.
              </CardContent>
            </Card>
          </div>
        </section>

        {/* The 11 Incoterms Table */}
        <section className="border-t bg-secondary/20 px-4 py-10 md:px-6 lg:py-16">
          <div className="container mx-auto max-w-6xl">
            <h2 className="mb-4 text-3xl font-bold">The 11 Incoterms at a Glance</h2>
            <p className="mb-6 text-lg text-muted-foreground">
              Click any Incoterm to see a plain-language explanation
            </p>
            
            <Accordion type="single" collapsible className="space-y-4">
              {INCOTERMS_DATA.map((incoterm) => (
                <AccordionItem
                  key={incoterm.code}
                  value={incoterm.code}
                  className="overflow-hidden rounded-lg border bg-card"
                >
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <div className="grid w-full grid-cols-4 gap-4 text-left">
                      <div>
                        <span className="font-mono text-lg font-bold">{incoterm.code}</span>
                      </div>
                      <div className="col-span-3">
                        <span className="font-medium">{incoterm.name}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="border-t px-6 pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-sm font-medium text-muted-foreground">Transport Mode</p>
                        <p className="text-sm">{incoterm.transportMode?.join(', ') || 'Any'}</p>
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium text-muted-foreground">Risk Transfers At</p>
                        <p className="text-sm">{incoterm.riskTransfer}</p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="mb-2 text-sm font-medium text-muted-foreground">Best For</p>
                        <p className="text-sm leading-relaxed">{incoterm.bestFor}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Common Mistakes */}
        <section className="px-4 py-10 md:px-6 lg:py-16">
          <div className="container mx-auto max-w-6xl">
            <h2 className="mb-6 text-3xl font-bold">Common Mistakes</h2>
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Using FOB for Containerized Cargo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    FOB was designed for break-bulk cargo loaded directly onto ships. For containers, 
                    use FCA instead. Risk transfers when goods are handed to the carrier at the container 
                    yard, not when they cross the ship's rail.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>EXW with Inexperienced Buyers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Under EXW, the buyer must handle export clearance in the seller's country. Most buyers 
                    can't do this. The shipment gets stuck at customs, and the seller still bears 
                    reputational and practical risk.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>CIF Without Specifying Insurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    CIF requires the seller to provide insurance, but only at minimum coverage (ICC Clause C 
                    - 110%). For high-value goods, specify ICC Clause A (all-risk) coverage or the buyer may 
                    be underinsured.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why AI Analysis */}
        <section className="border-t bg-secondary/20 px-4 py-10 md:px-6 lg:py-16">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="mb-6 text-3xl font-bold">Why AI-Powered Analysis Matters</h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Mercorama analyzes your specific situation — cargo type, route, relationship, value — and 
              recommends the right Incoterm with confidence scoring. No more guesswork.
            </p>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t px-4 py-10 md:px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to analyze your trade situation?</h2>
            <p className="mb-8 text-muted-foreground">
              Available on Starter and above — join today.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {isLoggedIn ? (
                <Link href="/dashboard?tool=incoterms-analyzer">
                  <Button size="lg">Open Incoterms Analyzer</Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/signup">
                    <Button size="lg">Start with Starter</Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button size="lg" variant="outline">Sign In</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <MarketingCmsSection slug="incoterms" />

      <Footer />
    </div>
  );
}
