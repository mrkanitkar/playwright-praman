#!/usr/bin/env python3
"""Temporary script to write cjs-smoke.test.ts with correct escapes."""
import pathlib

content = r"""import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const testDir = dirname(fileURLToPath(import.meta.url));

describe('CJS compatibility smoke test', () => {
  it('should load the main entry point via require()', () => {
    const distPath = resolve(testDir, '..', '..', '..', 'dist', 'index.cjs');
    // eslint-disable-next-line sonarjs/os-command -- intentional: smoke test verifying CJS module loading
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
      // eslint-disable-next-line sonarjs/os-command -- intentional: smoke test verifying CJS sub-path loading
      const result = execSync(
        `node -e "require('${distPath.replaceAll('\\', '\\\\')}'); process.stdout.write('ok')"`,
        { encoding: 'utf-8' },
      );
      expect(result).toBe('ok');
    }
  });
});
"""

target = pathlib.Path(__file__).parent / "cjs-smoke.test.ts"
target.write_text(content.lstrip())
print(f"Wrote {target}")
