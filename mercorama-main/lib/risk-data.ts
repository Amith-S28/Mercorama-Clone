// lib/risk-data.ts
// Static reference data for Deep Market Profile (DMP-2 through DMP-7).
// No API calls — pure lookup tables. Safe to import from client or server.

export type RiskBand      = 'Low' | 'Medium' | 'High';
export type FreightBand   = 'Low' | 'Medium' | 'High';
export type ComplexityBand = 'Low' | 'Medium' | 'High';

// ── Country name → ISO3 ────────────────────────────────────────────────────────
export const NAME_TO_ISO3: Record<string, string> = {
  'United States': 'USA', 'United Kingdom': 'GBR', 'Germany': 'DEU',
  'France': 'FRA', 'Japan': 'JPN', 'China': 'CHN', 'South Korea': 'KOR',
  'Australia': 'AUS', 'Netherlands': 'NLD', 'Italy': 'ITA', 'Spain': 'ESP',
  'Mexico': 'MEX', 'Brazil': 'BRA', 'India': 'IND', 'Sweden': 'SWE',
  'Switzerland': 'CHE', 'Norway': 'NOR', 'Denmark': 'DNK', 'Finland': 'FIN',
  'Belgium': 'BEL', 'Austria': 'AUT', 'Poland': 'POL', 'Portugal': 'PRT',
  'New Zealand': 'NZL', 'Singapore': 'SGP', 'Vietnam': 'VNM', 'Malaysia': 'MYS',
  'Chile': 'CHL', 'Peru': 'PER', 'Colombia': 'COL', 'Israel': 'ISR',
  'United Arab Emirates': 'ARE', 'Saudi Arabia': 'SAU', 'South Africa': 'ZAF',
  'Nigeria': 'NGA', 'Egypt': 'EGY', 'Indonesia': 'IDN', 'Thailand': 'THA',
  'Philippines': 'PHL', 'Taiwan': 'TWN', 'Hong Kong': 'HKG', 'Ireland': 'IRL',
};

export const ISO3_TO_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(NAME_TO_ISO3).map(([n, c]) => [c, n])
);

// ── Country risk + payment norms ───────────────────────────────────────────────
export interface CountryRisk {
  band:        RiskBand;
  riskFactors: string[];
  paymentNorm: string;
  typicalDays: string;
}

