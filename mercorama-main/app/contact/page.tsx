'use client';

import { useState, useEffect } from 'react';
import { Mail, MessageSquare, User, Building2, Phone, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { MarketingCmsSection } from '@/components/marketing/MarketingCmsSection';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LcvZI8sAAAAADy1wIWyIJHy4AP9s-hI6rZW6NsM';

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const INQUIRY_TYPES = [
  'General Inquiry',
  'Technical Support',
  'Sales & Pricing',
  'Enterprise / Partnership',
  'Media & Press',
  'Other',
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [inquiryType, setInquiryType] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || document.getElementById('recaptcha-script')) return;
    const script = document.createElement('script');
    script.id = 'recaptcha-script';
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setLoading(true);
    try {
      let recaptchaToken = '';
      if (RECAPTCHA_SITE_KEY && window.grecaptcha) {
        recaptchaToken = await new Promise<string>((resolve) => {
          window.grecaptcha.ready(async () => {
            const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action: 'contact' });
            resolve(token);
          });
        });
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, email, phone, inquiryType, message, recaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Submission failed');
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">

          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Get in touch</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact Us</h1>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Have a question, feedback, or need help? We'd love to hear from you.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Contact info */}
            <div className="space-y-4">
              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">General Inquiries</h3>
                    <p className="mt-1 text-sm text-muted-foreground">contact@mercorama.com</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Sales &amp; Enterprise</h3>
                    <p className="mt-1 text-sm text-muted-foreground">sales@mercorama.com</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Custom plans &amp; API access</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-muted/50">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We respond within <strong>two working days</strong>. For urgent trade queries,
                  please include your company name and time zone in your message.
                </p>
              </Card>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              {submitted ? (
                <Card className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Message received</h2>
                  <p className="text-muted-foreground max-w-sm">
                    Thank you for reaching out. We will respond within two working days.
                  </p>
                </Card>
              ) : (
                <Card className="p-8">
                  <h2 className="mb-6 text-xl font-semibold">Send us a message</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Your Name *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="name"
                            placeholder="Jane Smith"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name *</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="company"
                            placeholder="Acme Exports Ltd."
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            required
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone (Optional)</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+1 902 555 0100"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="inquiryType">Type of Inquiry *</Label>
                      <select
                        id="inquiryType"
                        value={inquiryType}
                        onChange={(e) => setInquiryType(e.target.value)}
                        required
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        {INQUIRY_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        placeholder="Tell us how we can help..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        rows={5}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      This site is protected by reCAPTCHA.
                    </p>

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </Button>
                  </form>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <MarketingCmsSection slug="contact" />

      <Footer />
    </div>
  );
}
