import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 3000,
    strictPort: false // 如果3000被占用，自动选择下一个可用端口
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
