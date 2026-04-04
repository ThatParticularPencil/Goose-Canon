/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Surfaces — driven by CSS variables (auto light/dark) ──────────────
        ink: {
          DEFAULT: 'rgb(var(--ink-900) / <alpha-value>)',
          50:      'rgb(var(--ink-50)  / <alpha-value>)',
          100:     'rgb(var(--ink-100) / <alpha-value>)',
          900:     'rgb(var(--ink-900) / <alpha-value>)',
        },
        // ── Text — driven by CSS variables ────────────────────────────────────
        parchment: {
          DEFAULT: 'rgb(var(--parchment)       / <alpha-value>)',
          muted:   'rgb(var(--parchment-muted)  / <alpha-value>)',
          dim:     'rgb(var(--parchment-dim)    / <alpha-value>)',
        },
        // ── Accent — green highlight system ──────────────────────────────────
        gold: {
          DEFAULT: 'rgb(var(--gold)       / <alpha-value>)',
          light:   'rgb(var(--gold-light) / <alpha-value>)',
          dark:    'rgb(var(--gold-dark)  / <alpha-value>)',
          glow:    'rgba(34,197,94,0.15)',
        },
        amber: {
          story: '#d97706',
          glow:  'rgba(217,119,6,0.15)',
        },
        rose: {
          storii: '#db2777',
          glow:   'rgba(219,39,119,0.12)',
        },
        seal: {
          DEFAULT: '#15803d',
          light:   '#22c55e',
          glow:    'rgba(21,128,61,0.2)',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans:  ['Manrope', 'system-ui', 'sans-serif'],
        mono:  ['DM Mono', 'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-in-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'typewriter': 'typewriter 0.05s steps(1) forwards',
        'seal-stamp': 'sealStamp 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'vote-fill':  'voteFill 0.8s ease-out forwards',
        'shimmer':    'shimmer 2s linear infinite',
        'float':      'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.35)' },
          '50%':       { boxShadow: '0 0 0 8px rgba(34,197,94,0)' },
        },
        sealStamp: {
          '0%':   { transform: 'scale(0) rotate(-15deg)', opacity: '0' },
          '60%':  { transform: 'scale(1.15) rotate(3deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        voteFill: {
          '0%':   { width: '0%' },
          '100%': { width: 'var(--vote-width)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-8px)' },
        },
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E\")",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
