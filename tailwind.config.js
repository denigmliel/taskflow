/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        sans: ['var(--font-sans)', 'system-ui'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        ink: {
          50:  '#f0f0ff',
          100: '#e4e4f7',
          200: '#cdcdf0',
          300: '#a9a9e0',
          400: '#8080cc',
          500: '#6060b8',
          600: '#4d4da3',
          700: '#3e3e8a',
          800: '#353572',
          900: '#2e2e5e',
          950: '#1a1a3e',
        },
        surface: '#0d0d14',
        panel:   '#12121c',
        card:    '#17172a',
        raised:  '#1e1e32',
        border:  'rgba(255,255,255,0.07)',
      },
      animation: {
        'in':     'animIn 0.25s ease-out',
        'in-up':  'animInUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        animIn:    { from: { opacity: '0' },                        to: { opacity: '1' } },
        animInUp:  { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer:   { from: { backgroundPosition: '-200% 0' },       to: { backgroundPosition: '200% 0' } },
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(99,102,241,0.15)',
        'glow':    '0 0 30px rgba(99,102,241,0.2)',
        'glow-lg': '0 0 60px rgba(99,102,241,0.25)',
      },
    },
  },
  plugins: [],
}
