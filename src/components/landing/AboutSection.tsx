"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";

export function AboutSection() {
  const containerRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Scale up from 0.8 to 1.15 and fade in/out smoothly as user scrolls past
  const scale = useTransform(
    scrollYProgress,
    [0.1, 0.45, 0.7, 0.95],
    [0.75, 1.08, 1.08, 0.85],
  );
  const opacity = useTransform(
    scrollYProgress,
    [0.1, 0.35, 0.7, 0.95],
    [0, 1, 1, 0],
  );

  return (
    <section id="about" className="df-section" ref={containerRef}>
      <div className="df-section__header">
        <span className="df-section__number">01</span>
        <h2 className="df-section__title">ABOUT</h2>
      </div>

      <span className="df-section__label">SEC-01</span>

      <div className="about-text">
        Seven years in trade intelligence, Mercorama brings access and insight
        to export teams with global aspirations to find markets anywhere.
      </div>

      <motion.div
        ref={textRef}
        className="about-huge-text"
        style={{
          scale,
          opacity,
        }}
      >
        <span>TRADE READY</span>
        <span>FROM</span>
        <span>DAY 1</span>
      </motion.div>
    </section>
  );
}
