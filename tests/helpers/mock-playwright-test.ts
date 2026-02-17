/**
 * Mock Playwright test framework for fixture unit testing.
 *
 * @remarks
 * Provides mocked versions of test.extend(), mergeTests(), and
 * expect.extend() so fixture composition can be tested in vitest
 * without requiring a running Playwright test runner.
 *
 * @example
 * ```typescript
 * import { createMockTestExtend, createMockMergeTests } from '../../helpers/mock-playwright-test.js';
 *
 * vi.mock('@playwright/test', () => ({
 *   test: { extend: createMockTestExtend() },
 *   mergeTests: createMockMergeTests(),
 *   expect: { extend: vi.fn().mockReturnValue({ extend: vi.fn() }) },
 * }));
 * ```
 *
 * @module test-helpers
 */

import { vi } from 'vitest';

/** Type for the mock test object returned by test.extend(). */
export interface MockPlaywrightTest {
  readonly extend: ReturnType<typeof vi.fn>;
  readonly describe: ReturnType<typeof vi.fn>;
  readonly step: ReturnType<typeof vi.fn>;
  readonly use: ReturnType<typeof vi.fn>;
  /** The fixture definitions passed to test.extend(), stored for introspection. */
  readonly _fixtureDefinitions: Record<string, unknown>;
}

/**
 * Creates a mock for Playwright's `test.extend()`.
 *
 * @remarks
 * Returns a vi.fn() that accepts fixture definitions and returns a
 * MockPlaywrightTest object. The fixture definitions are stored on
 * `_fixtureDefinitions` for test introspection.
 *
 * @returns A mock function simulating test.extend() behavior.
 *
 * @example
 * ```typescript
 * const mockExtend = createMockTestExtend();
 * const test = mockExtend({ myFixture: [async ({}, use) => { await use('val'); }, { scope: 'test' }] });
 * expect(test._fixtureDefinitions).toHaveProperty('myFixture');
 * ```
 */
export function createMockTestExtend(): ReturnType<typeof vi.fn> {
  return vi.fn().mockImplementation((fixtures: Record<string, unknown>) => {
    const mockTest: MockPlaywrightTest = {
      extend: createMockTestExtend(),
      describe: vi.fn(),
      step: vi.fn(),
      use: vi.fn(),
      _fixtureDefinitions: fixtures,
    };
    return mockTest;
  });
}

/**
 * Creates a mock for Playwright's `mergeTests()`.
 *
 * @remarks
 * Returns a vi.fn() that accepts multiple test objects and returns
 * a merged mock test object combining all fixture definitions.
 *
 * @returns A mock function simulating mergeTests() behavior.
 *
 * @example
 * ```typescript
 * const mockMerge = createMockMergeTests();
 * const merged = mockMerge(testA, testB);
 * ```
 */
export function createMockMergeTests(): ReturnType<typeof vi.fn> {
  return vi.fn().mockImplementation((...tests: MockPlaywrightTest[]) => {
    const mergedFixtures: Record<string, unknown> = {};
    for (const test of tests) {
      Object.assign(mergedFixtures, test._fixtureDefinitions);
    }
    const merged: MockPlaywrightTest = {
      extend: createMockTestExtend(),
      describe: vi.fn(),
      step: vi.fn(),
      use: vi.fn(),
      _fixtureDefinitions: mergedFixtures,
    };
    return merged;
  });
}

/**
 * Creates a mock for Playwright's `expect.extend()`.
 *
 * @remarks
 * Returns a vi.fn() that accepts custom matchers and returns an
 * extended expect mock for testing matcher registration.
 *
 * @returns A mock function simulating expect.extend() behavior.
 *
 * @example
 * ```typescript
 * const mockExpectExtend = createMockExpectExtend();
 * const customExpect = mockExpectExtend({ toBeVisible: () => ({ pass: true, message: () => '' }) });
 * ```
 */
export function createMockExpectExtend(): ReturnType<typeof vi.fn> {
  return vi.fn().mockImplementation(() => ({
    extend: vi.fn(),
  }));
}
