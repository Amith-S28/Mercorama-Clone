"use client";

import { motion } from "motion/react";
import type { ReadinessGrade } from "@/types";
import { gradeColor, gradeLabel } from "@/lib/scoring-engine";
import { useCountUp } from "@/hooks";
import { snappy } from "@/lib/animation/presets";

export interface ScoreGaugeProps {
  score: number;
  grade: ReadinessGrade;
}

const SIZE = 168;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreGauge({ score, grade }: ScoreGaugeProps) {
  const animatedScore = useCountUp(score, { decimals: 1 });
  const offset = CIRCUMFERENCE - (animatedScore / 100) * CIRCUMFERENCE;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1rem",
        width: "100%",
      }}
    >
      <p
        className="mono-label"
        style={{ color: "#ff5500", alignSelf: "flex-start", fontWeight: 600 }}
      >
        Readiness Score
      </p>

      <div style={{ position: "relative", width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden
        >
          {/* Visible Track Circle */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth={STROKE}
          />
          {/* Solid Orange Progress Arc */}
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#ff5500"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={snappy}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </svg>

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "2.25rem",
              fontWeight: 700,
              lineHeight: 1,
              color: "#ff5500",
            }}
          >
            {grade}
          </span>
          <span
            style={{
              marginTop: "0.25rem",
              fontFamily: "var(--font-jetbrains-mono)",
              fontSize: "1.125rem",
              color: "#ffffff",
              fontWeight: 600,
            }}
          >
            {animatedScore.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Linear progress bar indicator below gauge */}
      <div style={{ width: "100%", marginTop: "0.5rem" }}>
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
              width: `${Math.min(100, Math.max(0, animatedScore))}%`,
              backgroundColor: "#ff5500",
              borderRadius: "3px",
              boxShadow: "0 0 10px rgba(255, 85, 0, 0.5)",
              transition: "width 1s cubic-bezier(0.16, 1, 0.3, 1) 0.3s",
            }}
          />
        </div>
        <p
          style={{
            margin: "0.375rem 0 0 0",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
            textAlign: "center",
          }}
        >
          {gradeLabel(grade)} ({animatedScore.toFixed(1)} / 100)
        </p>
      </div>
    </div>
  );
}
