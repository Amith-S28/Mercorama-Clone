import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportWorkspace } from "@/components/report/ReportWorkspace";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { id } = await searchParams;
  const title = id
    ? `Agency Trade Intelligence Report ${id} | Mercorama Portal`
    : "Agency Trade Intelligence Report | Mercorama Portal";
  const description =
    "Comprehensive country trade analytics, HS commodity breakdown, 10-year volume trends, landed cost solver, and global risk scorecard.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Mercorama",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: id
        ? `https://mercorama.com/portal/agency/report?id=${encodeURIComponent(id)}`
        : "https://mercorama.com/portal/agency/report",
    },
  };
}

function ReportSchema({ id }: { id?: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Report",
    name: id ? `Agency Trade Intelligence Report ${id}` : "Agency Trade Intelligence Report",
    description:
      "Comprehensive country trade analytics, HS commodity breakdown, landed cost solver, and risk scorecard.",
    publisher: {
      "@type": "Organization",
      name: "Mercorama",
      url: "https://mercorama.com",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function AgencyReportPage({ searchParams }: Props) {
  const { id } = await searchParams;
  return (
    <Suspense fallback={<div className="page-container">Loading report…</div>}>
      <ReportSchema id={id} />
      <ReportWorkspace />
    </Suspense>
  );
}

