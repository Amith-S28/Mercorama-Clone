'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { FeaturedExperts } from '@/components/experts/FeaturedExperts';

// ── Scroll reveal hook ────────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { el.style.opacity = '1'; el.style.transform = 'none'; return; }
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'none'; obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ── Count-up component ────────────────────────────────────────────────────────

function CountUp({ target, prefix = '', suffix = '', duration = 1500 }: { target: number; prefix?: string; suffix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted.current) {
        counted.current = true;
        const start = performance.now();
        const animate = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const val = Math.round(eased * target);
          el.textContent = `${prefix}${val.toLocaleString()}${suffix}`;
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, prefix, suffix, duration]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

// ── Donut chart ───────────────────────────────────────────────────────────────

function DonutStat({ pct, label, color, delay }: { pct: number; label: string; color: string; delay: number }) {
  const ref = useRef<SVGCircleElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const circumference = 2 * Math.PI * 40;
    el.style.strokeDasharray = `${circumference}`;
    el.style.strokeDashoffset = `${circumference}`;
    el.style.transition = `stroke-dashoffset 1.5s ease ${delay}ms`;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.style.strokeDashoffset = `${circumference * (1 - pct / 100)}`;
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    const parent = el.closest('svg');
    if (parent) obs.observe(parent);
    return () => obs.disconnect();
  }, [pct, delay]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="100" height="100" viewBox="0 0 100 100" className="rotate-[-90deg]">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
        <circle ref={ref} cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
      </svg>
      <span className="text-2xl font-bold" style={{ color }}>{pct}%</span>
      <span className="text-xs text-muted-foreground text-center max-w-[120px]">{label}</span>
    </div>
  );
}

// ── Flow diagram ──────────────────────────────────────────────────────────────

function FlowDiagram() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const lines = el.querySelectorAll<SVGLineElement>('.flow-line');
    lines.forEach((line) => {
      const len = line.getTotalLength();
      line.style.strokeDasharray = `${len}`;
      line.style.strokeDashoffset = `${len}`;
      line.style.transition = 'stroke-dashoffset 1s ease 0.3s';
    });
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        lines.forEach((line) => { line.style.strokeDashoffset = '0'; });
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const steps = [
    { label: 'Classification\n& Customs', x: 60 },
    { label: 'Market Access\n& Intelligence', x: 220 },
    { label: 'Incoterms &\nRisk Allocation', x: 380 },
    { label: 'Export Deal\nFramework', x: 540 },
  ];

  return (
    <svg ref={ref} viewBox="0 0 640 100" className="w-full max-w-2xl mx-auto hidden sm:block" aria-label="Trade workflow: Classification to Deal Framework">
      {steps.map((s, i) => (
        <g key={s.label}>
          {i < steps.length - 1 && (
            <line className="flow-line" x1={s.x + 40} y1={35} x2={steps[i + 1].x - 10} y2={35} stroke="#01696f" strokeWidth="2" />
          )}
          <circle cx={s.x + 15} cy={35} r="22" fill="#01696f" opacity="0.1" />
          <circle cx={s.x + 15} cy={35} r="12" fill="#01696f" />
          {s.label.split('\n').map((line, li) => (
            <text key={li} x={s.x + 15} y={72 + li * 14} textAnchor="middle" className="fill-foreground text-[10px]">{line}</text>
          ))}
        </g>
      ))}
    </svg>
  );
}

// Mobile flow (vertical)
function FlowDiagramMobile() {
  const steps = ['Classification & Customs', 'Market Access & Intelligence', 'Incoterms & Risk Allocation', 'Export Deal Framework'];
  return (
    <div className="sm:hidden space-y-3">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className="h-8 w-8 rounded-full bg-[#01696f] flex items-center justify-center text-white text-xs font-bold">{i + 1}</div>
            {i < steps.length - 1 && <div className="w-px h-4 bg-[#01696f]/30" />}
          </div>
          <span className="text-sm font-medium">{step}</span>
        </div>
      ))}
    </div>
  );
}

// ── Marquee ───────────────────────────────────────────────────────────────────

