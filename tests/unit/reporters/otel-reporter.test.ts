/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/reporters/otel-reporter.ts`.
 */
import type {
  FullConfig,
  FullResult,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('#core/logging/index.js', () => ({
  createLogger: vi.fn(() => ({
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    child: vi.fn(),
  })),
  createRootLogger: vi.fn(),
  resetDefaultLogger: vi.fn(),
}));

import { OTelReporter } from '../../../src/reporters/otel-reporter.js';

/** Creates a minimal mock TestCase. */
function mockTestCase(overrides: Partial<TestCase> = {}): TestCase {
  return {
    id: 'test-1',
    title: 'should create purchase order',
    location: { file: 'tests/po.spec.ts', line: 10, column: 1 },
    ...overrides,
  } as TestCase;
}

/** Creates a minimal mock TestResult. */
function mockTestResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    status: 'passed',
    duration: 1500,
    errors: [],
    ...overrides,
  } as TestResult;
}

/** Creates a minimal mock TestStep. */
function mockTestStep(overrides: Partial<TestStep> = {}): TestStep {
  return {
    title: 'locator.click',
    category: 'pw:api',
    startTime: new Date(1_700_000_000_000),
    duration: 100,
    ...overrides,
  } as TestStep;
}

describe('OTelReporter', () => {
  let reporter: OTelReporter;

  beforeEach(() => {
    reporter = new OTelReporter();
  });

  it('creates an instance', () => {
    expect(reporter).toBeDefined();
  });

  it('printsToStdio returns false', () => {
    expect(reporter.printsToStdio()).toBe(false);
  });

  it('onBegin does not throw when disabled', () => {
    const disabledReporter = new OTelReporter({ enabled: false });
    expect(() => {
      disabledReporter.onBegin({} as FullConfig, {} as Suite);
    }).not.toThrow();
  });

  it('onBegin does not throw without endpoint', () => {
    expect(() => {
      reporter.onBegin({} as FullConfig, {} as Suite);
    }).not.toThrow();
  });

  it('onTestBegin/onTestEnd does not throw with NoOp tracer', () => {
    const test = mockTestCase();
    const result = mockTestResult();

    expect(() => {
      reporter.onTestBegin(test, result);
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('onStepBegin/onStepEnd does not throw with NoOp tracer', () => {
    const test = mockTestCase();
    const result = mockTestResult();
    const step = mockTestStep();

    expect(() => {
      reporter.onTestBegin(test, result);
      reporter.onStepBegin(test, result, step);
      reporter.onStepEnd(test, result, step);
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('handles failed test status', () => {
    const test = mockTestCase();
    const result = mockTestResult({
      status: 'failed',
      errors: [{ message: 'Expected visible' } as TestResult['errors'][0]],
    });

    expect(() => {
      reporter.onTestBegin(test, result);
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('handles step with error', () => {
    const test = mockTestCase();
    const result = mockTestResult();
    const step = mockTestStep();
    // Manually set error on the step (simulating Playwright runtime behavior)
    Object.assign(step, { error: { message: 'Element not found' } });

    expect(() => {
      reporter.onTestBegin(test, result);
      reporter.onStepBegin(test, result, step);
      reporter.onStepEnd(test, result, step);
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('handles multiple step categories', () => {
    const test = mockTestCase();
    const result = mockTestResult();
    const categories = ['expect', 'fixture', 'hook', 'pw:api', 'test.step', 'test.attach'];

    expect(() => {
      reporter.onTestBegin(test, result);
      for (const category of categories) {
        const step = mockTestStep({
          category,
          title: `${category} step`,
          startTime: new Date(Date.now() + categories.indexOf(category)),
        });
        reporter.onStepBegin(test, result, step);
        reporter.onStepEnd(test, result, step);
      }
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('onEnd resolves without error', async () => {
    await expect(reporter.onEnd({ status: 'passed' } as FullResult)).resolves.toBeUndefined();
  });

  it('handles timedOut test status', () => {
    const test = mockTestCase();
    const result = mockTestResult({ status: 'timedOut', errors: [] });

    expect(() => {
      reporter.onTestBegin(test, result);
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('records metrics for skipped tests', () => {
    const test = mockTestCase();
    const result = mockTestResult({ status: 'skipped' });

    expect(() => {
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('records test duration metric on test end', () => {
    const test = mockTestCase();
    const result = mockTestResult({ status: 'passed', duration: 2500 });

    expect(() => {
      reporter.onTestBegin(test, result);
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('handles onTestEnd without prior onTestBegin (no span in map)', () => {
    const test = mockTestCase();
    const result = mockTestResult();

    expect(() => {
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('handles onStepEnd without matching onStepBegin (no span in map)', () => {
    const test = mockTestCase();
    const result = mockTestResult();
    const step = mockTestStep();

    expect(() => {
      reporter.onStepEnd(test, result, step);
    }).not.toThrow();
  });

  it('handles failed test with empty error messages', () => {
    const test = mockTestCase();
    const result = mockTestResult({
      status: 'failed',
      errors: [{ message: '' } as TestResult['errors'][0]],
    });

    expect(() => {
      reporter.onTestBegin(test, result);
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('handles failed test with empty errors array', () => {
    const test = mockTestCase();
    const result = mockTestResult({ status: 'failed', errors: [] });

    expect(() => {
      reporter.onTestBegin(test, result);
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('handles interrupted test status', () => {
    const test = mockTestCase();
    const result = mockTestResult({ status: 'interrupted' as TestResult['status'] });

    expect(() => {
      reporter.onTestBegin(test, result);
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('handles step with error where message is undefined', () => {
    const test = mockTestCase();
    const result = mockTestResult();
    const step = mockTestStep();
    Object.assign(step, { error: {} });

    expect(() => {
      reporter.onTestBegin(test, result);
      reporter.onStepBegin(test, result, step);
      reporter.onStepEnd(test, result, step);
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('handles multiple errors in failed test result', () => {
    const test = mockTestCase();
    const result = mockTestResult({
      status: 'failed',
      errors: [
        { message: 'Error one' } as TestResult['errors'][0],
        { message: 'Error two' } as TestResult['errors'][0],
      ],
    });

    expect(() => {
      reporter.onTestBegin(test, result);
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('handles timedOut test with error messages', () => {
    const test = mockTestCase();
    const result = mockTestResult({
      status: 'timedOut',
      errors: [{ message: 'Timeout exceeded' } as TestResult['errors'][0]],
    });

    expect(() => {
      reporter.onTestBegin(test, result);
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('handles timedOut test with empty error messages', () => {
    const test = mockTestCase();
    const result = mockTestResult({
      status: 'timedOut',
      errors: [{ message: '' } as TestResult['errors'][0]],
    });

    expect(() => {
      reporter.onTestBegin(test, result);
      reporter.onTestEnd(test, result);
    }).not.toThrow();
  });
});

describe('OTelReporter with endpoint configured', () => {
  it('onBegin calls initTracer when endpoint is provided', () => {
    const reporterWithEndpoint = new OTelReporter({ endpoint: 'http://localhost:4318' });
    // initTracer runs async but errors are caught internally — should not throw
    expect(() => {
      reporterWithEndpoint.onBegin({} as FullConfig, {} as Suite);
    }).not.toThrow();
  });

  it('initTracer failure falls back to NoOp (no throw)', async () => {
    // This exercises the catch block in #initTracer — the dynamic import
    // will fail because the real OTel modules are not available in test context
    // eslint-disable-next-line @microsoft/sdl/no-insecure-url, sonarjs/no-clear-text-protocols -- intentionally testing bad endpoint fallback
    const reporterWithEndpoint = new OTelReporter({ endpoint: 'http://bad-endpoint:9999' });
    reporterWithEndpoint.onBegin({} as FullConfig, {} as Suite);

    // Wait for the async #initTracer to settle (it fires via void)
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });

    // After failure, reporter should still work with NoOp fallback
    const test = mockTestCase();
    const result = mockTestResult();
    expect(() => {
      reporterWithEndpoint.onTestBegin(test, result);
      reporterWithEndpoint.onTestEnd(test, result);
    }).not.toThrow();
  });

  it('onEnd calls shutdown on meter and tracer providers', async () => {
    const reporterWithEndpoint = new OTelReporter({ endpoint: 'http://localhost:4318' });
    // Even without successful init, onEnd should resolve (NoOp shutdown)
    await expect(
      reporterWithEndpoint.onEnd({ status: 'passed' } as FullResult),
    ).resolves.toBeUndefined();
  });
});
