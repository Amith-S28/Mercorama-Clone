"use client";
import { useRef, useEffect, useState } from "react";

const articles = [
  {
    category: "MARKET ANALYSIS",
    title: "How Emerging Markets Are Reshaping Global Supply Chains in 2025",
    image: null,
  },
  {
    category: "READINESS REPORT",
    title:
      "The Export Readiness Gap: Why 70% of SMEs Fail in Their First International Market",
    image: null,
  },
  {
    category: "TRADE POLICY",
    title:
      "Navigating Tariff Complexity: A Data-Driven Approach to Landed Cost Modeling",
    image: null,
  },
  {
    category: "CASE STUDY",
    title:
      "From Local to Global: How AgriCorp Expanded to 12 Markets in 18 Months",
    image: null,
  },
];

export function StatementSection() {
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
    <section id="intelligence" className="df-section" ref={sectionRef}>
      <div className="df-section__header">
        <span className="df-section__number">02</span>
        <h2 className="df-section__title">INTELLIGENCE</h2>
      </div>

      <span className="df-section__label">SEC-02</span>

      <div className="intel-cards">
        {articles.map((article, i) => (
          <div
            key={i}
            className={`intel-card reveal-up ${visible ? "visible" : ""}`}
            style={{ transitionDelay: `${i * 0.1}s` }}
          >
            <div className="intel-card__image">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: `linear-gradient(135deg, rgba(255,77,0,${0.08 + i * 0.03}) 0%, rgba(0,0,0,0.9) 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span className="df-label" style={{ color: "var(--grey-300)" }}>
                  RESEARCH
                </span>
              </div>
            </div>
            <div className="intel-card__body">
              <span className="intel-card__category">{article.category}</span>
              <span className="intel-card__title">{article.title}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
