/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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

import { redactStepParams } from '#core/logging/redaction.js';
import { matchesPramanStepTitle } from '#core/utils/step-actions.js';

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
  /**
   * Locators used by raw Playwright steps, deduplicated.
   *
   * @remarks
   * Requires Playwright 1.63+, which reports the target locator on its own
   * `pw:api` steps. Always empty on 1.57-1.62 — the count above is then the
   * only signal available, as before.
   */
  readonly rawPlaywrightLocators: readonly string[];
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
 * The minimum a step must expose to be classified.
 *
 * @remarks
 * Structural rather than Playwright's `TestStep`, deliberately: `params` only
 * exists from 1.63, so a structural type with an optional key compiles and
 * behaves correctly across the whole supported range.
 *
 * @example
 * ```typescript
 * const step: ClassifiableStep = { title: 'Click', params: { praman: true } };
 * ```
 */
export interface ClassifiableStep {
  readonly title: string;
  readonly params?: Readonly<Record<string, unknown>> | undefined;
}

/**
 * Determines whether a step was produced by a Praman abstraction.
 *
 * @remarks
 * Two tiers, and the order matters:
 *
 * 1. **Structural (Playwright 1.63+)** — when `params` is present it is
 *    authoritative. Praman stamps `{ praman: true }` via `buildStepOptions`;
 *    Playwright's own `pw:api` steps populate `params` too but never that
 *    marker, so a step carrying params without it is definitively *not* Praman.
 *    This makes classification exact for every Praman step and every `pw:api`
 *    step. It does **not** fix a bare `test.step('Checkout flow', fn)` written
 *    by a user: Playwright only fills `params` from what the author passed, so
 *    with none it falls to tier 2 and `'Check'` still matches as a prefix.
 *    Eliminating that needs the author to pass `params`, which Praman cannot
 *    do on their behalf.
 * 2. **Title heuristic (1.57-1.62)** — {@link matchesPramanStepTitle}, now
 *    derived from `ACTION_MAP` rather than a hand-maintained copy that had
 *    drifted by 10 verbs.
 *
 * Accepts a bare title string as before, so existing callers are unaffected.
 *
 * @param stepOrTitle - A step, or just its title.
 * @returns `true` if the step was produced by a Praman abstraction.
 *
 * @example
 * ```typescript
 * isPramanStep('Click button');                            // true
 * isPramanStep('ui5.table.getRows');                       // true
 * isPramanStep({ title: 'x', params: { praman: true } });  // true
 * isPramanStep({ title: 'Login now', params: { locator: 'x' } }); // false
 * isPramanStep('page.click');                              // false
 * ```
 */
/**
 * Reads `TestStep.params` without requiring the property to exist in the type.
 *
 * @remarks
 * `params` was added to `TestStep` in Playwright 1.63. Accessing `step.params`
 * directly compiles here but fails `tsc` against the 1.57 floor with
 * `TS2339: Property 'params' does not exist on type 'TestStep'` — a *build*
 * error for floor users, invisible to a typecheck on 1.63. `Reflect.get` is the
 * same escape hatch `control-wait.ts` uses for `locator.waitForFunction`.
 *
 * @param step - Any step-like value.
 * @returns The params record, or `undefined` on 1.57-1.62.
 */
function readStepParams(step: object): Readonly<Record<string, unknown>> | undefined {
  const params: unknown = Reflect.get(step, 'params');
  return typeof params === 'object' && params !== null
    ? (params as Readonly<Record<string, unknown>>)
    : undefined;
}

export function isPramanStep(stepOrTitle: string | ClassifiableStep): boolean {
  if (typeof stepOrTitle === 'string') {
    return matchesPramanStepTitle(stepOrTitle);
  }

  const { params } = stepOrTitle;
  if (params !== undefined) {
    return params['praman'] === true;
  }

  return matchesPramanStepTitle(stepOrTitle.title);
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
    const rawLocators = new Set<string>();

    for (const step of steps) {
      if (isPramanStep(step)) {
        pramanCount++;
        continue;
      }
      rawCount++;

      // Playwright 1.63+ names the locator a raw call used, turning a bare
      // count into something a user can act on. Routed through the redactor
      // so no step param can reach disk without passing the allow-list.
      const locator = redactStepParams(readStepParams(step))?.['locator'];
      if (locator !== undefined && locator !== '') {
        rawLocators.add(locator);
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
      rawPlaywrightLocators: [...rawLocators],
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
