/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Verify that no dist/ runtime file contains a `#`-specifier import.
 *
 * @remarks
 * TypeScript path aliases like `#core/*` are compile-time only. If tsup fails
 * to rewrite them the published package will throw `ERR_PACKAGE_IMPORT_NOT_DEFINED`
 * at runtime for every consumer. This script scans the compiled output and fails
 * the build if any such specifier leaks through.
 *
 * Excluded: `.d.ts` / `.d.cts` declaration files (type-only, never executed).
 *
 * Run: `npm run check:dist-imports`
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST_DIR = 'dist';
/**
 * Matches a `#`-specifier in an import/require/dynamic-import expression.
 * The leading character group avoids false positives mid-identifier.
 */
const HASH_IMPORT_RE =
  /(?:^|[\s;,({])(?:from\s+['"]|import\s*\(?\s*['"]|require\s*\(\s*['"])#\w+\//;
/**
 * Lines that are part of a JSDoc/TSDoc comment block.
 * Pattern: optional whitespace + `*` (not `**`), i.e. ` * some text`.
 * These appear in bundled output when tsup preserves JSDoc comments for types.
 */
const COMMENT_LINE_RE = /^\s+\*/;
const RUNTIME_EXTENSIONS = new Set(['.js', '.cjs', '.mjs']);

let found = 0;

function scanDir(dir: string): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      scanDir(full);
      continue;
    }
    const ext = extname(full);
    if (!RUNTIME_EXTENSIONS.has(ext)) continue;

    const content = readFileSync(full, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      if (!COMMENT_LINE_RE.test(line) && HASH_IMPORT_RE.test(line)) {
        console.error(`❌ ${full}:${i + 1}: runtime #-specifier found: ${line.trim()}`);
        found++;
      }
    }
  }
}

scanDir(DIST_DIR);

if (found > 0) {
  console.error(
    `\n${found} runtime #-specifier import(s) found in dist/. These will fail for consumers.`,
  );
  process.exit(1);
} else {
  console.log('✅ No runtime #-specifier imports found in dist/');
}
