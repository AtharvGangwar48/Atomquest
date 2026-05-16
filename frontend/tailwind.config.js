/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          primary: '#0a0f1e',
          secondary: '#0d1526',
          card: 'rgba(255,255,255,0.04)',
        },
        accent: {
          purple: '#6366f1',
          cyan: '#06b6d4',
          pink: '#ec4899',
          emerald: '#10b981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  theme: {
    extend: {},
  },
  plugins: [],
}

