'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import {
  getPendingUser,
  verifyOTP,
  setAuthUser,
  clearPendingUser,
  generateOTP,
  storeOTP,
} from '@/lib/auth-store';

export default function VerifyOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [displayOTP, setDisplayOTP] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const pending = getPendingUser();
    if (!pending) {
      router.push('/auth/signup');
      return;
    }
    // Generate and show OTP on mount (demo mode — in production this would be emailed)
    const code = generateOTP();
    storeOTP(code);
    setDisplayOTP(code);
  }, [router]);

  const handleResend = () => {
    const code = generateOTP();
    storeOTP(code);
    setDisplayOTP(code);
    setOtp('');
    setError('');
  };

  const handleComplete = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      handleVerify(value);
    }
  };

  const handleVerify = (value: string) => {
    setLoading(true);
    setError('');

    if (verifyOTP(value)) {
      const pending = getPendingUser();
      if (pending) {
        setAuthUser({ ...pending, isVerified: true });
        clearPendingUser();
        router.push('/dashboard');
      }
    } else {
      setError('Incorrect code. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6 flex justify-center">
          <a href="https://mercorama.com">
            <Image src="/mercorama_logo_2026.png" alt="Mercorama" width={143} height={36} className="h-[2.04rem] w-auto" />
          </a>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
        </div>

        <h1 className="text-2xl font-bold">Verify your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the 6-digit code to complete your registration.
        </p>

        {/* Demo OTP display */}
        {displayOTP && (
          <div className="mt-4 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:bg-amber-950/20 dark:border-amber-800">
            <p className="text-amber-800 dark:text-amber-300">
              Demo mode — your code is: <span className="font-bold tracking-widest">{displayOTP}</span>
            </p>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={handleComplete}
            disabled={loading}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive">{error}</p>
        )}

        <Button
          className="mt-6 w-full"
          onClick={() => handleVerify(otp)}
          disabled={otp.length < 6 || loading}
        >
          {loading ? 'Verifying...' : 'Verify & Continue'}
        </Button>

        <button
          type="button"
          onClick={handleResend}
          className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mx-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Resend code
        </button>

        <div className="mt-6">
          <Link href="/auth/signup" className="text-sm text-muted-foreground hover:underline">
            ← Back to sign up
          </Link>
        </div>
      </Card>
    </div>
  );
}
