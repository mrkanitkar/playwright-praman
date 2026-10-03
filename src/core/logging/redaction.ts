/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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
  // Playwright populates `TestStep.params` for a `fill()` step as
  // `{ locator, value }`, so a typed password arrives under the key `value` —
  // which none of the name-based paths above match. See redactStepParams.
  '*.value',
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

// ── Step-param redaction (Playwright 1.63 `TestStep.params`) ───────────────

/**
 * Keys permitted to leave the process from a step's `params`.
 *
 * An **allow-list, deliberately** — not a deny-list. Playwright curates what it
 * puts in `params` and may add keys in any minor; a deny-list would export each
 * new one until someone noticed. The first three are Praman's own marker, the
 * last two are Playwright's diagnostic values worth keeping.
 *
 * Notably absent: `value`. Playwright documents a `fill()` step's params as
 * `{ locator: "getByLabel('Password')", value: 'secret' }`.
 *
 * @internal
 */
const STEP_PARAM_ALLOWED_KEYS: readonly string[] = [
  'praman',
  'module',
  'action',
  'controlType',
  'locator',
  'url',
] as const;

/**
 * Renders one param value as a string without risking `'[object Object]'`.
 *
 * @param value - The raw param value.
 * @returns A readable string; JSON for objects, `String()` for primitives.
 */
function stringifyParamValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'object') {
    // null included: JSON.stringify(null) === 'null', which is what we want.
    return JSON.stringify(value);
  }
  // eslint-disable-next-line @typescript-eslint/no-base-to-string -- narrowed to primitives above
  return String(value);
}

/**
 * Reduces a step's `params` to the allow-listed keys, stringifying each value.
 *
 * @remarks
 * Reporters export step params — the OTel reporter over the network — so this
 * runs between Playwright's data and every sink. Values are stringified because
 * OTel span attributes are `Record<string, string>`.
 *
 * @param params - Raw `TestStep.params`, or `undefined` on Playwright 1.57-1.62
 *   where the property does not exist.
 * @returns The surviving keys as strings, or `undefined` when `params` was absent.
 *
 * @example
 * ```typescript
 * import { redactStepParams } from '#core/logging/redaction.js';
 *
 * redactStepParams({ locator: "getByLabel('Password')", value: 'secret' });
 * // { locator: "getByLabel('Password')" } — `value` is dropped
 * ```
 */
export function redactStepParams(
  params: Readonly<Record<string, unknown>> | undefined,
): Record<string, string> | undefined {
  if (params === undefined) {
    return undefined;
  }

  const redacted: Record<string, string> = {};

  for (const key of STEP_PARAM_ALLOWED_KEYS) {
    if (!Object.prototype.hasOwnProperty.call(params, key)) {
      continue;
    }
    // eslint-disable-next-line security/detect-object-injection -- key comes from the literal STEP_PARAM_ALLOWED_KEYS, never from input
    const value = params[key];
    if (value === undefined) {
      continue;
    }
    // eslint-disable-next-line security/detect-object-injection -- as above
    redacted[key] = stringifyParamValue(value);
  }

  return redacted;
}
