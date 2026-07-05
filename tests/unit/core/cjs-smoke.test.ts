/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const testDir = dirname(fileURLToPath(import.meta.url));

describe('CJS compatibility smoke test', () => {
  it('should load the main entry point via require()', () => {
    const distPath = resolve(testDir, '..', '..', '..', 'dist', 'index.cjs');
    const result = execSync(
      `node -e "const m = require('${distPath.replaceAll('\\', '\\\\')}'); process.stdout.write(JSON.stringify(Object.keys(m)))"`,
      { encoding: 'utf-8' },
    );
    const exports = JSON.parse(result) as string[];
    expect(exports).toContain('VERSION');
  });

  it('should load sub-path entries via require()', () => {
    const subPaths = [
      'ai/index',
      'intents/index',
      'vocabulary/index',
      'fe/index',
      'reporters/index',
    ];

    for (const subPath of subPaths) {
      const distPath = resolve(testDir, '..', '..', '..', 'dist', `${subPath}.cjs`);
      const result = execSync(
        `node -e "require('${distPath.replaceAll('\\', '\\\\')}'); process.stdout.write('ok')"`,
        { encoding: 'utf-8' },
      );
      expect(result).toBe('ok');
    }
  });
});
