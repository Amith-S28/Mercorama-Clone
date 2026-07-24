"use client";
import { useRef, useEffect, useState } from "react";

const features = [
  {
    title: "Market Intelligence",
    desc: "Access live macroeconomic indicators, seasonal trade flows, and historical UN Comtrade data instantly.",
    points: [
      "Live Global Trade Data",
      "Macroeconomic Risk Indicators",
      "Competitor Analysis",
      "Seasonal Trends",
    ],
  },
  {
    title: "Export Readiness",
    desc: "Evaluate SMEs systematically across operational, financial, and strategic readiness pillars.",
    points: [
      "Diagnostic Assessments",
      "Financial Health Checks",
      "Compliance Readiness",
      "Strategic Roadmaps",
    ],
  },
  {
    title: "Landed Cost Engine",
    desc: "Calculate HS Code specific tariffs, freight costs, and exact landing margins with live exchange rates.",
    points: [
      "Real-time Tariff Rates",
      "Duty & Tax Calculators",
      "Freight Cost Estimator",
      "Margin Projections",
    ],
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="df-section" ref={sectionRef}>
      <div className="df-section__header">
        <span className="df-section__number">03</span>
        <h2 className="df-section__title">FEATURES</h2>
      </div>

      <span className="df-section__label">SEC-03</span>

      <div className="careers-grid">
        {features.map((feat, i) => (
          <div
            key={i}
            className={`careers-card reveal-up ${visible ? "visible" : ""}`}
            style={{ transitionDelay: `${i * 0.15}s`, marginTop: 0 }}
          >
            <span className="careers-card__number">0{i + 1}</span>
            <span className="careers-card__title">{feat.title}</span>
            <span className="careers-card__desc">{feat.desc}</span>

            <ul
              style={{
                marginTop: "auto",
                paddingTop: "32px",
                borderTop: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {feat.points.map((point, idx) => (
                <li
                  key={idx}
                  style={{
                    color: "var(--grey-300)",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ color: "var(--accent)" }}>+</span> {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
