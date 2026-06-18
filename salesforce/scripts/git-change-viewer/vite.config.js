import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server on :5173; all /api calls are proxied to the Express backend on :3001.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
