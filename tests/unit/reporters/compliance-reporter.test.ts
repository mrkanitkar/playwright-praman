/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for `src/reporters/compliance-reporter.ts`.
 *
 * @remarks
 * All file-system operations are mocked via `vi.mock('node:fs/promises')`.
 * No real files are written to disk.
 */

import { mkdir, writeFile } from 'node:fs/promises';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ComplianceReporter, isPramanStep } from '../../../src/reporters/compliance-reporter.js';
import type { TestComplianceReport } from '../../../src/reporters/compliance-reporter.js';
import {
  createMockFullConfig,
  createMockFullResult,
  createMockSuite,
  createMockTestCase,
  createMockTestResult,
  createMockTestStep,
} from '../../helpers/mock-playwright-reporter.js';

// ── Mock fs (hoisted by vitest) ────────────────────────────────────────────

vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const mockMkdir = vi.mocked(mkdir);
const mockWriteFile = vi.mocked(writeFile);

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ComplianceReporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('implements Reporter interface (has onBegin, onTestEnd, onEnd methods)', () => {
    const reporter = new ComplianceReporter();

    expect(typeof reporter.onBegin).toBe('function');
    expect(typeof reporter.onTestEnd).toBe('function');
    expect(typeof reporter.onEnd).toBe('function');
  });

  it('categorises Praman steps correctly', () => {
    const pramanTitles = [
      'Click button',
      'Fill input',
      'Press Enter',
      'Select item',
      'Check checkbox',
      'Uncheck toggle',
      'Clear field',
      'Get text from label',
      'Get value of input',
      'Find control by ID',
      'Find controls by type',
      'Wait for stable',
      'Destroy dialog',
      'Verify shell header',
      'Click home',
      'Open user menu',
      'Click Save',
      'Click Apply',
      'Click Cancel',
      'Click Edit',
      'Click Delete',
      'Click Create',
      'Generate test case',
      'Interpret step instruction',
      'Suggest actions for user',
      'Login to system',
      'Logout from session',
      'Check authentication status',
    ];

    for (const title of pramanTitles) {
      expect(isPramanStep(title)).toBe(true);
    }
  });

  it('categorises withStep steps correctly (title contains " > ")', () => {
    expect(isPramanStep('navigation > open tile')).toBe(true);
    expect(isPramanStep('table > select row')).toBe(true);
    expect(isPramanStep('shell > click home button')).toBe(true);
  });

  it('categorises raw Playwright steps as non-Praman', () => {
    expect(isPramanStep('page.click')).toBe(false);
    expect(isPramanStep('locator.fill')).toBe(false);
    expect(isPramanStep('expect.toBeVisible')).toBe(false);
    expect(isPramanStep('route.fulfill')).toBe(false);
  });

  // ── Regression: titles Praman actually emits ─────────────────────────────
  //
  // Measured before this fix: 12 of these 15 were classified as raw Playwright,
  // i.e. reported as compliance violations that did not exist. The ' > ' form
  // the classifier *did* recognise has zero production emitters —
  // `createStepName` is exported but never called inside `src/`.

  it('recognises every ACTION_MAP verb emitted by ui5Step', () => {
    const emitted = [
      'Click { id: "save" }',
      'Wait for UI5',
      'Inspect control { id: "t1" }',
      'Get language',
      'Get date format',
      'Get time format',
      'Get timezone',
      'Get number format',
      'Get all settings',
      'Save test data "x"',
      'Load test data "x"',
      'Cleanup test data',
      'Login',
      'Login from env',
      'Wait for control',
      'Destroy handler',
    ];

    for (const title of emitted) {
      expect(isPramanStep(title), title).toBe(true);
    }
  });

  it('recognises the dot-separated convention every withStep call site uses', () => {
    // nav-fixtures.ts:351-384 and the generic proxy at module-fixtures.ts:324
    expect(isPramanStep('ui5Navigation.navigateToApp: myApp')).toBe(true);
    expect(isPramanStep('ui5Navigation.navigateToHome')).toBe(true);
    expect(isPramanStep('ui5Navigation.getCurrentHash')).toBe(true);
    expect(isPramanStep('ui5.table.getRows')).toBe(true);
    expect(isPramanStep('ui5.dialog.dismiss')).toBe(true);
    expect(isPramanStep('ui5.getRows')).toBe(true);
  });

  it('does not treat a bare ui5 mention as the dot convention', () => {
    expect(isPramanStep('ui5 is great')).toBe(false);
    expect(isPramanStep('ui5Navigation')).toBe(false);
  });

  it('documents the residual prefix ambiguity on the title path', () => {
    // 'Check' is a real action verb, so a user step named 'Checkout flow' is
    // indistinguishable by title alone. Asserted rather than glossed over:
    // prefix matching cannot resolve this, and on 1.63 it is only resolved
    // when the author passes `params` themselves.
    expect(isPramanStep('Checkout flow')).toBe(true);

    // Supplying params removes the ambiguity.
    expect(isPramanStep({ title: 'Checkout flow', params: { orderId: 42 } })).toBe(false);
  });

  // ── 1.63 structured params take precedence over the title heuristic ──────

  it('classifies by params.praman when present, ignoring the title', () => {
    // A title the heuristic would reject, but marked structurally.
    expect(isPramanStep({ title: 'totally opaque', params: { praman: true } })).toBe(true);
  });

  it('rejects a pw:api step even when its title starts with a Praman verb', () => {
    // The false-positive direction: Playwright's own steps carry params too,
    // but never the praman marker. Previously 'Login to the supplier portal'
    // counted as Praman because 'Login' is a prefix.
    expect(
      isPramanStep({
        title: 'Login to the supplier portal',
        params: { locator: "getByRole('button')" },
      }),
    ).toBe(false);
  });

  it('falls back to the title heuristic when params is absent (PW 1.57-1.62)', () => {
    expect(isPramanStep({ title: 'Get all settings' })).toBe(true);
    expect(isPramanStep({ title: 'page.click' })).toBe(false);
  });

  it('still accepts a bare title string (public API, unchanged)', () => {
    expect(isPramanStep('Click button')).toBe(true);
  });

  it('calculates compliance percentage correctly', async () => {
    const reporter = new ComplianceReporter();
    reporter.onBegin(createMockFullConfig(), createMockSuite());

    // 2 compliant tests
    reporter.onTestEnd(
      createMockTestCase({ title: 'test-1' }),
      createMockTestResult({
        steps: [
          createMockTestStep({ title: 'Click button' }),
          createMockTestStep({ title: 'Fill input' }),
        ],
      }),
    );
    reporter.onTestEnd(
      createMockTestCase({ title: 'test-2' }),
      createMockTestResult({
        steps: [createMockTestStep({ title: 'navigation > open' })],
      }),
    );

    // 1 raw-playwright test
    reporter.onTestEnd(
      createMockTestCase({ title: 'test-3' }),
      createMockTestResult({
        steps: [createMockTestStep({ title: 'page.click' })],
      }),
    );

    // 1 mixed test
    reporter.onTestEnd(
      createMockTestCase({ title: 'test-4' }),
      createMockTestResult({
        steps: [
          createMockTestStep({ title: 'Click button' }),
          createMockTestStep({ title: 'page.click' }),
        ],
      }),
    );

    await reporter.onEnd(createMockFullResult());

    const written = mockWriteFile.mock.calls[0]?.[1] as string;
    const report: TestComplianceReport = JSON.parse(written) as TestComplianceReport;

    expect(report.totalTests).toBe(4);
    expect(report.compliantTests).toBe(2);
    expect(report.rawPlaywrightTests).toBe(1);
    expect(report.mixedTests).toBe(1);
    // 2 out of 4 compliant = 50%
    expect(report.compliancePercentage).toBe(50);
  });

  it('writes JSON output to configured dir', async () => {
    const reporter = new ComplianceReporter({ outputDir: '/custom/reports' });
    reporter.onBegin(createMockFullConfig(), createMockSuite());

    reporter.onTestEnd(
      createMockTestCase({ title: 'my test' }),
      createMockTestResult({
        steps: [createMockTestStep({ title: 'Click save' })],
      }),
    );

    await reporter.onEnd(createMockFullResult());

    expect(mockMkdir).toHaveBeenCalledWith('/custom/reports', { recursive: true });
    expect(mockWriteFile).toHaveBeenCalledOnce();

    const [filePath, content, encoding] = mockWriteFile.mock.calls[0] as [string, string, string];
    expect(filePath).toContain('compliance-report.json');
    expect(encoding).toBe('utf8');

    const report: TestComplianceReport = JSON.parse(content) as TestComplianceReport;
    expect(report.totalTests).toBe(1);
    expect(report.tests[0]?.testTitle).toBe('my test');
  });

  it('handles test with no steps (0 total counts as compliant)', async () => {
    const reporter = new ComplianceReporter();
    reporter.onBegin(createMockFullConfig(), createMockSuite());

    reporter.onTestEnd(
      createMockTestCase({ title: 'empty test' }),
      createMockTestResult({ steps: [] }),
    );

    await reporter.onEnd(createMockFullResult());

    const written = mockWriteFile.mock.calls[0]?.[1] as string;
    const report: TestComplianceReport = JSON.parse(written) as TestComplianceReport;

    expect(report.tests[0]?.status).toBe('compliant');
    expect(report.tests[0]?.totalSteps).toBe(0);
    expect(report.compliantTests).toBe(1);
    expect(report.compliancePercentage).toBe(100);
  });

  it('handles mixed compliance (some Praman + some raw in same test)', async () => {
    const reporter = new ComplianceReporter();
    reporter.onBegin(createMockFullConfig(), createMockSuite());

    reporter.onTestEnd(
      createMockTestCase({ title: 'mixed test' }),
      createMockTestResult({
        steps: [
          createMockTestStep({ title: 'Click button' }),
          createMockTestStep({ title: 'navigation > open page' }),
          createMockTestStep({ title: 'page.click' }),
          createMockTestStep({ title: 'locator.fill' }),
        ],
      }),
    );

    await reporter.onEnd(createMockFullResult());

    const written = mockWriteFile.mock.calls[0]?.[1] as string;
    const report: TestComplianceReport = JSON.parse(written) as TestComplianceReport;

    const entry = report.tests[0];
    expect(entry?.status).toBe('mixed');
    expect(entry?.pramanSteps).toBe(2);
    expect(entry?.rawPlaywrightSteps).toBe(2);
    expect(entry?.totalSteps).toBe(4);
  });

  it('printsToStdio returns false', () => {
    const reporter = new ComplianceReporter();
    expect(reporter.printsToStdio()).toBe(false);
  });

  it('uses default output dir when none specified', async () => {
    const reporter = new ComplianceReporter();
    reporter.onBegin(createMockFullConfig(), createMockSuite());

    reporter.onTestEnd(
      createMockTestCase({ title: 'default dir test' }),
      createMockTestResult({ steps: [] }),
    );

    await reporter.onEnd(createMockFullResult());

    const mkdirPath = mockMkdir.mock.calls[0]?.[0] as string;
    expect(mkdirPath).toContain('test-results');
    expect(mkdirPath).toContain('praman-reports');
  });

  it('includes timestamp in report', async () => {
    const reporter = new ComplianceReporter();
    reporter.onBegin(createMockFullConfig(), createMockSuite());

    reporter.onTestEnd(
      createMockTestCase({ title: 'timestamp test' }),
      createMockTestResult({ steps: [] }),
    );

    await reporter.onEnd(createMockFullResult());

    const written = mockWriteFile.mock.calls[0]?.[1] as string;
    const report: TestComplianceReport = JSON.parse(written) as TestComplianceReport;

    // ISO date string should have 'T' separator and end with 'Z'
    expect(report.timestamp).toContain('T');
    expect(report.timestamp).toMatch(/Z$/u);
  });
});

