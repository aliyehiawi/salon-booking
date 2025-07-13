// tailwind.config.js
const defaultTheme = require('tailwindcss/defaultTheme')
const colors       = require('tailwindcss/colors')

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // globally default all borders/divides to gray.200
      borderColor: {
        DEFAULT: colors.gray[200],
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'serif'],
        body:    ['var(--font-body)',    'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#faf6f2',
          100: '#f4ece0',
          200: '#e8d8c1',
          300: '#d9be9a',
          400: '#c89e73',
          500: '#bd8758',
          600: '#af724d',
          700: '#925c41',
          800: '#764b39',
          900: '#603f32',
        },
        secondary: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
        },
      },
    },
  },
  plugins: [],
}