export const COUNTRY_RISK: Record<string, CountryRisk> = {
  USA: { band: 'Low',    riskFactors: ['High political stability','USD transactions','Strong rule of law'],       paymentNorm: 'Open account',              typicalDays: '30–45 days' },
  CAN: { band: 'Low',    riskFactors: ['Domestic market','CAD transactions','Shared legal frameworks'],           paymentNorm: 'Open account',              typicalDays: '30 days' },
  GBR: { band: 'Low',    riskFactors: ['Stable institutions','GBP market','Common law system'],                   paymentNorm: 'Open account',              typicalDays: '30–45 days' },
  IRL: { band: 'Low',    riskFactors: ['EU legal framework','EUR stability','English language market'],            paymentNorm: 'Open account',              typicalDays: '30–45 days' },
  DEU: { band: 'Low',    riskFactors: ['Largest EU economy','EUR stability','Strong legal system'],               paymentNorm: 'Open account',              typicalDays: '30–60 days' },
  FRA: { band: 'Low',    riskFactors: ['Stable democracy','EUR zone','CETA member'],                              paymentNorm: 'Open account',              typicalDays: '45–60 days' },
  NLD: { band: 'Low',    riskFactors: ['Rotterdam gateway','EUR zone','High trade openness'],                     paymentNorm: 'Open account',              typicalDays: '30–45 days' },
  BEL: { band: 'Low',    riskFactors: ['EU institutional hub','EUR zone','Trade-oriented economy'],               paymentNorm: 'Open account',              typicalDays: '30–60 days' },
  SWE: { band: 'Low',    riskFactors: ['High transparency','SEK market','Strong consumer protection'],            paymentNorm: 'Open account',              typicalDays: '30 days' },
  NOR: { band: 'Low',    riskFactors: ['Sovereign wealth fund','NOK market','Seafood-savvy importers'],          paymentNorm: 'Open account',              typicalDays: '30–45 days' },
  DNK: { band: 'Low',    riskFactors: ['High trade trust','DKK market','Gateway to Scandinavia'],                paymentNorm: 'Open account',              typicalDays: '30–45 days' },
  FIN: { band: 'Low',    riskFactors: ['EUR zone','High business integrity','CETA member'],                       paymentNorm: 'Open account',              typicalDays: '30–45 days' },
  CHE: { band: 'Low',    riskFactors: ['CHF safe haven','EFTA agreement with Canada','Banking stability'],       paymentNorm: 'Open account',              typicalDays: '30–60 days' },
  AUT: { band: 'Low',    riskFactors: ['EUR zone','CETA member','Central European gateway'],                      paymentNorm: 'Open account',              typicalDays: '30–60 days' },
  AUS: { band: 'Low',    riskFactors: ['Common law','AUD volatility moderate','CPTPP partner'],                  paymentNorm: 'Open account',              typicalDays: '30–45 days' },
  NZL: { band: 'Low',    riskFactors: ['High rule of law','CPTPP partner','Small but open market'],              paymentNorm: 'Open account',              typicalDays: '30–45 days' },
  SGP: { band: 'Low',    riskFactors: ['AAA-rated economy','USD-linked currency','CPTPP partner'],               paymentNorm: 'Open account / wire transfer', typicalDays: '30–45 days' },
  HKG: { band: 'Low',    riskFactors: ['USD peg','Major trade hub','Legal stability'],                           paymentNorm: 'Open account',              typicalDays: '30–45 days' },
  ITA: { band: 'Low',    riskFactors: ['EUR zone','CETA member','Slow payment culture'],                         paymentNorm: 'Documentary collection',    typicalDays: '60–90 days' },
  ESP: { band: 'Low',    riskFactors: ['EUR zone','CETA member','Growing import market'],                        paymentNorm: 'Open account',              typicalDays: '45–60 days' },
  PRT: { band: 'Low',    riskFactors: ['EUR zone','CETA member','Atlantic gateway'],                             paymentNorm: 'Open account',              typicalDays: '30–60 days' },
  POL: { band: 'Low',    riskFactors: ['EU accession','EUR-adjacent PLN','Growing middle class'],                paymentNorm: 'Open account',              typicalDays: '30–60 days' },
  JPN: { band: 'Low',    riskFactors: ['JPY volatility','CPTPP partner','Strong institutions'],                  paymentNorm: 'Open account or wire',      typicalDays: '30–60 days' },
  KOR: { band: 'Low',    riskFactors: ['KRW stable','CKFTA partner','Advanced economy'],                        paymentNorm: 'Wire transfer / L/C on first deal', typicalDays: '30–60 days' },
  TWN: { band: 'Low',    riskFactors: ['TWD stable','Advanced economy','Strong IP protection'],                  paymentNorm: 'Wire transfer',             typicalDays: '30–60 days' },
  ISR: { band: 'Medium', riskFactors: ['Geopolitical risk','USD-indexed','CIFTA partner','High tech base'],      paymentNorm: 'Wire transfer / L/C',       typicalDays: '30–60 days' },
  CHL: { band: 'Medium', riskFactors: ['Political transition risks','CLP volatility','CCOFTA partner'],         paymentNorm: 'Documentary collection',    typicalDays: '45–60 days' },
  PER: { band: 'Medium', riskFactors: ['Political instability','PEN volatility','CPEFTA partner'],               paymentNorm: 'Documentary collection',    typicalDays: '45–60 days' },
  COL: { band: 'Medium', riskFactors: ['Security concerns reducing','COP volatility','CCOFTA partner'],         paymentNorm: 'Documentary collection',    typicalDays: '45–60 days' },
  MEX: { band: 'Medium', riskFactors: ['Nearshoring momentum','MXN volatility','CUSMA partner'],                paymentNorm: 'Open account (CUSMA parties) / L/C', typicalDays: '30–60 days' },
  BRA: { band: 'Medium', riskFactors: ['BRL volatility','Complex import regime','Large consumer market'],       paymentNorm: 'Letter of credit',          typicalDays: '60–90 days' },
  IND: { band: 'Medium', riskFactors: ['INR depreciation trend','Bureaucratic complexity','Fast-growing market'], paymentNorm: 'Letter of credit',        typicalDays: '60–90 days' },
  MYS: { band: 'Medium', riskFactors: ['MYR moderate risk','CPTPP partner','Halal certification may be needed'], paymentNorm: 'Wire transfer / L/C',    typicalDays: '30–45 days' },
  VNM: { band: 'Medium', riskFactors: ['VND controls','CPTPP partner','Rapid growth economy'],                  paymentNorm: 'Letter of credit',          typicalDays: '30–60 days' },
  THA: { band: 'Medium', riskFactors: ['Political cycle risks','THB moderate','Strong distribution networks'],  paymentNorm: 'Wire transfer / L/C',       typicalDays: '45–60 days' },
  IDN: { band: 'Medium', riskFactors: ['Complex import licensing','IDR depreciation','Large archipelago logistics'], paymentNorm: 'Letter of credit',     typicalDays: '60–90 days' },
  PHL: { band: 'Medium', riskFactors: ['PHP depreciation','Typhoon logistics risk','Growing middle class'],     paymentNorm: 'Letter of credit',          typicalDays: '60–90 days' },
  ZAF: { band: 'Medium', riskFactors: ['ZAR volatility','Load-shedding disruptions','Regional hub potential'], paymentNorm: 'Letter of credit',          typicalDays: '60–90 days' },
  ARE: { band: 'Medium', riskFactors: ['AED USD peg','Halal/labelling requirements','Re-export hub'],           paymentNorm: 'Wire transfer / L/C',       typicalDays: '30–60 days' },
  SAU: { band: 'Medium', riskFactors: ['SAR USD peg','Halal certification required','SASO standards'],         paymentNorm: 'Letter of credit',          typicalDays: '45–90 days' },
  CHN: { band: 'High',   riskFactors: ['Complex import licensing','CNY controls','Slow IP enforcement','Tariff escalation risk'], paymentNorm: 'Letter of credit',  typicalDays: '60–90 days' },
  NGA: { band: 'High',   riskFactors: ['NGN devaluation risk','Port delays','Regulatory unpredictability'],    paymentNorm: 'Confirmed letter of credit', typicalDays: '90–120 days' },
  EGY: { band: 'High',   riskFactors: ['EGP devaluation','FX controls','Documentation-heavy imports'],         paymentNorm: 'Confirmed letter of credit', typicalDays: '90–120 days' },
};

