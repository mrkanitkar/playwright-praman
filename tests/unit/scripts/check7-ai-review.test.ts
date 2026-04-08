/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */
import process from 'node:process';

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import type { DocUnderTest, SharedContext } from '../../../scripts/docs-verify/lib/types.js';

// Mock @anthropic-ai/sdk
const mockCreate = vi.fn();
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
    },
  };
});

// Mock fs for source file loading
vi.mock('node:fs', async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    existsSync: vi.fn((p: string) => {
      if (typeof p === 'string' && p.includes('src/fixtures/index.ts')) return true;
      // Delegate to actual for other paths
      return actual.existsSync(p);
    }),
    readFileSync: vi.fn((p: string, encoding?: string) => {
      if (typeof p === 'string' && p.includes('src/fixtures/index.ts') && encoding === 'utf-8') {
        return 'export function test() { return true; }';
      }
      return actual.readFileSync(p, encoding as BufferEncoding);
    }),
  };
});

const { Check7AiReview } = await import('../../../scripts/docs-verify/checks/check7-ai-review.js');

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

describe('check7-ai-review', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env
    delete process.env['DOCS_VERIFY_AI_API_KEY'];
    delete process.env['DOCS_VERIFY_AI_MODEL'];
    delete process.env['DOCS_VERIFY_AI_MAX_COST_USD'];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('should skip when no API key is set', async () => {
    const check = new Check7AiReview();
    const doc = makeDoc('# Guide\n\nSome content.');
    const ctx = makeContext();

    const result = await check.run(doc, ctx);

    expect(result.status).toBe('skip');
    expect(result.skipReason).toContain('DOCS_VERIFY_AI_API_KEY not set');
  });

  it('should skip when no mapped source files', async () => {
    process.env['DOCS_VERIFY_AI_API_KEY'] = 'test-key';
    const check = new Check7AiReview();
    const doc = makeDoc('# Guide\n\nSome content.', {
      mappedSourceFiles: [],
    });
    const ctx = makeContext();

    const result = await check.run(doc, ctx);

    expect(result.status).toBe('skip');
    expect(result.skipReason).toContain('No mapped source files');
  });

  it('should skip when budget cap is exceeded', async () => {
    process.env['DOCS_VERIFY_AI_API_KEY'] = 'test-key';
    process.env['DOCS_VERIFY_AI_MAX_COST_USD'] = '0.001';

    const check = new Check7AiReview();
    const doc = makeDoc('# Guide\n\nSome content.', {
      mappedSourceFiles: ['src/fixtures/index.ts'],
    });
    const ctx = makeContext();

    // First call — should succeed and consume budget
    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '[]' }],
      usage: { input_tokens: 1000, output_tokens: 1000 },
    });

    await check.run(doc, ctx);

    // Second call — budget should be exceeded
    const result = await check.run(doc, ctx);

    expect(result.status).toBe('skip');
    expect(result.skipReason).toContain('Budget cap exceeded');
  });

  it('should pass when AI returns empty findings array', async () => {
    process.env['DOCS_VERIFY_AI_API_KEY'] = 'test-key';
    const check = new Check7AiReview();
    const doc = makeDoc('# Guide\n\nSome content.', {
      mappedSourceFiles: ['src/fixtures/index.ts'],
    });
    const ctx = makeContext();

    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '[]' }],
      usage: { input_tokens: 100, output_tokens: 10 },
    });

    const result = await check.run(doc, ctx);

    expect(result.status).toBe('pass');
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('should map AI findings to errors and warnings', async () => {
    process.env['DOCS_VERIFY_AI_API_KEY'] = 'test-key';
    const check = new Check7AiReview();
    const doc = makeDoc('# Guide\n\nWrong API described here.', {
      mappedSourceFiles: ['src/fixtures/index.ts'],
    });
    const ctx = makeContext();

    const findings = [
      {
        severity: 'error',
        line: 3,
        message: 'Function does not exist in source',
        suggestion: 'Remove reference to nonExistentFn()',
      },
      {
        severity: 'warning',
        line: null,
        message: 'Default value may be incorrect',
        suggestion: 'Verify the default is 5000, not 3000',
      },
    ];

    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify(findings) }],
      usage: { input_tokens: 200, output_tokens: 50 },
    });

    const result = await check.run(doc, ctx);

    expect(result.status).toBe('fail');
    expect(result.errors).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.errors[0]!.message).toBe('Function does not exist in source');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.errors[0]!.line).toBe(3);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.errors[0]!.suggestion).toBe('Remove reference to nonExistentFn()');
    expect(result.warnings).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveLength above
    expect(result.warnings[0]!.message).toBe('Default value may be incorrect');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(result.warnings[0]!.line).toBeUndefined(); // null → undefined
  });

  it('should verify system prompt instructs factual-only review', async () => {
    process.env['DOCS_VERIFY_AI_API_KEY'] = 'test-key';
    const check = new Check7AiReview();
    const doc = makeDoc('# Guide\n\nContent.', {
      mappedSourceFiles: ['src/fixtures/index.ts'],
    });
    const ctx = makeContext();

    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '[]' }],
      usage: { input_tokens: 100, output_tokens: 10 },
    });

    await check.run(doc, ctx);

    expect(mockCreate).toHaveBeenCalledOnce();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by toHaveBeenCalledOnce above
    const callArgs = mockCreate.mock.calls[0]![0] as { system: string; model: string };
    expect(callArgs.system).toContain('provably wrong facts');
    expect(callArgs.system).toContain('Do NOT flag style issues');
  });

  it('should handle API errors gracefully', async () => {
    process.env['DOCS_VERIFY_AI_API_KEY'] = 'test-key';
    const check = new Check7AiReview();
    const doc = makeDoc('# Guide\n\nContent.', {
      mappedSourceFiles: ['src/fixtures/index.ts'],
    });
    const ctx = makeContext();

    mockCreate.mockRejectedValue(new Error('API rate limit'));

    const result = await check.run(doc, ctx);

    expect(result.status).toBe('skip');
    expect(result.skipReason).toContain('AI API call failed');
  });

  it('should handle malformed AI response gracefully', async () => {
    process.env['DOCS_VERIFY_AI_API_KEY'] = 'test-key';
    const check = new Check7AiReview();
    const doc = makeDoc('# Guide\n\nContent.', {
      mappedSourceFiles: ['src/fixtures/index.ts'],
    });
    const ctx = makeContext();

    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: 'This is not valid JSON' }],
      usage: { input_tokens: 100, output_tokens: 10 },
    });

    const result = await check.run(doc, ctx);

    // Should pass (empty findings from failed parse)
    expect(result.status).toBe('pass');
    expect(result.errors).toHaveLength(0);
  });

  it('should track cumulative cost', async () => {
    process.env['DOCS_VERIFY_AI_API_KEY'] = 'test-key';
    const check = new Check7AiReview();
    const doc = makeDoc('# Guide\n\nContent.', {
      mappedSourceFiles: ['src/fixtures/index.ts'],
    });
    const ctx = makeContext();

    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '[]' }],
      usage: { input_tokens: 1_000_000, output_tokens: 100_000 },
    });

    await check.run(doc, ctx);

    // INPUT_COST_PER_M = 3.0, OUTPUT_COST_PER_M = 15.0
    // 1M input tokens = $3.00, 100K output tokens = $1.50
    const expectedCost = 3.0 + 1.5;
    expect(check.getCumulativeCost()).toBeCloseTo(expectedCost, 2);
  });

  it('should use configured model from env', async () => {
    process.env['DOCS_VERIFY_AI_API_KEY'] = 'test-key';
    process.env['DOCS_VERIFY_AI_MODEL'] = 'claude-haiku-4-5';
    const check = new Check7AiReview();
    const doc = makeDoc('# Guide\n\nContent.', {
      mappedSourceFiles: ['src/fixtures/index.ts'],
    });
    const ctx = makeContext();

    mockCreate.mockResolvedValue({
      content: [{ type: 'text', text: '[]' }],
      usage: { input_tokens: 100, output_tokens: 10 },
    });

    await check.run(doc, ctx);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guarded by mock call above
    const callArgs = mockCreate.mock.calls[0]![0] as { system: string; model: string };
    expect(callArgs.model).toBe('claude-haiku-4-5');
  });
});
