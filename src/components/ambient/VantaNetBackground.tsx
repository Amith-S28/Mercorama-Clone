'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

export interface VantaNetBackgroundProps {
  color?: number;
  backgroundColor?: number;
  points?: number;
  maxDistance?: number;
  spacing?: number;
  showDots?: boolean;
}

export function VantaNetBackground({
  color = 0xff9a00, // matches --accent (brand orange)
  backgroundColor = 0x0f1524, // matches --obsidian (deep navy)
  points = 12.00,
  maxDistance = 22.00,
  spacing = 18.00,
  showDots = true,
}: VantaNetBackgroundProps) {
  const [vantaLoaded, setVantaLoaded] = useState(false);
  const [threeLoaded, setThreeLoaded] = useState(false);
  const vantaRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vantaEffect = useRef<any>(null);

  useEffect(() => {
    if (!vantaLoaded || !threeLoaded || !vantaRef.current) return;
    
    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vantaWindow = window as unknown as { VANTA: any; THREE: any };

    if (!vantaEffect.current && vantaWindow.VANTA && vantaWindow.THREE) {
      vantaEffect.current = vantaWindow.VANTA.NET({
        el: vantaRef.current,
        THREE: vantaWindow.THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        scale: 1.00,
        scaleMobile: 1.00,
        color,
        backgroundColor,
        points,
        maxDistance,
        spacing,
        showDots,
      });
    }

    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, [vantaLoaded, threeLoaded, color, backgroundColor, points, maxDistance, spacing, showDots]);

  return (
    <>
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js" 
        strategy="lazyOnload"
        onLoad={() => setThreeLoaded(true)}
      />
      {threeLoaded && (
        <Script 
          src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js" 
          strategy="lazyOnload"
          onLoad={() => setVantaLoaded(true)}
        />
      )}
      <div 
        ref={vantaRef} 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          zIndex: -1, 
          pointerEvents: 'none',
          opacity: 0.6 // Subtle blend
        }} 
      />
    </>
  );
}
