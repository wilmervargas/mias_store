import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 👈 Plugin oficial de Tailwind CSS v4
  ],
  css: {
    postcss: {}, // 👈 Blindaje: aísla PostCSS para que no herede la versión vieja de la carpeta superior
  },
})
