import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Le navigateur passe par /api en développement : Vite relaie vers l'API sans exposer de CORS.
const API_URL = process.env.LOKKY_API_URL ?? 'https://lokky.onrender.com';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    port: 5180,
    proxy: {
      '/api': { target: API_URL, rewrite: (path) => path.replace(/^\/api/, '') },
    },
  },
  test: { environment: 'jsdom' },
});
