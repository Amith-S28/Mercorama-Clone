// app/deal/_components/line-items-editor.tsx
// Inline line-item table used in Deal Wizard Step 1.
// Manages draft items (client-only) before a Deal exists.
'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// ─── DraftItem ────────────────────────────────────────────────────────────────
// In-memory shape before persistence. _key is a React list key.

export interface DraftItem {
  _key: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export function emptyDraftItem(): DraftItem {
  return { _key: crypto.randomUUID(), sku: '', name: '', unitPrice: 0, quantity: 1 };
}

// ─── Validation helper ────────────────────────────────────────────────────────

export function validateDraftItems(items: DraftItem[]): string | null {
  const filled = items.filter((i) => i.name.trim() || i.unitPrice > 0);
  if (filled.length === 0) return null; // no items entered → skip
  for (const item of filled) {
    if (!item.name.trim()) return 'Each item needs a name.';
    if (item.unitPrice <= 0) return `Item "${item.name}" needs a unit price greater than 0.`;
    if (item.quantity < 1) return `Item "${item.name}" needs a quantity of at least 1.`;
  }
  return null;
}

/** Returns only the items that have been at least partially filled in. */
export function filledDraftItems(items: DraftItem[]): DraftItem[] {
  return items.filter((i) => i.name.trim() && i.unitPrice > 0 && i.quantity >= 1);
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  items: DraftItem[];
  currency: string;
  hsCode?: string;
  onChange: (items: DraftItem[]) => void;
}

export function LineItemsEditor({ items, currency, hsCode, onChange }: Props) {
  function update(key: string, patch: Partial<DraftItem>) {
    onChange(items.map((i) => (i._key === key ? { ...i, ...patch } : i)));
  }

  function remove(key: string) {
    onChange(items.filter((i) => i._key !== key));
  }

  function addRow() {
    onChange([...items, emptyDraftItem()]);
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <div className="space-y-3">
      {/* Table header */}
      <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] gap-2 px-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
        <span>SKU</span>
        <span>Item name *</span>
        <span>Qty *</span>
        <span>Unit price *</span>
        <span>Total</span>
        <span />
      </div>

      {/* Rows */}
      <div className="space-y-2">
        {items.map((item) => {
          const lineTotal = item.unitPrice * item.quantity;
          return (
            <div
              key={item._key}
              className="grid grid-cols-2 sm:grid-cols-[1fr_2fr_1fr_1fr_1fr_auto] gap-2 items-center rounded-md border p-2 sm:p-1 sm:border-0 sm:rounded-none sm:border-b"
            >
              {/* SKU */}
              <div className="sm:col-span-1">
                <span className="sm:hidden text-xs text-muted-foreground">SKU</span>
                <Input
                  placeholder="SKU (opt)"
                  value={item.sku}
                  onChange={(e) => update(item._key, { sku: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              {/* Name */}
              <div className="col-span-2 sm:col-span-1">
                <span className="sm:hidden text-xs text-muted-foreground">Item name *</span>
                <Input
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => update(item._key, { name: e.target.value })}
                  className="h-8 text-xs"
                />
              </div>
              {/* Qty */}
              <div>
                <span className="sm:hidden text-xs text-muted-foreground">Qty</span>
                <Input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => update(item._key, { quantity: Math.max(1, Number(e.target.value)) })}
                  className="h-8 text-xs"
                />
              </div>
              {/* Unit price */}
              <div>
                <span className="sm:hidden text-xs text-muted-foreground">Unit price ({currency})</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0.00"
                  value={item.unitPrice === 0 ? '' : item.unitPrice}
                  onChange={(e) => update(item._key, { unitPrice: Number(e.target.value) || 0 })}
                  className="h-8 text-xs"
                />
              </div>
              {/* Line total */}
              <div className="text-xs font-medium tabular-nums text-right sm:text-left">
                <span className="sm:hidden text-xs text-muted-foreground">Total: </span>
                {lineTotal > 0
                  ? `${currency} ${lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '—'}
              </div>
              {/* Remove */}
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(item._key)}
                  disabled={items.length <= 1}
                  title="Remove item"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtotal + Add button row */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={addRow}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add item
        </Button>

        {subtotal > 0 && (
          <p className="text-xs font-semibold tabular-nums text-right">
            Subtotal:{' '}
            <span className="text-primary">
              {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        )}
      </div>

      {/* HS note */}
      {hsCode && (
        <p className="text-[11px] text-muted-foreground">
          All line items inherit HS code{' '}
          <span className="font-mono font-semibold text-primary">{hsCode}</span> from the deal.
        </p>
      )}
    </div>
  );
}

// ─── Read-only pricing table (Step 3) ─────────────────────────────────────────

import type { DealItem } from '@/lib/deal-items';

interface PricingTableProps {
  items: DealItem[];
  currency: string;
}

export function PricingTable({ items, currency }: PricingTableProps) {
  if (items.length === 0) return null;
  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <div className="space-y-2 text-sm">
      {/* Header */}
      <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide pb-1 border-b">
        <span>SKU</span>
        <span>Item</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Unit price</span>
        <span className="text-right">Total</span>
      </div>

      {items.map((item) => {
        const total = item.unitPrice * item.quantity;
        return (
          <div
            key={item.id}
            className="grid grid-cols-2 sm:grid-cols-[1fr_2fr_1fr_1fr_1fr] gap-2 py-1.5 border-b last:border-b-0 text-sm"
          >
            <span className="font-mono text-xs text-muted-foreground">{item.sku || '—'}</span>
            <span className="col-span-1 font-medium">{item.name}</span>
            <span className="text-right tabular-nums">{item.quantity.toLocaleString()}</span>
            <span className="text-right tabular-nums">
              {currency} {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-right tabular-nums font-medium">
              {currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        );
      })}

      {/* Subtotal */}
      <div className="flex justify-between pt-1 border-t font-semibold">
        <span>Subtotal</span>
        <span className="text-primary tabular-nums">
          {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
