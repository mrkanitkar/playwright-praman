/**
 * Redaction configuration for pino logger -- strips sensitive values from logs.
 *
 * @remarks
 * Uses pino's built-in redaction feature. Paths follow pino's format:
 * - `*.field` -- redacts `field` at any depth
 * - `path.to.field` -- redacts specific nested field
 *
 * @example
 * ```typescript
 * import { createRedactConfig, REDACTION_PATHS } from '#core/logging/redaction.js';
 *
 * const redactConfig = createRedactConfig();
 * // Use in pino: pino({ redact: redactConfig })
 * ```
 *
 * @module logging
 */

/**
 * Paths to redact from pino log output.
 *
 * @remarks
 * Wildcard paths (`*.field`) match the field at any depth in the log object.
 * Specific paths (`auth.token`) match only that exact nested location.
 *
 * @example
 * ```typescript
 * import { REDACTION_PATHS } from '#core/logging/redaction.js';
 *
 * logger.info(REDACTION_PATHS.length); // >= 10
 * ```
 */
export const REDACTION_PATHS: readonly string[] = [
  '*.password',
  '*.token',
  '*.apiKey',
  '*.secret',
  '*.authorization',
  '*.cookie',
  '*.sessionId',
  '*.credentials',
  '*.accessToken',
  '*.refreshToken',
  '*.bearerToken',
  'auth.password',
  'auth.token',
  'config.ai.apiKey',
] as const;

/**
 * Configuration object for pino's redact option.
 *
 * @example
 * ```typescript
 * import type { RedactConfig } from '#core/logging/redaction.js';
 *
 * const config: RedactConfig = { paths: ['*.password'], censor: '[Redacted]' };
 * ```
 */
export interface RedactConfig {
  /** Paths to redact in log output. */
  readonly paths: readonly string[];
  /** Replacement string for redacted values. */
  readonly censor: string;
}

/**
 * Creates a pino-compatible redaction configuration.
 *
 * @returns A frozen {@link RedactConfig} with all known sensitive paths and the standard censor string.
 *
 * @example
 * ```typescript
 * import { createRedactConfig } from '#core/logging/redaction.js';
 *
 * const redactConfig = createRedactConfig();
 * // redactConfig.paths contains all REDACTION_PATHS
 * // redactConfig.censor === '[Redacted]'
 * ```
 */
export function createRedactConfig(): RedactConfig {
  return {
    paths: [...REDACTION_PATHS],
    censor: '[Redacted]',
  };
}
