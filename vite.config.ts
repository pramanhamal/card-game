import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/card-game/',
  css: {
    postcss: './postcss.config.js'
  }
});