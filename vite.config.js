import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';

export default defineConfig({
  plugins: [svelte()],
  publicDir: false, // Disable default public directory behavior
  build: {
    outDir: 'public',
    emptyOutDir: false, // Don't empty because index.html is there
    rollupOptions: {
      input: 'src/client/main.js',
      output: {
        entryFileNames: 'bundle.js',
        assetFileNames: '[name][extname]'
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve('./src/client')
    }
  }
});
