/**
 * Copy the demo page + JSON fixtures into dist/examples/ so that
 * baseurl/examples/example.html works for:
 *   - npm run dev            → Vite serves examples/ at /examples/ (+ /dist/)
 *   - python3 -m http.server → from project root
 *   - npm run serve:dist     → http.server --directory dist
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'examples');
const destDir = path.join(root, 'dist', 'examples');

if (!fs.existsSync(srcDir)) {
  console.error('copy-examples: missing source dir', srcDir);
  process.exit(1);
}

fs.mkdirSync(destDir, { recursive: true });

for (const name of fs.readdirSync(srcDir)) {
  const from = path.join(srcDir, name);
  const to = path.join(destDir, name);
  fs.cpSync(from, to, { recursive: true });
}

// Convenience redirect at dist/example.html → examples/example.html
const redirect = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0; url=./examples/example.html" />
  <title>Redirecting…</title>
  <script>location.replace('./examples/example.html');</script>
</head>
<body>
  <p>Moved to <a href="./examples/example.html">/examples/example.html</a>.</p>
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'dist', 'example.html'), redirect);

console.log('Copied examples/ → dist/examples/ (page + fixtures)');
console.log('  → open /examples/example.html');
