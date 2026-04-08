/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * TelemetryError — error subclass for OpenTelemetry initialization and runtime failures.
 *
 * @remarks
 * Thrown when OTel SDK initialization fails, peer dependencies are missing,
 * exporter configuration is invalid, or shutdown/metrics init fails.
 * The optional `exporterType` and `packageName` fields provide diagnostic context.
 *
 * Default code: `ERR_TELEMETRY_INIT_FAILED`. Default retryable: `false`
 * (telemetry errors usually need config/dependency fix).
 *
 * @example
 * ```typescript
 * import { TelemetryError } from '#core/errors/telemetry-error.js';
 *
 * throw new TelemetryError({
 *   message: 'OpenTelemetry SDK not installed',
 *   attempted: 'Initialize OTel tracing',
 *   packageName: '@opentelemetry/sdk-node',
 *   suggestions: ['Install: npm install @opentelemetry/api @opentelemetry/sdk-node'],
 * });
 * ```
 *
 * @module errors
 */

import { PramanError } from './base.js';
import type { AIErrorContext, PramanErrorOptions, SerializedPramanError } from './base.js';
import { ErrorCode } from './codes.js';

/**
 * Options for constructing a TelemetryError.
 */
export interface TelemetryErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_TELEMETRY_INIT_FAILED
    | typeof ErrorCode.ERR_TELEMETRY_PEER_DEP_MISSING
    | typeof ErrorCode.ERR_TELEMETRY_EXPORTER_FAILED
    | typeof ErrorCode.ERR_TELEMETRY_SHUTDOWN_FAILED
    | typeof ErrorCode.ERR_TELEMETRY_METRICS_INIT_FAILED;
  readonly retryable?: boolean;
  readonly exporterType?: string;
  readonly packageName?: string;
}

/**
 * Error subclass for OpenTelemetry initialization and runtime failures.
 *
 * @example
 * ```typescript
 * const error = new TelemetryError({
 *   message: 'Failed to initialize OTel SDK',
 *   attempted: 'Initialize OpenTelemetry tracing',
 *   exporterType: 'otlp',
 * });
 * ```
 *
 * @failureMode Init failed — OTel SDK could not be started
 * @failureMode Peer dep missing — required OTel package not installed
 * @failureMode Exporter failed — trace/metrics exporter creation failed
 * @failureMode Shutdown failed — graceful shutdown of SDK timed out
 * @failureMode Metrics init failed — metrics SDK could not be started
 */
export class TelemetryError extends PramanError {
  readonly exporterType: string | undefined;
  readonly packageName: string | undefined;

  /**
   * Creates a new TelemetryError instance.
   *
   * @param options - Telemetry error construction options including optional
   *   exporter type and package name for diagnostic context.
   *
   * @example
   * ```typescript
   * import { TelemetryError } from '#core/errors/telemetry-error.js';
   *
   * const error = new TelemetryError({
   *   message: 'Peer dependency missing: @opentelemetry/sdk-node',
   *   attempted: 'Dynamic import of @opentelemetry/sdk-node',
   *   code: 'ERR_TELEMETRY_PEER_DEP_MISSING',
   *   packageName: '@opentelemetry/sdk-node',
   * });
   * ```
   */
  constructor(options: TelemetryErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_TELEMETRY_INIT_FAILED,
      retryable: options.retryable ?? false,
    });

    this.name = 'TelemetryError';
    this.exporterType = options.exporterType;
    this.packageName = options.packageName;

    Object.defineProperty(this, 'exporterType', { writable: false, configurable: false });
    Object.defineProperty(this, 'packageName', { writable: false, configurable: false });
  }

  /**
   * Serializes this error to a JSON-safe object with telemetry-specific fields.
   *
   * @returns Base serialization extended with `exporterType` and `packageName`.
   *
   * @example
   * ```typescript
   * const json = error.toJSON();
   * console.log(json.exporterType); // 'otlp'
   * console.log(json.packageName);  // '@opentelemetry/sdk-node'
   * ```
   */
  override toJSON(): SerializedPramanError & {
    readonly exporterType: string | undefined;
    readonly packageName: string | undefined;
  } {
    return {
      ...super.toJSON(),
      exporterType: this.exporterType,
      packageName: this.packageName,
    };
  }

  /**
   * Returns AI-agent-friendly context with telemetry-specific diagnostic fields.
   *
   * @returns Base AI context extended with exporter type and package name details.
   *
   * @example
   * ```typescript
   * const ctx = error.toAIContext();
   * // LLM can use ctx.packageName to suggest install commands
   * // and ctx.exporterType to suggest alternative exporters
   * ```
   */
  override toAIContext(): AIErrorContext & {
    readonly exporterType: string | undefined;
    readonly packageName: string | undefined;
  } {
    return {
      ...super.toAIContext(),
      exporterType: this.exporterType,
      packageName: this.packageName,
    };
  }
}
