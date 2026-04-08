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
  parseCli,
  buildSharedContext,
  verifyDoc,
  CHECK_NUMBER_MAP,
} from '../../../scripts/docs-verify/index.js';
import type {
  DocCheck,
  DocUnderTest,
  CheckResult,
  CheckName,
} from '../../../scripts/docs-verify/lib/types.js';

/** Create a minimal DocUnderTest for testing */
function makeDoc(overrides?: Partial<DocUnderTest>): DocUnderTest {
  return {
    filePath: 'docs/docs/guides/integration-test.md',
    shortName: 'guides/integration-test.md',
    content: '# Integration Test Doc\n\nSome content here.',
    frontmatter: {},
    mappedSourceFiles: [],
    ...overrides,
  };
}

/** Create a mock DocCheck that returns a fixed result */
function makeCheck(name: CheckName, result: Partial<CheckResult>): DocCheck {
  return {
    name,
    // eslint-disable-next-line @typescript-eslint/require-await -- test stub returns static data
    async run(): Promise<CheckResult> {
      return {
        check: name,
        status: 'pass',
        errors: [],
        warnings: [],
        durationMs: 1,
        ...result,
      };
    },
  };
}

describe('docs-verify integration', () => {
  describe('parseCli with full option combinations', () => {
    it('should parse full mode with all options combined', () => {
      const options = parseCli([
        '--mode=full',
        '--doc=fixtures.md',
        '--checks=1,2,3,4',
        '--failOn=warning',
        '--verbose',
      ]);

      expect(options.mode).toBe('full');
      expect(options.doc).toBe('fixtures.md');
      expect(options.checks).toEqual([1, 2, 3, 4]);
      expect(options.failOn).toBe('warning');
      expect(options.verbose).toBe(true);
    });

    it('should parse PR mode with minimal options', () => {
      const options = parseCli(['--mode=pr']);
      expect(options.mode).toBe('pr');
      expect(options.doc).toBeUndefined();
      expect(options.checks).toBeUndefined();
      expect(options.failOn).toBe('error');
      expect(options.verbose).toBe(false);
    });
  });

  describe('verifyDoc end-to-end with mock checks', () => {
    it('should produce pass verdict when all checks pass', async () => {
      const doc = makeDoc();
      const context = buildSharedContext();
      const checks = [
        makeCheck('typecheck-snippets', { status: 'pass' }),
        makeCheck('api-references', { status: 'pass' }),
        makeCheck('import-paths', { status: 'pass' }),
      ];

      const verdict = await verifyDoc(doc, checks, context);

      expect(verdict.verdict).toBe('pass');
      expect(verdict.totalErrors).toBe(0);
      expect(verdict.totalWarnings).toBe(0);
      expect(verdict.checks).toHaveLength(3);
      expect(verdict.filePath).toBe(doc.filePath);
      expect(verdict.shortName).toBe(doc.shortName);
    });

    it('should produce fail verdict when any check has errors', async () => {
      const doc = makeDoc();
      const context = buildSharedContext();
      const checks = [
        makeCheck('typecheck-snippets', {
          status: 'fail',
          errors: [{ severity: 'error', message: 'TS2304: Cannot find name "foo"', line: 10 }],
        }),
        makeCheck('import-paths', { status: 'pass' }),
      ];

      const verdict = await verifyDoc(doc, checks, context);

      expect(verdict.verdict).toBe('fail');
      expect(verdict.totalErrors).toBe(1);
      expect(verdict.totalWarnings).toBe(0);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test assertion after length check
      expect(verdict.checks[0]!.errors).toHaveLength(1);
    });

    it('should produce warn verdict when checks have only warnings', async () => {
      const doc = makeDoc();
      const context = buildSharedContext();
      const checks = [
        makeCheck('api-references', {
          status: 'warn',
          warnings: [
            { severity: 'warning', message: 'Deprecated API: foo()', line: 5 },
            { severity: 'warning', message: 'Missing TSDoc for bar()', line: 12 },
          ],
        }),
        makeCheck('config-defaults', { status: 'pass' }),
      ];

      const verdict = await verifyDoc(doc, checks, context);

      expect(verdict.verdict).toBe('warn');
      expect(verdict.totalErrors).toBe(0);
      expect(verdict.totalWarnings).toBe(2);
    });

    it('should aggregate errors and warnings across multiple checks', async () => {
      const doc = makeDoc();
      const context = buildSharedContext();
      const checks = [
        makeCheck('typecheck-snippets', {
          status: 'fail',
          errors: [
            { severity: 'error', message: 'Error 1' },
            { severity: 'error', message: 'Error 2' },
          ],
          warnings: [{ severity: 'warning', message: 'Warning A' }],
        }),
        makeCheck('import-paths', {
          status: 'fail',
          errors: [{ severity: 'error', message: 'Error 3' }],
        }),
        makeCheck('claim-tests', {
          status: 'warn',
          warnings: [{ severity: 'warning', message: 'Warning B' }],
        }),
      ];

      const verdict = await verifyDoc(doc, checks, context);

      expect(verdict.verdict).toBe('fail');
      expect(verdict.totalErrors).toBe(3);
      expect(verdict.totalWarnings).toBe(2);
      expect(verdict.checks).toHaveLength(3);
    });

    it('should handle skipped checks without affecting verdict', async () => {
      const doc = makeDoc();
      const context = buildSharedContext();
      const checks = [
        makeCheck('typecheck-snippets', {
          status: 'skip',
          skipReason: 'No code blocks found',
        }),
        makeCheck('import-paths', { status: 'pass' }),
      ];

      const verdict = await verifyDoc(doc, checks, context);

      expect(verdict.verdict).toBe('pass');
      expect(verdict.totalErrors).toBe(0);
      expect(verdict.checks).toHaveLength(2);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- test assertion for skip reason
      expect(verdict.checks[0]!.skipReason).toBe('No code blocks found');
    });
  });

  describe('buildSharedContext', () => {
    it('should return a valid empty context with all required fields', () => {
      const context = buildSharedContext();

      expect(context.apiSurface).toBeInstanceOf(Map);
      expect(context.apiSurface.size).toBe(0);
      expect(context.configDefaults).toBeInstanceOf(Map);
      expect(context.configDefaults.size).toBe(0);
      expect(context.claimTestResults).toBeInstanceOf(Map);
      expect(context.testIndex.files).toBeInstanceOf(Map);
      expect(context.exampleTestMap).toEqual([]);
      expect(context.vitestResults).toBeInstanceOf(Map);
      expect(context.ui5ApiCache).toBeInstanceOf(Map);
      expect(context.changedFiles).toEqual([]);
    });
  });

  describe('CHECK_NUMBER_MAP', () => {
    it('should have all 8 checks registered', () => {
      expect(Object.keys(CHECK_NUMBER_MAP)).toHaveLength(8);
    });

    it('should map numbers 1-8 to valid check names', () => {
      const expectedNames: CheckName[] = [
        'typecheck-snippets',
        'api-references',
        'config-defaults',
        'import-paths',
        'claim-tests',
        'example-test-map',
        'ai-review',
        'sap-ui5-api',
      ];

      for (let i = 1; i <= 8; i++) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- iterating known range 1-8
        expect(CHECK_NUMBER_MAP[i]).toBe(expectedNames[i - 1]!);
      }
    });
  });
});
