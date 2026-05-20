import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  envPrefix: 'NEXT_PUBLIC_',

  plugins: [
    react(),
    tsconfigPaths(),
  ],

  resolve: {
    alias: {
      lodash: 'lodash-es',
      '@': path.resolve(__dirname, './src'),
    },

    dedupe: ['react', 'react-dom'],
  },

  server: {
    host: '0.0.0.0',
    port: 4000,
  },

  clearScreen: false,
});
