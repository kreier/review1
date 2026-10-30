import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/review1/' : '/'),
  build: {
    outDir: 'dist',
  },
});
