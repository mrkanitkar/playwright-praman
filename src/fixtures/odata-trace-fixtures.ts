/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * OData trace fixture — automatic OData network request capture.
 *
 * @ai
 * @aiContext Auto-enabled when `odataTracing.enabled` is `true` in config.
 * Captures browser-level OData HTTP requests (XHR/fetch) and attaches
 * trace data to `testInfo` for the {@link ODataTraceReporter}.
 *
 * @remarks
 * Provides one auto test-scoped fixture:
 * - `odataTraceInterceptor` — listens to `page` request/response events,
 *   filters OData URLs, measures duration, and attaches a JSON trace
 *   array on teardown via `testInfo.attach('odata-trace', ...)`.
 *
 * The fixture is opt-in: when `pramanConfig.odataTracing` is undefined or
 * `enabled` is `false`, the fixture calls `use()` immediately with zero overhead.
 *
 * Dependencies from coreTest (via mergeTests):
 * - `page` — Playwright built-in
 * - `pramanConfig` — from coreTest worker fixtures
 *
 * **Scope limitation:** Only browser-level requests (XHR/fetch from the SAP
 * Fiori app) are captured. Node-level `page.request.*` API calls (used by
 * `odata-http.ts`) do not fire browser events and are not intercepted.
 *
 * @example
 * ```typescript
 * // praman.config.ts — enable OData tracing
 * import { defineConfig } from 'playwright-praman';
 *
 * export default defineConfig({
 *   odataTracing: { enabled: true },
 * });
 * ```
 *
 * @example
 * ```typescript
 * // playwright.config.ts — add the reporter
 * import { defineConfig } from '@playwright/test';
 *
 * export default defineConfig({
 *   reporter: [
 *     ['playwright-praman/reporters', { outputDir: 'test-results' }],
 *   ],
 * });
 * ```
 *
 * @module fixtures
 */

import { Buffer } from 'node:buffer';

import { test as base } from '@playwright/test';
import type { Page, Request, Response } from '@playwright/test';

import type { PramanConfig } from '#core/config/index.js';
import { createLogger } from '#core/logging/index.js';
import { ODATA_DEFAULT_URL_PATTERNS } from '#core/utils/constants.js';

// ── Types ────────────────────────────────────────────────────────────

/**
 * OData trace fixture types.
 *
 * @remarks
 * The fixture is `void` because it is an auto side-effect fixture.
 *
 * @example
 * ```typescript
 * import type { ODataTraceFixtures } from '#fixtures/odata-trace-fixtures.js';
 * ```
 */
export interface ODataTraceFixtures {
  /** Captures OData network requests and attaches trace data on teardown. */
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- Playwright fixtures use void for side-effect-only fixtures
  odataTraceInterceptor: void;
}

/**
 * Dependency fixture types required by OData trace fixtures.
 *
 * @remarks
 * These come from coreTest via mergeTests and are declared here
 * as `{ option: true }` placeholders (PW-MERGE-1 pattern) so
 * they don't collide with the real definitions in coreTest.
 */
interface ODataTraceDeps {
  /** Validated, frozen Praman configuration (from coreTest). */
  pramanConfig: Readonly<PramanConfig>;
}

/** Shape of a captured OData trace entry for testInfo attachment. */
interface CapturedTrace {
  readonly method: string;
  readonly url: string;
  readonly statusCode: number;
  readonly duration: number;
  readonly responseSize: number;
  readonly timestamp: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Checks whether a URL matches any of the given OData URL patterns.
 *
 * @param url - The full request URL to check.
 * @param patterns - Substring patterns to match against.
 * @returns `true` if the URL contains any of the patterns.
 *
 * @example
 * ```typescript
 * import { isODataUrl } from '#fixtures/odata-trace-fixtures.js';
 *
 * isODataUrl('https://host/sap/opu/odata/sap/API_PRODUCT/Products', ['/sap/opu/odata/']);
 * // => true
 * ```
 */
export function isODataUrl(url: string, patterns: readonly string[]): boolean {
  return patterns.some((pattern) => url.includes(pattern));
}

// ── Fixture ──────────────────────────────────────────────────────────

/**
 * OData trace test object with automatic OData network request capture.
 *
 * @remarks
 * Extends `@playwright/test` base with one auto test-scoped fixture:
 *
 * `odataTraceInterceptor` — registers `page.on('request')` and
 * `page.on('response')` listeners that capture OData HTTP traffic.
 * On teardown, attaches the collected traces as a JSON attachment
 * named `'odata-trace'` for the {@link ODataTraceReporter} to consume.
 *
 * @capability ui5.odata.getModelData
 *
 * @example
 * ```typescript
 * import { odataTraceTest } from '#fixtures/odata-trace-fixtures.js';
 *
 * odataTraceTest('page loads with OData tracing', async ({ page }) => {
 *   // odataTraceInterceptor is auto-active when config enables it
 * });
 * ```
 */
export const odataTraceTest = base.extend<ODataTraceFixtures, ODataTraceDeps>({
  // Placeholder — provided by coreTest via mergeTests (PW-MERGE-1)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- PW-MERGE-1: placeholder overridden by mergeTests
  pramanConfig: [undefined!, { option: true, scope: 'worker' }],

  odataTraceInterceptor: [
    async (
      { page, pramanConfig }: { page: Page; pramanConfig: Readonly<PramanConfig> },
      use,
      testInfo,
    ) => {
      const tracingConfig = pramanConfig.odataTracing;
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain -- explicit guard needed for TypeScript narrowing below
      if (tracingConfig === undefined || !tracingConfig.enabled) {
        await use();
        return;
      }

      const log = createLogger('odata-trace');
      const allPatterns = [...ODATA_DEFAULT_URL_PATTERNS, ...tracingConfig.urlPatterns];
      const pendingRequests = new Map<Request, number>();
      const completedTraces: CapturedTrace[] = [];

      const requestListener = (request: Request): void => {
        const url = request.url();
        if (isODataUrl(url, allPatterns)) {
          pendingRequests.set(request, Date.now());
        }
      };

      const responseListener = (response: Response): void => {
        const request = response.request();
        const startTime = pendingRequests.get(request);
        if (startTime === undefined) {
          return;
        }
        pendingRequests.delete(request);

        const endTime = Date.now();
        const headers = response.headers();
        const contentLength = headers['content-length'];
        const responseSize = contentLength !== undefined ? Number(contentLength) : 0;

        completedTraces.push({
          method: request.method(),
          url: request.url(),
          statusCode: response.status(),
          duration: endTime - startTime,
          responseSize,
          timestamp: new Date(startTime).toISOString(),
        });
      };

      page.on('request', requestListener);
      page.on('response', responseListener);

      try {
        await use();
      } finally {
        page.off('request', requestListener);
        page.off('response', responseListener);

        if (completedTraces.length > 0) {
          try {
            await testInfo.attach('odata-trace', {
              contentType: 'application/json',
              body: Buffer.from(JSON.stringify(completedTraces), 'utf8'),
            });
          } catch (attachError: unknown) {
            log.debug({ err: attachError }, 'Failed to attach OData trace data (non-fatal)');
          }
        }
      }
    },
    { auto: true },
  ],
});

export type { ODataTraceDeps as ODataTraceWorkerFixtures };
