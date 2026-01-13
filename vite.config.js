import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// Enable bundle analysis with: ANALYZE=true npm run build
const analyze = process.env.ANALYZE === 'true';

export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        // Disable hydration for smaller bundle (not using SSR)
        hydratable: false
      }
    }),
    // Bundle size analyzer - only enabled when ANALYZE=true
    analyze && visualizer({
      filename: 'stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true
    })
  ].filter(Boolean),
  publicDir: false, // Disable default public directory behavior
  build: {
    outDir: 'public',
    emptyOutDir: false, // Don't empty because index.html is there
    // Use terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_debugger: true,
        // Only drop console.log and console.info, keep console.error and console.warn for debugging
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    // Target modern browsers for smaller output (Chrome 80+, Firefox 80+, Safari 14+)
    target: 'es2020',
    // Enable CSS minification
    cssMinify: true,
    rollupOptions: {
      input: 'src/client/main.js',
      output: {
        entryFileNames: 'bundle.js',
        assetFileNames: '[name][extname]',
        // Optimize chunk naming for caching
        manualChunks: undefined
      },
      treeshake: true
    }
  },
  resolve: {
    alias: {
      '@': path.resolve('./src/client')
    }
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['sortablejs']
  }
});
