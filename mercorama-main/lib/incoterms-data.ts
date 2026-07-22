import { IncotermData, IncotermCode } from './types';

// Static reference data for Incoterms 2020
export const INCOTERMS_2020: Record<IncotermCode, IncotermData> = {
  EXW: {
    code: 'EXW',
    name: 'Ex Works',
    transportMode: ['Any'],
    riskTransfer: "Seller's premises",
    costTransfer: "Seller's premises",
    sellerResponsibilities: [
      'Make goods available at premises',
      'Provide commercial invoice',
      'Pack goods adequately'
    ],
    buyerResponsibilities: [
      'Arrange all transportation',
      'Handle export/import clearance',
      'Bear all costs and risks from pickup',
      'Provide shipping instructions'
    ],
    bestFor: 'Domestic sales or when buyer has strong logistics network'
  },
  FCA: {
    code: 'FCA',
    name: 'Free Carrier',
    transportMode: ['Any'],
    riskTransfer: 'Named place (seller premises or carrier location)',
    costTransfer: 'Named place',
    sellerResponsibilities: [
      'Deliver goods to carrier',
      'Handle export clearance',
      'Load goods if at seller premises',
      'Provide proof of delivery'
    ],
    buyerResponsibilities: [
      'Arrange main carriage',
      'Handle import clearance',
      'Bear all costs from delivery point',
      'Unload at destination'
    ],
    bestFor: 'Container shipping, air freight, multimodal transport'
  },
  CPT: {
    code: 'CPT',
    name: 'Carriage Paid To',
    transportMode: ['Any'],
    riskTransfer: 'When goods handed to first carrier',
    costTransfer: 'Named destination',
    sellerResponsibilities: [
      'Arrange and pay for main carriage',
      'Handle export clearance',
      'Deliver to first carrier',
      'Risk transfers at handover'
    ],
    buyerResponsibilities: [
      'Handle import clearance',
      'Unload at destination',
      'Bear risk during transit',
      'Arrange insurance (buyer bears risk)'
    ],
    bestFor: 'Multimodal transport when seller has better freight rates'
  },
  CIP: {
    code: 'CIP',
    name: 'Carriage and Insurance Paid To',
    transportMode: ['Any'],
    riskTransfer: 'When goods handed to first carrier',
    costTransfer: 'Named destination',
    sellerResponsibilities: [
      'Arrange and pay for main carriage',
      'Provide insurance (110% value, Institute Cargo Clauses A)',
      'Handle export clearance',
      'Deliver to first carrier'
    ],
    buyerResponsibilities: [
      'Handle import clearance',
      'Unload at destination',
      'Bear risk during transit (despite insurance)',
      'Additional insurance if needed'
    ],
    bestFor: 'High-value goods requiring comprehensive insurance'
  },
  DAP: {
    code: 'DAP',
    name: 'Delivered At Place',
    transportMode: ['Any'],
    riskTransfer: 'Named destination (ready for unloading)',
    costTransfer: 'Named destination (excluding unloading)',
    sellerResponsibilities: [
      'Arrange and pay for transport to destination',
      'Handle export clearance',
      'Bear all risks until ready for unloading',
      'Notify buyer of arrival'
    ],
    buyerResponsibilities: [
      'Unload goods',
      'Handle import clearance',
      'Pay import duties and taxes',
      'Arrange onward transport'
    ],
    bestFor: 'Door-to-door sales where buyer handles import duties'
  },
  DPU: {
    code: 'DPU',
    name: 'Delivered at Place Unloaded',
    transportMode: ['Any'],
    riskTransfer: 'Named place after unloading',
    costTransfer: 'Named place after unloading',
    sellerResponsibilities: [
      'Arrange transport and unloading',
      'Handle export clearance',
      'Bear all risks until goods unloaded',
      'Provide unloading equipment'
    ],
    buyerResponsibilities: [
      'Handle import clearance',
      'Pay import duties and taxes',
      'Arrange onward transport from unloading point',
      'Receive unloaded goods'
    ],
    bestFor: 'Shipments requiring specialized unloading equipment'
  },
  DDP: {
    code: 'DDP',
    name: 'Delivered Duty Paid',
    transportMode: ['Any'],
    riskTransfer: 'Named destination (ready for unloading)',
    costTransfer: 'Named destination (including all duties)',
    sellerResponsibilities: [
      'Arrange all transport',
      'Handle export AND import clearance',
      'Pay all duties and taxes',
      'Bear all risks to destination'
    ],
    buyerResponsibilities: [
      'Unload goods',
      'Receive goods at destination',
      'Arrange onward transport if needed'
    ],
    bestFor: 'Maximum convenience for buyer, seller has import expertise'
  },
  FAS: {
    code: 'FAS',
    name: 'Free Alongside Ship',
    transportMode: ['Sea/Inland Waterway'],
    riskTransfer: 'Alongside vessel at port of shipment',
    costTransfer: 'Alongside vessel',
    sellerResponsibilities: [
      'Deliver goods alongside ship',
      'Handle export clearance',
      'Bear costs to quayside',
      'Provide delivery notice'
    ],
    buyerResponsibilities: [
      'Arrange ocean freight',
      'Load goods onto vessel',
      'Handle import clearance',
      'Bear all risks from quayside'
    ],
    bestFor: 'Bulk commodities, when buyer arranges vessel'
  },
  FOB: {
    code: 'FOB',
    name: 'Free On Board',
    transportMode: ['Sea/Inland Waterway'],
    riskTransfer: 'When goods pass ship rail at port of shipment',
    costTransfer: 'On board vessel',
    sellerResponsibilities: [
      'Deliver and load goods on vessel',
      'Handle export clearance',
      'Pay loading costs',
      'Provide bill of lading'
    ],
    buyerResponsibilities: [
      'Arrange and pay ocean freight',
      'Handle import clearance',
      'Bear all risks from vessel loading',
      'Unload at destination'
    ],
    bestFor: 'Traditional ocean freight, buyer controls shipping'
  },
  CFR: {
    code: 'CFR',
    name: 'Cost and Freight',
    transportMode: ['Sea/Inland Waterway'],
    riskTransfer: 'When goods pass ship rail at port of shipment',
    costTransfer: 'Port of destination',
    sellerResponsibilities: [
      'Arrange and pay ocean freight',
      'Load goods on vessel',
      'Handle export clearance',
      'Provide shipping documents'
    ],
    buyerResponsibilities: [
      'Handle import clearance',
      'Unload at destination',
      'Bear risk during ocean transit',
      'Arrange marine insurance'
    ],
    bestFor: 'Ocean freight when seller has better shipping rates'
  },
  CIF: {
    code: 'CIF',
    name: 'Cost, Insurance and Freight',
    transportMode: ['Sea/Inland Waterway'],
    riskTransfer: 'When goods pass ship rail at port of shipment',
    costTransfer: 'Port of destination',
    sellerResponsibilities: [
      'Arrange and pay ocean freight',
      'Provide marine insurance (110% value, minimum coverage)',
      'Load goods on vessel',
      'Handle export clearance'
    ],
    buyerResponsibilities: [
      'Handle import clearance',
      'Unload at destination',
      'Bear risk during transit (despite insurance)',
      'Additional insurance if needed'
    ],
    bestFor: 'Traditional ocean shipping with basic insurance coverage'
  }
};

// Array format for educational pages
export const INCOTERMS_DATA = Object.values(INCOTERMS_2020);

export const INCOTERM_OPTIONS = Object.values(INCOTERMS_2020).map(i => ({
  value: i.code,
  label: `${i.code} - ${i.name}`
}));

export const PAYMENT_TERMS_OPTIONS = [
  { value: 'advance', label: '100% Advance Payment' },
  { value: '30-70', label: '30% Advance, 70% Before Shipment' },
  { value: '50-50', label: '50% Advance, 50% Before Shipment' },
  { value: 'net30', label: 'Net 30 Days' },
  { value: 'net60', label: 'Net 60 Days' },
  { value: 'lc', label: 'Letter of Credit (L/C)' },
  { value: 'lc-sight', label: 'L/C at Sight' },
  { value: 'lc-usance', label: 'L/C with Usance' },
  { value: 'da', label: 'Documents Against Acceptance (D/A)' },
  { value: 'dp', label: 'Documents Against Payment (D/P)' },
  { value: 'oa', label: 'Open Account' },
];
