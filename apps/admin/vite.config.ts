import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// L'admin appelle son API sur la même origine, sous /api : en local, Vite relaie vers
// l'API (port 3000) ; en production, Caddy fait de même (cookie de session SameSite=Strict).
const API_URL = process.env.LOKKY_API_URL ?? 'http://127.0.0.1:3000';

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
