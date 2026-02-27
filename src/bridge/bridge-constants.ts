/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Bridge-layer constants — global names, timeouts, and XHR ignore patterns.
 *
 * @remarks
 * Defines the window namespace for bridge injection, timeout defaults for
 * bridge operations, and XHR URL patterns to exclude from UI5 stability
 * detection. Merged with `ignoreAutoWaitUrls` from config at runtime.
 *
 * @example
 * ```typescript
 * import { BRIDGE_GLOBALS, BRIDGE_TIMEOUTS } from '#bridge/bridge-constants.js';
 *
 * const bridge = window[BRIDGE_GLOBALS.NAMESPACE];
 * ```
 *
 * @module bridge
 */

/**
 * Window-level global names used by the injected bridge.
 *
 * @remarks
 * The bridge injects itself under `window.__praman_bridge`. The ready flag
 * and object map are stored as separate globals for fast polling checks.
 */
export const BRIDGE_GLOBALS = Object.freeze({
  /** Window namespace for the bridge object. */
  NAMESPACE: '__praman_bridge',
  /** Boolean flag set when bridge is fully initialized. */
  READY_FLAG: '__praman_ready',
  /** Window-level object map for UUID-based object tracking. */
  OBJECT_MAP: '__praman_objectMap',
} as const);

/**
 * Timeout defaults for bridge operations (milliseconds).
 *
 * @remarks
 * These values are used when the config does not provide overrides.
 * Calibrated from production SAP BTP deployments.
 *
 * @guarantee Calibrated from production SAP BTP deployments
 *
 * @example
 * ```typescript
 * import { BRIDGE_TIMEOUTS } from '#bridge/bridge-constants.js';
 *
 * const timeout = BRIDGE_TIMEOUTS.INJECTION; // 30_000ms
 * const stability = BRIDGE_TIMEOUTS.UI5_STABLE; // 5_000ms
 * ```
 */
export const BRIDGE_TIMEOUTS = Object.freeze({
  /** Max time to wait for bridge injection to complete. */
  INJECTION: 30_000,
  /** Max time to wait for a control to be found. */
  CONTROL_FIND: 10_000,
  /** Max time to wait for UI5 to become stable. */
  UI5_STABLE: 30_000,
  /** Polling interval for waitForFunction loops. */
  POLLING_INTERVAL: 100,
  /** TTL for cached objects in the bridge object map (5 minutes). */
  OBJECT_TTL: 300_000,
} as const);

/**
 * XHR URL patterns to exclude from UI5 stability detection.
 *
 * @remarks
 * Third-party scripts (analytics, adoption platforms, monitoring) add
 * background XHR/fetch requests that delay `waitForUI5Stable()`.
 * These patterns are merged with user-configured `ignoreAutoWaitUrls`
 * at runtime.
 *
 * Source: mk v2.5.0 production field data + common SAP BTP services.
 *
 * @example
 * ```typescript
 * import { XHR_IGNORE_PATTERNS } from '#bridge/bridge-constants.js';
 *
 * // Merge with user-configured patterns
 * const allPatterns = [...XHR_IGNORE_PATTERNS, ...userPatterns];
 * ```
 */
export const XHR_IGNORE_PATTERNS: readonly string[] = Object.freeze([
  'walkme',
  'pendo',
  'analytics',
  'tracking',
  'hotjar',
  'fullstory',
  'sentry',
  'newrelic',
  'dynatrace',
  'appdynamics',
  'datadog',
  'qualtrics',
  'launchdarkly',
  'googletagmanager',
  'google-analytics',
  'optimizely',
  'segment',
  'mixpanel',
]);
