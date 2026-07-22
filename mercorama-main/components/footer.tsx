import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-muted mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                src="/mercorama_logo_2026.png"
                alt="Mercorama"
                width={143}
                height={36}
                className="h-9 sm:h-11 w-auto"
              />
              <span className="inline-flex items-center rounded-full bg-[#01696f]/10 dark:bg-[#4f98a3]/15 text-[#01696f] dark:text-[#4f98a3] px-2 py-0.5 text-xs font-semibold tracking-wide select-none">
                beta
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">
              AI-powered trade intelligence platform for international commerce professionals.
            </p>
            <p className="text-xs text-muted-foreground/70 leading-relaxed mb-4">
              MightyIQ Inc. · 42 Lewis Drive, Bedford, NS B4B 1C3, Canada
            </p>
            <nav className="flex flex-wrap gap-x-4 gap-y-1">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Blog', href: '/blog' },
                { label: 'Contact', href: '/contact' },
                { label: 'Terms', href: '/terms' },
                { label: 'Privacy', href: '/privacy' },
                { label: 'Experts', href: '/experts/search' },
                { label: 'Data Sources', href: '/data-sources' },
                { label: 'Data Retention', href: '/data-retention' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Disclaimer */}
          <div className="md:col-span-2">
            <h3 className="font-semibold text-foreground mb-3">Important Notice</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              Mercorama provides AI-powered guidance for informational purposes only. This platform does not constitute legal, financial, or professional trade advice. Always consult with qualified customs brokers, freight forwarders, and legal counsel for specific trade transactions.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              HS Code classifications, duty rates, and contract terms may vary by jurisdiction and change over time. Verify all information with official government sources and trade authorities before making business decisions.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border text-center space-y-1">
          <p className="text-sm text-muted-foreground">
            © 2026 MERCORAMA powered by{' '}
            <a
              href="https://mightyiq.ca"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              MightyIQ Inc.
            </a>{' '}
            All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground">
            Made for export driven SMEs worldwide 🌍
          </p>
        </div>
      </div>
    </footer>
  );
}
