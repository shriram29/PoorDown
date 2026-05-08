/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        board: {
          green: '#2D6A4F',
          cream: '#F8F4E8',
          red: '#E63946',
          blue: '#1D3557',
          gold: '#F4A261',
          dark: '#2B2D42',
          jail: '#E76F51',
          rail: '#8D99AE',
        },
        property: {
          brown: '#8B4513',
          lightblue: '#87CEEB',
          pink: '#FF69B4',
          orange: '#FF8C00',
          red: '#E63946',
          yellow: '#FFD700',
          green: '#228B22',
          darkblue: '#1D3557',
        },
        player: {
          cannonball: '#2B2D42',
          car: '#E63946',
          dog: '#87CEEB',
          hat: '#8B4513',
          iron: '#8D99AE',
          thimble: '#F4A261',
          wheelbarrow: '#228B22',
          racingcar: '#1D3557',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}