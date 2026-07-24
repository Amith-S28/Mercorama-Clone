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
        background: 'var(--bg-primary)',
        foreground: 'var(--text-primary)',
        border: {
          DEFAULT: 'var(--border)',
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
        grey: {
          100: 'var(--grey-100)',
          200: 'var(--grey-200)',
          300: 'var(--grey-300)',
          400: 'var(--grey-400)',
          500: 'var(--grey-500)',
        },
        'theme-bg': 'var(--theme-bg)',
        'theme-fg': 'var(--theme-fg)',
        'theme-contrast': 'var(--theme-contrast)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
        questrial: ['var(--font-questrial-loaded)', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tightest: '-0.06em',
        'display': '-12.24px',
        'h1': '-5.28px',
        'h2': '-1.6px',
        'body': '-0.32px',
        'label': '0.4px',
      },
      lineHeight: {
        'display': '90%',
        'heading': '100%',
        'sub': '112%',
        'body': '140%',
      },
      borderRadius: {
        DEFAULT: '0',
        sm: '0',
        md: '0',
        lg: '0',
        xl: '0',
        '2xl': '0',
        '3xl': '0',
        full: '0',
      },
      spacing: {
        'spacer-4': 'var(--spacer-4)',
        'spacer-8': 'var(--spacer-8)',
        'spacer-12': 'var(--spacer-12)',
        'spacer-16': 'var(--spacer-16)',
        'spacer-24': 'var(--spacer-24)',
        'spacer-32': 'var(--spacer-32)',
        'spacer-48': 'var(--spacer-48)',
      },
    },
  },
  plugins: [],
};

export default config;
