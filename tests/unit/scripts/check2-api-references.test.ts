/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import { describe, expect, it } from 'vitest';

import { check2ApiReferences } from '../../../scripts/docs-verify/checks/check2-api-references.js';
import type { DocUnderTest, SharedContext } from '../../../scripts/docs-verify/lib/types.js';

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
  apiSymbols: Record<string, { kind: string; entryPoint: string }> = {},
): SharedContext {
  const apiSurface = new Map(
    Object.entries(apiSymbols).map(([name, info]) => [
      name,
      {
        name,
        kind: info.kind as 'function' | 'class' | 'interface' | 'type' | 'variable' | 'enum',
        entryPoint: info.entryPoint,
      },
    ]),
  );

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

describe('check2-api-references', () => {
  it('should skip when document has no API symbols', async () => {
    const doc = makeDoc('# Getting Started\n\nThis is a guide with no code.');
    const ctx = makeContext();

    const result = await check2ApiReferences.run(doc, ctx);

    expect(result.status).toBe('skip');
    expect(result.skipReason).toContain('No API symbols');
  });

  it('should pass when all referenced symbols exist in API surface', async () => {
    const doc = makeDoc("```typescript\nimport { PramanConfig } from 'playwright-praman';\n```");
    const ctx = makeContext({
      PramanConfig: { kind: 'interface', entryPoint: '.' },
    });

    const result = await check2ApiReferences.run(doc, ctx);

    expect(result.status).toBe('pass');
    expect(result.errors).toHaveLength(0);
  });

  it('should report error for unknown symbol', async () => {
    const doc = makeDoc("```typescript\nimport { NonExistentType } from 'playwright-praman';\n```");
    const ctx = makeContext({
      PramanConfig: { kind: 'interface', entryPoint: '.' },
    });

    const result = await check2ApiReferences.run(doc, ctx);

    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    const error0 = result.errors[0];
    expect(error0).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(error0!.message).toContain('NonExistentType');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(error0!.severity).toBe('error');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(error0!.line).toBeGreaterThan(0);
  });

  it('should suggest closest match for typos', async () => {
    const doc = makeDoc("```typescript\nimport { PramanCofig } from 'playwright-praman';\n```");
    const ctx = makeContext({
      PramanConfig: { kind: 'interface', entryPoint: '.' },
    });

    const result = await check2ApiReferences.run(doc, ctx);

    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.errors[0]!.suggestion).toContain('PramanConfig');
  });

  it('should not flag Playwright built-in symbols like Page', async () => {
    // Page is mentioned via type reference pattern (PascalCase in backticks with certain prefixes)
    // but isKnownExternal should catch it. Let's use import pattern instead.
    const doc = makeDoc(
      'Use the `Page` object and `expect` from Playwright.\n' +
        "```typescript\nimport { PramanConfig } from 'playwright-praman';\n```",
    );
    const ctx = makeContext({
      PramanConfig: { kind: 'interface', entryPoint: '.' },
    });

    const result = await check2ApiReferences.run(doc, ctx);

    expect(result.status).toBe('pass');
    // Page and expect should not appear in errors
    const errorNames = result.errors.map((e) => e.message);
    expect(errorNames.join(' ')).not.toContain('Page');
    expect(errorNames.join(' ')).not.toContain('expect');
  });

  it('should detect function call symbols in backticks', async () => {
    const doc = makeDoc('Call `waitForUI5Stable(` to wait for stability.');
    const ctx = makeContext({
      waitForUI5Stable: { kind: 'function', entryPoint: '.' },
    });

    const result = await check2ApiReferences.run(doc, ctx);

    expect(result.status).toBe('pass');
    expect(result.errors).toHaveLength(0);
  });

  it('should report error for unknown function call in backticks', async () => {
    const doc = makeDoc('Call `someUnknownApi(` to do things.');
    const ctx = makeContext({
      waitForUI5Stable: { kind: 'function', entryPoint: '.' },
    });

    const result = await check2ApiReferences.run(doc, ctx);

    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.errors[0]!.message).toContain('someUnknownApi');
  });

  it('should have check name api-references', () => {
    expect(check2ApiReferences.name).toBe('api-references');
  });
});
