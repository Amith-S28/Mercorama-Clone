import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
        },
        obsidian: 'var(--obsidian)',
        paper: 'var(--paper)',
        'paper-white': 'var(--paper-white)',
        border: {
          dark: 'var(--border-dark)',
          light: 'var(--border-light)',
        },
        status: {
          healthy: 'var(--status-healthy)',
          degraded: 'var(--status-degraded)',
          down: 'var(--status-down)',
          unconfigured: 'var(--status-unconfigured)',
          unknown: 'var(--status-unknown)',
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
