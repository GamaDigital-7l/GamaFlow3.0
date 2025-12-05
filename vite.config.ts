import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Garante que o caminho base para o build seja a raiz
  base: '/', 
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'import.meta.env.VITE_NEXTCLOUD_UPLOAD_URL': JSON.stringify(process.env.VITE_NEXTCLOUD_UPLOAD_URL),
  },
});