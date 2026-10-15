import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1F4E4A',
          50: '#F2F7F6',
          100: '#E2EFEB',
          200: '#C4DFD7',
          300: '#97C5B8',
          400: '#609F90',
          500: '#3B8173',
          600: '#2E675C',
          700: '#1F4E4A',
          800: '#1B403D',
          900: '#183634',
        },
        cta: {
          DEFAULT: '#9A5B2E',
          hover: '#804820',
          active: '#6B3B18',
          subtle: '#FBF5F0',
        },
        focusRing: '#D97706',
        neutral: {
          cream: '#FAF7F2',
          paper: '#F4EFEA',
          card: '#FFFFFF',
          border: '#E3DCD4',
          text: '#262320',
          muted: '#6E6862',
        },
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
      },
      boxShadow: {
        card: '0 4px 20px -2px rgba(31, 78, 74, 0.06), 0 2px 6px -1px rgba(31, 78, 74, 0.04)',
        modal: '0 20px 40px -8px rgba(24, 54, 52, 0.25)',
      },
    },
  },
  plugins: [],
} satisfies Config;
