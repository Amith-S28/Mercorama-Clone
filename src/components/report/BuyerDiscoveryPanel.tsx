"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Users, Building2, Calendar, MapPin, Search } from "@/components/ui/icons";
import type { SmeRecord } from "@/types";
import { snappy } from "@/lib/animation/presets";

interface Buyer {
  name: string;
  type: string;
  description: string;
}

interface TradeShow {
  name: string;
  location: string;
  description: string;
}

export function BuyerDiscoveryPanel({ sme }: { sme: SmeRecord }) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [shows, setShows] = useState<TradeShow[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  async function discover() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        hsCode: sme.hsCode,
        country: sme.targetCountry,
        industry: sme.industry,
      });
      const res = await fetch(`/api/portal/buyers?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setBuyers(data.buyers || []);
        setShows(data.tradeShows || []);
      }
    } catch (e) {
      console.error("Failed to load buyers", e);
    } finally {
      setLoading(false);
      setHasRun(true);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p className="mono-label" style={{ color: "var(--text-tertiary)", marginBottom: "0.25rem" }}>
            B2B Buyer Discovery
          </p>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            AI-powered lead generation for {sme.targetCountryName}
          </span>
        </div>
        {!hasRun && (
          <button
            onClick={discover}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)] text-black text-xs font-medium hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50"
          >
            <Search size={14} className={loading ? "animate-spin" : ""} />
            {loading ? "Discovering..." : "Run Discovery"}
          </button>
        )}
      </div>

      {hasRun && !loading ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={snappy}
          style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div>
            <h4 className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)] mb-3">
              <Users size={16} className="text-[var(--accent)]" />
              Potential Buyers & Distributors
            </h4>
            <div className="grid gap-2">
              {buyers.length > 0 ? buyers.map((b, i) => (
                <div key={i} className="p-3 rounded-lg border border-[var(--border-low-contrast)] bg-[var(--bg-primary)]">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-[var(--text-primary)] text-sm">{b.name}</span>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-tertiary)] px-2 py-0.5 bg-[var(--surface-muted)] rounded-full">
                      {b.type}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">{b.description}</p>
                </div>
              )) : (
                <p className="text-xs text-[var(--text-tertiary)] italic m-0">No buyers found for this sector.</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="flex items-center gap-1.5 text-sm font-medium text-[var(--text-primary)] mb-3">
              <Building2 size={16} className="text-[var(--accent)]" />
              Relevant Trade Shows
            </h4>
            <div className="grid gap-2">
              {shows.length > 0 ? shows.map((s, i) => (
                <div key={i} className="p-3 rounded-lg border border-[var(--border-low-contrast)] bg-[var(--bg-primary)]">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-[var(--text-primary)] text-sm">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-1.5 text-[10px] uppercase font-mono text-[var(--text-tertiary)]">
                    <MapPin size={10} /> {s.location}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] m-0 leading-relaxed">{s.description}</p>
                </div>
              )) : (
                <p className="text-xs text-[var(--text-tertiary)] italic m-0">No trade shows found.</p>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed var(--border-low-contrast)", borderRadius: "8px" }}>
          <p className="text-sm text-[var(--text-tertiary)] m-0">
            {loading ? "Analyzing market sectors via Gemini..." : "Click Run Discovery to find potential B2B partners."}
          </p>
        </div>
      )}
    </div>
  );
}
