import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Wajib agar bisa diakses dari luar container Docker
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true, // Wajib agar perubahan file di host terbaca realtime oleh Docker
    },
  },
});