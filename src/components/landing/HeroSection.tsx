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
          aria-live="polite"
          aria-atomic="true"
          className="relative mt-4 flex h-[30px] justify-center"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={taglineIndex}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="absolute rounded-md bg-white/5 px-3 py-1 font-mono text-[18px] font-bold tracking-[2px] text-white backdrop-blur-sm border border-white/10"
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
