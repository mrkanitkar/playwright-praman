/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * TimeoutError — error subclass for operation timeout failures.
 *
 * @remarks
 * Thrown when UI5 stability waits, control discovery, or generic operations
 * exceed their configured timeouts. Includes the configured `timeoutMs` and
 * optionally the actual `elapsed` time.
 *
 * Default code: `ERR_TIMEOUT_OPERATION`. Default retryable: `true`
 * (operation may succeed with longer timeout).
 *
 * @example
 * ```typescript
 * import { TimeoutError } from '#core/errors/timeout-error.js';
 *
 * throw new TimeoutError({
 *   message: 'UI5 stability check timed out after 30s',
 *   attempted: 'Wait for UI5 to stabilize',
 *   timeoutMs: 30000,
 *   elapsed: 30123,
 * });
 * ```
 *
 * @module errors
 */

import { PramanError } from './base.js';
import type { AIErrorContext, PramanErrorOptions, SerializedPramanError } from './base.js';
import { ErrorCode } from './codes.js';

/**
 * Options for constructing a TimeoutError.
 */
export interface TimeoutErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_TIMEOUT_UI5_STABLE
    | typeof ErrorCode.ERR_TIMEOUT_CONTROL_DISCOVERY
    | typeof ErrorCode.ERR_TIMEOUT_OPERATION;
  readonly retryable?: boolean;
  readonly timeoutMs: number;
  readonly elapsed?: number;
}

/**
 * Error subclass for operation timeout failures.
 *
 * @remarks
 * Thrown when UI5 stability waits, control discovery, or generic operations
 * exceed their configured timeout. The `timeoutMs` field always reflects the
 * configured limit, and `elapsed` captures the actual wall-clock time when
 * available.
 *
 * @failureMode UI5 stability timeout — UI5 framework did not reach stable state
 * @failureMode Control discovery timeout — target control not found within timeout period
 * @guarantee Always includes configured timeoutMs value in error details
 *
 * @example
 * ```typescript
 * const error = new TimeoutError({
 *   message: 'UI5 stability check timed out after 30s',
 *   attempted: 'Wait for UI5 to stabilize',
 *   timeoutMs: 30000,
 *   elapsed: 30123,
 * });
 * ```
 */
export class TimeoutError extends PramanError {
  readonly timeoutMs: number;
  readonly elapsed: number | undefined;

  /**
   * Creates a new TimeoutError instance.
   *
   * @param options - Timeout error construction options including the
   *   required `timeoutMs` and optional `elapsed` diagnostic fields.
   *   Defaults: `code` = `ERR_TIMEOUT_OPERATION`, `retryable` = `true`.
   *
   * @example
   * ```typescript
   * import { TimeoutError } from '#core/errors/timeout-error.js';
   *
   * const error = new TimeoutError({
   *   message: 'Control not found within 10s',
   *   attempted: 'Discover control: sap.m.Button#save',
   *   code: 'ERR_TIMEOUT_CONTROL_DISCOVERY',
   *   timeoutMs: 10000,
   *   elapsed: 10045,
   *   suggestions: ['Increase controlDiscoveryTimeout in config'],
   * });
   * ```
   */
  constructor(options: TimeoutErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_TIMEOUT_OPERATION,
      retryable: options.retryable ?? true,
    });

    this.name = 'TimeoutError';
    this.timeoutMs = options.timeoutMs;
    this.elapsed = options.elapsed;

    Object.defineProperty(this, 'timeoutMs', { writable: false, configurable: false });
    Object.defineProperty(this, 'elapsed', { writable: false, configurable: false });
  }

  /**
   * Serializes the error to a plain JSON-safe object.
   *
   * @returns Base serialized fields plus `timeoutMs` and `elapsed`.
   *
   * @example
   * ```typescript
   * import { TimeoutError } from '#core/errors/timeout-error.js';
   *
   * const error = new TimeoutError({
   *   message: 'Timed out',
   *   attempted: 'Wait for stability',
   *   timeoutMs: 5000,
   * });
   * const json = error.toJSON();
   * // json.timeoutMs === 5000
   * ```
   */
  override toJSON(): SerializedPramanError & {
    readonly timeoutMs: number;
    readonly elapsed: number | undefined;
  } {
    return {
      ...super.toJSON(),
      timeoutMs: this.timeoutMs,
      elapsed: this.elapsed,
    };
  }

  /**
   * Returns structured context for AI agents to reason about the timeout failure.
   *
   * @remarks
   * Extends the base AI context with `timeoutMs` and `elapsed` so AI agents
   * can recommend timeout adjustments or identify slow-loading pages.
   *
   * @returns AI-friendly context object with timeout diagnostic fields.
   *
   * @example
   * ```typescript
   * import { TimeoutError } from '#core/errors/timeout-error.js';
   *
   * const error = new TimeoutError({
   *   message: 'UI5 stability timed out',
   *   attempted: 'Wait for UI5 stable state',
   *   timeoutMs: 30000,
   *   elapsed: 30500,
   * });
   * const context = error.toAIContext();
   * // context.timeoutMs === 30000, context.elapsed === 30500
   * ```
   */
  override toAIContext(): AIErrorContext & {
    readonly timeoutMs: number;
    readonly elapsed: number | undefined;
  } {
    return {
      ...super.toAIContext(),
      timeoutMs: this.timeoutMs,
      elapsed: this.elapsed,
    };
  }
}
