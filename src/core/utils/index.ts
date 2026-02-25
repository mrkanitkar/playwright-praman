/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Utils module — retry, version comparison, step decorator, constants, wait helpers.
 *
 * @example
 * ```typescript
 * import { retry, calculateBackoff } from '#core/utils/index.js';
 * import { DEFAULT_TIMEOUTS } from '#core/utils/index.js';
 * ```
 *
 * @module utils
 */

export { assertNever } from './assert-never.js';
export { calculateBackoff, retry } from './retry.js';
export type { RetryOptions } from './retry.js';
export { DEFAULT_IGNORE_PATTERNS, DEFAULT_TIMEOUTS } from './constants.js';
export { createStepName, withStep } from './step-decorator.js';
export { compareSemVer, isAtLeast, parseSemVer, satisfiesRange } from './version-compare.js';
export type { SemVer } from './version-compare.js';
export { briefDOMSettle, waitForUI5Bootstrap, waitForUI5Stable } from './wait-helpers.js';
export type { WaitForUI5StableOptions } from './wait-helpers.js';
