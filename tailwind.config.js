/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '.dark-theme'],
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
