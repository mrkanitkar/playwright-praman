/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * OTel Playwright Reporter — emits OpenTelemetry spans for test lifecycle events.
 *
 * @remarks
 * Implements the Playwright Reporter interface to create OTel spans for each
 * test run, test case, and test step. Spans are nested:
 *
 * ```text
 * test.run ("should create purchase order")     ← onTestBegin/onTestEnd
 *   hook: "auth.setup"                          ← category: 'hook'
 *   fixture: "ui5"                              ← category: 'fixture'
 *   test.step: "Fill header fields"             ← category: 'test.step'
 *     pw:api: "locator.click"                   ← category: 'pw:api'
 *     expect: "expect.toBeVisible"              ← category: 'expect'
 * ```
 *
 * The reporter initializes its own TracerProvider (separate from fixtures)
 * because the Playwright Reporter runs in a different process from test workers.
 *
 * @example
 * ```typescript
 * // playwright.config.ts
 * import { defineConfig } from '\@playwright/test';
 *
 * export default defineConfig({
 *   reporter: [
 *     ['playwright-praman/reporters', { otel: true, endpoint: 'http://localhost:4318' }],
 *   ],
 * });
 * ```
 *
 * @module reporters
 */

import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';

import { createLogger } from '#core/logging/index.js';
import type {
  MeterWrapper,
  MetricCounter,
  MetricHistogram,
  TracerWrapper,
  SpanWrapper,
} from '#core/telemetry/otel.js';
import { getNoOpMeter, getNoOpTracer } from '#core/telemetry/otel.js';

/**
 * Configuration options for the OTel reporter.
 */
export interface OTelReporterOptions {
  /** Enable OTel span emission. Default: `true`. */
  readonly enabled?: boolean;
  /** OTLP endpoint URL. Required when enabled. */
  readonly endpoint?: string;
  /** OTel service name. Default: `'playwright-praman'`. */
  readonly serviceName?: string;
}

// Step span keys are plain strings: `${testId}:${category}:${title}:${startTime}`

/** Metric name constants to avoid duplicate-string warnings. */
const METRIC_TEST_PASS = 'praman.test.pass';
const METRIC_TEST_FAIL = 'praman.test.fail';
const METRIC_TEST_SKIP = 'praman.test.skip';
const METRIC_TEST_DURATION = 'praman.test.duration';

/**
 * Playwright Reporter that emits OpenTelemetry spans for test lifecycle events.
 *
 * @example
 * ```typescript
 * const reporter = new OTelReporter({ endpoint: 'http://localhost:4318' });
 * ```
 */
export class OTelReporter implements Reporter {
  readonly #options: OTelReporterOptions;
  #tracer: TracerWrapper = getNoOpTracer();
  #meter: MeterWrapper = getNoOpMeter();
  #testPassCounter: MetricCounter;
  #testFailCounter: MetricCounter;
  #testSkipCounter: MetricCounter;
  #testDuration: MetricHistogram;
  readonly #testSpans = new Map<string, SpanWrapper>();
  readonly #stepSpans = new Map<string, SpanWrapper>();
  readonly #log = createLogger('reporters:otel');

  constructor(options: OTelReporterOptions = {}) {
    this.#options = options;
    this.#testPassCounter = this.#meter.createCounter(METRIC_TEST_PASS);
    this.#testFailCounter = this.#meter.createCounter(METRIC_TEST_FAIL);
    this.#testSkipCounter = this.#meter.createCounter(METRIC_TEST_SKIP);
    this.#testDuration = this.#meter.createHistogram(METRIC_TEST_DURATION);
  }

