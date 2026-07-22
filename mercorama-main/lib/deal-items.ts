// lib/deal-items.ts
// DealItem (line-item) persistence — localStorage-backed. Mirrors lib/deals.ts pattern.

const STORAGE_KEY = 'mercorama_deal_items';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DealItem {
  id: string;
  dealId: string;
  sku?: string;
  name: string;
  description?: string;
  hsCode: string;          // inherited from deal; read-only in v1 UI
  unitOfMeasure?: string;
  unitPrice: number;
  quantity: number;
  currency: string;        // inherited from deal.currency
  createdAt: string;       // ISO-8601
}

export type DealItemCreateInput = Omit<DealItem, 'id' | 'createdAt'>;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function load(): Record<string, DealItem> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DealItem>) : {};
  } catch {
    return {};
  }
}

function persist(items: Record<string, DealItem>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function listDealItems(dealId: string): Promise<DealItem[]> {
  return Object.values(load())
    .filter((i) => i.dealId === dealId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function createDealItem(input: DealItemCreateInput): Promise<DealItem> {
  const all = load();
  const item: DealItem = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  all[item.id] = item;
  persist(all);
  return item;
}

export async function updateDealItem(id: string, patch: Partial<DealItem>): Promise<DealItem> {
  const all = load();
  const existing = all[id];
  if (!existing) throw new Error(`DealItem ${id} not found`);
  const updated: DealItem = { ...existing, ...patch, id, createdAt: existing.createdAt };
  all[id] = updated;
  persist(all);
  return updated;
}

export async function deleteDealItem(id: string): Promise<void> {
  const all = load();
  delete all[id];
  persist(all);
}
