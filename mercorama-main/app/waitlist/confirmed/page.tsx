// app/waitlist/confirmed/page.tsx
// Shown after successful waitlist signup.
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

const LINKEDIN_URL = 'https://www.linkedin.com/company/mercorama';

export default function WaitlistConfirmedPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b px-6 py-4 flex items-center">
        <Link href="/" className="text-sm font-semibold text-foreground">
          Mercorama
        </Link>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-20 text-center space-y-8">

        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />

        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">You're on the list.</h1>
          <p className="text-muted-foreground leading-relaxed">
            We'll notify you when Cohort 2 opens — typically within 2–4 weeks.
            Founding pricing will be available to Cohort 2 members as well.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Follow our journey on LinkedIn for updates →
          </p>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[#0A66C2] text-[#0A66C2] px-5 py-2.5 text-sm font-medium hover:bg-[#0A66C2]/5 transition-colors"
          >
            Follow on LinkedIn
          </a>
        </div>

      </main>

      <footer className="border-t px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Mercorama &middot;{' '}
          <Link href="/terms" className="hover:underline">Terms</Link>
          {' · '}
          <Link href="/privacy" className="hover:underline">Privacy</Link>
        </p>
      </footer>
    </div>
  );
}
