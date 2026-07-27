"use client";

import { motion } from "motion/react";
import type { ReadinessGrade } from "@/types";
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

    </div>
  );
}
