import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    // Base de test partagée : les fichiers s'exécutent l'un après l'autre.
    fileParallelism: false,
    globalSetup: ['./test/globalSetup.ts'],
    testTimeout: 15_000,
  },
});
