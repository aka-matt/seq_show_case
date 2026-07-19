import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'SequenceDiagram',
      formats: ['es', 'iife'],
      fileName: (format) => `sequence-diagram.${format}.js`,
    },
    rollupOptions: {
      // Ensure external deps are not bundled for ESM
      external: [],
      output: {
        globals: {},
        assetFileNames: 'sequence-diagram.[ext]',
        chunkFileNames: 'sequence-diagram-chunk.[hash].js',
      },
    },
    cssCodeSplit: false,
    minify: 'esbuild',
    sourcemap: true,
    target: 'es2022',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
});
