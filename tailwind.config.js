/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(9 9 11)',
        surface: 'rgb(24 24 27)',
        border: 'rgb(39 39 42)',
        primary: 'rgb(228 228 231)',
        secondary: 'rgb(161 161 170)',
        accent: 'rgb(59 130 246)',
        danger: 'rgb(239 68 68)',
        success: 'rgb(16 185 129)',
      },
    },
  },
};
