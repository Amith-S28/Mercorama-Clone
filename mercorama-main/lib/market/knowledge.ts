// lib/market/knowledge.ts
// Vectorless RAG — deterministic market knowledge injection.
// Phase 2: supplement with vector retrieval from embedded datasets.

// ── Category → priority markets ──────────────────────────────────────────────

interface CategoryMarketRule {
  keywords: string[];
  priorityMarkets: string[];
  context: string;
}

const CATEGORY_RULES: CategoryMarketRule[] = [
  {
    keywords: ['maple', 'syrup', 'sugar bush'],
    priorityMarkets: ['Germany', 'United Kingdom', 'Japan', 'Australia', 'France'],
    context: 'Canadian maple products have strong brand recognition in Europe and Japan. Germany is the largest EU importer of maple syrup. Japan values premium artisanal products and imports via specialty food distributors.',
  },
  {
    keywords: ['seafood', 'fish', 'lobster', 'crab', 'shrimp', 'salmon', 'shellfish'],
    priorityMarkets: ['United States', 'China', 'Japan', 'South Korea', 'Hong Kong'],
    context: 'Canada is the world\'s 7th-largest seafood exporter. The US absorbs 60%+ of Canadian seafood exports. China and Japan are high-value markets for live lobster and snow crab. CPTPP reduces tariffs for Japan and Vietnam.',
  },
  {
    keywords: ['lumber', 'wood', 'timber', 'plywood', 'softwood', 'pulp'],
    priorityMarkets: ['United States', 'China', 'Japan', 'South Korea', 'India'],
    context: 'Canada is the world\'s largest softwood lumber exporter. US is dominant (80%+ share). Softwood Lumber Agreement affects US tariffs. Japan and South Korea pay premium for certified sustainable wood (FSC/PEFC).',
  },
  {
    keywords: ['canola', 'wheat', 'barley', 'grain', 'oilseed', 'lentil', 'pulse'],
    priorityMarkets: ['China', 'Japan', 'Mexico', 'India', 'Bangladesh'],
    context: 'Canada is the world\'s largest canola exporter and a top-5 wheat exporter. China–Canada canola trade has been subject to phytosanitary restrictions. Japan values Canadian wheat for noodle production. India is a key pulse market.',
  },
  {
    keywords: ['machinery', 'equipment', 'industrial', 'manufacturing', 'tools'],
    priorityMarkets: ['United States', 'Mexico', 'United Kingdom', 'Australia', 'Germany'],
    context: 'Canadian machinery exports benefit from CUSMA (US/Mexico) and CETA (EU). The US accounts for 70%+ of Canadian machinery exports. UK and Australia are accessible through bilateral agreements.',
  },
  {
    keywords: ['technology', 'software', 'saas', 'ai', 'digital', 'fintech'],
    priorityMarkets: ['United States', 'United Kingdom', 'Germany', 'Australia', 'Singapore'],
    context: 'Canada\'s tech exports are primarily services-based. US is the natural first market (CUSMA provisions for digital trade). UK, Germany, and Australia have active procurement of Canadian tech. Singapore is a gateway to ASEAN.',
  },
  {
    keywords: ['cannabis', 'hemp', 'cbd'],
    priorityMarkets: ['Germany', 'Australia', 'Israel', 'United Kingdom', 'Czech Republic'],
    context: 'Canada is a global leader in regulated cannabis exports. Germany is the largest EU medical cannabis market (regulated under BfArM). Australia, Israel, and UK have active medical cannabis import frameworks.',
  },
  {
    keywords: ['cosmetics', 'skincare', 'beauty', 'personal care'],
    priorityMarkets: ['United States', 'China', 'South Korea', 'Japan', 'France'],
    context: 'Canadian clean beauty and natural cosmetics have growing international demand. China requires NMPA registration for imports. South Korea and Japan are early-adopter markets for premium skincare. CETA facilitates EU market entry.',
  },
];

// ── Country → FTA/trade context ──────────────────────────────────────────────

interface CountryContext {
  country: string;
  agreements: string[];
  context: string;
}

