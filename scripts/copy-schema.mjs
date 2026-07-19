/**
 * copy-schema.mjs — Copy schema to dist
 *
 * Runs as part of the build process (called from package.json postbuild hook
 * or manually) to copy the JSON schema to dist/.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCE_SCHEMA = path.join(ROOT, 'schemas', 'sequence-diagram.schema.json');
const DIST_SCHEMA = path.join(ROOT, 'dist', 'sequence-diagram.schema.json');

if (!fs.existsSync(SOURCE_SCHEMA)) {
  console.error('ERROR: Source schema not found:', SOURCE_SCHEMA);
  process.exit(1);
}

fs.mkdirSync(path.dirname(DIST_SCHEMA), { recursive: true });
fs.copyFileSync(SOURCE_SCHEMA, DIST_SCHEMA);
console.log('Copied schema to dist:', DIST_SCHEMA);
