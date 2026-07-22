// components/landing/Features.tsx
import Link from 'next/link';
import { Compass, PackageSearch, Ship, BarChart3, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: Compass,
    title: 'Export Compass',
    body: 'Discover the best global markets for your product using AI-powered scoring across demand, FTA access, logistics, and risk.',
    href: '/export-compass',
    accentBg: 'bg-indigo-50 dark:bg-indigo-900/20',
    accentIcon: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
    accentBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
    accentText: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    icon: PackageSearch,
    title: 'HS Code Intelligence',
    body: 'Instantly find product classification using GRI rules. Get duty rates, misclassification risk flags, and tariff insights in seconds.',
    href: '/hscode',
    accentBg: 'bg-violet-50 dark:bg-violet-900/20',
    accentIcon: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400',
    accentBorder: 'hover:border-violet-300 dark:hover:border-violet-700',
    accentText: 'text-violet-600 dark:text-violet-400',
  },
  {
    icon: Ship,
    title: 'Incoterms Navigator',
    body: 'Understand responsibilities and risk in global trade. Plain-language breakdowns grounded in Incoterms® 2020.',
    href: '/incoterms',
    accentBg: 'bg-sky-50 dark:bg-sky-900/20',
    accentIcon: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
    accentBorder: 'hover:border-sky-300 dark:hover:border-sky-700',
    accentText: 'text-sky-600 dark:text-sky-400',
  },
  {
    icon: BarChart3,
    title: 'Trade Analytics',
    body: 'Analyze global demand and import trends. Surface the highest-opportunity markets before your competitors do.',
    href: '/export-compass',
    accentBg: 'bg-teal-50 dark:bg-teal-900/20',
    accentIcon: 'bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400',
    accentBorder: 'hover:border-teal-300 dark:hover:border-teal-700',
    accentText: 'text-teal-600 dark:text-teal-400',
  },
];

export function Features() {
  return (
    <section className="bg-[#F6F8FB] px-4 py-16 sm:py-24 sm:px-6 lg:px-8 dark:bg-muted/20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-primary">Platform capabilities</p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Built for every stage of your export deal
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground text-pretty">
            Mercorama combines market discovery, classification, and deal tools in a single platform.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, body, href, accentBg, accentIcon, accentBorder, accentText }) => (
            <div
              key={title}
              className={`group rounded-2xl border bg-background p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${accentBorder}`}
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${accentIcon}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{title}</h3>
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{body}</p>
              <Link
                href={href}
                className={`inline-flex items-center gap-1.5 text-sm font-semibold ${accentText} transition-opacity hover:opacity-80`}
              >
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
