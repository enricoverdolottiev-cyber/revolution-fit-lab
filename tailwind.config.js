/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': '#18181B',        // Zinc-900 - Sfondo principale 'Asfalto scuro'
        'brand-surface': '#27272A',   // Zinc-800 - Sfondo card/sezioni secondarie
        'brand-red': '#EF4444',       // Red-500 - Rosso energico/Neon per accenti
        'brand-text': '#FAFAFA',      // Zinc-50 - Testo principale bianco ghiaccio
        'brand-grey': '#52525B',      // Zinc-600 - Dettagli metallici
        // Manteniamo i vecchi per compatibilità (deprecated)
        'brand-dark': '#374151',
        'brand-light': '#F3F4F6',
        'brand-white': '#FFFFFF',
      },
      fontFamily: {
        'barlow': ['Barlow', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
