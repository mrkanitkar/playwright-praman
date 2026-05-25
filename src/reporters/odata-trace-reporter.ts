/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Playwright reporter that aggregates OData request traces from test attachments.
 *
 * @remarks
 * This reporter reads OData trace data from test result attachments
 * (name containing "odata", content type "application/json") and
 * produces a consolidated `odata-trace.json` report file.
 *
 * The reporter is an AGGREGATOR, not an interceptor: it has no access
 * to `page` or browser context and relies entirely on data attached
 * during test execution via `testInfo.attach()`.
 *
 * @example
 * ```typescript
 * // playwright.config.ts
 * import { defineConfig } from '@playwright/test';
 *
 * export default defineConfig({
 *   reporter: [
 *     ['./src/reporters/odata-trace-reporter.ts', { outputDir: 'reports' }],
 *   ],
 * });
 * ```
 *
 * @module reporters
 */

import type { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import type {
  FullResult,
  Reporter,
  TestCase,
  TestError,
  TestResult,
  WorkerInfo,
} from '@playwright/test/reporter';

import { createLogger } from '#core/logging/index.js';

// ── Exported types ───────────────────────────────────────────────────────────

/**
 * A single OData HTTP request captured during test execution.
 *
 * @example
 * ```typescript
 * const entry: ODataTraceEntry = {
 *   testTitle: 'should load products',
 *   timestamp: '2026-01-15T10:30:00.000Z',
 *   method: 'GET',
 *   url: '/sap/opu/odata/sap/API_PRODUCT/A_Product?$top=10',
 *   entitySet: 'A_Product',
 *   queryParams: { top: 10 },
 *   statusCode: 200,
 *   duration: 150,
 *   responseSize: 4096,
 *   isBatch: false,
 *   isMetadata: false,
 * };
 * ```
 */
export interface ODataTraceEntry {
  readonly testTitle: string;
  readonly timestamp: string;
  readonly method: string;
  readonly url: string;
  readonly entitySet: string | null;
  readonly queryParams: {
    readonly filter?: string;
    readonly expand?: string;
    readonly orderby?: string;
    readonly top?: number;
    readonly skip?: number;
    readonly select?: string;
  };
  readonly statusCode: number;
  readonly duration: number;
  readonly responseSize: number;
  readonly isBatch: boolean;
  readonly isMetadata: boolean;
}

/**
 * Aggregated statistics for a single OData entity set.
 *
 * @example
 * ```typescript
 * const stats: ODataEntityStats = {
 *   entitySet: 'A_Product',
 *   totalCalls: 15,
 *   avgDuration: 120,
 *   maxDuration: 450,
 *   errorCount: 1,
 *   byMethod: { GET: 12, POST: 2, PATCH: 1 },
 * };
 * ```
 */
export interface ODataEntityStats {
  readonly entitySet: string;
  readonly totalCalls: number;
  readonly avgDuration: number;
  readonly maxDuration: number;
  readonly errorCount: number;
  readonly byMethod: Readonly<Record<string, number>>;
}

/**
 * The complete OData trace report written to `odata-trace.json`.
 *
 * @example
 * ```typescript
 * const report: ODataTraceReport = {
 *   timestamp: new Date().toISOString(),
 *   totalRequests: 42,
 *   totalDuration: 6300,
 *   entityStats: [{ entitySet: 'A_Product', totalCalls: 42, avgDuration: 150, maxDuration: 450, errorCount: 0, byMethod: { GET: 42 } }],
 *   traces: [],
 * };
 * ```
 */
export interface ODataTraceReport {
  readonly timestamp: string;
  readonly totalRequests: number;
  readonly totalDuration: number;
  readonly entityStats: readonly ODataEntityStats[];
  readonly traces: readonly ODataTraceEntry[];
}

/**
 * Configuration options for {@link ODataTraceReporter}.
 *
 * @example
 * ```typescript
 * const options: ODataTraceReporterOptions = { outputDir: 'test-results/odata' };
 * ```
 */
export interface ODataTraceReporterOptions {
  readonly outputDir?: string;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Extracts the last path segment (entity set name) from an OData URL.
 *
 * @param url - The OData request URL.
 * @returns The entity set name, or `null` if extraction fails.
 *
 * @example
 * ```typescript
 * extractEntitySet('/sap/opu/odata/sap/API_PRODUCT/A_Product?$top=10');
 * // => 'A_Product'
 * ```
 *
 * @internal
 */
export function extractEntitySet(url: string): string | null {
  const pathPart = url.split('?')[0] ?? '';
  const segments = pathPart.split('/').filter(Boolean);
  const lastSegment = segments.at(-1) ?? '';
  // Remove key predicates: Products('123') -> Products
  const entitySet = lastSegment.split('(')[0] ?? '';
  // Filter out metadata/batch pseudo-segments and empty strings
  if (entitySet === '' || entitySet === '$metadata' || entitySet === '$batch') {
    return null;
  }
  return entitySet;
}

/**
 * Parses OData system query options from a URL.
 *
 * @param url - The OData request URL containing query parameters.
 * @returns An object with any recognized OData query parameters found.
 *
 * @example
 * ```typescript
 * parseODataQueryParams('/Products?$filter=Price gt 100&$top=10');
 * // => { filter: 'Price gt 100', top: 10 }
 * ```
 *
 * @internal
 */
export function parseODataQueryParams(url: string): ODataTraceEntry['queryParams'] {
  const searchParams = new URL(url, 'https://placeholder.local').searchParams;
  const params: Record<string, string | number> = {};

  if (searchParams.has('$filter')) {
    params['filter'] = searchParams.get('$filter') ?? '';
  }
  if (searchParams.has('$expand')) {
    params['expand'] = searchParams.get('$expand') ?? '';
  }
  if (searchParams.has('$orderby')) {
    params['orderby'] = searchParams.get('$orderby') ?? '';
  }
  if (searchParams.has('$top')) {
    params['top'] = Number(searchParams.get('$top'));
  }
  if (searchParams.has('$skip')) {
    params['skip'] = Number(searchParams.get('$skip'));
  }
  if (searchParams.has('$select')) {
    params['select'] = searchParams.get('$select') ?? '';
  }

  return params;
}

/** Shape expected from each OData trace attachment entry. */
interface RawODataAttachmentEntry {
  readonly method?: string;
  readonly url?: string;
  readonly statusCode?: number;
  readonly duration?: number;
  readonly responseSize?: number;
  readonly timestamp?: string;
}

/**
 * Aggregates OData request trace data from Playwright test attachments.
 *
 * @remarks
 * Attach OData trace data in tests using `testInfo.attach('odata-trace', ...)`,
 * and this reporter will collect and aggregate the data into a JSON report.
 *
 * @example
 * ```typescript
 * // playwright.config.ts
 * import { defineConfig } from '@playwright/test';
 *
 * export default defineConfig({
 *   reporter: [
 *     ['./src/reporters/odata-trace-reporter.ts', { outputDir: 'reports' }],
 *   ],
 * });
 * ```
 */
export class ODataTraceReporter implements Reporter {
  private readonly traces: ODataTraceEntry[] = [];
  private readonly outputDir: string;

  constructor(options?: ODataTraceReporterOptions) {
    this.outputDir = options?.outputDir ?? 'test-results';
  }

  /**
   * Collects OData trace entries from test result attachments.
   *
   * @param test - The completed test case.
   * @param result - The test result containing attachments.
   *
   * @example
   * ```typescript
   * reporter.onTestEnd(testCase, testResult);
   * ```
   */
  onTestEnd(test: TestCase, result: TestResult): void {
    for (const attachment of result.attachments) {
      if (
        attachment.contentType !== 'application/json' ||
        !attachment.name.toLowerCase().includes('odata')
      ) {
        continue;
      }

      if (attachment.body !== undefined) {
        this.parseAndAddTraces(test.title, attachment.body);
      }
    }
  }

  /**
   * Writes the aggregated OData trace report to `odata-trace.json`.
   *
   * @param _result - The full test run result (unused).
   *
   * @example
   * ```typescript
   * await reporter.onEnd(fullResult);
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- required by Reporter interface
  async onEnd(_result: FullResult): Promise<void> {
    const entityStatsMap = new Map<
      string,
      {
        totalCalls: number;
        totalDuration: number;
        maxDuration: number;
        errorCount: number;
        byMethod: Record<string, number>;
      }
    >();

    for (const trace of this.traces) {
      const key = trace.entitySet ?? '__unknown__';
      const existing = entityStatsMap.get(key) ?? {
        totalCalls: 0,
        totalDuration: 0,
        maxDuration: 0,
        errorCount: 0,
        byMethod: {},
      };

      existing.totalCalls += 1;
      existing.totalDuration += trace.duration;
      existing.maxDuration = Math.max(existing.maxDuration, trace.duration);
      if (trace.statusCode >= 400) {
        existing.errorCount += 1;
      }
      existing.byMethod[trace.method] = (existing.byMethod[trace.method] ?? 0) + 1;

      entityStatsMap.set(key, existing);
    }

    const entityStats: ODataEntityStats[] = [];
    for (const [entitySet, stats] of entityStatsMap) {
      entityStats.push({
        entitySet,
        totalCalls: stats.totalCalls,
        avgDuration: stats.totalCalls > 0 ? Math.round(stats.totalDuration / stats.totalCalls) : 0,
        maxDuration: stats.maxDuration,
        errorCount: stats.errorCount,
        byMethod: stats.byMethod,
      });
    }

    const report: ODataTraceReport = {
      timestamp: new Date().toISOString(),
      totalRequests: this.traces.length,
      totalDuration: this.traces.reduce((sum, t) => sum + t.duration, 0),
      entityStats,
      traces: this.traces,
    };

    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from trusted outputDir option
    await mkdir(this.outputDir, { recursive: true });
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- path composed from trusted outputDir option + literal filename
    await writeFile(
      join(this.outputDir, 'odata-trace.json'),
      JSON.stringify(report, undefined, 2),
      'utf8',
    );
  }

  /**
   * Logs worker context when Playwright reports a runtime or fixture-teardown error.
   *
   * @param error - The error Playwright encountered.
   * @param workerInfo - Worker context (Playwright 1.60+); `undefined` on older versions.
   *
   * @example
   * ```typescript
   * reporter.onError(error, workerInfo);
   * ```
   */
  onError(error: TestError, workerInfo?: WorkerInfo): void {
    const log = createLogger('odata-trace-reporter');
    log.debug(
      {
        err: error.message ?? error.stack ?? 'unknown error',
        workerIndex: workerInfo?.workerIndex,
        parallelIndex: workerInfo?.parallelIndex,
      },
      'Playwright reported an error (possibly during fixture teardown)',
    );
  }

  /**
   * Indicates this reporter does not write to stdout/stderr.
   *
   * @returns Always `false`.
   *
   * @example
   * ```typescript
   * reporter.printsToStdio(); // false
   * ```
   */
  printsToStdio(): boolean {
    return false;
  }

  /** Parses a Buffer attachment body and adds trace entries. */
  private parseAndAddTraces(testTitle: string, body: Buffer): void {
    let parsed: unknown;
    try {
      // Type assertion: JSON.parse returns any; cast to unknown for safe narrowing below
      parsed = JSON.parse(body.toString('utf8')) as unknown;
    } catch (error: unknown) {
      const log = createLogger('odata-reporter');
      log.debug({ err: error }, 'Malformed JSON in OData trace attachment — skipping');
      return;
    }

    const entries: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
    for (const entry of entries) {
      if (!isRawODataEntry(entry)) {
        continue;
      }

      const url = entry.url;
      this.traces.push({
        testTitle,
        timestamp: entry.timestamp ?? new Date().toISOString(),
        method: entry.method,
        url,
        entitySet: extractEntitySet(url),
        queryParams: parseODataQueryParams(url),
        statusCode: entry.statusCode ?? 0,
        duration: entry.duration ?? 0,
        responseSize: entry.responseSize ?? 0,
        isBatch: url.includes('$batch'),
        isMetadata: url.includes('$metadata'),
      });
    }
  }
}

/** Type guard for raw OData attachment entries. */
function isRawODataEntry(
  value: unknown,
): value is RawODataAttachmentEntry & { method: string; url: string } {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  // Type assertion: non-null object check above guarantees value is indexable
  const record = value as Record<string, unknown>;
  return typeof record['method'] === 'string' && typeof record['url'] === 'string';
}
