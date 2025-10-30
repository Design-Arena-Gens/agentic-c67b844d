/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        neon: {
          red: '#ff0033',
          pink: '#ff3355',
          dark: '#0a0a0a',
          glow: '#ff1a4d',
        },
      },
      fontFamily: {
        display: ['Poppins_600SemiBold', 'System'],
        regular: ['Poppins_400Regular', 'System'],
      },
      borderWidth: {
        neon: '1.5px',
      },
      dropShadow: {
        neon: [
          '0 0 6px rgba(255, 0, 51, 0.7)',
          '0 0 24px rgba(255, 0, 51, 0.35)',
        ],
      },
    },
  },
  plugins: [],
};
