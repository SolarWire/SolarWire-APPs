import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync } from 'fs';

const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    port: 3000,
    strictPort: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app')
    }
  },
  build: {
    outDir: './dist/app',
    emptyOutDir: true
  }
});
