import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          muted: 'rgba(37, 99, 235, 0.12)',
        },
        obsidian: '#0A0A0A',
        paper: '#FAFAFA',
        'paper-white': '#FFFFFF',
        border: {
          dark: '#1F1F1F',
          light: '#E5E5E5',
        },
        status: {
          healthy: '#22C55E',
          degraded: '#F59E0B',
          down: '#EF4444',
          unconfigured: '#6B7280',
          unknown: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
