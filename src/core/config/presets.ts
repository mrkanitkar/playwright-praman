/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Built-in configuration presets for common environments.
 *
 * @remarks
 * Presets return `PramanConfigInput` objects that can be spread into
 * `defineConfig()` or passed as `loadConfig({ overrides })`.
 *
 * @example
 * ```typescript
 * import { defineConfig, presets } from 'playwright-praman';
 *
 * export default defineConfig({
 *   ...presets.ci,
 *   auth: { strategy: 'basic', baseUrl: 'https://my-sap.example.com' },
 * });
 * ```
 *
 * @module config
 */

import type { PramanConfigInput } from './schema.js';

/**
 * CI preset — shorter timeouts and debug-friendly defaults for CI pipelines.
 *
 * @remarks
 * Reduces `ui5WaitTimeout` from 30 s to 15 s and `controlDiscoveryTimeout`
 * from 10 s to 5 s. Enables failure artifact capture. Reduces feedback loop
 * time in CI without sacrificing reliability for well-behaved SAP apps.
 *
 * @example
 * ```typescript
 * import { defineConfig, presets } from 'playwright-praman';
 * export default defineConfig({ ...presets.ci });
 * ```
 */
const ci: PramanConfigInput = {
  ui5WaitTimeout: 15_000,
  controlDiscoveryTimeout: 5_000,
  captureFailureArtifacts: true,
  logLevel: 'warn',
};

/**
 * Debug preset — verbose logging, longer timeouts for local investigation.
 *
 * @example
 * ```typescript
 * import { defineConfig, presets } from 'playwright-praman';
 * export default defineConfig({ ...presets.debug });
 * ```
 */
const debug: PramanConfigInput = {
  ui5WaitTimeout: 60_000,
  controlDiscoveryTimeout: 30_000,
  captureFailureArtifacts: true,
  logLevel: 'debug',
};

/**
 * Built-in configuration presets.
 *
 * @example
 * ```typescript
 * import { presets } from 'playwright-praman';
 * console.log(presets.ci.ui5WaitTimeout); // 15000
 * ```
 */
export const presets = {
  ci,
  debug,
} as const satisfies Record<string, PramanConfigInput>;
