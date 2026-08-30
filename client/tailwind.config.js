/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#171717',
        accent: {
          500: '#ef4444', // Red-500
          600: '#dc2626', // Red-600
          900: '#7f1d1d', // Maroon
        }
      }
    },
  },
  plugins: [],
}
