import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Generate the bundled type declarations declared in package.json `types`.
    dts({
      entryRoot: 'src',
      // Roll up into a single index.d.ts so consumers can resolve types from
      // the package root without having to follow nested paths.
      rollupTypes: true,
      insertTypesEntry: true,
    }),
  ],
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
