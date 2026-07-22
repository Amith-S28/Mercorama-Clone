'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export interface UseGsapCounterOptions {
  end: number;
  duration?: number;
  decimals?: number;
  delay?: number;
  threshold?: number;
  prefix?: string;
  suffix?: string;
}

export function useGsapCounter<T extends HTMLElement = HTMLSpanElement>(options: UseGsapCounterOptions) {
  const [value, setValue] = useState(options.prefix ? `${options.prefix}0${options.suffix || ''}` : '0');
  const ref = useRef<T>(null);
  
  const {
    end,
    duration = 1.5,
    decimals = 0,
    delay = 0,
    threshold = 0.1,
    prefix = '',
    suffix = '',
  } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setValue(`${prefix}${end.toFixed(decimals)}${suffix}`);
      return;
    }

    const obj = { val: 0 };

    const anim = gsap.to(obj, {
      val: end,
      duration,
      delay,
      ease: 'power3.out',
      onUpdate: () => {
        setValue(`${prefix}${obj.val.toFixed(decimals)}${suffix}`);
      },
      scrollTrigger: {
        trigger: el,
        start: `top ${100 - threshold * 100}%`,
        toggleActions: 'play none none none',
      },
    });

    return () => {
      anim.kill();
    };
  }, [end, duration, decimals, delay, threshold, prefix, suffix]);

  return { ref, value };
}
