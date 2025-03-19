/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'], // Escanea todos los archivos en src
  theme: {
    extend: {
      colors: {
        primary: '#1e40af', // Azul
        secondary: '#9333ea', // Morado
      },
    },
  },
  plugins: [],
};