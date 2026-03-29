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

/** Env var name to top-level config field mapping. */
interface EnvMapping {
  readonly envVar: string;
  readonly configKey: string;
  readonly type: 'string' | 'number' | 'boolean' | 'string-array';
}

/** Env var name to nested config path mapping (depth = 2). */
interface NestedEnvMapping {
  readonly envVar: string;
  readonly section: string;
  readonly field: string;
  readonly type: 'string' | 'number' | 'boolean';
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

const NESTED_ENV_MAPPINGS: readonly NestedEnvMapping[] = [
  // auth section
  { envVar: 'PRAMAN_AUTH_BASE_URL', section: 'auth', field: 'baseUrl', type: 'string' },
  { envVar: 'PRAMAN_AUTH_STRATEGY', section: 'auth', field: 'strategy', type: 'string' },
  { envVar: 'PRAMAN_AUTH_USERNAME', section: 'auth', field: 'username', type: 'string' },
  { envVar: 'PRAMAN_AUTH_PASSWORD', section: 'auth', field: 'password', type: 'string' },
  { envVar: 'PRAMAN_AUTH_CLIENT', section: 'auth', field: 'client', type: 'string' },
  { envVar: 'PRAMAN_AUTH_LANGUAGE', section: 'auth', field: 'language', type: 'string' },
  // ai section
  { envVar: 'PRAMAN_AI_PROVIDER', section: 'ai', field: 'provider', type: 'string' },
  { envVar: 'PRAMAN_AI_API_KEY', section: 'ai', field: 'apiKey', type: 'string' },
  { envVar: 'PRAMAN_AI_MODEL', section: 'ai', field: 'model', type: 'string' },
  { envVar: 'PRAMAN_AI_TEMPERATURE', section: 'ai', field: 'temperature', type: 'number' },
  { envVar: 'PRAMAN_AI_ENDPOINT', section: 'ai', field: 'endpoint', type: 'string' },
  { envVar: 'PRAMAN_AI_DEPLOYMENT', section: 'ai', field: 'deployment', type: 'string' },
  { envVar: 'PRAMAN_AI_API_VERSION', section: 'ai', field: 'apiVersion', type: 'string' },
  {
    envVar: 'PRAMAN_AI_ANTHROPIC_API_KEY',
    section: 'ai',
    field: 'anthropicApiKey',
    type: 'string',
  },
  // telemetry section
  {
    envVar: 'PRAMAN_TELEMETRY_ENABLED',
    section: 'telemetry',
    field: 'openTelemetry',
    type: 'boolean',
  },
  { envVar: 'PRAMAN_TELEMETRY_ENDPOINT', section: 'telemetry', field: 'endpoint', type: 'string' },
  {
    envVar: 'PRAMAN_TELEMETRY_SERVICE_NAME',
    section: 'telemetry',
    field: 'serviceName',
    type: 'string',
  },
  // odataTracing section
  {
    envVar: 'PRAMAN_ODATA_TRACING_ENABLED',
    section: 'odataTracing',
    field: 'enabled',
    type: 'boolean',
  },
];

/**
 * Parses an env var string value to a typed value based on the mapping type.
 *
 * @param value - Raw env var string.
 * @param type - Target type: 'string', 'number', or 'boolean'.
 * @returns Parsed value, or `undefined` if parsing fails (e.g. non-numeric number).
 */
function parseNestedEnvValue(value: string, type: 'string' | 'number' | 'boolean'): unknown {
  switch (type) {
    case 'number': {
      const num = Number(value);
      return Number.isNaN(num) ? undefined : num;
    }
    case 'boolean':
      return value === 'true';
    case 'string':
      return value;
    default:
      return assertNever(type);
  }
}

/**
 * Reads nested env vars (auth.*, ai.*, telemetry.*, odataTracing.*)
 * and merges them into the config object.
 */
function readNestedEnvOverrides(envConfig: Record<string, unknown>): void {
  for (const mapping of NESTED_ENV_MAPPINGS) {
    const value = process.env[mapping.envVar];
    if (value === undefined) continue;

    const parsed = parseNestedEnvValue(value, mapping.type);
    if (parsed === undefined) continue;

    const existing = envConfig[mapping.section];
    if (existing !== null && typeof existing === 'object' && !Array.isArray(existing)) {
      (existing as Record<string, unknown>)[mapping.field] = parsed;
    } else {
      envConfig[mapping.section] = { [mapping.field]: parsed };
    }
  }
}

/**
 * Reads flat env vars and returns a partial config object.
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

  readNestedEnvOverrides(envConfig);

  return envConfig;
}

/**
 * Deep-merges two config objects at depth 2 (section.field level).
 * Values in `over` take precedence. Only merges plain objects — arrays
 * and primitives are replaced wholesale.
 *
 * @param base - Base config (inline overrides).
 * @param over - Override config (env vars).
 * @returns Merged config.
 */
function deepMergeConfig(
  base: Record<string, unknown>,
  over: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };

  for (const [key, overVal] of Object.entries(over)) {
    // eslint-disable-next-line security/detect-object-injection -- safe: key comes from Object.entries on trusted config
    const baseVal = result[key];
    if (
      overVal !== null &&
      typeof overVal === 'object' &&
      !Array.isArray(overVal) &&
      baseVal !== null &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      // Merge nested section: base section fields + env override fields
      // eslint-disable-next-line security/detect-object-injection -- safe: key comes from Object.entries on trusted config
      result[key] = {
        ...(baseVal as Record<string, unknown>),
        ...(overVal as Record<string, unknown>),
      };
    } else {
      // eslint-disable-next-line security/detect-object-injection -- safe: key comes from Object.entries on trusted config
      result[key] = overVal;
    }
  }

  return result;
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

  // Deep-merge: defaults ← inline overrides ← env overrides
  // Nested sections (auth, ai, telemetry, etc.) are merged per-field,
  // so env vars don't clobber entire sections from inline overrides.
  const merged = deepMergeConfig(
    (options?.overrides ?? {}) as Record<string, unknown>,
    envOverrides,
  );

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
        path: issue.path.map((segment) =>
          typeof segment === 'symbol' ? String(segment) : segment,
        ),
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
