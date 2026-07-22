// components/seo/JsonLd.tsx
// Global JSON-LD structured data for SEO, GEO (Generative Engine Optimization),
// and AEO (Answer Engine Optimization).

const SITE_URL = 'https://mercorama.com';

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Mercorama',
  legalName: 'MightyIQ Inc.',
  url: SITE_URL,
  logo: `${SITE_URL}/mercorama_logo_2026.png`,
  description: 'AI-powered trade intelligence platform for Canadian SMEs. From HS Code classification to signed deal.',
  foundingDate: '2025',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '42 Lewis Drive',
    addressLocality: 'Bedford',
    addressRegion: 'NS',
    postalCode: 'B4B 1C3',
    addressCountry: 'CA',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    url: `${SITE_URL}/contact`,
  },
  sameAs: [],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Mercorama',
  url: SITE_URL,
  description: 'AI-powered trade intelligence platform for Canadian SMEs.',
  publisher: { '@type': 'Organization', name: 'MightyIQ Inc.' },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/experts/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Mercorama',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description: 'AI-powered trade intelligence for Canadian SMEs — HS Code classification, Incoterms analysis, export market intelligence, FTA optimization, deal documentation, and verified trade expert consultations.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'CAD',
    description: 'Beta access available — apply to join.',
    url: `${SITE_URL}/beta`,
  },
  featureList: [
    'HS Code Classification (WCO HS 2022)',
    'Incoterms 2020 Analysis',
    'Deal Summary Generator',
    'Deal Wizard (end-to-end)',
    'Export Compass (10-market intelligence)',
    'FTA Diversify Wizard (CETA, CPTPP, CUSMA)',
    'Fund My Export (EDC, BDC matching)',
    'Freight Connect (verified forwarders)',
    'Trade Expert Marketplace (CITP/FIBP, customs brokers)',
  ],
  creator: { '@type': 'Organization', name: 'MightyIQ Inc.' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is Mercorama?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Mercorama is an AI-powered trade intelligence platform for Canadian SMEs. It provides HS Code classification, Incoterms analysis, export market intelligence, FTA optimization, deal documentation, and a marketplace of verified trade experts including CITP/FIBP professionals, customs brokers, and logistics specialists.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does Mercorama help Canadian exporters?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Mercorama helps Canadian exporters by providing AI-powered tools for every stage of an export deal: classifying products with HS codes, selecting the right Incoterms, identifying the best export markets via the Export Compass, finding FTA advantages under CETA/CPTPP/CUSMA, matching to export financing programs (EDC, BDC), and connecting with verified trade experts for professional guidance.',
      },
    },
    {
      '@type': 'Question',
      name: 'What trade agreements does Mercorama cover?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Mercorama covers all 15 active Canadian Free Trade Agreements including CETA (EU), CPTPP (Australia, Japan, Vietnam, and others), CUSMA/USMCA (US, Mexico), CKFTA (South Korea), EFTA (Iceland, Norway, Switzerland), and 10 additional bilateral agreements covering 51+ partner countries.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the Trade Expert Marketplace?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The Mercorama Trade Expert Marketplace connects Canadian SME exporters with verified professionals including CITP/FIBP certified trade professionals, CSCB licensed customs brokers, CIFFA freight forwarders, FTA advisors, and export finance consultants. Experts are verified through a three-tier system and sessions can be booked directly on the platform.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does Mercorama cost?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Mercorama is currently in beta. You can apply for early access at mercorama.com/beta. The platform offers Starter, Growth, and Advisory plan tiers with different tool access levels.',
      },
    },
  ],
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'ProfessionalService',
  name: 'Mercorama Trade Expert Marketplace',
  url: `${SITE_URL}/experts`,
  description: 'Connect with verified Canadian trade professionals — CITP/FIBP advisors, customs brokers, freight specialists, and export consultants.',
  provider: { '@type': 'Organization', name: 'MightyIQ Inc.' },
  areaServed: { '@type': 'Country', name: 'Canada' },
  serviceType: 'Trade Consulting',
};

export function JsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
    </>
  );
}
