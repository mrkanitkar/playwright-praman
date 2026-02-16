import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('CJS compatibility smoke test', () => {
  it('should load the main entry point via require()', () => {
    const distPath = resolve(import.meta.dirname, '..', '..', '..', 'dist', 'index.cjs');
    const result = execSync(
      `node -e "const m = require('${distPath.replace(/\\/g, '\\\\')}'); process.stdout.write(JSON.stringify(Object.keys(m)))"`,
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
      const distPath = resolve(import.meta.dirname, '..', '..', '..', 'dist', `${subPath}.cjs`);
      const result = execSync(
        `node -e "require('${distPath.replace(/\\/g, '\\\\')}'); process.stdout.write('ok')"`,
        { encoding: 'utf-8' },
      );
      expect(result).toBe('ok');
    }
  });
});
