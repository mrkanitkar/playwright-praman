/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Default constants for network request filtering and timeout configuration.
 *
 * @remarks
 * Source: mk v2.5.0 constants.ts (field-tested in production SAP systems).
 *
 * WalkMe and analytics URL patterns are used by the request interceptor to block
 * third-party scripts that interfere with UI5 stability detection. These patterns
 * were identified through production testing across 50+ SAP BTP tenants.
 *
 * M3 tracked issue: WalkMe patterns originate from mk v2.5.0 field data.
 * These are regex pattern strings, not full RegExp objects, so consumers must
 * wrap them with `new RegExp(pattern)` before use. The patterns are intentionally
 * kept as strings to allow serialization across the Playwright browser boundary.
 *
 * @example
 * ```typescript
 * import {
 *   WALKME_DEFAULT_PATTERNS,
 *   ANALYTICS_DEFAULT_PATTERNS,
 *   DEFAULT_IGNORE_PATTERNS,
 *   DEFAULT_TIMEOUTS,
 * } from '#core/utils/constants.js';
 *
 * // Block WalkMe + analytics requests during test execution
 * for (const pattern of DEFAULT_IGNORE_PATTERNS) {
 *   const re = new RegExp(pattern);
 *   if (re.test(requestUrl)) {
 *     route.abort();
 *   }
 * }
 * ```
 *
 * @module utils
 */

/**
 * Regex patterns matching WalkMe digital adoption platform URLs.
 *
 * @remarks
 * WalkMe scripts are injected into many SAP Fiori Launchpad deployments.
 * They add overlay elements and XHR requests that interfere with UI5
 * stability detection (`waitForUI5Stable`). Blocking these during tests
 * eliminates flaky timeout failures.
 *
 * Source attribution: mk v2.5.0 production field data.
 *
 * @example
 * ```typescript
 * import { WALKME_DEFAULT_PATTERNS } from '#core/utils/constants.js';
 *
 * const matchers = WALKME_DEFAULT_PATTERNS.map((p) => new RegExp(p));
 * const isWalkMe = matchers.some((re) => re.test(url));
 * ```
 */
export const WALKME_DEFAULT_PATTERNS: readonly string[] = [
  // codeql[js/regex/missing-regexp-anchor] -- intentional substring match against full request URLs for request-blocking; anchoring would prevent matching subpaths
  'walkme\\.com', // codeql[js/regex/missing-regexp-anchor]
  'walkme\\.cloud\\.sap', // codeql[js/regex/missing-regexp-anchor]
  'walkmeusercontent\\.com', // codeql[js/regex/missing-regexp-anchor]
  'cdn\\.walkme\\.com', // codeql[js/regex/missing-regexp-anchor]
  'ec\\.walkme\\.com', // codeql[js/regex/missing-regexp-anchor]
  'papi\\.walkme\\.com', // codeql[js/regex/missing-regexp-anchor]
] as const;

/**
 * Regex patterns matching common analytics and tracking service URLs.
 *
 * @remarks
 * Analytics scripts (Google Analytics, Qualtrics, LaunchDarkly) add background
 * XHR/fetch requests that delay UI5 stability detection. Blocking them during
 * test execution improves reliability without affecting application behavior.
 *
 * @example
 * ```typescript
 * import { ANALYTICS_DEFAULT_PATTERNS } from '#core/utils/constants.js';
 *
 * const matchers = ANALYTICS_DEFAULT_PATTERNS.map((p) => new RegExp(p));
 * const isAnalytics = matchers.some((re) => re.test(url));
 * ```
 */
export const ANALYTICS_DEFAULT_PATTERNS: readonly string[] = [
  'analytics\\.google', // codeql[js/regex/missing-regexp-anchor]
  'googletagmanager\\.com', // codeql[js/regex/missing-regexp-anchor]
  'siteintercept\\.qualtrics\\.com', // codeql[js/regex/missing-regexp-anchor]
  'launchdarkly\\.com', // codeql[js/regex/missing-regexp-anchor]
] as const;

/**
 * Combined default URL ignore patterns (WalkMe + Analytics).
 *
 * @remarks
 * Used by the request interceptor as the default blocklist. All patterns
 * are valid regex strings that can be passed to `new RegExp()`.
 *
 * @example
 * ```typescript
 * import { DEFAULT_IGNORE_PATTERNS } from '#core/utils/constants.js';
 *
 * for (const pattern of DEFAULT_IGNORE_PATTERNS) {
 *   const re = new RegExp(pattern);
 *   if (re.test(requestUrl)) {
 *     route.abort();
 *   }
 * }
 * ```
 */
export const DEFAULT_IGNORE_PATTERNS: readonly string[] = [
  ...WALKME_DEFAULT_PATTERNS,
  ...ANALYTICS_DEFAULT_PATTERNS,
] as const;

/**
 * Default timeout values (in milliseconds) for UI5 operations.
 *
 * @remarks
 * These timeouts are calibrated from production SAP BTP deployments:
 * - `UI5_WAIT`: General UI5 stability wait (covers most XHR/Promise settling)
 * - `CONTROL_DISCOVERY`: Finding controls after navigation or dialog open
 * - `UI5_BOOTSTRAP`: Initial UI5 library + component loading (slow on first load)
 * - `DOM_SETTLE`: DOM mutation settling after property changes
 * - `POLLING_INTERVAL`: Bridge polling loop interval
 * - `CACHE_TTL`: Control metadata cache time-to-live
 *
 * All values are positive integers representing milliseconds.
 *
 * @example
 * ```typescript
 * import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';
 *
 * await page.waitForFunction(() => window.sap !== undefined, {
 *   timeout: DEFAULT_TIMEOUTS.UI5_BOOTSTRAP,
 * });
 * ```
 */
export const DEFAULT_TIMEOUTS = Object.freeze({
  UI5_WAIT: 15_000,
  CONTROL_DISCOVERY: 10_000,
  UI5_BOOTSTRAP: 60_000,
  DOM_SETTLE: 500,
  POLLING_INTERVAL: 100,
  CACHE_TTL: 5_000,
} as const);

/**
 * Substring patterns matching common SAP OData service URL paths.
 *
 * @remarks
 * Used by the OData trace fixture to identify OData network requests.
 * Unlike the regex-based ignore patterns above, these are plain substring
 * patterns checked via `String.includes()`. They cover:
 * - SAP Gateway OData V2: `/sap/opu/odata/`
 * - SAP Gateway OData V4: `/sap/opu/odata4/`
 * - Generic CAP/CDS OData V2: `/odata/v2/`
 * - Generic CAP/CDS OData V4: `/odata/v4/`
 *
 * Users can add additional patterns via the `odataTracing.urlPatterns`
 * config option.
 *
 * @example
 * ```typescript
 * import { ODATA_DEFAULT_URL_PATTERNS } from '#core/utils/constants.js';
 *
 * const isOData = ODATA_DEFAULT_URL_PATTERNS.some((p) => url.includes(p));
 * ```
 */
export const ODATA_DEFAULT_URL_PATTERNS: readonly string[] = [
  '/sap/opu/odata/',
  '/sap/opu/odata4/',
  '/odata/v2/',
  '/odata/v4/',
] as const;
