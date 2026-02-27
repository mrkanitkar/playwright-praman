/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Config loader — loads, validates, and freezes Praman configuration.
 *
 * @remarks
 * Resolution order: inline overrides → env vars → defaults.
 * Env vars take precedence over inline overrides.
 * The returned config is deeply frozen (`Readonly<PramanConfig>`).
 *
 * @example
 * ```typescript
 * import { loadConfig, defineConfig } from '#core/config/loader.js';
 *
 * // Load with defaults
 * const config = await loadConfig();
 *
 * // Load with overrides
 * const config2 = await loadConfig({ overrides: { logLevel: 'debug' } });
 *
 * // Type helper for config files
 * export default defineConfig({ logLevel: 'verbose' });
 * ```
 *
 * @module config
 */

import process from 'node:process';

import type { PramanConfig, PramanConfigInput } from './schema.js';
import { PramanConfigSchema } from './schema.js';

import { ConfigError } from '#core/errors/config-error.js';
import { createLogger } from '#core/logging/index.js';
import type { ValidationIssue } from '#core/types/validation.js';
import { assertNever } from '#core/utils/assert-never.js';

const log = createLogger('config:loader');

/**
 * Options for loading Praman configuration.
 */
export interface LoadConfigOptions {
  /** Inline config overrides (lower priority than env vars). */
  readonly overrides?: PramanConfigInput;
}

/** Env var name to config field mapping. */
interface EnvMapping {
  readonly envVar: string;
  readonly configKey: string;
  readonly type: 'string' | 'number' | 'boolean' | 'string-array';
}

const ENV_MAPPINGS: readonly EnvMapping[] = [
  { envVar: 'PRAMAN_LOG_LEVEL', configKey: 'logLevel', type: 'string' },
  { envVar: 'PRAMAN_UI5_WAIT_TIMEOUT', configKey: 'ui5WaitTimeout', type: 'number' },
  {
    envVar: 'PRAMAN_CONTROL_DISCOVERY_TIMEOUT',
    configKey: 'controlDiscoveryTimeout',
    type: 'number',
  },
  { envVar: 'PRAMAN_INTERACTION_STRATEGY', configKey: 'interactionStrategy', type: 'string' },
  {
    envVar: 'PRAMAN_DISCOVERY_STRATEGIES',
    configKey: 'discoveryStrategies',
    type: 'string-array',
  },
  { envVar: 'PRAMAN_SKIP_STABILITY_WAIT', configKey: 'skipStabilityWait', type: 'boolean' },
  { envVar: 'PRAMAN_PREFER_VISIBLE', configKey: 'preferVisibleControls', type: 'boolean' },
];

/**
 * Reads env vars and returns a partial config object.
 *
 * @returns Partial config from env vars (only defined vars included).
 */
function readEnvOverrides(): Record<string, unknown> {
  const envConfig: Record<string, unknown> = {};

  for (const mapping of ENV_MAPPINGS) {
    const value = process.env[mapping.envVar];
    if (value === undefined) continue;

    switch (mapping.type) {
      case 'number': {
        const num = Number(value);
        if (!Number.isNaN(num)) {
          envConfig[mapping.configKey] = num;
        }
        break;
      }
      case 'boolean':
        envConfig[mapping.configKey] = value === 'true';
        break;
      case 'string':
        envConfig[mapping.configKey] = value;
        break;
      case 'string-array': {
        const items = value
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        if (items.length > 0) {
          envConfig[mapping.configKey] = items;
        }
        break;
      }
      default:
        assertNever(mapping.type);
    }
  }

  // PRAMAN_DEBUG=true is a convenience shorthand for logLevel: 'debug'.
  // Lower priority than explicit PRAMAN_LOG_LEVEL.
  if (envConfig['logLevel'] === undefined && process.env['PRAMAN_DEBUG'] === 'true') {
    envConfig['logLevel'] = 'debug';
  }

  return envConfig;
}

/**
 * Loads, validates, and freezes Praman configuration.
 *
 * @param options - Optional inline overrides.
 * @returns Frozen, validated PramanConfig with all defaults applied.
 *
 * @example
 * ```typescript
 * const config = await loadConfig({ overrides: { logLevel: 'debug' } });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/require-await -- async for future file loading via import()
export async function loadConfig(options?: LoadConfigOptions): Promise<Readonly<PramanConfig>> {
  const envOverrides = readEnvOverrides();

  // Merge: defaults ← inline overrides ← env overrides
  const merged = {
    ...(options?.overrides ?? {}),
    ...envOverrides,
  };

  // Validate with Zod — safeParse to handle invalid env values gracefully
  const result = PramanConfigSchema.safeParse(merged);

  if (result.success) {
    return Object.freeze(result.data);
  }

  // If env vars caused validation failure, fall back to overrides-only and warn
  const fallbackResult = PramanConfigSchema.safeParse(options?.overrides ?? {});
  if (fallbackResult.success) {
    log.warn(
      {
        zodErrors: result.error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
          code: issue.code,
        })),
      },
      'Config validation failed due to invalid env vars — falling back to overrides-only config',
    );
    return Object.freeze(fallbackResult.data);
  }

  // Overrides themselves are invalid — this is a developer mistake, throw
  throw new ConfigError({
    message: 'Config validation failed: invalid overrides provided to loadConfig()',
    attempted: 'Validate merged configuration (overrides + env vars)',
    validationErrors: result.error.issues.map(
      (issue): ValidationIssue => ({
        path: issue.path.map((segment) => (typeof segment === 'symbol' ? String(segment) : segment)),
        message: issue.message,
        code: issue.code,
      }),
    ),
    suggestions: [
      'Check the overrides passed to loadConfig() for invalid values',
      'Use defineConfig() for type-safe config authoring',
      'Run PramanConfigSchema.safeParse(overrides) to inspect validation errors',
    ],
  });
}

/**
 * Type helper for Praman config files — returns input unchanged.
 *
 * @remarks
 * Used in `praman.config.ts` for IDE autocomplete and type checking.
 *
 * @param input - Config input to pass through.
 * @returns The input unchanged.
 *
 * @example
 * ```typescript
 * // praman.config.ts
 * import { defineConfig } from 'playwright-praman';
 * export default defineConfig({ logLevel: 'debug' });
 * ```
 */
export function defineConfig(input: PramanConfigInput): PramanConfigInput {
  return input;
}
