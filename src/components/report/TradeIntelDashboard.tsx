'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';

interface PartnerData {
  country: string;
  value: number;
}

interface TrendData {
  year: number;
  value: number;
}

interface TradeIntelData {
  importVolumeUsd: number;
  yoyChange: number;
  dataOrigin: string;
  partners: PartnerData[];
  trend: TrendData[];
  seasonality: { month: string; volumeIndex: number }[];
}

export interface TradeIntelDashboardProps {
  countryIso3: string;
  hsCode?: string;
}

export function TradeIntelDashboard({ countryIso3, hsCode }: TradeIntelDashboardProps) {
  const [data, setData] = useState<TradeIntelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const baseParams = new URLSearchParams({
        country: countryIso3,
        hsCode: hsCode ?? '000000',
      });

      try {
        const [summaryRes, partnersRes, trendRes] = await Promise.all([
          fetch(`/api/sandbox/comtrade?${baseParams.toString()}&type=summary`),
          fetch(`/api/sandbox/comtrade?${baseParams.toString()}&type=partners`),
          fetch(`/api/sandbox/comtrade?${baseParams.toString()}&type=trend`),
        ]);

        if (cancelled) return;

        const summary = await summaryRes.json().catch(() => ({}));
        const partnersData = await partnersRes.json().catch(() => ({}));
        const trendData = await trendRes.json().catch(() => ({}));

        setData({
          importVolumeUsd: summary.importVolumeUsd || 0,
          yoyChange: summary.yoyChange || 0,
          dataOrigin: summaryRes.headers.get('data-origin') === 'cache' ? 'cache' : (summary.dataOrigin || summaryRes.headers.get('data-origin') || 'unknown'),
          partners: partnersData.partners || [],
          trend: trendData.trend || [],
          seasonality: summary.seasonality || [], // We still use fallback seasonality since fetching 12 months is expensive, unless changed
        });
      } catch {
        // Silent catch
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [countryIso3, hsCode]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
        <Loader2 size={18} className="animate-spin" />
        Loading Trade Intelligence...
      </div>
    );
  }

  if (!data) return null;

  const formatCurrency = (val: number) => `$${(val / 1000000).toFixed(1)}M`;
  const formatCompact = (val: number) => `$${(val / 1000000000).toFixed(2)}B`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
          Trade Intelligence
        </p>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          HS {hsCode} · data source: {data.dataOrigin}
        </p>
      </div>

      <div className="bento-grid">
        {/* Hero Metric */}
        <div className="bento-card bento-card--span-4" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
            Total Import Volume
          </p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, margin: '0 0 0.5rem 0' }}>
            {data.importVolumeUsd > 1000000000 ? formatCompact(data.importVolumeUsd) : formatCurrency(data.importVolumeUsd)}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: data.yoyChange >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
              {data.yoyChange >= 0 ? '▲' : '▼'} {Math.abs(data.yoyChange * 100).toFixed(1)}%
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>vs previous year</span>
          </div>
        </div>

        {/* Trend Chart */}
        <div className="bento-card bento-card--span-8">
          <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
            5-Year Import Trend
          </p>
          <div style={{ height: 160 }}>
            {data.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.trend}>
                  <XAxis dataKey="year" fontSize={12} stroke="var(--text-tertiary)" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`} fontSize={12} stroke="var(--text-tertiary)" tickLine={false} axisLine={false} width={60} />
                  <Tooltip formatter={(value: unknown) => formatCurrency(Number(value) || 0)} contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
                  <Line type="monotone" dataKey="value" stroke="var(--accent-premium)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-premium)' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>No trend data available</div>
            )}
          </div>
        </div>

        {/* Top Partners Pie Chart        {/* Top 10 Partners Detailed Table */}
        <div className="bento-card bento-card--span-12">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>
                Bilateral Market Competitors (Top 10 Exporters)
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: 0 }}>
                Top countries exporting HS {hsCode} products to the targeted market of {countryIso3}
              </p>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Rank</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Country</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500 }}>Export Value (USD)</th>
                  <th style={{ padding: '0.75rem 0.5rem', fontWeight: 500, width: '45%' }}>Market Share</th>
                </tr>
              </thead>
              <tbody>
                {data.partners.slice(0, 10).map((p, i) => {
                  const pct = data.importVolumeUsd > 0 ? ((p.value / data.importVolumeUsd) * 100) : 0;
                  return (
                    <tr key={p.country} style={{ borderBottom: '1px solid var(--border-low-contrast)', color: 'var(--text-primary)' }}>
                      <td style={{ padding: '0.625rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        #{i + 1}
                      </td>
                      <td style={{ padding: '0.625rem 0.5rem', fontWeight: 600 }}>
                        {p.country}
                      </td>
                      <td style={{ padding: '0.625rem 0.5rem', fontFamily: 'var(--font-mono)' }}>
                        {p.value > 1000000 ? `$${(p.value / 1000000).toFixed(1)}M` : `$${p.value.toLocaleString()}`}
                      </td>
                      <td style={{ padding: '0.625rem 0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', minWidth: '3.25rem', fontWeight: 500 }}>
                            {pct.toFixed(1)}%
                          </span>
                          <div style={{ flex: 1, height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(100, pct)}%`,
                              height: '100%',
                              background: 'var(--accent-premium)',
                              borderRadius: 3,
                              opacity: 0.85,
                            }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Seasonality */}
        <div className="bento-card bento-card--span-12">
          <p className="mono-label" style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }}>
            Import Seasonality
          </p>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.seasonality}>
                <XAxis dataKey="month" fontSize={12} stroke="var(--text-tertiary)" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--surface-muted)' }} contentStyle={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />
                <Bar dataKey="volumeIndex" fill="var(--accent-premium)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
