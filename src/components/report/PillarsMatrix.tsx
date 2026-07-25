"use client";

import type { PillarKey } from "@/types";
import { PILLAR_LABELS } from "@/lib/scoring-engine";
import { useGsapStagger } from "@/hooks";

export interface PillarsMatrixProps {
  pillarScores: Record<PillarKey, number>;
}

function pillarColor(score: number): string {
  if (score >= 70) return "var(--success)";
  if (score >= 50) return "var(--info)";
  if (score >= 25) return "var(--warning)";
  return "var(--danger)";
}

export function PillarsMatrix({ pillarScores }: PillarsMatrixProps) {
  const entries = (Object.keys(PILLAR_LABELS) as PillarKey[]).map((key) => ({
    key,
    label: PILLAR_LABELS[key],
    score: pillarScores[key] ?? 0,
  }));

  const listRef = useGsapStagger<HTMLDivElement>({
    staggerEach: 0.05,
    distance: 10,
    direction: "left",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <p
          className="mono-label"
          style={{ color: "#ff5500", marginBottom: "0.25rem", fontWeight: 600 }}
        >
          Pillar Matrix
        </p>
        <p
          style={{
            margin: 0,
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
          }}
        >
          Linear readiness breakdown across nine export pillars
        </p>
      </div>

      <div
        style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}
        ref={listRef}
      >
        {entries.map(({ key, label, score }) => (
          <div key={key} className="opacity-0">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "0.375rem",
                gap: "0.75rem",
              }}
            >
              <span
                style={{ fontSize: "0.8125rem", color: "var(--text-primary)", fontWeight: 500 }}
              >
                {label}
              </span>
              <span
                className="mono-label"
                style={{
                  fontSize: "0.75rem",
                  color: "#ff5500",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {Math.round(score)}%
              </span>
            </div>
            <div
              style={{
                height: "10px",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                overflow: "hidden",
                width: "100%",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, Math.max(0, score))}%`,
                  backgroundColor: "#ff5500",
                  borderRadius: "3px",
                  boxShadow: "0 0 10px rgba(255, 85, 0, 0.5)",
                  transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