const COUNTRY_CONTEXTS: CountryContext[] = [
  {
    country: 'Germany',
    agreements: ['CETA (Canada-EU Comprehensive Economic and Trade Agreement)'],
    context: 'CETA eliminates tariffs on 98% of EU tariff lines. Canadian exporters must obtain EUR.1 certificate of origin for preferential rates. German importers value certifications (ISO, BRC, IFS). Key ports: Hamburg, Bremerhaven.',
  },
  {
    country: 'United Kingdom',
    agreements: ['Canada-UK Trade Continuity Agreement (TCA)'],
    context: 'Post-Brexit TCA preserves CETA-like preferential access. UK importers require UKCA marking for regulated goods. Key channels: specialty food retailers, Amazon UK marketplace. London is the primary distribution hub.',
  },
  {
    country: 'Japan',
    agreements: ['CPTPP (Comprehensive and Progressive Agreement for Trans-Pacific Partnership)'],
    context: 'CPTPP progressively eliminates tariffs on 95% of Japanese tariff lines for Canadian goods. Japan has strict phytosanitary standards (MAFF). JAS certification required for organic claims. Key buyers: trading houses (sogo shosha).',
  },
  {
    country: 'United States',
    agreements: ['CUSMA (Canada-United States-Mexico Agreement)'],
    context: 'CUSMA ensures duty-free trade for most Canadian goods meeting rules of origin. FDA registration required for food exports. CBP classification uses HTS 10-digit codes. Key: compliance with Buy American provisions for government procurement.',
  },
  {
    country: 'China',
    agreements: [],
    context: 'No FTA with Canada — MFN rates apply. GACC registration required for food exporters since 2022. CIQ inspection mandatory. Growing demand for premium Canadian food products. Payment terms: typically LC (Letter of Credit) for new suppliers.',
  },
  {
    country: 'South Korea',
    agreements: ['Canada-Korea Free Trade Agreement (CKFTA)'],
    context: 'CKFTA eliminates tariffs on 98% of Korean tariff lines over 10 years. KFDA approval required for food products. K-REACH compliance required for chemicals. Korean importers prefer CIF or DDP terms.',
  },
  {
    country: 'Australia',
    agreements: ['CPTPP'],
    context: 'CPTPP provides preferential access. DAFF biosecurity clearance required for food/agriculture. TGA approval for health products. Strong demand for Canadian food, technology, and mining equipment.',
  },
  {
    country: 'Mexico',
    agreements: ['CUSMA'],
    context: 'CUSMA ensures duty-free access for qualifying goods. COFEPRIS registration required for food/pharma. Growing middle class drives demand for premium imports. Key: Spanish-language labeling requirements.',
  },
  {
    country: 'India',
    agreements: [],
    context: 'No FTA with Canada — negotiations ongoing. BIS certification required for many product categories. High MFN tariffs (15–100% on food). Payment risk: LC recommended. Growing demand for pulses, wood, and technology.',
  },
];

// ── Public API ───────────────────────────────────────────────────────────────

export function getMarketContext(query: string): string {
  if (!query) return '';
  const q = query.toLowerCase();
  const blocks: string[] = [];

  // Match category rules
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => q.includes(k))) {
      blocks.push(`Priority markets for this product category: ${rule.priorityMarkets.join(', ')}.\n${rule.context}`);
    }
  }

  // Match country context
  for (const cc of COUNTRY_CONTEXTS) {
    if (q.includes(cc.country.toLowerCase())) {
      const agreements = cc.agreements.length > 0
        ? `Active trade agreements: ${cc.agreements.join(', ')}.`
        : 'No active FTA with Canada — MFN rates apply.';
      blocks.push(`${cc.country}: ${agreements}\n${cc.context}`);
    }
  }

  return blocks.join('\n\n');
}

export function getPriorityMarkets(product: string): string[] {
  const q = product.toLowerCase();
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((k) => q.includes(k))) {
      return rule.priorityMarkets;
    }
  }
  return [];
}
