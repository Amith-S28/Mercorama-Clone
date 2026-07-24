"use client";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";

const TAGLINES = [
  "EMPOWERING GLOBAL EXPANSION",
  "DATA-DRIVEN TRADE INTELLIGENCE",
  "YOUR GATEWAY TO NEW MARKETS",
  "ASSESS EXPORT READINESS WITH PRECISION",
];

export function HeroSection() {
  const [taglineIndex, setTaglineIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTaglineIndex((prev) => (prev + 1) % TAGLINES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-title-container">
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          style={{
            fontSize: "clamp(60px, 10vw, 180px)",
            letterSpacing: "0.1em",
          }}
        >
          MERCORAMA
        </motion.h1>

        <div
          style={{
            height: "30px",
            position: "relative",
            marginTop: "16px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={taglineIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              style={{
                position: "absolute",
                fontFamily: "var(--font-mono)",
                fontSize: "18px",
                fontWeight: "bold",
                letterSpacing: "2px",
                color: "#fff",
                backgroundColor: "rgba(0,0,0,0.6)",
                padding: "4px 12px",
                borderRadius: "6px",
              }}
            >
              {TAGLINES[taglineIndex]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="hero-marquee">
        <div className="hero-marquee__track">
          {[...Array(10)].map((_, i) => (
            <span key={i} style={{ paddingRight: "3rem" }}>
              BE TRADE READY ALWAYS •
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
