/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Package version — kept in sync with package.json via build script.
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
export const VERSION = '1.0.1' as const;

/**
 * Package name — used in telemetry and error reporting.
 *
 * @example
 * ```typescript
 * import { PACKAGE_NAME } from './version.js';
 * ```
 */
export const PACKAGE_NAME = 'playwright-praman' as const;
