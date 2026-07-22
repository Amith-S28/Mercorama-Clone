'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export interface UseGsapRevealOptions {
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  delay?: number;
  duration?: number;
  threshold?: number;
  stagger?: number;
  distance?: number;
}

export function useGsapReveal<T extends HTMLElement>(options: UseGsapRevealOptions = {}) {
  const ref = useRef<T>(null);
  
  const {
    direction = 'up',
    delay = 0,
    duration = 0.8,
    threshold = 0.1,
    distance = 40,
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    
    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let x = 0;
    let y = 0;
    
    if (direction === 'up') y = distance;
    if (direction === 'down') y = -distance;
    if (direction === 'left') x = distance;
    if (direction === 'right') x = -distance;

    const anim = gsap.fromTo(
      el,
      { opacity: 0, x, y },
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: `top ${100 - (threshold * 100)}%`,
          toggleActions: 'play none none none'
        }
      }
    );

    return () => {
      anim.kill();
    };
  }, [direction, delay, duration, threshold, distance]);

  return ref;
}
