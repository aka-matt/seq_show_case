/**
 * verify-dist.mjs — Dist smoke tests
 *
 * Runs after `npm run build` to verify the dist output is correct.
 *
 * Checks:
 *   1. All required files exist
 *   2. No external CSS URL references in bundles
 *   3. IIFE contains custom element registration
 *   4. No `eval` in bundles
 *   5. Schema file matches source
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '..', 'dist');
const SOURCE_SCHEMA = path.resolve(__dirname, '..', 'schemas', 'sequence-diagram.schema.json');

const REQUIRED_FILES = [
  'sequence-diagram.es.js',
  'sequence-diagram.iife.js',
  'sequence-diagram.es.js.map',
  'sequence-diagram.iife.js.map',
  'index.d.ts',
  'sequence-diagram.schema.json',
];

// Matches CSS url() function calls with external http/https URLs.
// Does NOT match JavaScript URL() constructors like `new URL("http://...")`
// which React uses for error-decoding. We require 'url(' prefix (lowercase)
// followed by optional whitespace, then a quote or opening paren before the scheme.
const CSS_URL_RE = /url\(\s*['"]?\s*https?:\/\//g;
const EVAL_RE = /\beval\s*\(/g;
const CUSTOM_ELEMENT_RE = /customElements\.define\s*\(\s*['"]sequence-diagram['"]/;

let passed = 0;
let failed = 0;

function log(status, msg) {
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '  ';
  console.log(`${icon} ${msg}`);
}

function checkFile(name) {
  const filePath = path.join(DIST, name);
  if (!fs.existsSync(filePath)) {
    log('FAIL', `Missing required file: ${name}`);
    failed++;
    return null;
  }
  log('PASS', `File exists: ${name}`);
  passed++;
  return filePath;
}

function checkNoExternalCss(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const matches = content.match(CSS_URL_RE);
  if (matches) {
    log('FAIL', `${path.basename(filePath)}: contains external CSS URL: ${matches[0]}`);
    failed++;
    return;
  }
  log('PASS', `${path.basename(filePath)}: no external CSS URLs`);
  passed++;
}

function checkNoEval(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const matches = content.match(EVAL_RE);
  if (matches) {
    log('FAIL', `${path.basename(filePath)}: contains eval(): ${matches.length} occurrence(s)`);
    failed++;
    return;
  }
  log('PASS', `${path.basename(filePath)}: no eval()`);
  passed++;
}

function checkIIFEDefinition(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (!CUSTOM_ELEMENT_RE.test(content)) {
    log('FAIL', `${path.basename(filePath)}: missing customElements.define('sequence-diagram', ...)`);
    failed++;
    return;
  }
  log('PASS', `${path.basename(filePath)}: contains custom element registration`);
  passed++;
}

/**
 * The IIFE is loaded as a plain browser <script>. Any leftover
 * `process.env.NODE_ENV` (or other process.*) references throw
 * ReferenceError and prevent the custom element from registering —
 * which shows up as blank diagram areas on example.html.
 */
function checkNoProcessEnv(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const matches = content.match(/\bprocess\.env\b/g);
  if (matches) {
    log(
      'FAIL',
      `${path.basename(filePath)}: contains process.env (${matches.length}×) — ` +
        'will throw in browsers and leave diagrams blank. Set vite define.NODE_ENV.'
    );
    failed++;
    return;
  }
  log('PASS', `${path.basename(filePath)}: no process.env references`);
  passed++;
}

function checkExamplesPage() {
  const page = path.join(DIST, 'examples', 'example.html');
  if (!fs.existsSync(page)) {
    log('FAIL', 'Missing dist/examples/example.html');
    failed++;
    return;
  }
  log('PASS', 'File exists: examples/example.html');
  passed++;
  const fixtures = ['basic.json', 'checkout-alt.json', 'nested-fragments.json', 'parallel-services.json', 'polling-loop.json'];
  for (const f of fixtures) {
    const p = path.join(DIST, 'examples', f);
    if (!fs.existsSync(p)) {
      log('FAIL', `Missing dist/examples/${f}`);
      failed++;
    } else {
      log('PASS', `File exists: examples/${f}`);
      passed++;
    }
  }
}

function checkSchemaMatch() {
  if (!fs.existsSync(SOURCE_SCHEMA)) {
    log('FAIL', `Source schema not found: ${SOURCE_SCHEMA}`);
    failed++;
    return;
  }
  const sourceSchema = fs.readFileSync(SOURCE_SCHEMA, 'utf-8');
  const distSchema = path.join(DIST, 'sequence-diagram.schema.json');
  if (!fs.existsSync(distSchema)) {
    log('FAIL', `Dist schema not found: ${distSchema}`);
    failed++;
    return;
  }
  const distSchemaContent = fs.readFileSync(distSchema, 'utf-8');
  if (sourceSchema !== distSchemaContent) {
    log('FAIL', `Schema mismatch: dist schema does not match source schema`);
    failed++;
    return;
  }
  log('PASS', `Schema: dist matches source`);
  passed++;
}

function checkFileSize(filePath) {
  const stats = fs.statSync(filePath);
  const sizeKB = (stats.size / 1024).toFixed(1);
  log('INFO', `${path.basename(filePath)}: ${sizeKB} KB`);
}

console.log('========================================');
console.log('  verify-dist — dist smoke tests');
console.log('========================================\n');

console.log('[1] Checking required files...\n');
for (const file of REQUIRED_FILES) {
  checkFile(file);
}

console.log('\n[2] Checking IIFE bundle...\n');
const iifePath = path.join(DIST, 'sequence-diagram.iife.js');
if (fs.existsSync(iifePath)) {
  checkIIFEDefinition(iifePath);
  checkNoProcessEnv(iifePath);
  checkNoEval(iifePath);
  checkNoExternalCss(iifePath);
  checkFileSize(iifePath);
}

console.log('\n[3] Checking ESM bundle...\n');
const esmPath = path.join(DIST, 'sequence-diagram.es.js');
if (fs.existsSync(esmPath)) {
  checkNoProcessEnv(esmPath);
  checkNoEval(esmPath);
  checkNoExternalCss(esmPath);
  checkFileSize(esmPath);
}

console.log('\n[4] Checking schema...\n');
checkSchemaMatch();

console.log('\n[5] Checking examples page...\n');
checkExamplesPage();

console.log('\n========================================');
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  console.error(`ERROR: ${failed} check(s) failed.`);
  process.exit(1);
} else {
  console.log('All checks passed!\n');
  process.exit(0);
}
