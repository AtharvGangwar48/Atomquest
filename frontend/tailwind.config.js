/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#4f46e5',
          light: '#eef2ff',
          hover: '#4338ca',
        },
        surface: '#ffffff',
        border: '#e2e8f0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
