/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff8f3',
          100: '#feedde',
          200: '#fdd9bd',
          300: '#fbb38a',
          400: '#f6864d',
          500: '#e05a1b',
          600: '#c8480f', // Heritage Terracotta & Saffron
          700: '#a4360a',
          800: '#7a2708',
          900: '#4d1804',
        },
        leaf: {
          50: '#f2fbf4',
          100: '#e1f7e6',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#0e3a1f',
        },
        cream: {
          50: '#fdfbf7',
          100: '#faf7f2',
          200: '#f4ede2',
          300: '#e8ddce',
        },
        ink: {
          DEFAULT: '#181412',
          soft: '#26201c',
          muted: '#615750',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(24, 20, 18, 0.05), 0 2px 6px -1px rgba(24, 20, 18, 0.03)',
        doppel: '0 20px 40px -15px rgba(24, 20, 18, 0.08)',
        pop: '0 12px 28px -6px rgba(200, 72, 15, 0.3)',
        glow: '0 0 25px -4px rgba(200, 72, 15, 0.25)',
      },
      transitionTimingFunction: {
        fluid: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.6' },
        },
      },
      animation: {
        'fade-up': 'fade-up .6s cubic-bezier(0.32, 0.72, 0, 1) both',
        'fade-in': 'fade-in .5s ease both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
