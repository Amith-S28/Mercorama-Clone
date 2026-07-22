'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, User, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { generateOTP, storeOTP, setPendingUser } from '@/lib/auth-store';
import { getUserPlan } from '@/lib/user-overrides';
import { Footer } from '@/components/footer';

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const startOTPFlow = (userName: string, userEmail: string) => {
    const otp = generateOTP();
    storeOTP(otp);
    setPendingUser({ id: `user-${Date.now()}`, email: userEmail, name: userName, plan: getUserPlan(userEmail), isVerified: false });
    router.push('/auth/verify-otp');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      alert('Please agree to the Terms of Service and Privacy Policy');
      return;
    }
    setLoading(true);
    startOTPFlow(name, email);
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    startOTPFlow('User', '');
  };

  return (
    <div className="flex min-h-screen flex-col">
    <div className="flex-1 grid lg:grid-cols-2">
      {/* Left Panel - Branding */}
      <div className="hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div>
          <a href="https://mercorama.com">
            <Image src="/mercorama_logo_2026.png" alt="Mercorama" width={163} height={41} className="h-[2.55rem] w-auto brightness-0 invert" />
          </a>
        </div>

        <div>
          <h2 className="text-4xl font-bold leading-tight">
            Start analyzing your trade deals in 60 seconds
          </h2>
          <p className="mt-4 text-lg opacity-90">
            Start analyzing your trade deals in minutes. Starter plan from $99/month.
          </p>

          <div className="mt-12 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-white" />
              <p className="text-sm opacity-90">
                Full AI-powered trade intelligence from day one
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-white" />
              <p className="text-sm opacity-90">
                Instant AI recommendations powered by Claude
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 h-2 w-2 rounded-full bg-white" />
              <p className="text-sm opacity-90">
                Upgrade to Growth ($249/month) for FTA Diversify and Export Compass
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm opacity-75">
          © {new Date().getFullYear()} Mercorama. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Sign Up Form */}
      <div className="flex items-center justify-center p-8">
        <Card className="w-full max-w-md border-0 shadow-none lg:border lg:p-8 lg:shadow-sm">
          <div className="mb-8">
            <a href="https://mercorama.com" className="flex items-center gap-2 lg:hidden">
              <Image src="/mercorama_logo_2026.png" alt="Mercorama" width={143} height={36} className="h-[2.04rem] w-auto" />
            </a>
            <h1 className="mt-6 text-3xl font-bold">Create your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Get started on the Starter plan — $99/month.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
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
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading || !agreedToTerms}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignUp}
              disabled={loading}
            >
              <Chrome className="mr-2 h-4 w-4" />
              Sign up with Google
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-8 text-center text-xs text-muted-foreground">
            Protected by industry-standard encryption
          </div>
        </Card>
      </div>
    </div>
    <Footer />
    </div>
  );
}
