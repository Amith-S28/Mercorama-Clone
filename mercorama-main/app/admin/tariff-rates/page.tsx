// app/admin/tariff-rates/page.tsx
// Admin panel for managing verified_tariff_rates table.
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface TariffRate {
  id: string;
  hs_code: string;
  country_iso2: string;
  mfn_rate: string;
  preferential_rate: string | null;
  fta_name: string | null;
  source: string;
  verified: boolean;
  notes: string | null;
  verified_date: string;
  updated_at: string;
}

const COUNTRIES = [
  'US','CN','EU','JP','GB','KR','AU','MX','BR','ID','IN','CH',
];

const EMPTY_FORM = {
  hs_code: '', country_iso2: 'US', mfn_rate: '',
  preferential_rate: '', fta_name: '', source: '',
  verified: false, notes: '',
};

export default function TariffRatesPage() {
  const [rates, setRates]         = useState<TariffRate[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [filterCountry, setFilterCountry] = useState('');
  const [filterHs, setFilterHs]   = useState('');
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filterCountry) params.set('country', filterCountry);
    if (filterHs)      params.set('hs_code', filterHs);
    const res = await fetch(`/api/admin/tariff-rates?${params}`);
    if (res.ok) {
      const json = await res.json();
      setRates(json.rates ?? []);
      setTotal(json.total ?? 0);
    }
    setLoading(false);
  }, [page, filterCountry, filterHs]);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch('/api/admin/tariff-rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        preferential_rate: form.preferential_rate || null,
        fta_name:          form.fta_name || null,
        notes:             form.notes || null,
      }),
    });
    if (res.ok) {
      setMsg({ type: 'ok', text: 'Rate saved.' });
      setForm(EMPTY_FORM);
      fetchRates();
    } else {
      const j = await res.json();
      setMsg({ type: 'err', text: j.error ?? 'Save failed.' });
    }
    setSaving(false);
  }

  async function handleDelete(hsCode: string, country: string) {
    if (!confirm(`Delete ${hsCode} / ${country}?`)) return;
    const res = await fetch(
      `/api/admin/tariff-rates?hs_code=${hsCode}&country_iso2=${country}`,
      { method: 'DELETE' },
    );
    if (res.ok) fetchRates();
  }

  const totalPages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Verified Tariff Rates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {total} rates in DB. Filters apply to live data; fallback to static file when no DB row found.
        </p>
      </div>

      {/* Add / Edit form */}
      <form onSubmit={handleSave} className="border rounded-lg p-5 space-y-4 bg-muted/30">
        <h2 className="font-medium">Add / Update Rate</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">HS Code (6-digit)</label>
            <Input
              placeholder="870323"
              value={form.hs_code}
              onChange={e => setForm(f => ({ ...f, hs_code: e.target.value }))}
              required
              maxLength={6}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Country ISO2</label>
            <select
              className="w-full border rounded px-2 py-2 text-sm bg-background"
              value={form.country_iso2}
              onChange={e => setForm(f => ({ ...f, country_iso2: e.target.value }))}
            >
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">MFN Rate</label>
            <Input
              placeholder="6.5%"
              value={form.mfn_rate}
              onChange={e => setForm(f => ({ ...f, mfn_rate: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Preferential Rate</label>
            <Input
              placeholder="0% (CETA)"
              value={form.preferential_rate}
              onChange={e => setForm(f => ({ ...f, preferential_rate: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">FTA Name</label>
            <Input
              placeholder="CETA"
              value={form.fta_name}
              onChange={e => setForm(f => ({ ...f, fta_name: e.target.value }))}
            />
          </div>
          <div className="space-y-1 col-span-2">
            <label className="text-xs text-muted-foreground">Source</label>
            <Input
              placeholder="EU TARIC 2024"
              value={form.source}
              onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Verified</label>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="verified"
                checked={form.verified}
                onChange={e => setForm(f => ({ ...f, verified: e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor="verified" className="text-sm">Mark as verified</label>
            </div>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Notes (optional)</label>
          <Input
            placeholder="CVD/AD may apply separately; TRQ: in-quota 1%, out-of-quota 65%"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving} size="sm">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            Save Rate
          </Button>
          {msg && (
            <span className={`text-sm flex items-center gap-1 ${msg.type === 'ok' ? 'text-green-600' : 'text-red-500'}`}>
              {msg.type === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {msg.text}
            </span>
          )}
        </div>
      </form>

      {/* Filters */}
      <div className="flex gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Filter country</label>
          <select
            className="border rounded px-2 py-2 text-sm bg-background"
            value={filterCountry}
            onChange={e => { setFilterCountry(e.target.value); setPage(1); }}
          >
            <option value="">All</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Filter HS code</label>
          <Input
            placeholder="8703"
            value={filterHs}
            onChange={e => { setFilterHs(e.target.value); setPage(1); }}
            className="w-32"
          />
        </div>
        <Button variant="outline" size="sm" onClick={fetchRates}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          Page {page} / {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                {['HS Code','Country','MFN Rate','Pref. Rate','FTA','Source','Verified','Updated',''].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rates.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">No rates found</td></tr>
              ) : rates.map(r => (
                <tr key={r.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2 font-mono">{r.hs_code}</td>
                  <td className="px-3 py-2 font-semibold">{r.country_iso2}</td>
                  <td className="px-3 py-2">{r.mfn_rate}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.preferential_rate ?? '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.fta_name ?? '—'}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground max-w-[160px] truncate">{r.source}</td>
                  <td className="px-3 py-2">
                    {r.verified
                      ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                      : <AlertCircle className="h-4 w-4 text-yellow-500" />}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{r.updated_at.slice(0, 10)}</td>
                  <td className="px-3 py-2">
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => handleDelete(r.hs_code, r.country_iso2)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