// ── Logistics from Atlantic Canada (default: Halifax) ─────────────────────────
export interface LogisticsInfo {
  departurePort: string;
  route:         string;
  freightBand:   FreightBand;
  transitDays:   string;
}

export const LOGISTICS: Record<string, LogisticsInfo> = {
  USA: { departurePort: 'Halifax',  route: 'Direct truck or container, US East Coast',    freightBand: 'Low',    transitDays: '2–5 days' },
  MEX: { departurePort: 'Halifax',  route: 'Container via Gulf of Mexico or truck/rail',  freightBand: 'Low',    transitDays: '7–14 days' },
  GBR: { departurePort: 'Halifax',  route: 'Container, North Atlantic crossing',           freightBand: 'Medium', transitDays: '10–14 days' },
  IRL: { departurePort: 'Halifax',  route: 'Container, North Atlantic crossing',           freightBand: 'Medium', transitDays: '10–14 days' },
  DEU: { departurePort: 'Halifax',  route: 'Container via Rotterdam or Hamburg',           freightBand: 'Medium', transitDays: '12–16 days' },
  FRA: { departurePort: 'Halifax',  route: 'Container via Le Havre or Rotterdam',          freightBand: 'Medium', transitDays: '12–16 days' },
  NLD: { departurePort: 'Halifax',  route: 'Container direct to Rotterdam',                freightBand: 'Medium', transitDays: '10–14 days' },
  BEL: { departurePort: 'Halifax',  route: 'Container via Antwerp',                        freightBand: 'Medium', transitDays: '12–16 days' },
  ITA: { departurePort: 'Halifax',  route: 'Container via Genoa or Rotterdam + rail',      freightBand: 'Medium', transitDays: '14–20 days' },
  ESP: { departurePort: 'Halifax',  route: 'Container via Valencia or Barcelona',          freightBand: 'Medium', transitDays: '14–18 days' },
  PRT: { departurePort: 'Halifax',  route: 'Container via Lisbon',                         freightBand: 'Medium', transitDays: '12–16 days' },
  SWE: { departurePort: 'Halifax',  route: 'Container via Gothenburg',                     freightBand: 'Medium', transitDays: '12–16 days' },
  NOR: { departurePort: 'Halifax',  route: 'Container via Oslo or Bergen',                 freightBand: 'Medium', transitDays: '12–16 days' },
  DNK: { departurePort: 'Halifax',  route: 'Container via Copenhagen',                     freightBand: 'Medium', transitDays: '12–16 days' },
  FIN: { departurePort: 'Halifax',  route: 'Container via Helsinki via North Sea',         freightBand: 'Medium', transitDays: '14–18 days' },
  CHE: { departurePort: 'Halifax',  route: 'Container via Rotterdam + rail',               freightBand: 'Medium', transitDays: '14–18 days' },
  AUT: { departurePort: 'Halifax',  route: 'Container via Hamburg + rail',                 freightBand: 'Medium', transitDays: '16–20 days' },
  POL: { departurePort: 'Halifax',  route: 'Container via Gdansk or Hamburg + rail',       freightBand: 'Medium', transitDays: '14–18 days' },
  ISR: { departurePort: 'Halifax',  route: 'Container via Haifa (Med routing)',            freightBand: 'High',   transitDays: '18–25 days' },
  ARE: { departurePort: 'Halifax',  route: 'Container via Jebel Ali (Suez routing)',       freightBand: 'High',   transitDays: '25–32 days' },
  SAU: { departurePort: 'Halifax',  route: 'Container via Jeddah or Dammam (Suez)',       freightBand: 'High',   transitDays: '25–35 days' },
  ZAF: { departurePort: 'Halifax',  route: 'Container via Cape Town or Durban',           freightBand: 'High',   transitDays: '25–35 days' },
  NGA: { departurePort: 'Halifax',  route: 'Container via Apapa Port, Lagos',             freightBand: 'High',   transitDays: '28–40 days' },
  EGY: { departurePort: 'Halifax',  route: 'Container via Alexandria (Suez routing)',      freightBand: 'High',   transitDays: '22–30 days' },
  JPN: { departurePort: 'Vancouver/Halifax', route: 'Container via Trans-Pacific or Panama', freightBand: 'High', transitDays: '18–28 days' },
  KOR: { departurePort: 'Vancouver/Halifax', route: 'Container via Trans-Pacific',          freightBand: 'High',  transitDays: '18–28 days' },
  CHN: { departurePort: 'Vancouver/Halifax', route: 'Container via Trans-Pacific',          freightBand: 'High',  transitDays: '20–30 days' },
  AUS: { departurePort: 'Vancouver',  route: 'Container via Trans-Pacific + Australian ports', freightBand: 'High', transitDays: '25–35 days' },
  NZL: { departurePort: 'Vancouver',  route: 'Container via Trans-Pacific',               freightBand: 'High',   transitDays: '28–38 days' },
  SGP: { departurePort: 'Vancouver/Halifax', route: 'Container via Trans-Pacific or Indian Ocean', freightBand: 'High', transitDays: '28–38 days' },
  HKG: { departurePort: 'Vancouver',  route: 'Container via Trans-Pacific',               freightBand: 'High',   transitDays: '18–25 days' },
  TWN: { departurePort: 'Vancouver',  route: 'Container via Trans-Pacific',               freightBand: 'High',   transitDays: '18–28 days' },
  IND: { departurePort: 'Halifax',    route: 'Container via Suez to Mumbai or Chennai',   freightBand: 'High',   transitDays: '25–35 days' },
  BRA: { departurePort: 'Halifax',    route: 'Container to Santos or Manaus',             freightBand: 'Medium', transitDays: '12–18 days' },
  CHL: { departurePort: 'Halifax',    route: 'Container via Panama Canal to Valparaíso', freightBand: 'High',   transitDays: '20–28 days' },
  PER: { departurePort: 'Halifax',    route: 'Container via Panama Canal to Callao',      freightBand: 'High',   transitDays: '18–25 days' },
  COL: { departurePort: 'Halifax',    route: 'Container to Cartagena or Buenaventura',    freightBand: 'Medium', transitDays: '10–18 days' },
  MYS: { departurePort: 'Vancouver',  route: 'Container via Trans-Pacific to Port Klang', freightBand: 'High',   transitDays: '28–38 days' },
  VNM: { departurePort: 'Vancouver',  route: 'Container via Trans-Pacific to Ho Chi Minh', freightBand: 'High',  transitDays: '28–38 days' },
  THA: { departurePort: 'Vancouver',  route: 'Container via Trans-Pacific to Bangkok',    freightBand: 'High',   transitDays: '28–38 days' },
  IDN: { departurePort: 'Vancouver',  route: 'Container via Trans-Pacific to Jakarta',    freightBand: 'High',   transitDays: '30–40 days' },
  PHL: { departurePort: 'Vancouver',  route: 'Container via Trans-Pacific to Manila',     freightBand: 'High',   transitDays: '28–38 days' },
};

