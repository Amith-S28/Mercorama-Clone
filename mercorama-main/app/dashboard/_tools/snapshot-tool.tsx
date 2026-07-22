'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const PRICE_OPTIONS = ['Under $25', '$25–$100', '$100–$500', '$500+'];
const MARKET_OPTIONS = ['Local only', 'Ontario', 'Quebec', 'British Columbia', 'Multiple provinces', 'Already exporting'];
const EXPERIENCE_OPTIONS = ['None', 'Exploring', 'Have exported before'];

const SNAPSHOT_KEY = 'mercorama_snapshot';

interface Snapshot {
  productDescription: string;
  priceRange: string;
  currentMarket: string;
  exportExperience: string;
}

export function SnapshotTool() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isUpdate, setIsUpdate] = useState(false);

  const [form, setForm] = useState<Snapshot>({
    productDescription: '',
    priceRange: '',
    currentMarket: '',
    exportExperience: '',
  });

  useEffect(() => {
    fetch('/api/snapshot')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.productDescription) {
          setForm(data);
          setIsUpdate(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function set<K extends keyof Snapshot>(key: K, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    setError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.productDescription.trim() || !form.priceRange || !form.currentMarket || !form.exportExperience) {
      setError('Please fill in all fields.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Failed to save');
      }
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(form));
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">
            {isUpdate ? 'Update your business profile' : 'Tell us about your business'}
          </h1>
          {!isUpdate && (
            <p className="mt-2 text-sm text-muted-foreground">
              Takes 30 seconds. Personalizes your entire experience.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Describe your product or service</label>
            <Input
              value={form.productDescription}
              onChange={(e) => set('productDescription', e.target.value.slice(0, 100))}
              placeholder="e.g., Organic maple syrup for retail"
              maxLength={100}
            />
            <span className="text-[10px] text-muted-foreground mt-0.5 block text-right">{form.productDescription.length}/100</span>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Price range per unit</label>
            <div className="grid grid-cols-2 gap-2">
              {PRICE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set('priceRange', opt)}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all min-h-[44px]',
                    form.priceRange === opt
                      ? 'bg-[#01696f] text-white border-[#01696f]'
                      : 'bg-card text-foreground border-border hover:border-[#01696f]/40',
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Where do you currently sell?</label>
            <div className="grid grid-cols-2 gap-2">
              {MARKET_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set('currentMarket', opt)}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all min-h-[44px]',
                    form.currentMarket === opt
                      ? 'bg-[#01696f] text-white border-[#01696f]'
                      : 'bg-card text-foreground border-border hover:border-[#01696f]/40',
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Export experience</label>
            <div className="grid grid-cols-3 gap-2">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set('exportExperience', opt)}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-sm font-medium transition-all min-h-[44px]',
                    form.exportExperience === opt
                      ? 'bg-[#01696f] text-white border-[#01696f]'
                      : 'bg-card text-foreground border-border hover:border-[#01696f]/40',
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" size="lg" className="w-full gap-2" disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isUpdate ? (
              <><Save className="h-4 w-4" />Save changes</>
            ) : (
              <>Show me my growth opportunities <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
