/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import { describe, it, expect } from 'vitest';

import { check5ClaimTests } from '../../../scripts/docs-verify/checks/check5-claim-tests.js';
import type { DocUnderTest, SharedContext } from '../../../scripts/docs-verify/lib/types.js';

function makeDoc(content: string): DocUnderTest {
  return {
    filePath: 'docs/docs/guides/test.md',
    shortName: 'guides/test.md',
    content,
    frontmatter: {},
    mappedSourceFiles: [],
  };
}

function makeContext(claims?: Record<string, 'pass' | 'fail'>): SharedContext {
  return {
    apiSurface: new Map(),
    configDefaults: new Map(),
    claimTestResults: new Map(Object.entries(claims ?? {})),
    testIndex: { files: new Map() },
    exampleTestMap: [],
    vitestResults: new Map(),
    ui5ApiCache: new Map(),
    changedFiles: [],
  };
}

describe('check5-claim-tests', () => {
  it('has the correct check name', () => {
    expect(check5ClaimTests.name).toBe('claim-tests');
  });

  it('skips when no claims in doc', async () => {
    const doc = makeDoc('# Hello\n\nNo claims here.');
    const context = makeContext();

    const result = await check5ClaimTests.run(doc, context);
    expect(result.status).toBe('skip');
    expect(result.skipReason).toBe('no claim tags found');
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('passes when all claim testIds have passing backing tests', async () => {
    const doc = makeDoc(
      [
        '<!-- @claim testId="claim-a" -->',
        'The framework is reliable.',
        '<!-- @claim testId="claim-b" -->',
        'Performance is excellent.',
      ].join('\n'),
    );
    const context = makeContext({ 'claim-a': 'pass', 'claim-b': 'pass' });

    const result = await check5ClaimTests.run(doc, context);
    expect(result.status).toBe('pass');
    expect(result.errors).toHaveLength(0);
  });

  it('errors when testId has no backing test', async () => {
    const doc = makeDoc('<!-- @claim testId="missing-test" -->\nSome claim.');
    const context = makeContext();

    const result = await check5ClaimTests.run(doc, context);
    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.errors[0]!.message).toContain(
      "No backing test found for claim testId='missing-test'",
    );
  });

  it('errors when backing test failed', async () => {
    const doc = makeDoc('<!-- @claim testId="failing-test" -->\nSome claim.');
    const context = makeContext({ 'failing-test': 'fail' });

    const result = await check5ClaimTests.run(doc, context);
    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.errors[0]!.message).toContain(
      "Backing test failed for claim testId='failing-test'",
    );
  });

  it('handles multiple claims with mixed results', async () => {
    const doc = makeDoc(
      [
        '<!-- @claim testId="pass-one" -->',
        'Claim one.',
        '<!-- @claim testId="fail-one" -->',
        'Claim two.',
        '<!-- @claim testId="missing-one" -->',
        'Claim three.',
      ].join('\n'),
    );
    const context = makeContext({ 'pass-one': 'pass', 'fail-one': 'fail' });

    const result = await check5ClaimTests.run(doc, context);
    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(2); // one fail + one missing
    const messages = result.errors.map((e) => e.message);
    expect(messages.some((m) => m.includes('fail-one'))).toBe(true);
    expect(messages.some((m) => m.includes('missing-one'))).toBe(true);
  });

  it('warns for untagged numerical claims', async () => {
    const doc = makeDoc(
      [
        '<!-- @claim testId="tagged-claim" -->',
        'This is tagged.',
        'Supports 10 control types in the framework.',
      ].join('\n'),
    );
    const context = makeContext({ 'tagged-claim': 'pass' });

    const result = await check5ClaimTests.run(doc, context);
    expect(result.status).toBe('warn');
    expect(result.errors).toHaveLength(0);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by check above
    expect(result.warnings[0]!.message).toContain('Potential untagged claim');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.warnings[0]!.message).toContain('@claim testId=');
  });

  it('has no warnings when no untagged claims exist', async () => {
    const doc = makeDoc(
      ['<!-- @claim testId="only-claim" -->', 'This is a simple text claim with no numbers.'].join(
        '\n',
      ),
    );
    const context = makeContext({ 'only-claim': 'pass' });

    const result = await check5ClaimTests.run(doc, context);
    expect(result.status).toBe('pass');
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('returns check name claim-tests in result', async () => {
    const doc = makeDoc('<!-- @claim testId="x" -->\nText.');
    const context = makeContext({ x: 'pass' });

    const result = await check5ClaimTests.run(doc, context);
    expect(result.check).toBe('claim-tests');
  });
});
