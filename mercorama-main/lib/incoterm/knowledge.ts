// lib/incoterm/knowledge.ts
// Static Incoterms 2020 knowledge base — V1 (prompt injection).
// Phase 2: replace with vector retrieval from embedded knowledge store.

export interface IncotermKnowledge {
  term: string;
  fullName: string;
  summary: string;
  riskTransfer: string;
  sellerPays: string;
  buyerPays: string;
  modes: string[];
  commonUseCases: string[];
  commonMistakes: string[];
}

export const INCOTERM_KNOWLEDGE: IncotermKnowledge[] = [
  {
    term: 'EXW', fullName: 'Ex Works',
    summary: 'Seller makes goods available at their premises. Buyer bears all costs and risks from pickup.',
    riskTransfer: 'At seller\'s premises when goods are placed at buyer\'s disposal.',
    sellerPays: 'Packaging only', buyerPays: 'All transport, export/import clearance, insurance',
    modes: ['Any'], commonUseCases: ['Domestic sales', 'Buyer has own logistics'],
    commonMistakes: ['Seller still liable for loading', 'Buyer may not have export license'],
  },
  {
    term: 'FCA', fullName: 'Free Carrier',
    summary: 'Seller delivers goods to carrier at named place. Most versatile term for containers.',
    riskTransfer: 'When goods are handed to the carrier at the named place.',
    sellerPays: 'Transport to carrier, export clearance', buyerPays: 'Main carriage, import clearance, insurance',
    modes: ['Any'], commonUseCases: ['Container shipments', 'Inland delivery to terminal'],
    commonMistakes: ['Confusing with FOB for containers', 'Not specifying exact delivery point'],
  },
  {
    term: 'FOB', fullName: 'Free On Board',
    summary: 'Seller delivers goods on board the vessel. Traditional term for sea freight.',
    riskTransfer: 'When goods are on board the vessel at the port of shipment.',
    sellerPays: 'Transport to port, loading, export clearance', buyerPays: 'Ocean freight, insurance, import clearance',
    modes: ['Sea/inland waterway only'], commonUseCases: ['Bulk cargo', 'Commodity trade'],
    commonMistakes: ['Using FOB for containers (use FCA)', 'Risk gap during loading'],
  },
  {
    term: 'CFR', fullName: 'Cost and Freight',
    summary: 'Seller pays freight to destination port. Risk transfers at loading port.',
    riskTransfer: 'When goods are on board the vessel at the port of shipment.',
    sellerPays: 'Transport to port, loading, ocean freight, export clearance', buyerPays: 'Insurance, import clearance, destination charges',
    modes: ['Sea/inland waterway only'], commonUseCases: ['When seller has better freight rates'],
    commonMistakes: ['Assuming seller bears risk during transit', 'No insurance obligation on seller'],
  },
  {
    term: 'CIF', fullName: 'Cost, Insurance and Freight',
    summary: 'Like CFR but seller also provides minimum insurance. Risk still transfers at loading.',
    riskTransfer: 'When goods are on board the vessel at the port of shipment.',
    sellerPays: 'Transport, loading, ocean freight, minimum insurance, export clearance', buyerPays: 'Import clearance, destination charges',
    modes: ['Sea/inland waterway only'], commonUseCases: ['Letters of credit requirements', 'When buyer wants insurance included'],
    commonMistakes: ['Insurance is minimum (Institute Cargo Clause C)', 'Risk transfers at loading, not destination'],
  },
  {
    term: 'CPT', fullName: 'Carriage Paid To',
    summary: 'Seller pays carriage to named destination. Risk transfers when goods are handed to first carrier.',
    riskTransfer: 'When goods are handed to the first carrier.',
    sellerPays: 'Transport to destination, export clearance', buyerPays: 'Insurance, import clearance',
    modes: ['Any'], commonUseCases: ['Multimodal transport', 'Air freight'],
    commonMistakes: ['Risk and cost transfer at different points', 'Buyer needs own insurance'],
  },
  {
    term: 'CIP', fullName: 'Carriage and Insurance Paid To',
    summary: 'Like CPT but seller provides broader insurance (Institute Cargo Clause A).',
    riskTransfer: 'When goods are handed to the first carrier.',
    sellerPays: 'Transport, insurance (all risks), export clearance', buyerPays: 'Import clearance',
    modes: ['Any'], commonUseCases: ['High-value goods', 'When buyer wants comprehensive insurance'],
    commonMistakes: ['Insurance is broader than CIF', 'Cost of insurance may be significant'],
  },
  {
    term: 'DAP', fullName: 'Delivered At Place',
    summary: 'Seller delivers goods at named destination, ready for unloading. Buyer handles import clearance.',
    riskTransfer: 'When goods are placed at buyer\'s disposal at the named destination.',
    sellerPays: 'All transport to destination, export clearance', buyerPays: 'Unloading, import clearance, duties',
    modes: ['Any'], commonUseCases: ['Door-to-door except import duties', 'When seller controls logistics'],
    commonMistakes: ['Seller doesn\'t clear import', 'Delays at customs are buyer\'s cost'],
  },
  {
    term: 'DPU', fullName: 'Delivered at Place Unloaded',
    summary: 'Seller delivers and unloads goods at named destination. Only term requiring seller to unload.',
    riskTransfer: 'When goods are unloaded at the named destination.',
    sellerPays: 'All transport, unloading, export clearance', buyerPays: 'Import clearance, duties',
    modes: ['Any'], commonUseCases: ['When seller has unloading capability at destination'],
    commonMistakes: ['Seller must ensure they can unload at destination', 'Replaced DAT in 2020'],
  },
  {
    term: 'DDP', fullName: 'Delivered Duty Paid',
    summary: 'Maximum seller obligation. Seller delivers goods cleared for import at destination.',
    riskTransfer: 'When goods are placed at buyer\'s disposal at the named destination, cleared for import.',
    sellerPays: 'Everything including import duties and taxes', buyerPays: 'Nothing (except unloading if agreed)',
    modes: ['Any'], commonUseCases: ['E-commerce', 'When seller wants full control'],
    commonMistakes: ['Seller must be able to clear import', 'VAT/GST registration may be required in destination'],
  },
  {
    term: 'FAS', fullName: 'Free Alongside Ship',
    summary: 'Seller delivers goods alongside the vessel at the port of shipment.',
    riskTransfer: 'When goods are placed alongside the vessel at the named port.',
    sellerPays: 'Transport to port, export clearance', buyerPays: 'Loading, ocean freight, insurance, import clearance',
    modes: ['Sea/inland waterway only'], commonUseCases: ['Bulk commodities at port', 'When buyer arranges vessel'],
    commonMistakes: ['Rarely used for containers', 'Seller must clear export'],
  },
];

/**
 * Get knowledge for a specific Incoterm.
 */
export function getIncotermKnowledge(term: string): IncotermKnowledge | null {
  return INCOTERM_KNOWLEDGE.find((k) => k.term === term.toUpperCase()) ?? null;
}

/**
 * Build a context string for Claude prompts.
 * Phase 2: this will be replaced by RAG retrieval.
 */
export function buildIncotermContext(term: string): string {
  const k = getIncotermKnowledge(term);
  if (!k) return '';
  return `Incoterm ${k.term} (${k.fullName}): ${k.summary} Risk transfers: ${k.riskTransfer}. Seller pays: ${k.sellerPays}. Buyer pays: ${k.buyerPays}. Common mistakes: ${k.commonMistakes.join('; ')}.`;
}
