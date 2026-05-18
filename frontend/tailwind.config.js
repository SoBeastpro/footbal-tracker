/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1e40af',
        primaryHover: '#1d4ed8',
        secondary: '#64748b',
        success: '#22c55e',
        danger: '#ef4444',
        background: '#f8fafc',
      }
    },
  },
  plugins: [],
}