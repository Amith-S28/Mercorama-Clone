// app/risk/page.tsx

import { getCurrentUser } from '@/app/auth/get-current-user';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { ArrowRight, Shield, Lock, DollarSign, Plane, Scale, AlertTriangle, Users } from 'lucide-react';

export default async function RiskEducationalPage() {
  const user = await getCurrentUser();

  if (!user.features.includes('risk-insights')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold">Upgrade required</h1>
        <p className="text-muted-foreground">
          Your current plan does not include Risk Insights.
        </p>
        <a href="/beta" className="text-primary underline underline-offset-4">
          View plans
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="border-b bg-gradient-to-b from-background to-secondary/20 px-4 py-20 md:px-6 lg:py-32">
          <div className="container mx-auto max-w-5xl">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                Are You Taking On Too Much Risk in Your Trade Deals?
              </h1>
              <p className="max-w-3xl text-pretty text-lg text-muted-foreground md:text-xl">
                Mercorama scores your trade situation across 6 risk dimensions — payment, transit, currency, 
                regulatory, counterparty, and force majeure.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent/10 px-4 py-2 text-sm">
                <Lock className="h-4 w-4 text-accent" />
                <span className="font-medium">Pro plan feature</span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/auth/signin?callbackUrl=/analyze/incoterm">
                  <Button size="lg" className="gap-2">
                    Try Incoterm Analysis
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/beta">
                  <Button size="lg" variant="outline">View Pro Features</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The 6 Risk Dimensions */}
        <section className="px-4 py-16 md:px-6 lg:py-24">
          <div className="container mx-auto max-w-6xl">
            <h2 className="mb-12 text-3xl font-bold">The 6 Risk Dimensions</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                    <DollarSign className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <CardTitle>Payment Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Probability of non-payment or delayed payment. Influenced by payment terms, buyer 
                    creditworthiness, and jurisdiction enforcement mechanisms.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900">
                    <Plane className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <CardTitle>Transit Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Exposure while goods are in transit. Depends on Incoterm, insurance coverage, 
                    shipping route, and cargo value relative to premium cost.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                    <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle>Currency Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    FX fluctuation exposure between contract date and payment date. Critical for long 
                    payment terms or volatile currency pairs.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                    <Scale className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle>Regulatory Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Import licensing requirements, sanctions compliance, sudden tariff changes, and 
                    non-tariff barriers that could halt or delay your shipment.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                    <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle>Counterparty Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Financial health and reliability of the other party. First-time buyer/seller 
                    relationships carry higher risk than established partnerships.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                    <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle>Force Majeure Risk</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Political instability, natural disasters, port congestion, or logistical disruptions 
                    that could prevent contract performance.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Sample Scorecard Preview */}
        <section className="border-t bg-secondary/20 px-4 py-16 md:px-6 lg:py-24">
          <div className="container mx-auto max-w-4xl">
            <h2 className="mb-8 text-3xl font-bold">Sample Risk Scorecard</h2>
            <Card className="relative overflow-hidden">
              <CardHeader>
                <CardTitle>Your Trade Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Payment Risk</span>
                      <span className="text-muted-foreground">Medium (45/100)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-[45%] bg-amber-500" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Transit Risk</span>
                      <span className="text-muted-foreground">Low (22/100)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full w-[22%] bg-green-500" />
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/95 backdrop-blur-sm" />
                    <div className="relative space-y-2 opacity-30">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Currency Risk</span>
                          <span className="text-muted-foreground">High (78/100)</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full w-[78%] bg-red-500" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Regulatory Risk</span>
                          <span className="text-muted-foreground">Medium (52/100)</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-secondary">
                          <div className="h-full w-[52%] bg-amber-500" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <Lock className="mx-auto mb-2 h-8 w-8 text-muted-foreground/50" />
                        <p className="font-medium text-muted-foreground">
                          Sign in to run your full scorecard
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t px-4 py-16 md:px-6">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to assess your risk exposure?</h2>
            <p className="mb-8 text-muted-foreground">
              Starter plan feature — risk analysis included from $99/month.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link href="/auth/signup">
                <Button size="lg">Start with Starter</Button>
              </Link>
              <Link href="/beta">
                <Button size="lg" variant="outline">View Plans</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
