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
import type { ComplianceReport } from '../../../src/reporters/compliance-reporter.js';
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
    const report: ComplianceReport = JSON.parse(written) as ComplianceReport;

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

    const report: ComplianceReport = JSON.parse(content) as ComplianceReport;
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
    const report: ComplianceReport = JSON.parse(written) as ComplianceReport;

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
    const report: ComplianceReport = JSON.parse(written) as ComplianceReport;

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
    const report: ComplianceReport = JSON.parse(written) as ComplianceReport;

    // ISO date string should have 'T' separator and end with 'Z'
    expect(report.timestamp).toContain('T');
    expect(report.timestamp).toMatch(/Z$/u);
  });
});
