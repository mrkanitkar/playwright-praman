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

export { calculateBackoff, retry } from './retry.js';
export type { RetryOptions } from './retry.js';
export {
  ANALYTICS_DEFAULT_PATTERNS,
  DEFAULT_IGNORE_PATTERNS,
  DEFAULT_TIMEOUTS,
  WALKME_DEFAULT_PATTERNS,
} from './constants.js';
export { createStepName, withStep } from './step-decorator.js';
export { compareSemVer, isAtLeast, parseSemVer, satisfiesRange } from './version-compare.js';
export type { SemVer } from './version-compare.js';
export { briefDOMSettle, waitForUI5Bootstrap, waitForUI5Stable } from './wait-helpers.js';
export type { WaitForUI5StableOptions } from './wait-helpers.js';
