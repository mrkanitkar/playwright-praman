/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

import { describe, it, expect } from 'vitest';

import { check6ExampleTestMap } from '../../../scripts/docs-verify/checks/check6-example-test-map.js';
import type {
  DocUnderTest,
  SharedContext,
  TestFileInfo,
} from '../../../scripts/docs-verify/lib/types.js';

function makeDoc(content: string): DocUnderTest {
  return {
    filePath: 'docs/docs/guides/test.md',
    shortName: 'guides/test.md',
    content,
    frontmatter: {},
    mappedSourceFiles: [],
  };
}

function makeContext(testFiles?: Record<string, TestFileInfo>): SharedContext {
  return {
    apiSurface: new Map(),
    configDefaults: new Map(),
    claimTestResults: new Map(),
    testIndex: { files: new Map(Object.entries(testFiles ?? {})) },
    exampleTestMap: [],
    vitestResults: new Map(),
    ui5ApiCache: new Map(),
    changedFiles: [],
  };
}

describe('check6-example-test-map', () => {
  it('has the correct check name', () => {
    expect(check6ExampleTestMap.name).toBe('example-test-map');
  });

  it('skips when no TypeScript code blocks in doc', async () => {
    const doc = makeDoc('# Hello\n\nNo code blocks here.\n\n```bash\necho hi\n```');
    const context = makeContext();

    const result = await check6ExampleTestMap.run(doc, context);
    expect(result.status).toBe('skip');
    expect(result.skipReason).toContain('No TypeScript code blocks');
  });

  it('passes when @example tag matches existing test file and name', async () => {
    const doc = makeDoc(
      [
        '# Guide',
        '',
        '<!-- @example testFile="tests/unit/my.test.ts" testName="should work" -->',
        '```typescript',
        'ui5.control({ controlType: "sap.m.Button" });',
        '```',
      ].join('\n'),
    );

    const context = makeContext({
      'tests/unit/my.test.ts': {
        filePath: 'tests/unit/my.test.ts',
        testNames: ['should work', 'another test'],
        codePatterns: ['ui5.control'],
        content: 'it("should work", () => { ui5.control({ controlType: "sap.m.Button" }); });',
      },
    });

    const result = await check6ExampleTestMap.run(doc, context);
    expect(result.status).toBe('pass');
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('errors when @example references non-existent test file', async () => {
    const doc = makeDoc(
      [
        '<!-- @example testFile="tests/unit/missing.test.ts" -->',
        '```typescript',
        'const x = 1;',
        '```',
      ].join('\n'),
    );

    const context = makeContext();

    const result = await check6ExampleTestMap.run(doc, context);
    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.errors[0]!.message).toContain('non-existent test file');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.errors[0]!.message).toContain('missing.test.ts');
  });

  it('errors when @example references non-existent test name', async () => {
    const doc = makeDoc(
      [
        '<!-- @example testFile="tests/unit/my.test.ts" testName="does not exist" -->',
        '```typescript',
        'const x = 1;',
        '```',
      ].join('\n'),
    );

    const context = makeContext({
      'tests/unit/my.test.ts': {
        filePath: 'tests/unit/my.test.ts',
        testNames: ['should work'],
        codePatterns: [],
        content: 'it("should work", () => {});',
      },
    });

    const result = await check6ExampleTestMap.run(doc, context);
    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.errors[0]!.message).toContain('non-existent test name');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.errors[0]!.message).toContain('does not exist');
  });

  it('warns for code block with no backing test and no API patterns', async () => {
    const doc = makeDoc(['```typescript', 'const x = 1;', '```'].join('\n'));

    const context = makeContext();

    const result = await check6ExampleTestMap.run(doc, context);
    expect(result.status).toBe('warn');
    expect(result.warnings).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.warnings[0]!.message).toContain('no backing test');
  });

  it('warns with fuzzy match suggestion when API patterns match a test file', async () => {
    const doc = makeDoc(
      ['```typescript', 'ui5.control({ controlType: "sap.m.Button" });', '```'].join('\n'),
    );

    const context = makeContext({
      'tests/unit/button.test.ts': {
        filePath: 'tests/unit/button.test.ts',
        testNames: ['finds a button'],
        codePatterns: ['ui5.control'],
        content: 'ui5.control({ controlType: "sap.m.Button" });',
      },
    });

    const result = await check6ExampleTestMap.run(doc, context);
    expect(result.status).toBe('warn');
    expect(result.warnings).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.warnings[0]!.message).toContain('fuzzy search');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.warnings[0]!.message).toContain('button.test.ts');
  });

  it('handles multiple blocks with mixed results', async () => {
    const doc = makeDoc(
      [
        '<!-- @example testFile="tests/unit/exists.test.ts" testName="works" -->',
        '```typescript',
        'ui5.control({ controlType: "sap.m.Input" });',
        '```',
        '',
        '<!-- @example testFile="tests/unit/missing.test.ts" -->',
        '```typescript',
        'const y = 2;',
        '```',
        '',
        '```typescript',
        'const z = 3;',
        '```',
      ].join('\n'),
    );

    const context = makeContext({
      'tests/unit/exists.test.ts': {
        filePath: 'tests/unit/exists.test.ts',
        testNames: ['works'],
        codePatterns: ['ui5.control'],
        content: 'it("works", () => { ui5.control({}); });',
      },
    });

    const result = await check6ExampleTestMap.run(doc, context);
    expect(result.status).toBe('fail');
    // 1 error: missing test file reference
    expect(result.errors).toHaveLength(1);
    // 1 warning: unmatched block (no API patterns, no tag)
    expect(result.warnings).toHaveLength(1);
  });

  it('passes when @example tag has testFile only (no testName)', async () => {
    const doc = makeDoc(
      [
        '<!-- @example testFile="tests/unit/my.test.ts" -->',
        '```typescript',
        'const x = 1;',
        '```',
      ].join('\n'),
    );

    const context = makeContext({
      'tests/unit/my.test.ts': {
        filePath: 'tests/unit/my.test.ts',
        testNames: ['some test'],
        codePatterns: [],
        content: 'it("some test", () => {});',
      },
    });

    const result = await check6ExampleTestMap.run(doc, context);
    expect(result.status).toBe('pass');
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('populates exampleTestMap in context for valid mappings', async () => {
    const doc = makeDoc(
      [
        '<!-- @example testFile="tests/unit/my.test.ts" testName="works" -->',
        '```typescript',
        'const x = 1;',
        '```',
      ].join('\n'),
    );

    const context = makeContext({
      'tests/unit/my.test.ts': {
        filePath: 'tests/unit/my.test.ts',
        testNames: ['works'],
        codePatterns: [],
        content: 'it("works", () => {});',
      },
    });

    await check6ExampleTestMap.run(doc, context);
    expect(context.exampleTestMap).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(context.exampleTestMap[0]!.testFile).toBe('tests/unit/my.test.ts');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(context.exampleTestMap[0]!.testName).toBe('works');
  });
});
