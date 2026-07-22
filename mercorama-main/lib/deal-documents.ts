// lib/deal-documents.ts
// DealDocument persistence layer — localStorage-backed. Mirrors lib/deals.ts pattern.
// Swap localStorage calls for Supabase when ready.

const STORAGE_KEY = 'mercorama_deal_documents';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DealDocumentType = 'HS_DOSSIER' | 'CONTRACT' | 'INVOICE' | 'OTHER';

export interface DealDocument {
  id: string;
  dealId: string;
  type: DealDocumentType;
  title: string;
  fileUrl: string; // data URI or public URL
  createdAt: string; // ISO-8601
  createdBy: string | null;
}

export type DealDocumentCreateInput = Omit<DealDocument, 'id' | 'createdAt'>;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function load(): Record<string, DealDocument> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, DealDocument>) : {};
  } catch {
    return {};
  }
}

function persist(docs: Record<string, DealDocument>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function createDealDocument(
  input: DealDocumentCreateInput
): Promise<DealDocument> {
  const docs = load();
  const doc: DealDocument = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  docs[doc.id] = doc;
  persist(docs);
  return doc;
}

export async function listDealDocuments(dealId: string): Promise<DealDocument[]> {
  const docs = load();
  return Object.values(docs)
    .filter((d) => d.dealId === dealId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
