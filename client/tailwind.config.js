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
          DEFAULT: '#328bad',
          50: '#ecf6fb',
          100: '#d9eef7',
          200: '#b3ddef',
          300: '#8dcce7',
          400: '#67bbdf',
          500: '#328bad',
          600: '#2a738a',
          700: '#225b67',
          800: '#1a4344',
          900: '#122b21',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
