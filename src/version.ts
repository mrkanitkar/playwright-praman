/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Build-time version placeholder — replaced by tsup `define` from package.json.
 *
 * @remarks
 * tsup replaces `__PRAMAN_VERSION__` with the literal value from
 * `package.json#version` at build time. This eliminates manual sync.
 * In development (vitest, tsx), the `declare` + fallback ensures
 * the symbol resolves without a build step.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention -- build-time placeholder replaced by tsup define
declare const __PRAMAN_VERSION__: string;

/**
 * Package version — injected from package.json at build time.
 *
 * @remarks
 * Read at runtime by telemetry (`service.version`) and user-agent headers.
 *
 * @example
 * ```typescript
 * import { VERSION, PACKAGE_NAME } from './version.js';
 * logger.info(`${PACKAGE_NAME}@${VERSION}`);
 * ```
 */
export const VERSION: string =
  typeof __PRAMAN_VERSION__ !== 'undefined' ? __PRAMAN_VERSION__ : '0.0.0-dev';

/**
 * Package name — used in telemetry and error reporting.
 *
 * @example
 * ```typescript
 * import { PACKAGE_NAME } from './version.js';
 * ```
 */
export const PACKAGE_NAME = 'playwright-praman' as const;
