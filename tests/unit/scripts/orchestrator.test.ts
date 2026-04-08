/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import { describe, it, expect } from 'vitest';

import { parseCli, buildSharedContext, verifyDoc } from '../../../scripts/docs-verify/index.js';
import type {
  DocCheck,
  DocUnderTest,
  CheckResult,
} from '../../../scripts/docs-verify/lib/types.js';

function makeDoc(overrides?: Partial<DocUnderTest>): DocUnderTest {
  return {
    filePath: 'docs/docs/guides/test.md',
    shortName: 'guides/test.md',
    content: '# Test Doc',
    frontmatter: {},
    mappedSourceFiles: [],
    ...overrides,
  };
}

function makeCheck(name: string, result: Partial<CheckResult>): DocCheck {
  return {
    name: name as CheckResult['check'],
    // eslint-disable-next-line @typescript-eslint/require-await -- test stub returns static data
    async run(): Promise<CheckResult> {
      return {
        check: name as CheckResult['check'],
        status: 'pass',
        errors: [],
        warnings: [],
        durationMs: 1,
        ...result,
      };
    },
  };
}

describe('parseCli', () => {
  it('returns full mode by default', () => {
    const options = parseCli([]);
    expect(options.mode).toBe('full');
  });

  it('parses --mode=pr', () => {
    const options = parseCli(['--mode=pr']);
    expect(options.mode).toBe('pr');
  });

  it('parses --mode=full', () => {
    const options = parseCli(['--mode=full']);
    expect(options.mode).toBe('full');
  });

  it('parses --doc=fixtures.md', () => {
    const options = parseCli(['--doc=fixtures.md']);
    expect(options.doc).toBe('fixtures.md');
  });

  it('parses --checks=1,4', () => {
    const options = parseCli(['--checks=1,4']);
    expect(options.checks).toEqual([1, 4]);
  });

  it('parses --checks=1', () => {
    const options = parseCli(['--checks=1']);
    expect(options.checks).toEqual([1]);
  });

  it('returns undefined checks when not specified', () => {
    const options = parseCli([]);
    expect(options.checks).toBeUndefined();
  });

  it('parses --verbose', () => {
    const options = parseCli(['--verbose']);
    expect(options.verbose).toBe(true);
  });

  it('defaults verbose to false', () => {
    const options = parseCli([]);
    expect(options.verbose).toBe(false);
  });

  it('parses --failOn=warning', () => {
    const options = parseCli(['--failOn=warning']);
    expect(options.failOn).toBe('warning');
  });

  it('defaults failOn to error', () => {
    const options = parseCli([]);
    expect(options.failOn).toBe('error');
  });

  it('handles combined flags', () => {
    const options = parseCli(['--mode=pr', '--doc=auth.md', '--checks=1,4', '--verbose']);
    expect(options.mode).toBe('pr');
    expect(options.doc).toBe('auth.md');
    expect(options.checks).toEqual([1, 4]);
    expect(options.verbose).toBe(true);
  });
});

describe('buildSharedContext', () => {
  it('returns a valid SharedContext with empty collections', () => {
    const context = buildSharedContext();
    expect(context.apiSurface).toBeInstanceOf(Map);
    expect(context.apiSurface.size).toBe(0);
    expect(context.configDefaults).toBeInstanceOf(Map);
    expect(context.changedFiles).toEqual([]);
    expect(context.testIndex.files).toBeInstanceOf(Map);
  });
});

describe('verifyDoc', () => {
  it('returns pass when all checks pass', async () => {
    const doc = makeDoc();
    const context = buildSharedContext();
    const checks = [
      makeCheck('typecheck-snippets', { status: 'pass' }),
      makeCheck('import-paths', { status: 'pass' }),
    ];

    const verdict = await verifyDoc(doc, checks, context);
    expect(verdict.verdict).toBe('pass');
    expect(verdict.totalErrors).toBe(0);
    expect(verdict.totalWarnings).toBe(0);
    expect(verdict.checks).toHaveLength(2);
  });

  it('returns fail when any check has errors', async () => {
    const doc = makeDoc();
    const context = buildSharedContext();
    const checks = [
      makeCheck('typecheck-snippets', {
        status: 'fail',
        errors: [{ severity: 'error', message: 'Type error' }],
      }),
      makeCheck('import-paths', { status: 'pass' }),
    ];

    const verdict = await verifyDoc(doc, checks, context);
    expect(verdict.verdict).toBe('fail');
    expect(verdict.totalErrors).toBe(1);
  });

  it('returns warn when checks have warnings but no errors', async () => {
    const doc = makeDoc();
    const context = buildSharedContext();
    const checks = [
      makeCheck('typecheck-snippets', {
        status: 'warn',
        warnings: [{ severity: 'warning', message: 'Deprecated API' }],
      }),
    ];

    const verdict = await verifyDoc(doc, checks, context);
    expect(verdict.verdict).toBe('warn');
    expect(verdict.totalWarnings).toBe(1);
    expect(verdict.totalErrors).toBe(0);
  });

  it('aggregates errors from multiple checks', async () => {
    const doc = makeDoc();
    const context = buildSharedContext();
    const checks = [
      makeCheck('typecheck-snippets', {
        status: 'fail',
        errors: [
          { severity: 'error', message: 'Error 1' },
          { severity: 'error', message: 'Error 2' },
        ],
      }),
      makeCheck('import-paths', {
        status: 'fail',
        errors: [{ severity: 'error', message: 'Error 3' }],
      }),
    ];

    const verdict = await verifyDoc(doc, checks, context);
    expect(verdict.verdict).toBe('fail');
    expect(verdict.totalErrors).toBe(3);
  });

  it('includes durationMs', async () => {
    const doc = makeDoc();
    const context = buildSharedContext();
    const checks = [makeCheck('typecheck-snippets', {})];

    const verdict = await verifyDoc(doc, checks, context);
    expect(verdict.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('preserves filePath and shortName', async () => {
    const doc = makeDoc({
      filePath: 'docs/docs/guides/custom.md',
      shortName: 'guides/custom.md',
    });
    const context = buildSharedContext();

    const verdict = await verifyDoc(doc, [], context);
    expect(verdict.filePath).toBe('docs/docs/guides/custom.md');
    expect(verdict.shortName).toBe('guides/custom.md');
  });

  it('handles empty checks array', async () => {
    const doc = makeDoc();
    const context = buildSharedContext();

    const verdict = await verifyDoc(doc, [], context);
    expect(verdict.verdict).toBe('pass');
    expect(verdict.checks).toHaveLength(0);
  });
});
