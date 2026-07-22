import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Users } from 'lucide-react';

export function MarketingFooter() {
  return (
    <>
      {/* Dark CTA band */}
      <section className="bg-[#0b1f3a] px-4 py-14 sm:py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Ready to grow beyond borders?
            </h2>
            <p className="text-gray-400 max-w-md text-sm leading-relaxed">
              Book a personalized demo to see how Mercorama can help your business find opportunities, reduce risk, and grow globally.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link href="/contact">
              <Button size="lg" className="gap-2 rounded-full bg-[#0d6e74] hover:bg-[#0a5a5f] text-white px-7">
                <Calendar className="h-4 w-4" />
                Book a Demo
              </Button>
            </Link>
            <Link href="/beta">
              <Button size="lg" variant="outline" className="gap-2 rounded-full border-gray-600 text-white hover:bg-white/10 px-7">
                <Users className="h-4 w-4" />
                Join Early Access
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer links */}
      <footer className="bg-[#07182e] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} MightyIQ Inc. · Built in Canada 🍁</p>
          <nav className="flex flex-wrap gap-4 justify-center">
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
              { label: 'Data Retention', href: '/data-retention' },
              { label: 'Verification Policy', href: '/verification-policy' },
              { label: 'Contact', href: '/contact' },
            ].map(({ label, href }) => (
              <Link key={href} href={href} className="hover:text-gray-300 transition-colors">
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}
