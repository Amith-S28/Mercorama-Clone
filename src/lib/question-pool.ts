import type { PillarKey, Question } from '@/types';
import { PILLAR_LABELS, PILLAR_WEIGHTS } from '@/lib/scoring-engine';

export { PILLAR_WEIGHTS, PILLAR_LABELS };

const S = (source: string) => source;

function q(
  id: string,
  pillar: PillarKey,
  text: string,
  opts: [string, string, string, string],
  source: string,
  trap?: string
): Question {
  const keys = ['A', 'B', 'C', 'D'] as const;
  const scores = [100, 70, 40, 10];
  return {
    id,
    pillar,
    text,
    options: keys.map((key, i) => ({ key, text: opts[i], score: scores[i] })),
    trap,
    source: S(source),
    officialSources: [source],
  };
}

export const QUESTION_POOL: Question[] = [
  // Pillar 1: Management
  q('Q1.1', 'management', 'How does your organization allocate time and resources to international sales development?', [
    'We have a dedicated export manager/team with a defined annual budget for international market development.',
    'Our CEO/owner personally handles export opportunities alongside domestic duties, with an informal budget.',
    'We respond to incoming international inquiries when they arrive but have no proactive export plan.',
    'We focus on exporting only when domestic sales slow down or seasonal demand drops.',
  ], 'TCS Step-by-Step Guide to Exporting, BDC Export Readiness Framework', 'Reactionary exporter syndrome — per BDC research, SMEs that treat exports as overflow fail within 18 months.'),
  q('Q1.2', 'management', "Your board/ownership group asks: 'When should we expect positive ROI from our export initiative?' What is your answer?", [
    'We have modeled a 2-3 year runway with phased milestones before expecting net-positive returns.',
    'We expect to break even within 12-18 months based on initial order projections.',
    'We expect our first international order to be immediately profitable.',
    "We haven't discussed ROI timelines — we just need revenue from any available market.",
  ], 'TCS Step-by-Step Guide to Exporting'),
  q('Q1.3', 'management', 'How do you handle the risk of your key export champion leaving the organization?', [
    'Export knowledge is documented in SOPs, and at least 2 staff members are cross-trained on international processes.',
    'Our export lead has trained one backup, but most knowledge is informal.',
    'One person manages all export relationships and documentation.',
    "We haven't considered this — our founder handles everything personally.",
  ], 'BDC Export Readiness Framework'),
  q('Q1.4', 'management', 'A potential distributor in Germany requests a meeting at Anuga. How does management respond?', [
    'We budget for 2-3 international trade shows annually and would prioritize attending with prepared materials.',
    'We would attend if timing allows but have no standing budget for trade shows.',
    'We would send product samples by mail instead of attending in person.',
    'Trade shows are too expensive — we rely on our website and email outreach for international leads.',
  ], 'Trade Commissioner Service CanExport program'),
  q('Q1.5', 'management', 'How would you describe your formal export plan?', [
    'We have a written export plan with defined target markets, entry strategies, pricing models, and compliance checklists, reviewed quarterly.',
    'We have an informal plan discussed among management but not documented.',
    'We follow opportunities as they arise — our domestic business plan covers international sales loosely.',
    "We don't have a separate export plan. Our domestic sales strategy applies everywhere.",
  ], 'TCS Step-by-Step Guide to Exporting'),

  // Pillar 2: Product
  q('Q2.1', 'product', 'How have you validated that your product has demand in your target export market?', [
    'We analyzed UN Comtrade import data for our HS code in the target country and identified year-over-year demand growth.',
    'A foreign buyer or distributor expressed interest, and we researched basic market size data.',
    'Our product sells well domestically, so we assume it will succeed internationally.',
    "A friend/colleague suggested the market might be good. We haven't done formal research.",
  ], 'UN Comtrade, comtradeplus.un.org'),
  q('Q2.2', 'product', 'Do you know the 6-digit HS (Harmonized System) code for your primary export product?', [
    'Yes, we have verified it using the CBSA tariff finder or WCO classification tools.',
    "We have a code but haven't verified whether it's the most specific classification.",
    "Our customs broker handles this — we don't know the code ourselves.",
    'No, we are not familiar with HS codes.',
  ], 'CBSA Memorandum D11-6-6, WCO HS 2022'),
  q('Q2.3', 'product', 'Has your product received any international certifications, quality marks, or compliance testing?', [
    'Yes, we hold certifications relevant to our target markets (CE, JAS, FDA, HACCP/BRC).',
    'We have Canadian certifications and are researching international requirements.',
    'Our product meets Canadian standards, which we believe are sufficient for most markets.',
    "We haven't investigated what certifications foreign markets require.",
  ], 'CFIA Export Requirements Library'),
  q('Q2.4', 'product', "Your Japanese buyer requests bilingual labeling per Japan's Food Sanitation Act. What is your response?", [
    'We anticipated localization requirements and have engaged a certified translation service with regulatory expertise.',
    "We can adapt our labels but need to research Japan's specific requirements.",
    'We plan to add a Japanese sticker label over our existing Canadian packaging.',
    'Our current labels are in English/French as required by Canadian law — this should be sufficient.',
  ], "Japan Food Sanitation Act (食品衛生法)"),
  q('Q2.5', 'product', 'How do you protect your brand name and product designs in foreign markets?', [
    'We have registered (or are registering) trademarks through the Madrid Protocol system administered by WIPO.',
    'We have Canadian trademark registration and plan to explore international registration.',
    "We haven't registered internationally but believe our Canadian trademark provides some protection.",
    "We haven't considered trademark registration outside Canada.",
  ], 'WIPO Madrid Protocol'),

  // Pillar 3: Operations
  q('Q3.1', 'operations', 'Your German distributor places an unexpected rush order for 200% of your normal monthly output. How does your facility respond?', [
    'We maintain a 15-20% safety stock buffer and have pre-negotiated flex capacity with key suppliers.',
    'We can ramp up production within 4-6 weeks by adding shifts.',
    'We would accept the order and run extended overtime to meet the deadline.',
    'We would have to decline or significantly delay — our current capacity is fully committed.',
  ], 'ICC Incoterms 2020, EU Regulation EC 178/2002'),
  q('Q3.2', 'operations', 'Under which Incoterms 2020 trade terms do you intend to sell to foreign B2B buyers?', [
    'FCA or CIF — we handle export customs clearance and coordinate freight to the destination port.',
    'FOB — we deliver to the port of loading and the buyer arranges ocean freight.',
    'EXW — the buyer picks up from our warehouse.',
    "We haven't decided on trade terms yet.",
  ], 'ICC Incoterms 2020, CBSA Memorandum D20-1-1'),
  q('Q3.3', 'operations', 'How do you currently track international orders, shipments, and customs documentation?', [
    'We use an integrated ERP/order management system with separate customs documentation workflows.',
    'We use spreadsheets and email, with a designated person responsible for export paperwork.',
    "Our domestic order system handles everything — we haven't set up separate tracking for exports.",
    "We haven't thought about documentation tracking yet.",
  ], 'CBSA export documentation retention requirements'),
  q('Q3.4', 'operations', 'How will you handle the physical packaging requirements for international ocean freight?', [
    'We have consulted with our freight forwarder on ISPM-15 wood treatment and container load optimization.',
    'We plan to use our existing domestic packaging with additional protective materials.',
    'Our freight forwarder will handle all packaging requirements.',
    "We haven't considered how international shipping packaging differs from domestic trucking.",
  ], 'ISPM-15 International Standards for Phytosanitary Measures'),
  q('Q3.5', 'operations', 'Your cargo ship to Hamburg has been delayed by 3 weeks due to port congestion. What is your contingency?', [
    'Our contracts include force majeure clauses and we maintain 30-day cash reserves for logistics disruptions.',
    'We would notify the buyer and negotiate extended delivery terms.',
    'We would absorb the delay and hope the buyer is understanding.',
    "We haven't planned for shipping delays.",
  ], 'ICC Incoterms 2020 demurrage/detention guidance'),

  // Pillar 4: Financial
  q('Q4.1', 'financial', 'How will you manage accounts receivable and payment risk with a new foreign buyer?', [
    'We require irrevocable Letters of Credit confirmed by a Canadian bank, then transition to EDC AR Insurance.',
    'We will request 50% advance payment and ship the balance on 30-day terms.',
    'We will offer standard 60-90 day open account terms funded by domestic cash flow.',
    "We trust our foreign buyer's reputation and will ship on standard invoice terms.",
  ], 'EDC Accounts Receivable Insurance, edc.ca'),
  q('Q4.2', 'financial', 'Your target market operates in JPY. How do you plan to handle currency exchange risk on a $500,000 contract?', [
    'We will use forward contracts through our bank to lock in the CAD/JPY exchange rate.',
    'We will quote in CAD and require the buyer to bear the exchange risk.',
    'We will quote in JPY and convert to CAD when payment is received.',
    "We haven't considered exchange rate fluctuations.",
  ], 'EDC Currency Risk Management'),
  q('Q4.3', 'financial', 'Are you aware of government funding programs that can offset export market entry costs?', [
    'Yes, we have applied to CanExport SMEs and are aware of provincial trade programs.',
    'We know programs exist but have not applied yet.',
    "We've heard of CanExport but aren't sure if we qualify.",
    'We are not aware of any government export funding programs.',
  ], 'CanExport SMEs, tradecommissioner.gc.ca'),
  q('Q4.4', 'financial', 'How have you determined the selling price for your product in the target export market?', [
    'We calculated full landed cost and benchmarked against local competitor pricing using UN Comtrade data.',
    'We added our target margin to domestic selling price plus estimated shipping costs.',
    'We plan to use our domestic retail price and convert to the local currency.',
    'We will match whatever price the buyer suggests to win the deal.',
  ], 'UN Comtrade unit value data, WITS API'),
  q('Q4.5', 'financial', 'What is your plan if your first export shipment results in a net financial loss?', [
    'Our export budget includes contingency reserve for first 2-3 shipments as market entry investment.',
    'We would analyze what went wrong and adjust pricing/logistics before the second shipment.',
    'We would reconsider whether exporting is viable for our business.',
    'A loss would be devastating — we cannot afford any unprofitable shipments.',
  ], 'BDC export financing guidance'),

  // Pillar 5: Legal
  q('Q5.1', 'legal', 'How will you prepare your packaging and labeling for regulatory compliance in foreign markets?', [
    'We have engaged a regulatory consultant to audit destination-country requirements and adapt labels.',
    'We are researching requirements and plan to create market-specific labels before first shipment.',
    'We plan to ship standard Canadian packaging with a translated sticker added.',
    'Our Canadian labels comply with CFIA requirements, which should be accepted internationally.',
  ], 'EU Regulation 1169/2011, Japan Food Sanitation Act, FDA 21 CFR'),
  q('Q5.2', 'legal', 'Are you familiar with the export controls and permit requirements that apply to your products?', [
    'Yes, we verified against Canada Export Control List and obtained required permits from Global Affairs Canada.',
    'We checked and our products are not on the controlled list, but have not confirmed with CBSA.',
    'We assume our products are not controlled because they are commercial consumer goods.',
    'We are not aware of export controls or permit requirements.',
  ], 'Export and Import Permits Act (EIPA)'),
  q('Q5.3', 'legal', 'Your product requires a phytosanitary certificate for export to the EU. How do you obtain this?', [
    'We contact our local CFIA plant health office to arrange pre-shipment inspection before goods leave Canada.',
    'We assume our customs broker will handle all certification.',
    'We plan to obtain the certificate at the destination port.',
    'We are not familiar with phytosanitary certificates.',
  ], 'CFIA Export Requirements Library'),
  q('Q5.4', 'legal', 'How do you ensure your foreign buyer is not on a sanctions list?', [
    'We screen all new buyers against CSL, Canada SEMA list, and OFAC SDN list before sales discussions.',
    'We plan to implement screening but have not set it up yet.',
    'We rely on our bank to flag sanctioned entities during payment processing.',
    'We were not aware that we need to screen buyers against sanctions lists.',
  ], 'US Consolidated Screening List, SEMA'),
  q('Q5.5', 'legal', 'What is your understanding of Rules of Origin requirements under CETA for your product?', [
    'We verified our product qualifies under CETA product-specific Rules of Origin (Annex 5).',
    'We know CETA exists but have not confirmed our product meets origin criteria.',
    'Our product is made in Canada, so we assume it automatically qualifies for CETA tariff reductions.',
    'We are not familiar with Rules of Origin.',
  ], 'CETA Annex 5 Rules of Origin'),

  // Pillar 6: Market
  q('Q6.1', 'market', 'How did you select your target export market(s)?', [
    'We analyzed UN Comtrade data, TCS market reports, and tariff advantages under Canada FTAs.',
    'We received an inquiry from a buyer in that market and decided to pursue it.',
    "We chose the market because it's geographically close or culturally familiar.",
    'A competitor exports there, so we assumed it would work for us too.',
  ], 'UN Comtrade, TCS Market Reports'),
  q('Q6.2', 'market', 'Can you name your top 3 competitors in your target export market, including local producers?', [
    'Yes, we profiled competitors using ITC Trade Map data and in-market research.',
    'We know some international competitors but have not researched local producers.',
    'We assume our main competition is other Canadian exporters.',
    'We have not researched our competition in the target market.',
  ], 'ITC Trade Map, trademap.org'),
  q('Q6.3', 'market', 'How do you plan to find qualified buyers or distributors in your target market?', [
    'Through TCS in-market officers, trade shows, and verified B2B platforms for our sector.',
    'Through online research, LinkedIn outreach, and industry contacts.',
    'We plan to attend one trade show and hope to make connections.',
    'We are waiting for buyers to find us through our website.',
  ], 'Trade Commissioner Service'),
  q('Q6.4', 'market', 'What is the average market price for products similar to yours in your target country?', [
    'We calculated average import unit price using UN Comtrade and compared to our landed cost.',
    'We have anecdotal pricing information from a potential buyer or online research.',
    'We assume our domestic pricing will be competitive after currency conversion.',
    "We don't know what similar products sell for in the target market.",
  ], 'UN Comtrade netWeight unit value calculation'),
  q('Q6.5', 'market', 'Do you know which Free Trade Agreements Canada has that provide tariff advantages for your product?', [
    'Yes — I can identify the specific FTA, preferential tariff rate, and Rules of Origin required.',
    'I know Canada has FTAs with my target market but have not looked up the specific tariff rate.',
    "I've heard of CUSMA/NAFTA but I'm not sure which other agreements exist.",
    'I am not aware of Canada Free Trade Agreements.',
  ], 'Global Affairs Canada FTA registry'),

  // Pillar 7: Cultural
  q('Q7.1', 'cultural', 'How have you adapted your sales and marketing materials for the target market?', [
    'We have professionally translated and culturally adapted our website, product sheets, and sales presentations.',
    'We have translated key materials but have not fully adapted them to local cultural norms.',
    'We plan to use our English/French materials and rely on the buyer to translate.',
    'Our existing Canadian materials will work — our product quality speaks for itself.',
  ], 'TCS Cultural Intelligence resources'),
  q('Q7.2', 'cultural', 'How familiar are you with the business negotiation culture in your target market?', [
    'We have studied cultural business practices and have an in-market contact who can guide us.',
    'We have read general cultural guides but lack direct experience.',
    'Business is business — professional conduct is universal.',
    "We haven't researched cultural differences in business practices.",
  ], 'EDC market guides'),
  q('Q7.3', 'cultural', 'Your Japanese distributor is unresponsive for 3 weeks after your initial product pitch. What do you do?', [
    'We understand Japanese ringi-sho consensus can take 4-8 weeks and follow up politely without pressuring.',
    'We send a follow-up email after 1 week and call after 2 weeks.',
    'We assume they are not interested and move on to other prospects.',
    'We send daily follow-up emails to show urgency and commitment.',
  ], 'TCS Japan market guide, ringi-sho process'),
  q('Q7.4', 'cultural', 'How do you plan to build long-term customer relationships in your target market?', [
    'We plan regular in-person visits, local trade events, and a designated relationship manager.',
    'We will maintain regular email/video contact and visit annually.',
    'We expect the relationship to be maintained primarily through product quality and pricing.',
    'Once the initial deal is signed, we plan to focus on fulfillment rather than relationship management.',
  ], 'TCS Cultural Intelligence resources'),
  q('Q7.5', 'cultural', 'How does your digital presence address international buyers?', [
    'Our website has localized landing pages with currency display and international contact information.',
    'Our website is accessible internationally but is primarily in English/French for the Canadian market.',
    'We have a LinkedIn company page that international buyers could find.',
    'Our website is designed for Canadian customers only.',
  ], 'BDC Digital Maturity Assessment'),

  // Pillar 8: Digital
  q('Q8.1', 'digital', 'Can your internal systems generate documentation required for international shipments?', [
    'Yes — our ERP generates commercial invoices, packing lists, certificates of origin, and integrates with CERS.',
    'We can generate basic invoices and packing lists but create customs documentation manually.',
    'We use spreadsheets and rely on our customs broker for all documentation.',
    'We handle everything with paper-based systems and email.',
  ], 'CBSA CERS, BDC Digital Maturity Assessment'),
  q('Q8.2', 'digital', 'Do you have an e-commerce capability for international B2B or B2C sales?', [
    'Yes — our platform supports multi-currency checkout and international shipping calculations.',
    'We have a domestic e-commerce site that could accept international orders with manual adjustments.',
    'We use a marketplace platform (Amazon, Alibaba) for international sales.',
    'We do not sell online.',
  ], 'BDC Digital Maturity Assessment'),
  q('Q8.3', 'digital', 'How do you manage and protect sensitive trade documentation digitally?', [
    'We use encrypted cloud storage with role-based access and PIPEDA compliance for cross-border transfers.',
    'We use cloud storage with basic password protection.',
    'Documents are stored on local computers and shared via email attachments.',
    "We haven't implemented specific data security measures for trade documents.",
  ], 'PIPEDA, EU GDPR'),
  q('Q8.4', 'digital', 'How do you track and analyze the performance of your export operations?', [
    'We use dashboards tracking KPIs (lead times, payment collection, CAC per market, landed cost accuracy).',
    'We review export financials quarterly but do not track operational KPIs in detail.',
    'We check our bank account to see if export payments arrived.',
    'We do not systematically track export performance.',
  ], 'BDC Digital Maturity Assessment'),
  q('Q8.5', 'digital', 'Can your website and digital platforms handle inquiries from multiple time zones?', [
    'We have automated inquiry routing, async communication tools, and response time SLAs for international leads.',
    'We respond to emails within 24 business hours regardless of origin.',
    'We respond during Canadian business hours only.',
    "We don't receive digital inquiries from international buyers.",
  ], 'BDC Digital Maturity Assessment'),

  // Pillar 9: Programs
  q('Q9.1', 'programs', 'Which government export support organizations are you currently engaged with?', [
    'We are registered with TCS, have an EDC relationship manager, and connected with our provincial trade office.',
    'We are registered with one organization but have not explored others.',
    'We are aware these organizations exist but have not registered or engaged.',
    'We are not aware of government export support organizations.',
  ], 'TCS, EDC, BDC, provincial trade offices'),
  q('Q9.2', 'programs', 'Have you applied for or received any export-related government funding?', [
    'We have received CanExport SMEs funding and/or provincial export grants.',
    'We have applied but are awaiting a decision.',
    'We know about funding but have not applied because the process seems complex.',
    'We did not know government funding was available for export activities.',
  ], 'CanExport SMEs, tradecommissioner.gc.ca'),
  q('Q9.3', 'programs', 'Do you have access to export credit insurance to protect against foreign buyer non-payment?', [
    'We have an active EDC Accounts Receivable Insurance policy or evaluated Portfolio Credit Insurance.',
    'We have discussed credit insurance with EDC but have not purchased a policy.',
    'We rely on our bank assessment of buyer creditworthiness.',
    'We are not aware of export credit insurance products.',
  ], 'EDC AR Insurance, edc.ca'),
  q('Q9.4', 'programs', 'Are you a member of any industry trade associations with international trade programs?', [
    'Yes, we actively participate in our sector trade association and leverage international matchmaking events.',
    'We are a member but do not actively use their international programs.',
    'We are not a member of any trade association.',
    'We did not know trade associations offered international support.',
  ], 'Canadian Manufacturers & Exporters, Food & Beverage Canada'),
  q('Q9.5', 'programs', 'Have you engaged a customs broker licensed by CBSA to handle your export documentation?', [
    'Yes, we have a licensed customs broker on retainer for CERS filings and certificates of origin.',
    'We plan to engage a broker before our first shipment.',
    'We will handle customs documentation ourselves to save costs.',
    'We have not considered whether we need a customs broker.',
  ], 'CBSA Memorandum D20-1-1'),
];

