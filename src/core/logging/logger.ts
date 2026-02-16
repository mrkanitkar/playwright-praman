/**
 * Pino logger factory — creates configured logger instances with redaction.
 *
 * @remarks
 * Provides a standardized logging setup for the entire package:
 * - Root logger: created once per config, cached as default
 * - Child loggers: created per module with `{ module }` binding
 * - Redaction: always enabled via {@link createRedactConfig}
 *
 * M11: pino is imported as a default ESM import. Tests mock it with
 * `vi.mock('pino')` inline (no pre-mocking needed).
 *
 * @example
 * ```typescript
 * import { createRootLogger, createLogger } from '#core/logging/logger.js';
 * import { PramanConfigSchema } from '#core/config/schema.js';
 *
 * const config = PramanConfigSchema.parse({ logLevel: 'debug' });
 * const root = createRootLogger(config);
 * const log = createLogger('selector', root);
 * log.info('Parsing selector');
 * ```
 *
 * @module logging
 */

import pino from 'pino';
import type { Logger } from 'pino';

import { createRedactConfig } from './redaction.js';

import type { PramanConfig } from '#core/config/schema.js';

/** Cached default logger instance. */
let defaultLogger: Logger | undefined;

/**
 * Creates a root pino logger configured from PramanConfig.
 *
 * @param config - Validated Praman configuration.
 * @returns A configured pino Logger instance.
 *
 * @example
 * ```typescript
 * import { createRootLogger } from '#core/logging/logger.js';
 * import { PramanConfigSchema } from '#core/config/schema.js';
 *
 * const config = PramanConfigSchema.parse({ logLevel: 'debug' });
 * const logger = createRootLogger(config);
 * logger.info('Logger initialized');
 * ```
 */
export function createRootLogger(config: Readonly<PramanConfig>): Logger {
  const redact = createRedactConfig();

  const logger = pino({
    name: 'playwright-praman',
    level: config.logLevel,
    redact: {
      paths: [...redact.paths],
      censor: redact.censor,
    },
  });

  defaultLogger = logger;
  return logger;
}

/**
 * Creates a child logger bound to a specific module.
 *
 * @param module - Module name for the `{ module }` binding.
 * @param parentLogger - Optional parent logger. Falls back to the cached default.
 * @returns A child pino Logger with module context.
 *
 * @example
 * ```typescript
 * import { createLogger } from '#core/logging/logger.js';
 *
 * const log = createLogger('bridge');
 * log.info('Bridge initialized');
 * ```
 */
export function createLogger(module: string, parentLogger?: Logger): Logger {
  const parent = parentLogger ?? defaultLogger;

  if (parent === undefined) {
    // No default logger set yet — create a minimal fallback
    const fallback = pino({ name: 'playwright-praman', level: 'info' });
    return fallback.child({ module });
  }

  return parent.child({ module });
}

/**
 * Resets the cached default logger. Used in tests to ensure isolation.
 *
 * @example
 * ```typescript
 * import { resetDefaultLogger } from '#core/logging/logger.js';
 *
 * afterEach(() => {
 *   resetDefaultLogger();
 * });
 * ```
 */
export function resetDefaultLogger(): void {
  defaultLogger = undefined;
}
