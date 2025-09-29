/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      minHeight: {
        'svh': '100svh',
      },
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
      },
      borderRadius: {
        'lg': '0.5rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      animation: {
        'enter': 'enter 200ms ease-out',
        'leave': 'leave 150ms ease-in forwards',
      },
      keyframes: {
        enter: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        leave: {
          '0%': { transform: 'scale(1)', opacity: 1 },
          '100%': { transform: 'scale(0.9)', opacity: 0 },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      screens: {
        'pointer-fine': { 'raw': '(pointer: fine)' },
      },
    },
  },
  plugins: [
    function({ addUtilities, addVariant }) {
      addUtilities({
        '.size-6': {
          width: '1.5rem',
          height: '1.5rem',
        },
        '.size-5': {
          width: '1.25rem',
          height: '1.25rem',
        },
        '.size-4': {
          width: '1rem',
          height: '1rem',
        },
        '.size-7': {
          width: '1.75rem',
          height: '1.75rem',
        },
      })
      addVariant('data-closed', '&[data-state="closed"]')
      addVariant('data-open', '&[data-state="open"]')
      addVariant('data-active', '&[data-active="true"]')
      addVariant('data-current', '&[data-current="true"]')
      addVariant('data-hover', '&[data-hover="true"]')
      addVariant('data-slot', '&[data-slot]')
      addVariant('data-enter', '&[data-enter]')
      addVariant('data-leave', '&[data-leave]')
    }
  ],
}