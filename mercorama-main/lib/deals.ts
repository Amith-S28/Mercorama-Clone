// lib/deals.ts
// Deal persistence layer — localStorage-backed (consistent with profile-store / auth-store).
// Structure mirrors a DB model; swap localStorage calls for Supabase when ready.

const STORAGE_KEY = 'mercorama_deals';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DealStatus = 'draft' | 'finalized';

export interface Deal {
  id: string;
  createdAt: string; // ISO-8601
  updatedAt: string;

  status: DealStatus;

  // Parties & commercial
  sellerName: string;
  buyerName: string;
  buyerCountry: string;
  currency: string;
  unitPrice: number;
  quantity: number;

  // Product + HS
  productDescription: string;
  hsCode: string;
  hsDescription: string;
  hsRiskLevel: 'High' | 'Medium' | 'Low';
  hsDutyNote: string;

  // Incoterm & logistics
  incoterm: string;
  incotermPlace: string;
  freightResponsibility: 'Seller' | 'Buyer';
  insuranceResponsibility: 'Seller' | 'Buyer';

  // Payment & delivery
  paymentMethod: string;
  paymentTerms: string;
  deliveryDate: string;

  // Contract
  contractText: string;

  // Deal intent (optional — set by Step 0)
  dealIntent?: 'new_market' | 'fulfil_order' | 'repeat_deal' | 'explore';

  // Playbook enhancements (optional — backward compatible with existing deals)
  enhancedHsResult?: Record<string, unknown>;
  incotermInsight?: Record<string, unknown>;
  dealPlaybook?: Record<string, unknown>;
}

export type DealCreateInput = Partial<Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>>;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function load(): Record<string, Deal> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Deal>) : {};
  } catch {
    return {};
  }
}

function persist(deals: Record<string, Deal>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
}

const DEFAULTS: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'> = {
  status: 'draft',
  sellerName: '',
  buyerName: '',
  buyerCountry: '',
  currency: 'CAD',
  unitPrice: 0,
  quantity: 1,
  productDescription: '',
  hsCode: '',
  hsDescription: '',
  hsRiskLevel: 'Low',
  hsDutyNote: '',
  incoterm: '',
  incotermPlace: '',
  freightResponsibility: 'Seller',
  insuranceResponsibility: 'Seller',
  paymentMethod: '',
  paymentTerms: '',
  deliveryDate: '',
  contractText: '',
};

// ─── Public API ───────────────────────────────────────────────────────────────

export async function createDeal(input: DealCreateInput = {}): Promise<Deal> {
  const deals = load();
  const now = new Date().toISOString();
  const deal: Deal = {
    ...DEFAULTS,
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  deals[deal.id] = deal;
  persist(deals);
  return deal;
}

export async function updateDeal(id: string, patch: Partial<Deal>): Promise<Deal> {
  const deals = load();
  const existing = deals[id];
  if (!existing) throw new Error(`Deal ${id} not found`);
  const updated: Deal = {
    ...existing,
    ...patch,
    id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  deals[id] = updated;
  persist(deals);
  return updated;
}

export async function getDeal(id: string): Promise<Deal | null> {
  return load()[id] ?? null;
}
