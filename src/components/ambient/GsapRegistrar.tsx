'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLenis } from 'lenis/react';

export function GsapRegistrar() {
  const isRegistered = useRef(false);
  const lenis = useLenis();

  useEffect(() => {
    if (!isRegistered.current) {
      gsap.registerPlugin(ScrollTrigger);
      isRegistered.current = true;
    }
  }, []);

  useEffect(() => {
    if (!lenis) return;

    // Sync GSAP ScrollTrigger with Lenis
    lenis.on('scroll', ScrollTrigger.update);
    
    // Disable GSAP lag smoothing to let Lenis handle smooth scroll independently
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off('scroll', ScrollTrigger.update);
    };
  }, [lenis]);

  return null;
}
