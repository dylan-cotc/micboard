/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#96C8C1',
          50: '#f0f9f8',
          100: '#e1f3f1',
          200: '#c3e7e3',
          300: '#a5dbd5',
          400: '#87cfc7',
          500: '#96C8C1',
          600: '#76b3ac',
          700: '#5a9e97',
          800: '#4a8a83',
          900: '#3a756f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
