"use client";
import { useRef, useEffect, useState } from "react";

const careerCards = [
  {
    number: "01",
    title: "OPPORTUNITIES AT MERCORAMA",
    desc: "Join our growing team of trade analysts, data scientists, and platform engineers building the future of export intelligence.",
    arrow: "VIEW ROLES →",
  },
  {
    number: "02",
    title: "BROWSE SME JOB BOARD",
    desc: "Explore career opportunities across our portfolio of 500+ small and medium-sized enterprises expanding globally.",
    arrow: "BROWSE JOBS →",
  },
  {
    number: "03",
    title: "JOIN OUR ADVISOR NETWORK",
    desc: "Become a part of our expert advisory network connecting trade commissioners, consultants, and market specialists.",
    arrow: "APPLY NOW →",
  },
];

export function CareersSection() {
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
    <section id="careers" className="df-section" ref={sectionRef}>
      <div className="df-section__header">
        <span className="df-section__number">05</span>
        <h2 className="df-section__title">CAREERS</h2>
      </div>

      <span className="df-section__label">SEC-05</span>

      <div className="careers-grid">
        {careerCards.map((card, i) => (
          <a
            key={i}
            className={`careers-card reveal-up ${visible ? "visible" : ""}`}
            href="#"
            style={{ transitionDelay: `${i * 0.15}s` }}
          >
            <span className="careers-card__number">{card.number}</span>
            <span className="careers-card__title">{card.title}</span>
            <span className="careers-card__desc">{card.desc}</span>
            <span className="careers-card__arrow">{card.arrow}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
