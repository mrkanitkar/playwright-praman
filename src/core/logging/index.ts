/**
 * Logging module — pino logger factory with secret redaction.
 *
 * @example
 * ```typescript
 * import { createRootLogger, createLogger } from '#core/logging/index.js';
 * ```
 *
 * @module logging
 */

export { createLogger, createRootLogger, resetDefaultLogger } from './logger.js';
export { createRedactConfig, REDACTION_PATHS } from './redaction.js';
export type { RedactConfig } from './redaction.js';
