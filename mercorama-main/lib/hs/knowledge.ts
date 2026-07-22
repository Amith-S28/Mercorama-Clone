// lib/hs/knowledge.ts
// HS Code knowledge base — V1 (prompt injection).
// Phase 2: replace with vector retrieval.

export interface HSCategoryKnowledge {
  category: string;
  chapters: string[];
  notes: string[];
  commonMistakes: string[];
}

export const HS_KNOWLEDGE: HSCategoryKnowledge[] = [
  {
    category: 'Seafood & Fish',
    chapters: ['03'],
    notes: [
      'HS 2022 restructured Chapter 03 crustaceans: 0306.1x = FROZEN, 0306.3x = LIVE/FRESH/CHILLED (opposite of HS 2017)',
      'Homarus spp. (Atlantic lobster) ≠ Palinurus/Jasus (rock/spiny lobster)',
      'Atlantic lobster live/fresh = 030632, frozen = 030612',
      'Snow crab live/fresh = 030633, frozen = 030614',
      'Processing level (live → cooked → canned) changes heading entirely',
    ],
    commonMistakes: [
      'Using HS 2017 codes instead of HS 2022',
      'Confusing frozen vs live subheadings (reversed in 2022)',
      'Classifying cooked crustaceans under Chapter 03 instead of Chapter 16',
    ],
  },
  {
    category: 'Maple Products',
    chapters: ['17', '21'],
    notes: [
      'Pure maple syrup → 1702.90 (sugars)',
      'Maple syrup blends with other sweeteners → 2106.90 (food preparations)',
      'Maple sugar/candy → 1702.90 or 1704 depending on processing',
      'Purity certification affects classification — "100% pure" vs "maple flavored"',
    ],
    commonMistakes: [
      'Classifying blended syrups as pure maple',
      'Not distinguishing between maple syrup and maple sugar',
    ],
  },
  {
    category: 'Wood & Lumber',
    chapters: ['44'],
    notes: [
      'Rough vs sawn lumber: 4403 (rough) vs 4407 (sawn)',
      'Plywood → 4412, particle board → 4410',
      'Species identification required (softwood vs hardwood)',
      'Dimensional lumber grading affects subheading',
    ],
    commonMistakes: [
      'Not specifying wood species in product description',
      'Confusing rough timber with sawn lumber',
    ],
  },
  {
    category: 'Agricultural Products',
    chapters: ['01', '02', '04', '06', '07', '08', '09', '10', '11', '12'],
    notes: [
      'Fresh vs frozen vs dried vs preserved all have different subheadings',
      'Organic certification does not change HS code — it is a separate regulatory matter',
      'Seed for planting vs consumption may differ in classification',
      'SPS (Sanitary and Phytosanitary) certificates required for most agricultural exports',
    ],
    commonMistakes: [
      'Assuming organic products have special HS codes',
      'Not distinguishing between fresh and processed forms',
    ],
  },
  {
    category: 'Machinery & Equipment',
    chapters: ['84', '85'],
    notes: [
      'Function determines classification, not appearance',
      'Parts and accessories often classified separately from the machine',
      'Multi-function machines classified by principal function (GRI 3)',
      'Software embedded in machinery is classified with the machine',
    ],
    commonMistakes: [
      'Classifying parts under the machine heading instead of parts heading',
      'Not applying GRI 3 for multi-function devices',
    ],
  },
  {
    category: 'Chemicals & Minerals',
    chapters: ['25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '38'],
    notes: [
      'Pure chemicals classified by chemical name (Chapters 28-29)',
      'Mixtures and preparations → Chapter 38 or specific chapters',
      'Pharmaceutical products → Chapter 30 (requires regulatory context)',
      'Fertilizers → Chapter 31 (pure) or 38 (mixed)',
    ],
    commonMistakes: [
      'Classifying chemical mixtures as pure chemicals',
      'Not considering end-use for dual-use chemicals',
    ],
  },
  {
    category: 'Technology & Software',
    chapters: ['84', '85', '90'],
    notes: [
      'Hardware classified by function under Chapters 84/85',
      'Software on physical media classified under 8523 (recorded media)',
      'Downloaded software — no HS code (not a physical good)',
      'IoT devices classified by primary function, not connectivity',
    ],
    commonMistakes: [
      'Trying to classify SaaS or digital services under HS',
      'Classifying a computer peripheral as a computer',
    ],
  },
];

/**
 * Find relevant HS knowledge for a product description.
 * Returns matching category notes for prompt enrichment.
 */
export function findRelevantHSKnowledge(productDescription: string): string {
  const desc = productDescription.toLowerCase();
  const matches: HSCategoryKnowledge[] = [];

  for (const cat of HS_KNOWLEDGE) {
    const keywords = cat.category.toLowerCase().split(/[&,\s]+/);
    if (keywords.some((kw) => kw.length > 2 && desc.includes(kw))) {
      matches.push(cat);
    }
  }

  if (matches.length === 0) return '';

  return matches.map((m) =>
    `Category: ${m.category}\nNotes: ${m.notes.join('; ')}\nCommon mistakes: ${m.commonMistakes.join('; ')}`
  ).join('\n\n');
}
