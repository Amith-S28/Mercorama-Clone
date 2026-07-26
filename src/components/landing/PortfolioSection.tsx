"use client";
import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { COUNTRY_RISK_DATA } from "@/lib/country-risk-data";

// Spotlight specific top markets
const spotlightIso3 = [
  "USA",
  "MEX",
  "GBR",
  "DEU",
  "FRA",
  "NLD",
  "JPN",
  "CHN",
  "IND",
];
const spotlight = spotlightIso3.map((iso) =>
  COUNTRY_RISK_DATA.find((c) => c.iso3 === iso)!,
);

// The regions based on their actual data
const regions = [
  "NORTH-AMERICA",
  "EUROPE",
  "ASIA-PACIFIC",
  "MIDDLE-EAST",
  "SOUTH-AMERICA",
  "AFRICA",
];

export function PortfolioSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="markets" className="df-section" ref={sectionRef}>
      <div className="df-section__header">
        <span className="df-section__number">04</span>
        <h2 className="df-section__title">MAJOR MARKETS</h2>
      </div>

      <span className="df-section__label">SEC-04</span>

      {/* Spotlight */}
      <div
        className="portfolio-spotlight"
        style={{ padding: "0 var(--spacer-12)", marginBottom: "80px" }}
      >
        {spotlight.map((item, i) => (
          <Link
            key={i}
            href={`/portal/trade-data?reporter=${item.iso3}`}
            className={`portfolio-spotlight__item reveal-up ${visible ? "visible" : ""}`}
            style={{ transitionDelay: `${i * 0.08}s` }}
          >
            <span className="portfolio-spotlight__name">{item.name}</span>
            <span className="portfolio-spotlight__category">
              {item.region.replace("-", " ")}
            </span>
          </Link>
        ))}
      </div>

      {/* Grouped by Continent */}
      <div
        className="portfolio-grouped"
        style={{ padding: "0 var(--spacer-12)" }}
      >
        {regions.map((region) => {
          const regionCountries = COUNTRY_RISK_DATA.filter(
            (c) => c.region.toUpperCase() === region,
          ).sort((a, b) => a.name.localeCompare(b.name));

          if (regionCountries.length === 0) return null;

          return (
            <div key={region} style={{ marginBottom: "60px" }}>
              <div
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  paddingBottom: "16px",
                  marginBottom: "16px",
                }}
              >
                <h3
                  className="df-section__title"
                  style={{
                    fontSize: "12px",
                    color: "var(--grey-300)",
                    letterSpacing: "1px",
                  }}
                >
                  {region.replace("-", " ")}
                </h3>
              </div>
              <div className="portfolio-az" style={{ padding: 0 }}>
                {regionCountries.map((country, i) => (
                  <Link
                    key={i}
                    href={`/portal/trade-data?reporter=${country.iso3}`}
                    className="portfolio-az__item"
                  >
                    <span>{country.name}</span>
                    <span className="portfolio-az__item-category">
                      {country.region.replace("-", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
