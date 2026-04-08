/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import { describe, it, expect } from 'vitest';

import { check4ImportPaths } from '../../../scripts/docs-verify/checks/check4-import-paths.js';
import type {
  DocUnderTest,
  SharedContext,
  ApiSymbol,
} from '../../../scripts/docs-verify/lib/types.js';

function makeDoc(content: string, overrides?: Partial<DocUnderTest>): DocUnderTest {
  return {
    filePath: 'docs/docs/guides/test.md',
    shortName: 'guides/test.md',
    content,
    frontmatter: {},
    mappedSourceFiles: [],
    ...overrides,
  };
}

function makeContext(apiEntries?: [string, ApiSymbol][]): SharedContext {
  const apiSurface = new Map<string, ApiSymbol>(apiEntries ?? []);

  return {
    apiSurface,
    configDefaults: new Map(),
    claimTestResults: new Map(),
    testIndex: { files: new Map() },
    exampleTestMap: [],
    vitestResults: new Map(),
    ui5ApiCache: new Map(),
    changedFiles: [],
  };
}

describe('check4-import-paths', () => {
  it('has the correct check name', () => {
    expect(check4ImportPaths.name).toBe('import-paths');
  });

  it('skips when no imports found', async () => {
    const doc = makeDoc('# Hello\n\nNo imports here.');
    const context = makeContext();

    const result = await check4ImportPaths.run(doc, context);
    expect(result.status).toBe('skip');
    expect(result.skipReason).toContain('No playwright-praman imports');
  });

  it('passes with valid import source and valid specifier', async () => {
    const doc = makeDoc(`import { test, expect } from 'playwright-praman';`);
    const context = makeContext([
      ['test', { name: 'test', kind: 'variable', entryPoint: 'playwright-praman' }],
      ['expect', { name: 'expect', kind: 'variable', entryPoint: 'playwright-praman' }],
    ]);

    const result = await check4ImportPaths.run(doc, context);
    expect(result.status).toBe('pass');
    expect(result.errors).toHaveLength(0);
  });

  it('errors on invalid import source', async () => {
    const doc = makeDoc(`import { test } from 'playwright-praman/nonexistent';`);
    const context = makeContext();

    const result = await check4ImportPaths.run(doc, context);
    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.errors[0]!.message).toContain('Invalid import source');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.errors[0]!.message).toContain('nonexistent');
  });

  it('errors on unknown specifier with suggestion', async () => {
    const doc = makeDoc(`import { tset } from 'playwright-praman';`);
    const context = makeContext([
      ['test', { name: 'test', kind: 'variable', entryPoint: 'playwright-praman' }],
    ]);

    const result = await check4ImportPaths.run(doc, context);
    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.errors[0]!.message).toContain("Unknown specifier 'tset'");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.errors[0]!.suggestion).toContain('test');
  });

  it('errors on unknown specifier without suggestion when no close match', async () => {
    const doc = makeDoc(`import { completelyFakeSymbol } from 'playwright-praman';`);
    const context = makeContext([
      ['test', { name: 'test', kind: 'variable', entryPoint: 'playwright-praman' }],
    ]);

    const result = await check4ImportPaths.run(doc, context);
    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.errors[0]!.suggestion).toBeUndefined();
  });

  it('validates multiple imports in one doc', async () => {
    const doc = makeDoc(
      [
        `import { test } from 'playwright-praman';`,
        `import { pramanAI } from 'playwright-praman/ai';`,
      ].join('\n'),
    );

    const context = makeContext([
      ['test', { name: 'test', kind: 'variable', entryPoint: 'playwright-praman' }],
      ['pramanAI', { name: 'pramanAI', kind: 'variable', entryPoint: 'playwright-praman/ai' }],
    ]);

    const result = await check4ImportPaths.run(doc, context);
    expect(result.status).toBe('pass');
    expect(result.errors).toHaveLength(0);
  });

  it('validates all 6 valid sub-path sources', async () => {
    const validSources = [
      'playwright-praman',
      'playwright-praman/ai',
      'playwright-praman/intents',
      'playwright-praman/vocabulary',
      'playwright-praman/fe',
      'playwright-praman/reporters',
    ];

    for (const source of validSources) {
      const doc = makeDoc(`import { x } from '${source}';`);
      const context = makeContext([['x', { name: 'x', kind: 'variable', entryPoint: source }]]);

      const result = await check4ImportPaths.run(doc, context);
      expect(result.errors.filter((e) => e.message.includes('Invalid import source'))).toHaveLength(
        0,
      );
    }
  });
});
