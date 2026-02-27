/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * P22: Verify `as unknown as T` has been removed from all source files.
 *
 * @remarks
 * Scans the `src/` directory to ensure no `as unknown as` double-assertion
 * patterns remain after refactoring. Each location should use either
 * `(window as any)` with eslint-disable comment (browser context),
 * a structural adapter (Node context), or a single `as` assertion.
 *
 * @module batch-c
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Recursively collects all `.ts` files under a directory.
 */
function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- test utility: dir is built from __dirname + literal segments
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- test utility: path is built from trusted components
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...collectTsFiles(fullPath));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('P22: as unknown as T refactoring', () => {
  it('no source files in src/ contain "as unknown as" double assertion', () => {
    // Resolve src/ relative to project root (3 levels up from this test file)
    const srcDir = join(__dirname, '..', '..', '..', 'src');
    const tsFiles = collectTsFiles(srcDir);

    const violations: string[] = [];
    for (const filePath of tsFiles) {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- test utility: filePath is collected from trusted src/ directory
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? '';
        if (line.includes('as unknown as')) {
          violations.push(`${filePath}:${String(i + 1)}: ${line.trim()}`);
        }
      }
    }

    expect(
      violations,
      `Found ${String(violations.length)} "as unknown as" patterns:\n${violations.join('\n')}`,
    ).toEqual([]);
  });
});