export function getQuestionById(id: string): Question | undefined {
  return QUESTION_POOL.find((q) => q.id === id);
}

export function getQuestionsByIds(ids: string[]): Question[] {
  const byId = new Map(QUESTION_POOL.map((question) => [question.id, question]));
  return ids.map((id) => byId.get(id)).filter((q): q is Question => q !== undefined);
}

export function getQuestionPillarMap(): Record<string, PillarKey> {
  const map: Record<string, PillarKey> = {};
  for (const question of QUESTION_POOL) {
    map[question.id] = question.pillar;
  }
  return map;
}

/** Seeded PRNG — picks 3 questions per pillar + 3 background = 30 total. */
export function selectAssessmentQuestions(seed = 42): string[] {
  let state = seed >>> 0;
  const rand = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  const pillars = Object.keys(PILLAR_LABELS) as PillarKey[];
  const selected: string[] = [];

  for (const pillar of pillars) {
    const pillarQuestions = QUESTION_POOL.filter((q) => q.pillar === pillar);
    const shuffled = [...pillarQuestions].sort(() => rand() - 0.5);
    selected.push(...shuffled.slice(0, 3).map((q) => q.id));
  }

  const remaining = QUESTION_POOL.map((q) => q.id).filter((id) => !selected.includes(id));
  remaining.sort(() => rand() - 0.5);
  selected.push(...remaining.slice(0, 3));

  return selected.slice(0, 30);
}
