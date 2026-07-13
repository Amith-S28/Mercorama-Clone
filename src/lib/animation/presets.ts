export const snappy = { type: 'spring' as const, stiffness: 380, damping: 30 };
export const smooth = { type: 'spring' as const, stiffness: 220, damping: 24 };
export const fluid = { type: 'spring' as const, stiffness: 100, damping: 15 };
export const buttonSpring = {
  whileHover: { scale: 1.02, borderColor: 'var(--accent-premium)' },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring' as const, stiffness: 400, damping: 25 },
};

export const mapScrollScale = {
  initial: { scale: 0.96, opacity: 0.8 },
  whileInView: { scale: 1.0, opacity: 1 },
  viewport: { once: false, margin: '-100px' },
  transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
};

export const cssTransitionSpring = 'cubic-bezier(0.16, 1, 0.3, 1)';
