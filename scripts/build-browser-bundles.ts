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
import { writeFile } from 'node:fs/promises';
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
  console.log('Building browser bundles...');

  // 1. UI5 selector engine (CJS IIFE for selectors.register)
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

  const engineElapsed = Date.now() - startTime;
  // eslint-disable-next-line no-console -- build script
  console.log(`  ✓ ui5-engine → dist/browser/ui5-engine.js (${engineElapsed}ms)`);

  // 2. Praman bridge init script (IIFE for Playwright CLI initScript)
  const bridgeStart = Date.now();

  await esbuild.build({
    entryPoints: [resolve(rootDir, 'src/bridge/browser-scripts/praman-bridge-init.ts')],
    outfile: resolve(outDir, 'praman-bridge-init.js'),
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    sourcemap: false,
    logLevel: 'warning',
  });

  const bridgeElapsed = Date.now() - bridgeStart;
  // eslint-disable-next-line no-console -- build script
  console.log(`  ✓ praman-bridge-init → dist/browser/praman-bridge-init.js (${bridgeElapsed}ms)`);

  // 3. Pre-built run-code scripts (plain text function exports)
  const scriptsStart = Date.now();
  const scriptsOutDir = resolve(rootDir, 'dist', 'scripts');
  mkdirSync(scriptsOutDir, { recursive: true });

  const scriptModules = await import('../src/scripts/index.js');
  const scriptEntries: Record<string, string> = {
    'discover-all.js': scriptModules.DISCOVER_ALL_SCRIPT,
    'wait-for-ui5.js': scriptModules.WAIT_FOR_UI5_SCRIPT,
    'bridge-status.js': scriptModules.BRIDGE_STATUS_SCRIPT,
    'dialog-controls.js': scriptModules.DIALOG_CONTROLS_SCRIPT,
  };

  for (const [filename, content] of Object.entries(scriptEntries)) {
    if (/["`$]/.test(content)) {
      throw new Error(`Shell-unsafe character found in ${filename}. Pre-built scripts must not contain " \` or $.`);
    }
    await writeFile(resolve(scriptsOutDir, filename), content, 'utf8');
  }

  const scriptsElapsed = Date.now() - scriptsStart;
  // eslint-disable-next-line no-console -- build script
  console.log(`  ✓ pre-built scripts → dist/scripts/ (${scriptsElapsed}ms)`);

  // eslint-disable-next-line no-console -- build script
  console.log('Done.');
}

void main();
