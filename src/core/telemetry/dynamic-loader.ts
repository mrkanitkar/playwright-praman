/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Dynamic import helpers for optional OpenTelemetry peer dependencies.
 *
 * @remarks
 * Provides `tryImportOTel` (returns undefined on failure) and `requireOTel`
 * (throws TelemetryError on failure) for safe dynamic loading of OTel packages.
 * These ensure Praman does not crash when optional OTel peers are absent.
 *
 * @example
 * ```typescript
 * import { requireOTel } from '#core/telemetry/dynamic-loader.js';
 *
 * const otelApi = await requireOTel<typeof import('@opentelemetry/api')>(
 *   '@opentelemetry/api',
 * );
 * ```
 *
 * @internal
 * @module telemetry
 */

import { ErrorCode } from '#core/errors/codes.js';
import { TelemetryError } from '#core/errors/telemetry-error.js';
import { createLogger } from '#core/logging/index.js';

/** Lazy logger — created on first use to avoid module-scope side effects in tests. */
function getLog(): ReturnType<typeof createLogger> {
  return createLogger('telemetry:loader');
}

/**
 * Attempts to dynamically import an OTel package, returning `undefined` if not installed.
 *
 * @typeParam T - The expected module type (e.g., `typeof import('@opentelemetry/api')`)
 * @param packageName - The npm package name to import
 * @returns The imported module, or `undefined` if the package is not available
 *
 * @example
 * ```typescript
 * const api = await tryImportOTel<typeof import('@opentelemetry/api')>(
 *   '@opentelemetry/api',
 * );
 * if (api) {
 *   const tracer = api.trace.getTracer('my-app');
 * }
 * ```
 */
export async function tryImportOTel<T>(packageName: string): Promise<T | undefined> {
  try {
    const mod = (await import(packageName)) as T;
    getLog().debug({ packageName }, 'OTel package loaded');
    return mod;
  } catch {
    getLog().debug({ packageName }, 'OTel package not available');
    return undefined;
  }
}

/**
 * Dynamically imports an OTel package, throwing TelemetryError if not installed.
 *
 * @typeParam T - The expected module type (e.g., `typeof import('@opentelemetry/sdk-node')`)
 * @param packageName - The npm package name to import
 * @returns The imported module
 * @throws TelemetryError with code `ERR_TELEMETRY_PEER_DEP_MISSING` if import fails
 *
 * @example
 * ```typescript
 * const { NodeSDK } = await requireOTel<typeof import('@opentelemetry/sdk-node')>(
 *   '@opentelemetry/sdk-node',
 * );
 * ```
 */
export async function requireOTel<T>(packageName: string): Promise<T> {
  const mod = await tryImportOTel<T>(packageName);
  if (mod === undefined) {
    throw new TelemetryError({
      code: ErrorCode.ERR_TELEMETRY_PEER_DEP_MISSING,
      message: `Required OpenTelemetry package not installed: ${packageName}`,
      attempted: `Dynamic import of ${packageName}`,
      packageName,
      suggestions: [
        `Install the package: npm install ${packageName}`,
        'Ensure all OTel peer dependencies are installed: npm install @opentelemetry/api @opentelemetry/sdk-node',
        'Or disable telemetry: set openTelemetry to false in config',
      ],
    });
  }
  return mod;
}
