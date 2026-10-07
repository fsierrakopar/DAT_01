import { defineConfig } from 'vitest/config';

// Pruebas en entorno Node (sin navegador), solo dentro de tests/ (spec 001, sección 9).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
