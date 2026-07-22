'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { createClient } from '@/lib/supabase/client';

// Colored Google "G" SVG logo
function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function SignInForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const next = searchParams?.get('next') || searchParams?.get('callbackUrl') || '/dashboard';

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError('Invalid email or password.');
      setLoading(false);
      return;
    }

    window.location.href = next;
  };

  const inputClass = `w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-black/20 transition-colors`;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile navbar — logo + hamburger, hidden on desktop */}
      <div className="lg:hidden">
        <Navbar />
      </div>
    <div className="flex-1 grid lg:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div>
          <a href="https://mercorama.com" className="flex items-center gap-2">
            <Image src="/mercorama_logo_2026.png" alt="Mercorama" width={163} height={41} className="h-[2.55rem] w-auto brightness-0 invert" />
            <span className="inline-flex items-center rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold tracking-wide select-none">
              beta
            </span>
          </a>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">
            Welcome back to smarter international trade
          </h2>
          <p className="mt-4 text-lg opacity-90">
            Sign in to access your saved analyses, risk scorecards, and contract templates.
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-white" />
              <p className="text-sm opacity-90">AI-powered analysis using Claude for accurate trade guidance</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-white" />
              <p className="text-sm opacity-90">Secure, compliant, and always up-to-date with the latest trade regulations</p>
            </div>
          </div>
        </div>
        <div className="text-sm opacity-75">
          © {new Date().getFullYear()} Mercorama. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Sign In Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold tracking-tight">Sign in</h1>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-input bg-background px-4 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
          >
            <GoogleLogo />
            {googleLoading ? 'Redirecting…' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs uppercase tracking-widest text-muted-foreground">or</span>
            </div>
          </div>

          {/* Email / password form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className={inputClass}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className={inputClass}
            />

            <div className="flex justify-end">
              <Link href="/auth/forgot-password" className="text-xs text-[#1F6FEB] hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-black/85 disabled:opacity-60"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-muted-foreground leading-relaxed">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-[#1F6FEB] hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-[#1F6FEB] hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
    <Footer />
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
