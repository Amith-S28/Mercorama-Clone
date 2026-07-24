"use client";
import { useRef, useEffect, useState } from "react";

const teamMembers = [
  { name: "SARAH CHEN", role: "MANAGING DIRECTOR", color: "#1a1a1a" },
  { name: "MARCUS DUBOIS", role: "CHIEF TRADE OFFICER", color: "#111" },
  { name: "ELENA VASQUEZ", role: "HEAD OF ANALYTICS", color: "#0f0f0f" },
  { name: "JAMES OKAFOR", role: "DIRECTOR OF MARKETS", color: "#151515" },
];

export function TeamSection() {
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
    <section id="team" className="df-section" ref={sectionRef}>
      <div className="df-section__header">
        <span className="df-section__number">03</span>
        <h2 className="df-section__title">TEAM</h2>
      </div>

      <span className="df-section__label">SEC-03</span>

      <div className="team-grid">
        {teamMembers.map((member, i) => (
          <div
            key={i}
            className={`team-card reveal-up ${visible ? "visible" : ""}`}
            style={{ transitionDelay: `${i * 0.1}s` }}
          >
            <div className="team-card__cross">✦</div>
            <div className="team-card__image">
              {/* Placeholder portrait — dark gradient with initials */}
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: `radial-gradient(ellipse at 50% 30%, ${member.color} 0%, #000 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: "48px",
                    fontWeight: 300,
                    color: "rgba(255,255,255,0.08)",
                    textTransform: "uppercase",
                  }}
                >
                  {member.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </span>
              </div>
            </div>
            <div className="team-card__info">
              <div className="team-card__name">{member.name}</div>
              <div className="team-card__role">{member.role}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
