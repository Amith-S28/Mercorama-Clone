import { Metadata } from "next";
import Link from "next/link";
import { TradeDataExplorer } from "@/components/portal/TradeDataExplorer";
import { VantaNetBackground } from "@/components/ambient/VantaNetBackground";
import { ArrowLeft, Database, Globe2 } from "@/components/ui/icons";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Trade Data Intelligence Explorer | Mercorama";
  const description =
    "Explore historical bilateral trade flows, volume dissection, WorldBank GDP trends, and WTO MFN applied tariff schedules across global markets.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Mercorama Trade Intelligence",
      images: [
        {
          url: "https://mercorama.com/og-trade-data.png",
          width: 1200,
          height: 630,
          alt: "Mercorama Trade Data Explorer",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: "https://mercorama.com/portal/trade-data",
    },
  };
}

export default function TradeDataPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Global Bilateral Trade & Tariff Intelligence Dataset",
    description:
      "Comprehensive bilateral trade history, trade dissection by HS commodity chapters, WorldBank macroeconomic indicators, and WTO MFN tariff schedules.",
    url: "https://mercorama.com/portal/trade-data",
    provider: {
      "@type": "Organization",
      name: "Mercorama Trade Intelligence",
    },
  };

  return (
    <div className="relative min-h-screen bg-black text-white font-sans overflow-hidden">
      {/* Background Ambient Network Effect */}
      <VantaNetBackground />

      {/* JSON-LD SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Navigation & Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/portal/agency"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>BACK TO AGENCY PORTAL</span>
          </Link>
          <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black px-3.5 py-1 text-xs font-mono text-white">
            <Database size={12} className="text-[#ff5500]" />
            <span>DATASET SOURCE: UN COMTRADE & WORLDBANK</span>
          </div>
        </div>

        {/* Page Hero Header */}
        <header className="mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#ff5500] text-white px-3.5 py-1 text-xs font-mono font-bold tracking-wider">
            <Globe2 size={13} />
            <span>TRADE READINESS INTELLIGENCE</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white uppercase">
            Global Trade Data Explorer
          </h1>
          <p className="max-w-3xl text-sm text-zinc-400 leading-relaxed font-mono">
            Analyze multi-year bilateral trade history, commodity chapter dissections (HS 01–99), net weight volumes, WorldBank GDP growth, and WTO MFN applied tariff rates.
          </p>
        </header>

        {/* Primary Trade Data Explorer UI */}
        <TradeDataExplorer />
      </div>
    </div>
  );
}
