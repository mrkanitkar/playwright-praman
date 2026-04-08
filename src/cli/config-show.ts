/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Config show command — displays the resolved Praman configuration.
 *
 * @remarks
 * Loads config via `loadConfig()` (defaults + env var overrides),
 * redacts sensitive fields, and prints to stdout. Supports `--json`
 * for machine-readable output and `--show-secrets` to skip redaction.
 *
 * @module cli/config-show
 */

import process from 'node:process';

import { logBanner, logSection, logTable, logWarn } from './logger.js';
import { getVersion } from './version.js';

import { loadConfig } from '#core/config/loader.js';

/**
 * Options for the config show command.
 */
export interface ConfigShowOptions {
  /** Output raw JSON instead of formatted table. */
  readonly json: boolean;
  /** Show sensitive values without redaction. */
  readonly showSecrets: boolean;
}

/** Keys whose values are redacted in output by default. */
const SENSITIVE_KEYS: ReadonlySet<string> = new Set([
  'password',
  'apiKey',
  'anthropicApiKey',
  'token',
  'secret',
  'credentials',
  'accessToken',
  'refreshToken',
]);

/** Known PRAMAN_* env var names to check for active overrides. */
const KNOWN_ENV_VARS: readonly string[] = [
  // Top-level
  'PRAMAN_LOG_LEVEL',
  'PRAMAN_UI5_WAIT_TIMEOUT',
  'PRAMAN_CONTROL_DISCOVERY_TIMEOUT',
  'PRAMAN_INTERACTION_STRATEGY',
  'PRAMAN_DISCOVERY_STRATEGIES',
  'PRAMAN_SKIP_STABILITY_WAIT',
  'PRAMAN_PREFER_VISIBLE',
  'PRAMAN_DEBUG',
  // ai section
  'PRAMAN_AI_PROVIDER',
  'PRAMAN_AI_API_KEY',
  'PRAMAN_AI_MODEL',
  'PRAMAN_AI_TEMPERATURE',
  'PRAMAN_AI_ENDPOINT',
  'PRAMAN_AI_DEPLOYMENT',
  'PRAMAN_AI_API_VERSION',
  'PRAMAN_AI_ANTHROPIC_API_KEY',
  // telemetry section
  'PRAMAN_TELEMETRY_ENABLED',
  'PRAMAN_TELEMETRY_ENDPOINT',
  'PRAMAN_TELEMETRY_SERVICE_NAME',
  'PRAMAN_TELEMETRY_EXPORTER',
  'PRAMAN_TELEMETRY_PROTOCOL',
  'PRAMAN_TELEMETRY_METRICS_ENABLED',
  'PRAMAN_TELEMETRY_BATCH_TIMEOUT',
  'PRAMAN_TELEMETRY_MAX_QUEUE_SIZE',
  'PRAMAN_TELEMETRY_CONNECTION_STRING',
  // odataTracing section
  'PRAMAN_ODATA_TRACING_ENABLED',
];

/**
 * Deep-walks a value and replaces sensitive keys with `'[REDACTED]'`.
 *
 * @param value - The value to redact.
 * @param key - The current property key (used for sensitive-key matching).
 * @returns A new value with sensitive fields replaced.
 */
export function redactValue(value: unknown, key?: string): unknown {
  if (key !== undefined && SENSITIVE_KEYS.has(key) && typeof value === 'string') {
    return '[REDACTED]';
  }
  if (Array.isArray(value)) {
    return value.map((item: unknown) => redactValue(item));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      // eslint-disable-next-line security/detect-object-injection -- safe: iterating own enumerable keys
      result[k] = redactValue(v, k);
    }
    return result;
  }
  return value;
}

/**
 * Returns which PRAMAN_* env vars are currently set.
 *
 * @returns Array of `[envVar, value]` tuples for active overrides.
 */
export function detectActiveEnvVars(): readonly (readonly [string, string])[] {
  const active: [string, string][] = [];
  for (const envVar of KNOWN_ENV_VARS) {
    // eslint-disable-next-line security/detect-object-injection -- safe: reading from known-const env var names
    const val = process.env[envVar];
    if (val !== undefined) {
      active.push([envVar, val]);
    }
  }
  return active;
}

/**
 * Runs the config show command.
 *
 * @param options - Command options (json, showSecrets).
 *
 * @example
 * ```typescript
 * await runConfigShow({ json: false, showSecrets: false });
 * ```
 */
export async function runConfigShow(options: ConfigShowOptions): Promise<void> {
  const config = await loadConfig();
  const output = options.showSecrets ? config : redactValue(config);

  if (options.showSecrets) {
    logWarn('Showing unredacted config — secrets are visible');
  }

  if (options.json) {
    process.stdout.write(JSON.stringify(output, null, 2) + '\n');
    return;
  }

  // ── Pretty output ────────────────────────────────────────────────────
  logBanner('Praman Config', getVersion());

  // ── Active env var overrides ─────────────────────────────────────────
  const activeEnvVars = detectActiveEnvVars();
  logSection('Env Var Overrides');
  if (activeEnvVars.length > 0) {
    logTable(activeEnvVars.map(([k, v]) => [k, v] as const));
  } else {
    logTable([['(none)', 'Using defaults only']]);
  }

  // ── Resolved config ──────────────────────────────────────────────────
  logSection('Resolved Configuration');

  const redacted = output as Record<string, unknown>;
  const topLevel: [string, string][] = [];
  const sections: [string, Record<string, unknown>][] = [];

  for (const [key, val] of Object.entries(redacted)) {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      sections.push([key, val as Record<string, unknown>]);
    } else {
      topLevel.push([key, formatValue(val)]);
    }
  }

  logTable(topLevel);

  for (const [name, obj] of sections) {
    logSection(name);
    const rows: [string, string][] = Object.entries(obj).map(
      ([k, v]) => [k, formatValue(v)] as [string, string],
    );
    logTable(rows);
  }
}

/**
 * Formats a config value for display.
 *
 * @param value - The value to format.
 * @returns A string representation.
 */
function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  return String(value);
}