  /**
   * Called once before all tests. Initializes the OTel provider.
   *
   * @param _config - Full Playwright config
   * @param _suite - Root test suite
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by Reporter interface
  onBegin(_config: FullConfig, _suite: Suite): void {
    if (this.#options.enabled === false) {
      this.#log.info('OTel reporter disabled');
      return;
    }

    if (this.#options.endpoint === undefined) {
      this.#log.warn('OTel reporter: no endpoint configured, using NoOp tracer');
      return;
    }

    // Dynamic import to avoid pulling OTel into the reporter process when not needed
    void this.#initTracer();
  }

  /**
   * Called when a test begins execution.
   *
   * @param test - The test case
   * @param _result - The test result (incomplete at this point)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by Reporter interface
  onTestBegin(test: TestCase, _result: TestResult): void {
    const span = this.#tracer.startSpan(`test.run: ${test.title}`, {
      'praman.test.title': test.title,
      'praman.test.file': test.location.file,
    });
    this.#testSpans.set(test.id, span);
  }

  /**
   * Called when a test step begins (hooks, fixtures, user steps, pw:api calls).
   *
   * @param test - The parent test case
   * @param _result - The test result
   * @param step - The step that began
   */
  onStepBegin(test: TestCase, _result: TestResult, step: TestStep): void {
    const stepCategory = step.category;
    const spanName = `${stepCategory}: ${step.title}`;
    const key = this.#stepKey(test.id, step);

    const span = this.#tracer.startSpan(spanName, {
      'praman.step.category': stepCategory,
      'praman.step.title': step.title,
      'praman.test.title': test.title,
      'praman.test.file': test.location.file,
    });

    this.#stepSpans.set(key, span);
  }

  /**
   * Called when a test step ends.
   *
   * @param test - The parent test case
   * @param _result - The test result
   * @param step - The step that ended
   */
  onStepEnd(test: TestCase, _result: TestResult, step: TestStep): void {
    const key = this.#stepKey(test.id, step);
    const span = this.#stepSpans.get(key);
    if (span !== undefined) {
      const stepError = step.error as { message?: string } | undefined;
      if (stepError !== undefined) {
        span.setStatus('error', stepError.message ?? 'Step failed');
      } else {
        span.setStatus('ok');
      }
      span.end();
      this.#stepSpans.delete(key);
    }
  }

  /**
   * Called when a test ends. Closes the test-level span.
   *
   * @param test - The test case
   * @param result - The final test result
   */
  onTestEnd(test: TestCase, result: TestResult): void {
    // Record metrics
    this.#testDuration.record(result.duration, { 'test.file': test.location.file });
    if (result.status === 'passed') {
      this.#testPassCounter.add(1);
    } else if (result.status === 'failed' || result.status === 'timedOut') {
      this.#testFailCounter.add(1);
    } else if (result.status === 'skipped') {
      this.#testSkipCounter.add(1);
    }

    // Close span
    const span = this.#testSpans.get(test.id);
    if (span !== undefined) {
      span.setAttribute('praman.test.status', result.status);
      span.setAttribute('praman.test.duration', result.duration);
      if (result.status === 'failed' || result.status === 'timedOut') {
        const errorMsg = result.errors.map((e) => e.message).join('; ');
        span.setStatus('error', errorMsg !== '' ? errorMsg : 'Test failed');
      } else {
        span.setStatus('ok');
      }
      span.end();
      this.#testSpans.delete(test.id);
    }
  }

  /**
   * Called once after all tests. Shuts down the OTel provider, flushing spans.
   *
   * @param _result - The full test run result
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by Reporter interface
  async onEnd(_result: FullResult): Promise<void> {
    await this.#meter.shutdown();
    await this.#tracer.shutdown();
  }

  /**
   * Whether this reporter prints to stdout. Returns false — OTel uses network export.
   */
  printsToStdio(): boolean {
    return false;
  }

  /** Generates a unique key for step spans. */
  #stepKey(testId: string, step: TestStep): string {
    return `${testId}:${step.category}:${step.title}:${String(step.startTime.getTime())}`;
  }

  /** Initializes the real OTel tracer and meter asynchronously. */
  async #initTracer(): Promise<void> {
    try {
      const { initTelemetry, initMetrics } = await import('#core/telemetry/otel.js');
      const { PramanConfigSchema } = await import('#core/config/schema.js');

      const config = PramanConfigSchema.parse({
        telemetry: {
          openTelemetry: true,
          endpoint: this.#options.endpoint,
          serviceName: this.#options.serviceName ?? 'playwright-praman',
        },
      });

      this.#tracer = await initTelemetry(config);
      this.#meter = await initMetrics(config);
      this.#testPassCounter = this.#meter.createCounter(METRIC_TEST_PASS, 'Tests passed');
      this.#testFailCounter = this.#meter.createCounter(METRIC_TEST_FAIL, 'Tests failed');
      this.#testSkipCounter = this.#meter.createCounter(METRIC_TEST_SKIP, 'Tests skipped');
      this.#testDuration = this.#meter.createHistogram(METRIC_TEST_DURATION, 'Test duration (ms)');
      this.#log.info({ endpoint: this.#options.endpoint }, 'OTel reporter initialized');
    } catch (error: unknown) {
      this.#log.error(
        { err: error instanceof Error ? error : new Error(String(error)) },
        'Failed to initialize OTel reporter, falling back to NoOp',
      );
    }
  }
}
