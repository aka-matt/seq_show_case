import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

/**
 * Serve project-root folders as static paths during `npm run dev`, so the demo
 * page works at /examples/example.html and can load /dist/sequence-diagram.iife.js
 * the same way as `python3 -m http.server` from the repo root.
 */
function serveStaticDirs(dirs: Record<string, string>): Plugin {
  return {
    name: 'serve-static-dirs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        for (const [prefix, dir] of Object.entries(dirs)) {
          if (url === prefix || url.startsWith(prefix + '/')) {
            const rel = url === prefix ? '' : url.slice(prefix.length + 1);
            const filePath = path.join(dir, decodeURIComponent(rel || 'index.html'));
            const resolved = path.resolve(filePath);
            // Prevent path traversal outside the static dir.
            if (!resolved.startsWith(path.resolve(dir) + path.sep) && resolved !== path.resolve(dir)) {
              res.statusCode = 403;
              res.end('Forbidden');
              return;
            }
            if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
              const ext = path.extname(resolved).toLowerCase();
              const types: Record<string, string> = {
                '.html': 'text/html; charset=utf-8',
                '.js': 'application/javascript; charset=utf-8',
                '.mjs': 'application/javascript; charset=utf-8',
                '.map': 'application/json; charset=utf-8',
                '.json': 'application/json; charset=utf-8',
                '.css': 'text/css; charset=utf-8',
                '.svg': 'image/svg+xml',
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.woff': 'font/woff',
                '.woff2': 'font/woff2',
              };
              res.setHeader('Content-Type', types[ext] ?? 'application/octet-stream');
              fs.createReadStream(resolved).pipe(res);
              return;
            }
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  // Library IIFE is loaded as a plain <script> in static HTML — there is no
  // Node `process`. Without this, React's `process.env.NODE_ENV` checks throw
  // ReferenceError and the custom element never registers (blank diagrams).
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
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
    serveStaticDirs({
      '/examples': resolve(__dirname, 'examples'),
      '/dist': resolve(__dirname, 'dist'),
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
    // Demo page: examples/example.html → /examples/example.html
    open: '/examples/example.html',
  },
});
