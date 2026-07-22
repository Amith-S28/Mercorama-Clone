'use client';

import { ReactNode } from 'react';
import { motion } from 'motion/react';
import { snappy } from '@/lib/animation/presets';

interface GlowBorderProps {
  children: ReactNode;
  active?: boolean;
  className?: string;
}

export function GlowBorder({ children, active = false, className = '' }: GlowBorderProps) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={false}
      animate={{
        scale: active ? 1.02 : 1,
      }}
      transition={snappy}
    >
      {/* The inner card content */}
      <div className="relative z-10 w-full h-full bg-card rounded-2xl overflow-hidden">
        {children}
      </div>

      {/* The animated glow border */}
      <motion.div
        className="absolute -inset-[2px] z-0 rounded-[18px] opacity-0"
        animate={{
          opacity: active ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      >
        <div 
          className="w-full h-full rounded-[18px]" 
          style={{ 
            background: 'linear-gradient(45deg, var(--accent-vivid), var(--accent), var(--info))',
            backgroundSize: '200% 200%',
            animation: 'shimmer 3s linear infinite'
          }} 
        />
      </motion.div>
    </motion.div>
  );
}
