/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import { describe, expect, it } from 'vitest';

import { check3ConfigDefaults } from '../../../scripts/docs-verify/checks/check3-config-defaults.js';
import type {
  ConfigDefault,
  DocUnderTest,
  SharedContext,
} from '../../../scripts/docs-verify/lib/types.js';

function makeDoc(content: string, filePath = 'docs/test.md'): DocUnderTest {
  return {
    filePath,
    shortName: filePath,
    content,
    frontmatter: {},
    mappedSourceFiles: [],
  };
}

function makeContext(
  defaults: Record<string, { type: string; defaultValue: unknown }> = {},
): SharedContext {
  const configDefaults = new Map<string, ConfigDefault>(Object.entries(defaults));

  return {
    apiSurface: new Map(),
    configDefaults,
    claimTestResults: new Map(),
    testIndex: { files: new Map() },
    exampleTestMap: [],
    vitestResults: new Map(),
    ui5ApiCache: new Map(),
    changedFiles: [],
  };
}

describe('check3-config-defaults', () => {
  it('should skip when document has no config defaults', async () => {
    const doc = makeDoc('# Introduction\n\nNo config here.');
    const ctx = makeContext();

    const result = await check3ConfigDefaults.run(doc, ctx);

    expect(result.status).toBe('skip');
    expect(result.skipReason).toContain('No config defaults');
  });

  it('should pass when documented default matches actual default', async () => {
    const doc = makeDoc('`logLevel` defaults to `info`');
    const ctx = makeContext({
      logLevel: { type: 'string', defaultValue: 'info' },
    });

    const result = await check3ConfigDefaults.run(doc, ctx);

    expect(result.status).toBe('pass');
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should report error when documented default does not match actual', async () => {
    const doc = makeDoc('`timeout` defaults to `5000`');
    const ctx = makeContext({
      timeout: { type: 'number', defaultValue: 10000 },
    });

    const result = await check3ConfigDefaults.run(doc, ctx);

    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.errors[0]!.message).toContain('5000');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.errors[0]!.message).toContain('10000');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.errors[0]!.suggestion).toContain('10000');
  });

  it('should warn when config key is not found in schema', async () => {
    const doc = makeDoc('`unknownKey` defaults to `true`');
    const ctx = makeContext({
      logLevel: { type: 'string', defaultValue: 'info' },
    });

    const result = await check3ConfigDefaults.run(doc, ctx);

    expect(result.status).toBe('warn');
    expect(result.warnings).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.warnings[0]!.message).toContain('unknownKey');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.warnings[0]!.message).toContain('renamed');
  });

  it('should match dotted config keys by suffix', async () => {
    const doc = makeDoc('`openTelemetry` defaults to `false`');
    const ctx = makeContext({
      'telemetry.openTelemetry': { type: 'boolean', defaultValue: false },
    });

    const result = await check3ConfigDefaults.run(doc, ctx);

    expect(result.status).toBe('pass');
    expect(result.errors).toHaveLength(0);
  });

  it('should handle boolean default comparisons', async () => {
    const doc = makeDoc('`enabled` defaults to `true`');
    const ctx = makeContext({
      enabled: { type: 'boolean', defaultValue: true },
    });

    const result = await check3ConfigDefaults.run(doc, ctx);

    expect(result.status).toBe('pass');
  });

  it('should detect mismatched boolean defaults', async () => {
    const doc = makeDoc('`enabled` defaults to `true`');
    const ctx = makeContext({
      enabled: { type: 'boolean', defaultValue: false },
    });

    const result = await check3ConfigDefaults.run(doc, ctx);

    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.errors[0]!.message).toContain('true');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.errors[0]!.message).toContain('false');
  });

  it('should handle table-based config documentation', async () => {
    const doc = makeDoc(
      '| Option | Type | Default | Description |\n' +
        '| --- | --- | --- | --- |\n' +
        '| retries | number | 3 | Max retries |',
    );
    const ctx = makeContext({
      retries: { type: 'number', defaultValue: 3 },
    });

    const result = await check3ConfigDefaults.run(doc, ctx);

    expect(result.status).toBe('pass');
  });

  it('should have check name config-defaults', () => {
    expect(check3ConfigDefaults.name).toBe('config-defaults');
  });
});
