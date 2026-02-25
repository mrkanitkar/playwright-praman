/**
 * Compliance reporter that tracks whether test steps use Praman's UI5
 * abstractions versus raw Playwright calls.
 *
 * @remarks
 * Generates a JSON report summarising per-test compliance status. Each test
 * is classified as `compliant`, `raw-playwright`, or `mixed` based on its
 * `result.steps[]` titles in {@link onTestEnd}.
 *
 * @example
 * ```typescript
 * // playwright.config.ts
 * import { defineConfig } from '@playwright/test';
 *
 * export default defineConfig({
 *   reporter: [
 *     ['playwright-praman/reporters', { outputDir: 'test-results/praman-reports' }],
 *   ],
 * });
 * ```
 *
 * @module reporters
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

// ── Exported types ─────────────────────────────────────────────────────────

/** Classification of a single test's compliance. */
export type TestComplianceStatus = 'compliant' | 'raw-playwright' | 'mixed';

/** Per-test compliance entry. */
export interface TestComplianceEntry {
  readonly testTitle: string;
  readonly testFile: string;
  readonly status: TestComplianceStatus;
  readonly pramanSteps: number;
  readonly rawPlaywrightSteps: number;
  readonly totalSteps: number;
}

/** Full compliance report written to disk. */
export interface TestComplianceReport {
  readonly timestamp: string;
  readonly totalTests: number;
  readonly compliantTests: number;
  readonly rawPlaywrightTests: number;
  readonly mixedTests: number;
  readonly compliancePercentage: number;
  readonly tests: readonly TestComplianceEntry[];
}

/** Configuration options accepted by the reporter constructor. */
export interface ComplianceReporterOptions {
  readonly outputDir?: string;
}

// ── Step categorisation ────────────────────────────────────────────────────

/**
 * Praman action verb prefixes used to identify Praman-managed test steps.
 *
 * @internal
 */
const PRAMAN_STEP_PREFIXES: readonly string[] = [
  'Click',
  'Fill',
  'Press',
  'Select',
  'Check',
  'Uncheck',
  'Clear',
  'Get text',
  'Get value',
  'Find control',
  'Find controls',
  'Wait for',
  'Destroy',
  'Verify shell header',
  'Click home',
  'Open user menu',
  'Click Save',
  'Click Apply',
  'Click Cancel',
  'Click Edit',
  'Click Delete',
  'Click Create',
  'Generate test',
  'Interpret step',
  'Suggest actions',
  'Login',
  'Logout',
  'Check authentication',
];

/**
 * Determines whether a step title belongs to a Praman-managed step.
 *
 * A step is considered a Praman step when it either:
 * - starts with one of the known Praman action verbs, or
 * - contains ` \> ` (the withStep wrapper pattern `module \> action`).
 *
 * @param title - The step title to classify.
 * @returns `true` if the step was produced by a Praman abstraction.
 *
 * @example
 * ```typescript
 * isPramanStep('Click button');       // true
 * isPramanStep('navigation > open');  // true
 * isPramanStep('page.click');         // false
 * ```
 */
export function isPramanStep(title: string): boolean {
  if (title.includes(' > ')) {
    return true;
  }
  return PRAMAN_STEP_PREFIXES.some((prefix) => title.startsWith(prefix));
}

// ── Default output directory ───────────────────────────────────────────────

const DEFAULT_OUTPUT_DIR = join('test-results', 'praman-reports');

// ── Reporter class ─────────────────────────────────────────────────────────

/**
 * Playwright reporter that writes a per-test compliance summary to disk.
 *
 * @example
 * ```typescript
 * // Instantiate directly (Playwright does this via config)
 * const reporter = new ComplianceReporter({ outputDir: 'reports' });
 * ```
 */
export class ComplianceReporter implements Reporter {
  private readonly outputDir: string;
  private readonly entries: TestComplianceEntry[] = [];

  constructor(options?: ComplianceReporterOptions) {
    this.outputDir = options?.outputDir ?? DEFAULT_OUTPUT_DIR;
  }

  /** Called when the test run begins. No-op for this reporter. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by Reporter interface
  onBegin(_config: FullConfig, _suite: Suite): void {
    // intentional no-op — the reporter collects data in onTestEnd
  }

  /**
   * Called after each individual test finishes.
   *
   * @remarks
   * Iterates over `result.steps` and classifies each step as either a Praman
   * step or a raw Playwright step based on its title.
   *
   * @param test - The finished test case.
   * @param result - The test result containing step data.
   */
  onTestEnd(test: TestCase, result: TestResult): void {
    const steps = result.steps;
    let pramanCount = 0;
    let rawCount = 0;

    for (const step of steps) {
      if (isPramanStep(step.title)) {
        pramanCount++;
      } else {
        rawCount++;
      }
    }

    const total = pramanCount + rawCount;
    const status = categoriseStatus(pramanCount, rawCount);

    this.entries.push({
      testTitle: test.title,
      testFile: test.location.file,
      status,
      pramanSteps: pramanCount,
      rawPlaywrightSteps: rawCount,
      totalSteps: total,
    });
  }

  /** Called after all tests have finished. Writes the compliance report JSON. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by Reporter interface
  async onEnd(_result: FullResult): Promise<void> {
    const report = buildReport(this.entries);

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from trusted outputDir option + literal filename
    await mkdir(this.outputDir, { recursive: true });
    const filePath = join(this.outputDir, 'compliance-report.json');
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from trusted outputDir option + literal filename
    await writeFile(filePath, JSON.stringify(report, undefined, 2), 'utf8');
  }

  /**
   * Indicates whether this reporter prints to stdout/stderr.
   *
   * @returns `false` — this reporter writes only to a JSON file.
   */
  printsToStdio(): boolean {
    return false;
  }
}

// ── Internal helpers ───────────────────────────────────────────────────────

/**
 * Derives the compliance status from step counts.
 *
 * @internal
 */
function categoriseStatus(pramanCount: number, rawCount: number): TestComplianceStatus {
  if (pramanCount === 0 && rawCount === 0) {
    return 'compliant';
  }
  if (rawCount === 0) {
    return 'compliant';
  }
  if (pramanCount === 0) {
    return 'raw-playwright';
  }
  return 'mixed';
}

/**
 * Assembles the full compliance report from individual entries.
 *
 * @internal
 */
function buildReport(entries: readonly TestComplianceEntry[]): TestComplianceReport {
  const compliantTests = entries.filter((e) => e.status === 'compliant').length;
  const rawPlaywrightTests = entries.filter((e) => e.status === 'raw-playwright').length;
  const mixedTests = entries.filter((e) => e.status === 'mixed').length;
  const totalTests = entries.length;

  const compliancePercentage =
    totalTests === 0 ? 100 : Math.round((compliantTests / totalTests) * 100);

  return {
    timestamp: new Date().toISOString(),
    totalTests,
    compliantTests,
    rawPlaywrightTests,
    mixedTests,
    compliancePercentage,
    tests: entries,
  };
}
