/**
 * Prevent JavaScript files from existing in src/.
 *
 * @remarks
 * This is a strict TypeScript project — only `.ts` files are allowed in `src/`.
 * Cross-platform replacement for `check-no-js-in-src.sh`.
 * Works on Windows, macOS, and Linux without bash dependency.
 */

import { readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const JS_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs']);
const SRC_DIR = join(process.cwd(), 'src');

function findJsFiles(dir: string): string[] {
  const results: string[] = [];

  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath, { throwIfNoEntry: false });

    if (!stat) continue;

    if (stat.isDirectory()) {
      results.push(...findJsFiles(fullPath));
    } else if (JS_EXTENSIONS.has(extname(entry))) {
      // Return relative path from project root for readable output
      results.push(fullPath.replace(process.cwd() + '/', '').replace(process.cwd() + '\\', ''));
    }
  }

  return results;
}

const jsFiles = findJsFiles(SRC_DIR);

if (jsFiles.length > 0) {
  console.error('');
  console.error('❌ ERROR: JavaScript files are not allowed in src/');
  console.error('');
  console.error('This is a strict TypeScript project. The following files were rejected:');
  console.error('');
  for (const file of jsFiles) {
    console.error(`  - ${file}`);
  }
  console.error('');
  console.error('💡 Solutions:');
  console.error('  • Convert these files to TypeScript (.ts)');
  console.error('  • If these are config files, move them to the project root');
  console.error('  • Configuration files like eslint.config.mjs belong in the root, not src/');
  console.error('');
  process.exit(1);
}

console.log('✓ No JavaScript files in src/');
process.exit(0);
