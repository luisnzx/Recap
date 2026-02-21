/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        comic: {
          yellow:    '#FFDE03',
          orange:    '#FF5722',
          red:       '#E8003D',
          purple:    '#7B2FBE',
          darkPurple:'#3A0068',
          blue:      '#0057FF',
          green:     '#00C853',
          black:     '#0D0D0D',
          white:     '#FAFAFA',
          cream:     '#FFF9E6',
          panel:     '#5C1EA8',
        },
      },
      boxShadow: {
        'brutal':    '6px 6px 0px 0px #0D0D0D',
        'brutal-sm': '4px 4px 0px 0px #0D0D0D',
        'brutal-lg': '10px 10px 0px 0px #0D0D0D',
        'brutal-yellow': '6px 6px 0px 0px #FFDE03',
        'brutal-orange': '6px 6px 0px 0px #FF5722',
        'brutal-red':    '6px 6px 0px 0px #E8003D',
      },
      fontFamily: {
        comic: ['Impact', 'Arial Black', 'sans-serif'],
        body:  ['Arial', 'Helvetica', 'sans-serif'],
      },
      backgroundImage: {
        'art-gradient': 'linear-gradient(135deg, #2D1B4E 0%, #4A3370 50%, #3E2C5F 100%)',
        'art-radial': 'radial-gradient(circle at 50% 50%, #6B4C9A 0%, #2D1B4E 100%)',
      },
      animation: {
        'slide-in':   'slide-in 0.4s ease-out',
        'fade-in':    'fade-in 0.4s ease-out',
        'wiggle':     'wiggle 0.4s ease-in-out',
        'pop':        'pop 0.3s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'pulse-comic':'pulse-comic 1s steps(2, end) infinite',
      },
      keyframes: {
        'slide-in': {
          '0%':   { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',      opacity: '1' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%':      { transform: 'rotate(2deg)' },
        },
        'pop': {
          '0%':   { transform: 'scale(1)' },
          '50%':  { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        'pulse-comic': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