function StatsTicker() {
  const items = [
    '🇨🇦 1.1M+ Canadian SMEs',
    '97.4% of exporters are SMEs',
    '50+ markets via CETA & CPTPP',
    '<30% currently claim FTA benefits',
    '72% of SME exporters sell to US only',
    '$33T in global trade annually',
  ];
  const doubled = [...items, ...items];

  return (
    <div className="bg-[#0c4e54] text-white py-3 overflow-hidden select-none">
      <div className="flex gap-8 animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
        {doubled.map((item, i) => (
          <span key={i} className="text-sm font-medium opacity-90 flex items-center gap-2">
            {item}
            <span className="text-[#4f98a3]">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ExpertsLanding() {
  const heroRef = useReveal();
  const gapRef = useReveal();
  const stuckRef = useReveal();
  const helpRef1 = useReveal();
  const helpRef2 = useReveal();
  const trustRef = useReveal();

  return (
    <>
      {/* ── SECTION 1: HERO ── */}
      <section className="relative bg-[#01696f] text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#01696f] via-[#0c4e54] to-[#01696f]" />
        <div ref={heroRef} className="relative max-w-5xl mx-auto px-4 py-14 md:py-20 text-center space-y-6">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Canada&apos;s SMEs Are Ready to Export.<br className="hidden sm:block" />
            They Just Need the Right Guide.
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            Over 1.1 million SMEs power 98.2% of Canadian businesses — yet only 11%
            are active in global markets. MERCORAMA connects you with trade experts
            who change that.
          </p>
          <Link href="/experts/search">
            <Button size="lg" variant="secondary" className="gap-2 text-base">
              Connect with a Trade Expert <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── SECTION 2: ANIMATED STATS BAR ── */}
      <StatsTicker />

      {/* ── SECTION 3: THE OPPORTUNITY GAP ── */}
      <section className="py-10 md:py-14 px-4">
        <div ref={gapRef} className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
            The Opportunity Is Enormous — But So Is the Gap
          </h2>
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div className="text-left">
              <p className="text-base text-muted-foreground leading-relaxed">
                Canada is home to 1.08 million small businesses and nearly 17,000
                medium-sized enterprises — the backbone of the Canadian economy.
                Despite trade agreements like CETA and CPTPP opening access to 50+
                markets, fewer than 30% of SMEs use their Free Trade Agreement
                entitlements. The potential to grow is immense.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:gap-10 justify-items-center">
              <DonutStat pct={72} label="SMEs selling to US only" color="#01696f" delay={0} />
              <DonutStat pct={30} label="Using FTA entitlements" color="#4f98a3" delay={200} />
              <DonutStat pct={11} label="Active in global markets" color="#0c4e54" delay={400} />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: WHY SMES GET STUCK ── */}
      <section className="py-10 md:py-14 px-4 bg-muted/30">
        <div ref={stuckRef} className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">Why SMEs Get Stuck</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Large feature card */}
            <div className="md:col-span-2 md:row-span-2 rounded-2xl bg-card p-8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <p className="text-xl sm:text-2xl font-bold leading-snug mb-4">
                72% of Canadian SME exporters sell exclusively to the US — leaving CETA and CPTPP advantages entirely unclaimed.
              </p>
              <p className="text-xs text-muted-foreground">Source: Statistics Canada, 2025</p>
            </div>
            <div className="rounded-2xl bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <p className="text-base font-semibold leading-snug mb-3">
                Only 11% of Canadian SMEs are doing business in the global marketplace.
              </p>
              <p className="text-xs text-muted-foreground">Source: GAC / CPTPP SME report</p>
            </div>
            <div className="rounded-2xl bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <p className="text-base font-semibold leading-snug mb-3">
                Fewer than 30% of SMEs currently use their FTA entitlements — CETA + CPTPP open 50+ markets.
              </p>
              <p className="text-xs text-muted-foreground">Source: GAC / ICC</p>
            </div>
            <div className="rounded-2xl bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <p className="text-base font-semibold leading-snug mb-3">
                Wrong HS codes void FTA claims, trigger back-duties, and expose businesses to audit risk.
              </p>
            </div>
            <div className="md:col-span-2 rounded-2xl bg-card p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
              <p className="text-base font-semibold leading-snug mb-3">
                EXW or DAP Incoterm misuse creates liability gaps and quietly erodes your margins on every deal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: HOW TRADE EXPERTS HELP ── */}
      <section className="py-10 md:py-14 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">
            Meet Your Export Advantage — Real Experts, Real Deals
          </h2>

          {/* Row 1 */}
          <div ref={helpRef1} className="grid gap-8 md:grid-cols-2 items-center">
            <div className="text-left space-y-4">
              <h3 className="text-xl font-bold">The 4 Decisions That Determine Every Export Deal</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Get any one wrong and it cascades through all the others.
                MERCORAMA trade experts guide you through each one — inside
                a structured, audit-ready workflow.
              </p>
            </div>
            <div>
              <FlowDiagram />
              <FlowDiagramMobile />
            </div>
          </div>

          {/* Row 2 */}
          <div ref={helpRef2} className="grid gap-8 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1 rounded-2xl bg-gradient-to-br from-[#01696f]/5 to-[#4f98a3]/10 p-8 md:p-12 border">
              <div className="space-y-3">
                <div className="h-3 w-24 bg-[#01696f]/20 rounded-full" />
                <div className="h-3 w-36 bg-[#01696f]/15 rounded-full" />
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {[1,2,3,4,5,6].map((i) => (
                    <div key={i} className="h-12 rounded-lg bg-[#01696f]/10 border border-[#01696f]/15" />
                  ))}
                </div>
                <div className="h-3 w-28 bg-[#4f98a3]/20 rounded-full mt-4" />
                <div className="h-8 w-32 bg-[#01696f] rounded-lg mt-2" />
              </div>
            </div>
            <div className="order-1 md:order-2 text-left space-y-4">
              <h3 className="text-xl font-bold">Not a Report. A Working Partnership.</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                MERCORAMA experts don&apos;t hand you a 40-page report and disappear.
                They work alongside your team — inside the platform — to classify
                your product, select your market, apply the right Incoterm, and
                build a signed-ready deal record. From HS Code to signed deal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5B: FEATURED EXPERTS ── */}
      <FeaturedExperts />

      {/* ── SECTION 6: PULL QUOTE ── */}
      <section className="bg-[#01696f] text-white py-10 md:py-14 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="text-xl sm:text-2xl md:text-3xl font-bold leading-snug tracking-tight">
            &ldquo;The tools exist. The FTAs exist.<br />
            The gap is operational — and that&apos;s exactly what MERCORAMA closes.&rdquo;
          </blockquote>
          <p className="mt-6 text-sm text-white/60">
            — MightyIQ, MERCORAMA Platform Brief, April 2026
          </p>
        </div>
      </section>

      {/* ── SECTION 7: TRUST STATS GRID ── */}
      <section className="py-10 md:py-14 px-4 bg-[#f7f6f2] dark:bg-muted/20">
        <div ref={trustRef} className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { value: 33, prefix: '$', suffix: 'T', label: 'Global merchandise trade annually', source: 'WTO 2023' },
              { value: 1100000, prefix: '', suffix: '+', label: 'Canadian SMEs', source: 'ISED, 2025' },
              { value: 50, prefix: '', suffix: '+', label: 'Markets opened by CETA & CPTPP', source: '' },
              { value: 97, prefix: '', suffix: '.4%', label: 'Of exporters are SMEs', source: '' },
              { value: 30, prefix: '<', suffix: '%', label: 'Currently claim FTA benefits', source: 'GAC/ICC' },
              { value: 72, prefix: '', suffix: '%', label: 'SME exporters selling to US only', source: 'Stats Canada, 2025' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-card border p-6 text-center hover:shadow-md transition-shadow">
                <div className="text-3xl sm:text-4xl font-bold text-[#01696f] dark:text-[#4f98a3]">
                  <CountUp target={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
                {stat.source && <p className="text-[10px] text-muted-foreground/60 mt-1">{stat.source}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8: CTA FOOTER BANNER ── */}
      <section className="bg-[#0c4e54] text-white py-10 md:py-14 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Ready to reach your first — or next — export market?
          </h2>
          <p className="text-base text-white/70 max-w-lg mx-auto">
            Browse MERCORAMA trade experts and start building
            your global pipeline today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/experts/search">
              <Button size="lg" variant="secondary" className="gap-2 text-base w-full sm:w-auto">
                Connect with an Expert <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="gap-2 text-base border-white text-white bg-white/10 hover:bg-white/20 w-full sm:w-auto">
                Explore the Platform
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Marquee animation */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-marquee { animation: none; }
        }
      `}</style>
    </>
  );
}
