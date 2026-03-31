#!/usr/bin/env tsx
/**
 * Bundle browser-side UI5 selector engine with esbuild.
 *
 * @remarks
 * Produces a single self-contained IIFE bundle that Playwright can inject via
 * `selectors.register('ui5', { content: ... })` (content-based registration).
 *
 * Output:
 * - `dist/browser/ui5-engine.js` — unified engine (~400 KB minified)
 *
 * @see src/selectors/browser/ui5-engine.ts
 */

import * as esbuild from 'esbuild';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const outDir = resolve(rootDir, 'dist', 'browser');

// Ensure output directory exists
mkdirSync(outDir, { recursive: true });

async function main(): Promise<void> {
  const startTime = Date.now();

  // eslint-disable-next-line no-console -- build script, not library code
  console.log('Building browser bundle...');

  await esbuild.build({
    entryPoints: [resolve(rootDir, 'src/selectors/browser/ui5-engine.ts')],
    outfile: resolve(outDir, 'ui5-engine.js'),
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    sourcemap: false,
    logLevel: 'warning',
  });

  const elapsed = Date.now() - startTime;
  // eslint-disable-next-line no-console -- build script
  console.log(`  ✓ ui5-engine → dist/browser/ui5-engine.js (${elapsed}ms)`);
  // eslint-disable-next-line no-console -- build script
  console.log('Done.');
}

void main();
