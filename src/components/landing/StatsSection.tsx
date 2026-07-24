"use client";
import { useRef, useEffect, useState } from "react";

const stats = [
  { number: "$2.5B+", label: "TRADE VOLUME ANALYZED" },
  { number: "150+", label: "MARKETS COVERED" },
  { number: "500+", label: "SMEs ASSESSED" },
];

export function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="stats-section" ref={sectionRef}>
      <div style={{ padding: "0 var(--spacer-12)" }}>
        <div
          className={`stats-section__title reveal-up ${visible ? "visible" : ""}`}
        >
          GLOBAL SINCE 2024
        </div>

        <div className="stats-grid">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`stat-box reveal-up ${visible ? "visible" : ""}`}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <span className="stat-box__number">{stat.number}</span>
              <span className="stat-box__label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