// ── Raw-locator enrichment (Playwright 1.63) ───────────────────────────────
//
// 1.63 reports the target locator on Playwright's own pw:api steps, so a raw
// call can be named rather than merely counted. Everything here goes through
// the same allow-list redactor the OTel reporter uses.

describe('ComplianceReporter raw-locator enrichment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /** Runs one test's steps through the reporter and returns the written report. */
  async function reportFor(
    steps: ReturnType<typeof createMockTestStep>[],
  ): Promise<TestComplianceReport> {
    const reporter = new ComplianceReporter();
    reporter.onBegin(createMockFullConfig(), createMockSuite());
    reporter.onTestEnd(createMockTestCase({ title: 't' }), createMockTestResult({ steps }));
    await reporter.onEnd(createMockFullResult());

    const [, content] = mockWriteFile.mock.calls[0] as [string, string, string];
    return JSON.parse(content) as TestComplianceReport;
  }

  it('names the locator behind a raw Playwright step', async () => {
    const report = await reportFor([
      createMockTestStep({
        title: 'locator.click',
        category: 'pw:api',
        params: { locator: "getByRole('button')" },
      }),
    ]);

    expect(report.tests[0]?.rawPlaywrightSteps).toBe(1);
    expect(report.tests[0]?.rawPlaywrightLocators).toEqual(["getByRole('button')"]);
  });

  it('never writes a typed password to the report', async () => {
    const report = await reportFor([
      createMockTestStep({
        title: 'locator.fill',
        category: 'pw:api',
        params: { locator: "getByLabel('Password')", value: 'hunter2' },
      }),
    ]);

    const [, content] = mockWriteFile.mock.calls[0] as [string, string, string];
    expect(content).not.toContain('hunter2');
    expect(report.tests[0]?.rawPlaywrightLocators).toEqual(["getByLabel('Password')"]);
  });

  it('deduplicates repeated locators', async () => {
    const report = await reportFor([
      createMockTestStep({ title: 'locator.click', params: { locator: 'getByText("A")' } }),
      createMockTestStep({ title: 'locator.click', params: { locator: 'getByText("A")' } }),
      createMockTestStep({ title: 'locator.click', params: { locator: 'getByText("B")' } }),
    ]);

    expect(report.tests[0]?.rawPlaywrightSteps).toBe(3);
    expect(report.tests[0]?.rawPlaywrightLocators).toEqual(['getByText("A")', 'getByText("B")']);
  });

  it('omits an empty locator rather than recording a blank entry', async () => {
    const report = await reportFor([
      createMockTestStep({ title: 'locator.click', params: { locator: '' } }),
    ]);

    expect(report.tests[0]?.rawPlaywrightLocators).toEqual([]);
  });

  it('records no locators on PW 1.57-1.62, where params does not exist', async () => {
    const report = await reportFor([createMockTestStep({ title: 'locator.click' })]);

    expect(report.tests[0]?.rawPlaywrightSteps).toBe(1);
    expect(report.tests[0]?.rawPlaywrightLocators).toEqual([]);
  });

  it('reports 100% compliance for a run with no tests at all', async () => {
    const reporter = new ComplianceReporter();
    reporter.onBegin(createMockFullConfig(), createMockSuite());
    await reporter.onEnd(createMockFullResult());

    const [, content] = mockWriteFile.mock.calls[0] as [string, string, string];
    const report = JSON.parse(content) as TestComplianceReport;
    expect(report.totalTests).toBe(0);
    expect(report.compliancePercentage).toBe(100);
  });
});

describe('isPramanStep robustness', () => {
  it('does not throw when params is null', () => {
    // A reporter that throws inside onTestEnd takes the whole run's reporting
    // with it, so a malformed params must degrade to the title heuristic.
    expect(() => isPramanStep({ title: 'Click save', params: null })).not.toThrow();
    expect(isPramanStep({ title: 'Click save', params: null })).toBe(true);
    expect(isPramanStep({ title: 'page.click', params: null })).toBe(false);
  });
});
