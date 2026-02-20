/**
 * Mock `test.step()` and `test.info()` for decorator unit tests.
 *
 * @remarks
 * Provides configurable mocks for Playwright's `test.step()` and `test.info()`
 * to support testing decorators and utilities that depend on test context.
 * Supports simulating both in-test and hook contexts.
 *
 * @example
 * ```typescript
 * import { createMockTestStep } from '../../helpers/mock-test-step.js';
 *
 * const { test, getStepCalls } = createMockTestStep();
 * await test.step('my step', async () => { ... });
 * expect(getStepCalls()[0][0]).toBe('my step');
 * ```
 *
 * @module test-helpers
 */

import { vi } from 'vitest';

/** Configuration for the mock test step behavior. */
export interface MockTestStepConfig {
  /** Whether test.info() should return a truthy value (inside test context). */
  readonly insideTestContext: boolean;
  /** Whether test.step() should throw (simulates hook context where step is invalid). */
  readonly stepThrows: boolean;
}

/** The shape returned by {@link createMockTestStep}. */
export interface MockTestStepResult {
  /** Partial mock of the Playwright `test` object. */
  readonly test: {
    readonly info: ReturnType<typeof vi.fn>;
    readonly step: ReturnType<typeof vi.fn>;
  };
  /** Returns all recorded step calls as `[stepName, fn, options][]`. */
  getStepCalls(): [string, () => Promise<unknown>, unknown][];
}

/**
 * Creates a mock for `@playwright/test`'s `test` object with configurable
 * `test.info()` and `test.step()`.
 *
 * @param config - Controls whether mocks simulate test context or hook context.
 * @returns A mock `test` object and a helper to introspect recorded step calls.
 *
 * @example
 * ```typescript
 * const { test, getStepCalls } = createMockTestStep({ insideTestContext: true, stepThrows: false });
 * await test.step('validate', async () => 'done');
 * expect(getStepCalls()[0][0]).toBe('validate');
 * ```
 *
 * @example
 * ```typescript
 * // Simulate hook context where test.step() is invalid
 * const { test } = createMockTestStep({ insideTestContext: false, stepThrows: true });
 * await expect(test.step('x', async () => {})).rejects.toThrow('test.step() is not allowed in hooks');
 * ```
 */
export function createMockTestStep(
  config: MockTestStepConfig = { insideTestContext: true, stepThrows: false },
): MockTestStepResult {
  const stepFn = config.stepThrows
    ? vi.fn().mockImplementation(() => {
        throw new Error('test.step() is not allowed in hooks');
      })
    : vi.fn().mockImplementation(async (_name: string, fn: () => Promise<unknown>) => fn());

  const infoFn = config.insideTestContext
    ? vi.fn().mockReturnValue({ title: 'mock-test', timeout: 30000 })
    : vi.fn().mockImplementation(() => {
        throw new Error('test.info() is not available outside test context');
      });

  return {
    test: {
      info: infoFn,
      step: stepFn,
    },
    getStepCalls: () => stepFn.mock.calls as [string, () => Promise<unknown>, unknown][],
  };
}
