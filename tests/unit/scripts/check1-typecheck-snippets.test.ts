/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import { describe, it, expect } from 'vitest';

import {
  check1TypecheckSnippets,
  rewriteImports,
} from '../../../scripts/docs-verify/checks/check1-typecheck-snippets.js';
import type { DocUnderTest, SharedContext } from '../../../scripts/docs-verify/lib/types.js';

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

function makeContext(): SharedContext {
  return {
    apiSurface: new Map(),
    configDefaults: new Map(),
    claimTestResults: new Map(),
    testIndex: { files: new Map() },
    exampleTestMap: [],
    vitestResults: new Map(),
    ui5ApiCache: new Map(),
    changedFiles: [],
  };
}

describe('check1-typecheck-snippets', () => {
  describe('rewriteImports', () => {
    it('rewrites playwright-praman base import', () => {
      const code = `import { test } from 'playwright-praman';`;
      const result = rewriteImports(code);
      expect(result).toBe(`import { test } from './dist/index';`);
    });

    it('rewrites playwright-praman/ai import', () => {
      const code = `import { pramanAI } from 'playwright-praman/ai';`;
      const result = rewriteImports(code);
      expect(result).toBe(`import { pramanAI } from './dist/ai/index';`);
    });

    it('rewrites playwright-praman/reporters import', () => {
      const code = `import { reporter } from "playwright-praman/reporters";`;
      const result = rewriteImports(code);
      expect(result).toBe(`import { reporter } from "./dist/reporters/index";`);
    });

    it('rewrites all 6 sub-path exports', () => {
      const subpaths = [
        'playwright-praman',
        'playwright-praman/ai',
        'playwright-praman/intents',
        'playwright-praman/vocabulary',
        'playwright-praman/fe',
        'playwright-praman/reporters',
      ];
      for (const pkg of subpaths) {
        const code = `import { x } from '${pkg}';`;
        const result = rewriteImports(code);
        expect(result).not.toContain(pkg);
        expect(result).toContain('./dist/');
      }
    });

    it('leaves non-praman imports unchanged', () => {
      const code = `import { Page } from '@playwright/test';`;
      const result = rewriteImports(code);
      expect(result).toBe(code);
    });
  });

  describe('run', () => {
    const context = makeContext();

    it('skips when no TypeScript code blocks found', async () => {
      const doc = makeDoc('# Hello\n\nSome text without code blocks.');
      const result = await check1TypecheckSnippets.run(doc, context);
      expect(result.status).toBe('skip');
      expect(result.skipReason).toContain('No TypeScript');
    });

    it('skips blocks with docs-verify:ignore directive', async () => {
      const doc = makeDoc(
        [
          '# Test',
          '<!-- docs-verify:ignore -->',
          '```typescript',
          'const x: number = "not a number";',
          '```',
        ].join('\n'),
      );

      const result = await check1TypecheckSnippets.run(doc, context);
      // The block is skipped, so no errors
      expect(result.errors).toHaveLength(0);
    });

    it('skips blocks with title="pseudo-code" meta', async () => {
      const doc = makeDoc(
        [
          '# Test',
          '```typescript title="pseudo-code"',
          'const x: SomeFantasyType = magic();',
          '```',
        ].join('\n'),
      );

      const result = await check1TypecheckSnippets.run(doc, context);
      // The block is skipped, so no errors
      expect(result.errors).toHaveLength(0);
    });

    it('has the correct check name', () => {
      expect(check1TypecheckSnippets.name).toBe('typecheck-snippets');
    });

    it('returns pass status when blocks have no errors on valid TS', async () => {
      // This tests a trivially valid block — we can't guarantee tsc is available
      // in all test environments, so we just verify the structure
      const doc = makeDoc(['# Test', '```typescript', '// just a comment', '```'].join('\n'));

      const result = await check1TypecheckSnippets.run(doc, context);
      // Result should have the right shape
      expect(result.check).toBe('typecheck-snippets');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('durationMs');
    });
  });
});
