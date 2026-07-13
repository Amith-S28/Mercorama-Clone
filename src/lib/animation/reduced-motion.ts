export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function motionSafe<T extends Record<string, unknown>>(
  full: T,
  reduced: Partial<T>
): T {
  if (prefersReducedMotion()) {
    return { ...full, ...reduced };
  }
  return full;
}
