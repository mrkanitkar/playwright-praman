/**
 * Tests for `src/fixtures/test-data-fixtures.ts` — Playwright test data fixture.
 *
 * @remarks
 * Validates that the testDataTest fixture correctly creates a TestDataHandler
 * with the test's output directory, and calls cleanup on teardown.
 *
 * @module fixtures
 */

import { describe, expect, it, vi } from 'vitest';

import { createMockTestExtend } from '../../helpers/mock-playwright-test.js';

// ── Mock Playwright ─────────────────────────────────────────────────

const mockTestExtend = createMockTestExtend();

vi.mock('@playwright/test', () => ({
  test: {
    extend: mockTestExtend,
  },
}));

// ── Mock TestDataHandler ────────────────────────────────────────────

const mockCleanup = vi.fn().mockResolvedValue(undefined);

const mockTestDataHandler = vi.fn().mockImplementation(function mockHandler(
  this: Record<string, unknown>,
  options: { readonly baseDir: string },
) {
  this['baseDir'] = options.baseDir;
  this['generate'] = vi.fn();
  this['save'] = vi.fn();
  this['load'] = vi.fn();
  this['cleanup'] = mockCleanup;
});

vi.mock('../../../src/fixtures/test-data-handler.js', () => ({
  TestDataHandler: mockTestDataHandler,
}));

// ── Import after mocks ─────────────────────────────────────────────

const { testDataTest } = await import('#fixtures/test-data-fixtures.js');

// ── Helpers ─────────────────────────────────────────────────────────

const fixtures = (testDataTest as unknown as { _fixtureDefinitions: Record<string, unknown> })
  ._fixtureDefinitions;

function extractFixtureFn(definition: unknown): (...args: unknown[]) => Promise<void> {
  if (Array.isArray(definition)) {
    return definition[0] as (...args: unknown[]) => Promise<void>;
  }
  return definition as (...args: unknown[]) => Promise<void>;
}

// ── Tests ───────────────────────────────────────────────────────────

describe('test-data-fixtures declarations', () => {
  it('exports testDataTest with testData fixture', () => {
    expect(fixtures).toHaveProperty('testData');
  });
});

describe('test-data-fixtures testData fixture', () => {
  it('creates TestDataHandler with baseDir from testInfo.outputDir', async () => {
    const fn = extractFixtureFn(fixtures['testData']);
    const testInfo = { outputDir: '/home/user/project/test-results' };

    let captured: unknown;
    const useFn = async (value: unknown): Promise<void> => {
      captured = value;
      await Promise.resolve();
    };

    // The fixture signature is ({}, use, testInfo)
    await (
      fn as (
        deps: Record<string, unknown>,
        use: (v: unknown) => Promise<void>,
        info: unknown,
      ) => Promise<void>
    )({}, useFn, testInfo);

    expect(mockTestDataHandler).toHaveBeenCalledWith({
      baseDir: expect.stringContaining('test-data') as string,
    });
    expect(captured).toBeDefined();
  });

  it('calls cleanup on teardown', async () => {
    mockCleanup.mockClear();
    const fn = extractFixtureFn(fixtures['testData']);
    const testInfo = { outputDir: '/home/user/project/test-results' };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Playwright `use()` signature requires the parameter
    const useFn = async (_value: unknown): Promise<void> => {
      await Promise.resolve();
    };

    await (
      fn as (
        deps: Record<string, unknown>,
        use: (v: unknown) => Promise<void>,
        info: unknown,
      ) => Promise<void>
    )({}, useFn, testInfo);

    expect(mockCleanup).toHaveBeenCalledOnce();
  });
});
