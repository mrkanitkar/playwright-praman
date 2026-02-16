import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('ESM compatibility smoke test', () => {
  it('should load the main entry point via import()', () => {
    const distPath = resolve(import.meta.dirname, '..', '..', '..', 'dist', 'index.js');
    const fileUrl = `file://${distPath.replace(/\\/g, '/')}`;
    const result = execSync(
      `node --input-type=module -e "import('${fileUrl}').then(m => process.stdout.write(JSON.stringify(Object.keys(m))))"`,
      { encoding: 'utf-8' },
    );
    const exports = JSON.parse(result) as string[];
    expect(exports).toContain('VERSION');
  });

  it('should load sub-path entries via import()', () => {
    const subPaths = [
      'ai/index',
      'intents/index',
      'vocabulary/index',
      'fe/index',
      'reporters/index',
    ];

    for (const subPath of subPaths) {
      const distPath = resolve(import.meta.dirname, '..', '..', '..', 'dist', `${subPath}.js`);
      const fileUrl = `file://${distPath.replace(/\\/g, '/')}`;
      const result = execSync(
        `node --input-type=module -e "import('${fileUrl}').then(() => process.stdout.write('ok'))"`,
        { encoding: 'utf-8' },
      );
      expect(result).toBe('ok');
    }
  });
});
