/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Mock Playwright reporter objects for reporter unit tests.
 *
 * @remarks
 * Provides factory functions for `TestCase`, `TestResult`, `TestStep`,
 * `FullResult`, `FullConfig`, and `Suite` mocks. All factories return objects
 * that satisfy the reporter interface contracts without requiring a live
 * Playwright test runner.
 *
 * @example
 * ```typescript
 * import { createMockTestCase, createMockTestResult } from '../../helpers/mock-playwright-reporter.js';
 *
 * const testCase = createMockTestCase({ title: 'should log in' });
 * const result = createMockTestResult({ status: 'passed', duration: 1200 });
 * myReporter.onTestEnd(testCase, result);
 * ```
 *
 * @module test-helpers
 */

import type {
  TestCase,
  TestResult,
  TestStep,
  FullResult,
  FullConfig,
  Suite,
} from '@playwright/test/reporter';

/** Overrides for {@link createMockTestCase}. */
export interface TestCaseOverrides {
  readonly title: string;
  readonly titlePath: string[];
  readonly location: { file: string; line: number; column: number };
}

/** Overrides for {@link createMockTestResult}. */
export interface TestResultOverrides {
  readonly status: TestResult['status'];
  readonly duration: number;
  readonly steps: TestStep[];
}

/** Overrides for {@link createMockTestStep}. */
export interface TestStepOverrides {
  readonly title: string;
  readonly category: string;
  readonly duration: number;
  readonly error?: TestStep['error'];
  readonly steps: TestStep[];
}

/**
 * Creates a mock `TestCase` for use in reporter unit tests.
 *
 * @param overrides - Optional property overrides applied to the default mock.
 * @returns A `TestCase`-conformant object with sensible defaults.
 *
 * @example
 * ```typescript
 * const tc = createMockTestCase({ title: 'should render button' });
 * expect(tc.titlePath()).toContain('should render button');
 * ```
 */
export function createMockTestCase(overrides?: Partial<TestCaseOverrides>): TestCase {
  const title = overrides?.title ?? 'mock test';
  const path = overrides?.titlePath ?? ['root', 'mock-file.spec.ts', title];
  const location = overrides?.location ?? { file: 'mock-file.spec.ts', line: 1, column: 1 };

  return {
    title,
    titlePath: () => path,
    location,
    id: `mock-id-${title.replaceAll(/\s+/gu, '-')}`,
    ok: () => true,
    outcome: () => 'expected',
    expectedStatus: 'passed',
    repeatEachIndex: 0,
    retries: 0,
    tags: [],
    timeout: 30000,
    annotations: [],
    results: [],
    type: 'test',
    parent: {} as Suite,
  };
}

/**
 * Creates a mock `TestResult` for use in reporter unit tests.
 *
 * @param overrides - Optional property overrides applied to the default mock.
 * @returns A `TestResult`-conformant object with sensible defaults.
 *
 * @example
 * ```typescript
 * const result = createMockTestResult({ status: 'failed', duration: 5000 });
 * expect(result.status).toBe('failed');
 * ```
 */
export function createMockTestResult(overrides?: Partial<TestResultOverrides>): TestResult {
  return {
    status: overrides?.status ?? 'passed',
    duration: overrides?.duration ?? 100,
    steps: overrides?.steps ?? [],
    attachments: [],
    annotations: [],
    errors: [],
    stderr: [],
    stdout: [],
    parallelIndex: 0,
    retry: 0,
    startTime: new Date('2026-01-01T00:00:00Z'),
    workerIndex: 0,
  };
}

/**
 * Creates a mock `TestStep` for use in reporter unit tests.
 *
 * @param overrides - Optional property overrides applied to the default mock.
 * @returns A `TestStep`-conformant object with sensible defaults.
 *
 * @example
 * ```typescript
 * const step = createMockTestStep({ title: 'Click button', category: 'pw:api', duration: 50 });
 * ```
 */
export function createMockTestStep(overrides?: Partial<TestStepOverrides>): TestStep {
  const base = {
    title: overrides?.title ?? 'mock step',
    category: overrides?.category ?? 'test.step',
    duration: overrides?.duration ?? 10,
    steps: overrides?.steps ?? [],
    annotations: [] as TestStep['annotations'],
    attachments: [] as TestStep['attachments'],
    startTime: new Date('2026-01-01T00:00:00Z'),
    titlePath: () => [overrides?.title ?? 'mock step'],
  };
  // exactOptionalPropertyTypes: only spread error key when it is actually defined
  return overrides?.error !== undefined ? { ...base, error: overrides.error } : base;
}

/**
 * Creates a mock `FullResult` for use in reporter unit tests.
 *
 * @param overrides - Optional property overrides applied to the default mock.
 * @returns A `FullResult`-conformant object with sensible defaults.
 *
 * @example
 * ```typescript
 * const fullResult = createMockFullResult({ status: 'failed' });
 * expect(fullResult.status).toBe('failed');
 * ```
 */
export function createMockFullResult(overrides?: Partial<Pick<FullResult, 'status'>>): FullResult {
  return {
    status: overrides?.status ?? 'passed',
    startTime: new Date('2026-01-01T00:00:00Z'),
    duration: 5000,
  };
}

/**
 * Creates a minimal mock `FullConfig` for use in reporter unit tests.
 *
 * @returns A `FullConfig`-conformant object with sensible defaults.
 *
 * @example
 * ```typescript
 * const config = createMockFullConfig();
 * myReporter.onBegin(config, createMockSuite());
 * ```
 */
export function createMockFullConfig(): FullConfig {
  return {
    rootDir: '/mock/project',
    configFile: '/mock/project/playwright.config.ts',
    forbidOnly: false,
    fullyParallel: false,
    globalSetup: null,
    globalTeardown: null,
    globalTimeout: 0,
    grep: /.*/,
    grepInvert: null,
    maxFailures: 0,
    metadata: {},
    preserveOutput: 'always',
    projects: [],
    reporter: [],
    reportSlowTests: null,
    quiet: false,
    shard: null,
    updateSnapshots: 'missing',
    version: '1.0.0',
    workers: 1,
    webServer: null,
  } as unknown as FullConfig;
}

/**
 * Creates a minimal mock `Suite` for use in reporter unit tests.
 *
 * @param tests - Optional list of `TestCase` objects to include in the suite.
 * @returns A `Suite`-conformant object with sensible defaults.
 *
 * @example
 * ```typescript
 * const tc = createMockTestCase({ title: 'my test' });
 * const suite = createMockSuite([tc]);
 * myReporter.onBegin(createMockFullConfig(), suite);
 * ```
 */
export function createMockSuite(tests: TestCase[] = []): Suite {
  return {
    title: 'mock-suite',
    type: 'root',
    suites: [],
    tests,
    allTests: () => tests,
    entries: () => tests,
    titlePath: () => ['mock-suite'],
    project: () => undefined,
  };
}