// ── Regulatory / non-tariff complexity ────────────────────────────────────────
export const REGULATORY: Record<string, ComplexityBand> = {
  USA: 'Medium', // FDA/USDA requirements vary by product
  GBR: 'Medium', CAN: 'Low',    IRL: 'Low',    DEU: 'Low',    FRA: 'Medium',
  NLD: 'Low',    BEL: 'Low',    ITA: 'Medium', ESP: 'Medium', PRT: 'Low',
  SWE: 'Low',    NOR: 'Low',    DNK: 'Low',    FIN: 'Low',    CHE: 'Medium',
  AUT: 'Low',    POL: 'Low',    JPN: 'High',   KOR: 'Medium', AUS: 'Medium',
  NZL: 'Medium', SGP: 'Low',    HKG: 'Low',    TWN: 'Medium',
  CHN: 'High',   IND: 'High',   MYS: 'Medium', VNM: 'Medium', THA: 'Medium',
  IDN: 'High',   PHL: 'Medium', BRA: 'High',   MEX: 'Medium', CHL: 'Medium',
  PER: 'Medium', COL: 'Medium', ISR: 'Medium', ARE: 'High',   SAU: 'High',
  ZAF: 'Medium', NGA: 'High',   EGY: 'High',
};

// ── Government support programs ───────────────────────────────────────────────
export interface GovernmentProgram {
  name:        string;
  href:        string;
  description: string;
}

export const PROGRAMS: GovernmentProgram[] = [
  { name: 'CanExport SMEs',    href: 'https://www.tradecommissioner.gc.ca/funding-financement/canexport/sme-pme/index.aspx', description: 'Up to $50,000 in non-repayable funding for export development activities' },
  { name: 'Trade Commissioner Service', href: 'https://www.tradecommissioner.gc.ca', description: 'Free in-market intelligence, introductions, and advice from Canadian embassies' },
  { name: 'EDC (Export Development Canada)', href: 'https://www.edc.ca', description: 'Export credit insurance, financing, and bonding for Canadian exporters' },
  { name: 'BDC Export Financing', href: 'https://www.bdc.ca/en/financing/business-loans/export-financing', description: 'Working capital and term loans tailored for exporters' },
  { name: 'Canadian Commercial Corporation', href: 'https://www.ccc.ca', description: 'Government-to-government contracting support for public procurement markets' },
  { name: 'AgriMarketing Program', href: 'https://agriculture.canada.ca/en/agricultural-programs-and-services/agrimarketing', description: 'Supports agri-food exporters with market development activities' },
];
