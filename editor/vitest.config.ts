import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    include: ['test/**/*.test.tsx', 'test/**/*.test.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    passWithNoTests: true,
    css: true,
    clearMocks: true
  }
});
