// lib/tariff-rates.ts
// Verified MFN and preferential tariff rates for Canada's 73 priority export HS codes.
// Keys: 6-digit HS code. Lookup falls back to 4-digit heading, then 2-digit chapter.
// Sources: USITC HTS 2024, EU TARIC 2024, national tariff schedules 2024.

export type TariffEntry = {
  mfn: string;
  preferential?: string;
  agreementName?: string;
  source: string;
  verified: boolean;
  notes?: string;
};

export type TariffLookup = {
  [countryCode: string]: {
    [hsCode: string]: TariffEntry;
  };
};

export const TARIFF_RATES: TariffLookup = {
  // ── United States (CUSMA) ──────────────────────────────────────────────────
  US: {
    // Ch.27 Mineral Fuels
    '270900': { mfn: '5.25¢/bbl', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '271121': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '271012': { mfn: '0.175¢/L', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '271019': { mfn: '0.175¢/L', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '271119': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '270112': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '271311': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '271600': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    // Ch.87 Vehicles & Parts
    '870322': { mfn: '2.5%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '870323': { mfn: '2.5%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '870324': { mfn: '2.5%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '870360': { mfn: '2.5%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '870370': { mfn: '2.5%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '870380': { mfn: '2.5%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '870840': { mfn: '2.5%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '870829': { mfn: '2.5%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '870431': { mfn: '25%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true, notes: 'Light trucks subject to Section 232 tariff; CUSMA eligible goods at 0%' },
    '870421': { mfn: '25%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true, notes: 'Light trucks; CUSMA 0%' },
    '870899': { mfn: '2.5%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    // Ch.71 Precious Metals & Gems
    '710812': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '710813': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '711011': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '710231': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    // Ch.84 Machinery & Engines
    '841182': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '847989': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '848180': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '843143': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '842952': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '841391': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '841191': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    // Ch.88 Aerospace
    '880240': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '880230': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '880330': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    // Ch.10,12,15,19 Agriculture & Food
    '100199': { mfn: '0.65¢/kg', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '100119': { mfn: '0.65¢/kg', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '120510': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '151419': { mfn: '6.4%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '151211': { mfn: '6.4%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '190590': { mfn: '4.5%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '030389': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '030617': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    // Ch.31 Fertilizers
    '310420': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '310210': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '310520': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    // Ch.44,47 Wood & Pulp
    '440710': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true, notes: 'MFN duty-free; US may impose CVD/AD countervailing duties separately' },
    '440311': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true, notes: 'CVD/AD may apply; verify with US CBP' },
    '470321': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '480411': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '441233': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '480100': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '480255': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    // Ch.76,74,26 Metals & Ores
    '760110': { mfn: '2.6%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '760120': { mfn: '2.6%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '760410': { mfn: '2.6%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '260111': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '260300': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '262011': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '740200': { mfn: '1%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '740311': { mfn: '1%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '720410': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '720711': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '261690': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    // Ch.30,39,28 Pharma & Chemicals
    '300490': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '300215': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '390720': { mfn: '3.4%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '390110': { mfn: '6.5%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '390210': { mfn: '6.5%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '281410': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '284420': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    // Ch.85 Electrical
    '854442': { mfn: '2.6%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '853710': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '850440': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '851762': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
    '853650': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'USITC HTS 2024', verified: true },
  },

  // ── European Union (CETA) ──────────────────────────────────────────────────
  EU: {
    // Ch.27 Mineral Fuels
    '270900': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '271121': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '271012': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '271019': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '271119': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '270112': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '271311': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '271600': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    // Ch.87 Vehicles & Parts
    '870322': { mfn: '6.5%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '870323': { mfn: '6.5%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '870324': { mfn: '6.5%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '870360': { mfn: '6.5%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '870370': { mfn: '6.5%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '870380': { mfn: '6.5%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '870840': { mfn: '2.7%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '870829': { mfn: '2.7%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '870431': { mfn: '4.5%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '870421': { mfn: '4.5%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '870899': { mfn: '2.7%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    // Ch.71 Precious Metals & Gems
    '710812': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '710813': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '711011': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '710231': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    // Ch.84 Machinery & Engines
    '841182': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '847989': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '848180': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '843143': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '842952': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '841391': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '841191': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    // Ch.88 Aerospace
    '880240': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '880230': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '880330': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    // Ch.10,12,15,19 Agriculture & Food
    '100199': { mfn: '€95/tonne', preferential: '0% (TRQ)', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true, notes: 'CETA TRQ: 100,000 t/year at 0%' },
    '100119': { mfn: '€95/tonne', preferential: '0% (TRQ)', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true, notes: 'CETA TRQ applies' },
    '120510': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '151419': { mfn: '6.4%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '151211': { mfn: '3.2%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '190590': { mfn: '9%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '030389': { mfn: '6-20%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '030617': { mfn: '12%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    // Ch.31 Fertilizers
    '310420': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '310210': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '310520': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    // Ch.44,47 Wood & Pulp
    '440710': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '440311': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '470321': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '480411': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '441233': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '480100': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '480255': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    // Ch.76,74,26 Metals & Ores
    '760110': { mfn: '3%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '760120': { mfn: '3%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '760410': { mfn: '3%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '260111': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '260300': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '262011': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '740200': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '740311': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '720410': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '720711': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '261690': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    // Ch.30,39,28 Pharma & Chemicals
    '300490': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '300215': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '390720': { mfn: '6.5%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '390110': { mfn: '6.5%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '390210': { mfn: '6.5%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '281410': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '284420': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    // Ch.85 Electrical
    '854442': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '853710': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '850440': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '851762': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
    '853650': { mfn: '0%', preferential: '0%', agreementName: 'CETA', source: 'EU TARIC 2024', verified: true },
  },

  // ── China (no FTA) ────────────────────────────────────────────────────────
  CN: {
    '270900': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '271121': { mfn: '1%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '271012': { mfn: '1%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '271019': { mfn: '1%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '271119': { mfn: '1%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '270112': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '271311': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '271600': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '870322': { mfn: '15%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '870323': { mfn: '15%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '870324': { mfn: '15%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '870360': { mfn: '15%', source: 'China MFN Tariff Schedule 2024', verified: true, notes: 'Battery EVs subject to additional duties since July 2024' },
    '870370': { mfn: '15%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '870380': { mfn: '15%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '870840': { mfn: '10%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '870829': { mfn: '10%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '870431': { mfn: '20%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '870421': { mfn: '20%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '870899': { mfn: '10%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '710812': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '710813': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '711011': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '710231': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '841182': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '847989': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '848180': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '843143': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '842952': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '841391': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '841191': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '880240': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '880230': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '880330': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '100199': { mfn: '1% (TRQ)', source: 'China MFN Tariff Schedule 2024', verified: true, notes: 'In-quota 1%; out-of-quota 65%' },
    '100119': { mfn: '1% (TRQ)', source: 'China MFN Tariff Schedule 2024', verified: true, notes: 'In-quota 1%; out-of-quota 65%' },
    '120510': { mfn: '9%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '151419': { mfn: '9%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '151211': { mfn: '9%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '190590': { mfn: '8%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '030389': { mfn: '10%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '030617': { mfn: '10%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '310420': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '310210': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '310520': { mfn: '3%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '440710': { mfn: '2%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '440311': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '470321': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '480411': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '441233': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '480100': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '480255': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '760110': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '760120': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '760410': { mfn: '8%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '260111': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '260300': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '262011': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '740200': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '740311': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '720410': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '720711': { mfn: '2%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '261690': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '300490': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '300215': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '390720': { mfn: '6.5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '390110': { mfn: '6.5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '390210': { mfn: '6.5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '281410': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '284420': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '854442': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '853710': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '850440': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: false },
    '851762': { mfn: '0%', source: 'China MFN Tariff Schedule 2024', verified: true },
    '853650': { mfn: '5%', source: 'China MFN Tariff Schedule 2024', verified: false },
  },

  // ── Japan (CPTPP) ─────────────────────────────────────────────────────────
  JP: {
    '270900': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '271121': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '271012': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '271019': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '271119': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '270112': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '271311': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '271600': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '870322': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '870323': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '870324': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '870360': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '870370': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '870380': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '870840': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '870829': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '870431': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '870421': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '870899': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '710812': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '710813': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '711011': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '710231': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '841182': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '847989': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '848180': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '841191': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '880240': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '880230': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '880330': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '100199': { mfn: '¥55/kg', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true, notes: 'CPTPP eliminates wheat tariff over staged reduction' },
    '100119': { mfn: '¥55/kg', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '120510': { mfn: '0%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '151419': { mfn: '3.2%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '151211': { mfn: '3.2%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '190590': { mfn: '6%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: false },
    '030389': { mfn: '3.5%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '030617': { mfn: '5%', preferential: '0%', agreementName: 'CPTPP', source: 'Japan Customs Tariff 2024', verified: true },
    '310420': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '310210': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '310520': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '440710': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '440311': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '470321': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '480100': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '760110': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '760120': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '260111': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '260300': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '740311': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '300490': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '390110': { mfn: '3.9%', source: 'Japan Customs Tariff 2024', verified: false },
    '390210': { mfn: '3.9%', source: 'Japan Customs Tariff 2024', verified: false },
    '854442': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
    '851762': { mfn: '0%', source: 'Japan Customs Tariff 2024', verified: true },
  },

  // ── United Kingdom (CUKTCA) ───────────────────────────────────────────────
  GB: {
    '270900': { mfn: '0%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '271121': { mfn: '0%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '271012': { mfn: '0%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '271019': { mfn: '0%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '270112': { mfn: '0%', source: 'UK Global Tariff 2024', verified: true },
    '271600': { mfn: '0%', source: 'UK Global Tariff 2024', verified: true },
    '870322': { mfn: '6.5%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '870323': { mfn: '6.5%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '870324': { mfn: '6.5%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '870360': { mfn: '6.5%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '870370': { mfn: '6.5%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '870380': { mfn: '6.5%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '870840': { mfn: '2.7%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '870829': { mfn: '2.7%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '710812': { mfn: '0%', source: 'UK Global Tariff 2024', verified: true },
    '710813': { mfn: '0%', source: 'UK Global Tariff 2024', verified: true },
    '711011': { mfn: '0%', source: 'UK Global Tariff 2024', verified: true },
    '710231': { mfn: '0%', source: 'UK Global Tariff 2024', verified: true },
    '841182': { mfn: '0%', source: 'UK Global Tariff 2024', verified: true },
    '880240': { mfn: '0%', source: 'UK Global Tariff 2024', verified: true },
    '100199': { mfn: '£1.20/100kg', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '120510': { mfn: '0%', source: 'UK Global Tariff 2024', verified: true },
    '151419': { mfn: '6.4%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '030389': { mfn: '6-12%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '440710': { mfn: '0%', source: 'UK Global Tariff 2024', verified: true },
    '760110': { mfn: '3%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '760120': { mfn: '3%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '300490': { mfn: '0%', source: 'UK Global Tariff 2024', verified: true },
    '390110': { mfn: '6.5%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '390210': { mfn: '6.5%', preferential: '0%', agreementName: 'CUKTCA', source: 'UK Global Tariff 2024', verified: true },
    '854442': { mfn: '0%', source: 'UK Global Tariff 2024', verified: true },
    '851762': { mfn: '0%', source: 'UK Global Tariff 2024', verified: true },
  },

  // ── South Korea (CKFTA) ───────────────────────────────────────────────────
  KR: {
    '270900': { mfn: '0%', source: 'Korea Customs Tariff 2024', verified: true },
    '271121': { mfn: '0%', preferential: '0%', agreementName: 'CKFTA', source: 'Korea Customs Tariff 2024', verified: true },
    '870322': { mfn: '8%', preferential: '0%', agreementName: 'CKFTA', source: 'Korea Customs Tariff 2024', verified: true },
    '870323': { mfn: '8%', preferential: '0%', agreementName: 'CKFTA', source: 'Korea Customs Tariff 2024', verified: true },
    '870324': { mfn: '8%', preferential: '0%', agreementName: 'CKFTA', source: 'Korea Customs Tariff 2024', verified: true },
    '870360': { mfn: '8%', preferential: '0%', agreementName: 'CKFTA', source: 'Korea Customs Tariff 2024', verified: true },
    '710812': { mfn: '0%', source: 'Korea Customs Tariff 2024', verified: true },
    '710813': { mfn: '0%', source: 'Korea Customs Tariff 2024', verified: true },
    '120510': { mfn: '0%', preferential: '0%', agreementName: 'CKFTA', source: 'Korea Customs Tariff 2024', verified: true },
    '440710': { mfn: '0%', source: 'Korea Customs Tariff 2024', verified: true },
    '440311': { mfn: '0%', source: 'Korea Customs Tariff 2024', verified: true },
    '760110': { mfn: '5%', preferential: '0%', agreementName: 'CKFTA', source: 'Korea Customs Tariff 2024', verified: true },
    '300490': { mfn: '0%', source: 'Korea Customs Tariff 2024', verified: true },
    '854442': { mfn: '8%', preferential: '0%', agreementName: 'CKFTA', source: 'Korea Customs Tariff 2024', verified: false },
    '851762': { mfn: '0%', source: 'Korea Customs Tariff 2024', verified: true },
  },

  // ── Australia (MFN — CanAus FTA not yet in force) ─────────────────────────
  AU: {
    '270900': { mfn: '0%', source: 'Australia Customs Tariff 2024', verified: true },
    '271121': { mfn: '0%', source: 'Australia Customs Tariff 2024', verified: true },
    '870322': { mfn: '5%', source: 'Australia Customs Tariff 2024', verified: true },
    '870323': { mfn: '5%', source: 'Australia Customs Tariff 2024', verified: true },
    '870324': { mfn: '5%', source: 'Australia Customs Tariff 2024', verified: true },
    '870360': { mfn: '0%', source: 'Australia Customs Tariff 2024', verified: true, notes: 'EVs duty-free as of 2024' },
    '710812': { mfn: '0%', source: 'Australia Customs Tariff 2024', verified: true },
    '120510': { mfn: '0%', source: 'Australia Customs Tariff 2024', verified: true },
    '440710': { mfn: '0%', source: 'Australia Customs Tariff 2024', verified: true },
    '760110': { mfn: '5%', source: 'Australia Customs Tariff 2024', verified: true },
    '030389': { mfn: '0%', source: 'Australia Customs Tariff 2024', verified: true },
    '300490': { mfn: '0%', source: 'Australia Customs Tariff 2024', verified: true },
    '390110': { mfn: '5%', source: 'Australia Customs Tariff 2024', verified: false },
    '851762': { mfn: '0%', source: 'Australia Customs Tariff 2024', verified: true },
  },

  // ── Mexico (CUSMA) ────────────────────────────────────────────────────────
  MX: {
    '270900': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'Mexico LIGIE Tariff 2024', verified: true },
    '271121': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'Mexico LIGIE Tariff 2024', verified: true },
    '870322': { mfn: '20%', preferential: '0%', agreementName: 'CUSMA', source: 'Mexico LIGIE Tariff 2024', verified: true },
    '870323': { mfn: '20%', preferential: '0%', agreementName: 'CUSMA', source: 'Mexico LIGIE Tariff 2024', verified: true },
    '870360': { mfn: '20%', preferential: '0%', agreementName: 'CUSMA', source: 'Mexico LIGIE Tariff 2024', verified: true },
    '710812': { mfn: '0%', source: 'Mexico LIGIE Tariff 2024', verified: true },
    '120510': { mfn: '0%', preferential: '0%', agreementName: 'CUSMA', source: 'Mexico LIGIE Tariff 2024', verified: true },
    '440710': { mfn: '15%', preferential: '0%', agreementName: 'CUSMA', source: 'Mexico LIGIE Tariff 2024', verified: false },
    '760110': { mfn: '15%', preferential: '0%', agreementName: 'CUSMA', source: 'Mexico LIGIE Tariff 2024', verified: false },
    '300490': { mfn: '0%', source: 'Mexico LIGIE Tariff 2024', verified: true },
  },

  // ── Brazil (no FTA — Mercosur CET) ───────────────────────────────────────
  BR: {
    '270900': { mfn: '0%', source: 'Brazil CAMEX Tariff 2024', verified: true },
    '271121': { mfn: '0%', source: 'Brazil CAMEX Tariff 2024', verified: true },
    '870322': { mfn: '35%', source: 'Brazil CAMEX Tariff 2024', verified: true },
    '870323': { mfn: '35%', source: 'Brazil CAMEX Tariff 2024', verified: true },
    '870324': { mfn: '35%', source: 'Brazil CAMEX Tariff 2024', verified: true },
    '870360': { mfn: '35%', source: 'Brazil CAMEX Tariff 2024', verified: true },
    '710812': { mfn: '0%', source: 'Brazil CAMEX Tariff 2024', verified: true },
    '841182': { mfn: '14%', source: 'Brazil CAMEX Tariff 2024', verified: false },
    '847989': { mfn: '14%', source: 'Brazil CAMEX Tariff 2024', verified: false },
    '880240': { mfn: '0%', source: 'Brazil CAMEX Tariff 2024', verified: true },
    '100199': { mfn: '10%', source: 'Brazil CAMEX Tariff 2024', verified: false },
    '120510': { mfn: '6%', source: 'Brazil CAMEX Tariff 2024', verified: false },
    '440710': { mfn: '8%', source: 'Brazil CAMEX Tariff 2024', verified: false },
    '760110': { mfn: '0%', source: 'Brazil CAMEX Tariff 2024', verified: true },
    '300490': { mfn: '6%', source: 'Brazil CAMEX Tariff 2024', verified: false },
    '390110': { mfn: '14%', source: 'Brazil CAMEX Tariff 2024', verified: false },
    '854442': { mfn: '18%', source: 'Brazil CAMEX Tariff 2024', verified: false },
  },

  // ── Indonesia (no FTA) ────────────────────────────────────────────────────
  ID: {
    '270900': { mfn: '0%', source: 'Indonesia BTI Tariff 2024', verified: true },
    '271121': { mfn: '0%', source: 'Indonesia BTI Tariff 2024', verified: true },
    '870322': { mfn: '30%', source: 'Indonesia BTI Tariff 2024', verified: true },
    '870323': { mfn: '30%', source: 'Indonesia BTI Tariff 2024', verified: true },
    '870360': { mfn: '50%', source: 'Indonesia BTI Tariff 2024', verified: false, notes: 'Indonesia applying EV incentive measures; verify current rate' },
    '710812': { mfn: '0%', source: 'Indonesia BTI Tariff 2024', verified: true },
    '841182': { mfn: '5%', source: 'Indonesia BTI Tariff 2024', verified: false },
    '880240': { mfn: '0%', source: 'Indonesia BTI Tariff 2024', verified: true },
    '100199': { mfn: '5%', source: 'Indonesia BTI Tariff 2024', verified: false },
    '120510': { mfn: '5%', source: 'Indonesia BTI Tariff 2024', verified: false },
    '440710': { mfn: '5%', source: 'Indonesia BTI Tariff 2024', verified: false },
    '760110': { mfn: '0%', source: 'Indonesia BTI Tariff 2024', verified: true },
    '300490': { mfn: '0%', source: 'Indonesia BTI Tariff 2024', verified: true },
  },

  // ── India (no FTA) ────────────────────────────────────────────────────────
  IN: {
    '270900': { mfn: '0%', source: 'India Customs Tariff 2024', verified: true },
    '271121': { mfn: '2.5%', source: 'India Customs Tariff 2024', verified: false },
    '870322': { mfn: '100%', source: 'India Customs Tariff 2024', verified: true },
    '870323': { mfn: '100%', source: 'India Customs Tariff 2024', verified: true },
    '870324': { mfn: '125%', source: 'India Customs Tariff 2024', verified: true, notes: 'Includes all applicable duties for vehicles >3000cc; verify with CBIC' },
    '870360': { mfn: '100%', source: 'India Customs Tariff 2024', verified: true },
    '710812': { mfn: '15%', source: 'India Customs Tariff 2024', verified: true },
    '710813': { mfn: '15%', source: 'India Customs Tariff 2024', verified: true },
    '711011': { mfn: '10%', source: 'India Customs Tariff 2024', verified: false },
    '710231': { mfn: '0%', source: 'India Customs Tariff 2024', verified: true },
    '841182': { mfn: '7.5%', source: 'India Customs Tariff 2024', verified: true },
    '847989': { mfn: '7.5%', source: 'India Customs Tariff 2024', verified: false },
    '880240': { mfn: '0%', source: 'India Customs Tariff 2024', verified: true },
    '100199': { mfn: '50%', source: 'India Customs Tariff 2024', verified: true },
    '120510': { mfn: '30%', source: 'India Customs Tariff 2024', verified: true },
    '440710': { mfn: '10%', source: 'India Customs Tariff 2024', verified: false },
    '760110': { mfn: '7.5%', source: 'India Customs Tariff 2024', verified: true },
    '260111': { mfn: '0%', source: 'India Customs Tariff 2024', verified: true },
    '300490': { mfn: '10%', source: 'India Customs Tariff 2024', verified: true },
    '390110': { mfn: '7.5%', source: 'India Customs Tariff 2024', verified: false },
    '854442': { mfn: '20%', source: 'India Customs Tariff 2024', verified: false },
    '851762': { mfn: '20%', source: 'India Customs Tariff 2024', verified: false },
  },

  // ── Switzerland (WTO MFN — not EU) ───────────────────────────────────────
  CH: {
    '270900': { mfn: '0%', source: 'Switzerland OCD Tariff 2024', verified: true },
    '271121': { mfn: '0%', source: 'Switzerland OCD Tariff 2024', verified: true },
    '870322': { mfn: '0%', source: 'Switzerland OCD Tariff 2024', verified: true },
    '870323': { mfn: '0%', source: 'Switzerland OCD Tariff 2024', verified: true },
    '870360': { mfn: '0%', source: 'Switzerland OCD Tariff 2024', verified: true },
    '710812': { mfn: '0%', source: 'Switzerland OCD Tariff 2024', verified: true },
    '841182': { mfn: '0%', source: 'Switzerland OCD Tariff 2024', verified: true },
    '880240': { mfn: '0%', source: 'Switzerland OCD Tariff 2024', verified: true },
    '100199': { mfn: 'CHF 23/100kg', source: 'Switzerland OCD Tariff 2024', verified: false },
    '440710': { mfn: '0%', source: 'Switzerland OCD Tariff 2024', verified: true },
    '760110': { mfn: '0%', source: 'Switzerland OCD Tariff 2024', verified: true },
    '300490': { mfn: '0%', source: 'Switzerland OCD Tariff 2024', verified: true },
    '390110': { mfn: '3.6%', source: 'Switzerland OCD Tariff 2024', verified: false },
    '851762': { mfn: '0%', source: 'Switzerland OCD Tariff 2024', verified: true },
  },
};

// Country name / ISO2 / ISO3 → internal ISO2 key
const COUNTRY_TO_ISO: Record<string, string> = {
  // English names
  'United States': 'US', 'USA': 'US', 'US': 'US',
  'China': 'CN', 'PRC': 'CN',
  'European Union': 'EU', 'EU': 'EU',
  'Japan': 'JP',
  'United Kingdom': 'GB', 'UK': 'GB',
  'South Korea': 'KR', 'Korea': 'KR',
  'Australia': 'AU',
  'Mexico': 'MX',
  'Brazil': 'BR',
  'Indonesia': 'ID',
  'India': 'IN',
  'Switzerland': 'CH',
  // EU member states → EU rates
  'Germany': 'EU', 'France': 'EU', 'Netherlands': 'EU', 'Italy': 'EU',
  'Spain': 'EU', 'Belgium': 'EU', 'Poland': 'EU', 'Sweden': 'EU',
  'Austria': 'EU', 'Denmark': 'EU', 'Ireland': 'EU', 'Portugal': 'EU',
  'Czech Republic': 'EU', 'Romania': 'EU', 'Hungary': 'EU', 'Finland': 'EU',
  'Greece': 'EU', 'Slovakia': 'EU', 'Bulgaria': 'EU', 'Croatia': 'EU',
  'Lithuania': 'EU', 'Latvia': 'EU', 'Estonia': 'EU', 'Slovenia': 'EU',
  'Luxembourg': 'EU', 'Malta': 'EU', 'Cyprus': 'EU',
  // Comtrade 3-letter ISO codes
  'CHN': 'CN', 'GBR': 'GB', 'JPN': 'JP', 'MEX': 'MX', 'KOR': 'KR',
  'NLD': 'EU', 'DEU': 'EU', 'CHE': 'CH', 'IND': 'IN', 'BEL': 'EU',
  'FRA': 'EU', 'AUS': 'AU', 'BRA': 'BR', 'IDN': 'ID',
};

/**
 * Look up a verified tariff rate by country name/code and HS code (static file).
 * Lookup order: exact 6-digit → 4-digit heading → 2-digit chapter.
 * Returns null if no verified rate is available.
 */
export function lookupTariffRate(countryName: string, hsCode: string): TariffEntry | null {
  const iso = COUNTRY_TO_ISO[countryName] ?? COUNTRY_TO_ISO[countryName.trim()];
  if (!iso) return null;

  const normalized = hsCode.replace(/[\s.]/g, '');
  const six = normalized.slice(0, 6);
  const four = normalized.slice(0, 4);
  const two = normalized.slice(0, 2);

  const countryRates = TARIFF_RATES[iso];
  if (!countryRates) return null;

  return countryRates[six] ?? countryRates[four] ?? countryRates[two] ?? null;
}

// ── DB-backed lookup (Layer 4) ────────────────────────────────────────────────

export interface DbTariffRate {
  hs_code: string;
  country_iso2: string;
  mfn_rate: string;
  preferential_rate: string | null;
  fta_name: string | null;
  source: string;
  verified: boolean;
  notes: string | null;
  verified_date: string;
}

/**
 * Look up tariff rate from Supabase verified_tariff_rates table.
 * Falls back to static lookupTariffRate() if no DB row found.
 * Lookup order: exact 6-digit → 4-digit heading → 2-digit chapter.
 */
export async function lookupTariffRateFromDb(
  countryName: string,
  hsCode: string,
): Promise<TariffEntry | null> {
  const iso = COUNTRY_TO_ISO[countryName] ?? COUNTRY_TO_ISO[countryName.trim()];
  if (!iso) return lookupTariffRate(countryName, hsCode);

  const normalized = hsCode.replace(/[\s.]/g, '');
  const six  = normalized.slice(0, 6).padEnd(6, '0').slice(0, 6);
  const four = normalized.slice(0, 4);
  const two  = normalized.slice(0, 2);

  try {
    const { createServiceClient } = await import('@/lib/supabase');
    const supabase = createServiceClient();

    // Try exact 6-digit match first, then fall back via JS
    const { data, error } = await supabase
      .from('verified_tariff_rates')
      .select('*')
      .eq('country_iso2', iso)
      .in('hs_code', [six, four.padEnd(6, '0'), two.padEnd(6, '0')])
      .order('hs_code', { ascending: false }) // longer code = more specific
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      const row = data as DbTariffRate;
      return {
        mfn:           row.mfn_rate,
        preferential:  row.preferential_rate ?? undefined,
        agreementName: row.fta_name ?? undefined,
        source:        row.source,
        verified:      row.verified,
        notes:         row.notes ?? undefined,
      };
    }
  } catch {
    // DB unavailable — fall through to static lookup
  }

  return lookupTariffRate(countryName, hsCode);
}

/**
 * Upsert a tariff rate into Supabase verified_tariff_rates.
 * Used by admin panel and USITC cron job.
 */
export async function upsertTariffRate(
  hsCode: string,
  countryIso2: string,
  entry: Omit<DbTariffRate, 'hs_code' | 'country_iso2' | 'verified_date'> & { verified_date?: string },
): Promise<void> {
  const { createServiceClient } = await import('@/lib/supabase');
  const supabase = createServiceClient();

  const normalized = hsCode.replace(/[\s.]/g, '').slice(0, 6);

  const { error } = await supabase
    .from('verified_tariff_rates')
    .upsert(
      {
        hs_code:           normalized,
        country_iso2:      countryIso2.toUpperCase(),
        mfn_rate:          entry.mfn_rate,
        preferential_rate: entry.preferential_rate ?? null,
        fta_name:          entry.fta_name ?? null,
        source:            entry.source,
        verified:          entry.verified,
        notes:             entry.notes ?? null,
        verified_date:     entry.verified_date ?? new Date().toISOString().slice(0, 10),
      },
      { onConflict: 'hs_code,country_iso2' }, // matches verified_tariff_rates_uq constraint
    );

  if (error) {
    console.error('[mercorama] upsertTariffRate failed:', error.message);
    throw error;
  }
}
