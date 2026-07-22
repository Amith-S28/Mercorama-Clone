'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface UseGsapStaggerOptions {
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  staggerEach?: number;
  delay?: number;
  duration?: number;
  distance?: number;
  threshold?: number;
  staggerFrom?: 'start' | 'center' | 'end' | 'edges' | 'random';
  triggerValue?: unknown;
}

export function useGsapStagger<T extends HTMLElement>(options: UseGsapStaggerOptions = {}) {
  const ref = useRef<T>(null);

  const {
    direction = 'up',
    staggerEach = 0.08,
    delay = 0,
    duration = 0.6,
    distance = 30,
    threshold = 0.1,
    staggerFrom = 'start',
    triggerValue,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Get children of the container
    const children = el.children;
    if (children.length === 0) return;

    let x = 0;
    let y = 0;

    if (direction === 'up') y = distance;
    if (direction === 'down') y = -distance;
    if (direction === 'left') x = distance;
    if (direction === 'right') x = -distance;

    const anim = gsap.fromTo(
      children,
      { opacity: 0, x, y },
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration,
        delay,
        ease: 'power2.out',
        stagger: {
          each: staggerEach,
          from: staggerFrom,
        },
        scrollTrigger: {
          trigger: el,
          start: `top ${100 - threshold * 100}%`,
          toggleActions: 'play none none none',
        },
      }
    );

    return () => {
      anim.kill();
    };
  }, [direction, staggerEach, delay, duration, distance, threshold, staggerFrom, triggerValue]);

  return ref;
}
