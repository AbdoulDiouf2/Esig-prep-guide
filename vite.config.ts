import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Esig-prep-guide',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    open: true,
    proxy: {
      '/api.emailjs.com': {
        target: 'https://api.emailjs.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\.emailjs\.com/, '')
      }
    }
  },
  define: {
    'process.env': {}
  },
});
