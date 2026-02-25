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
 * @example
 * ```typescript
 * const error = new TimeoutError({
 *   message: 'Timed out',
 *   attempted: 'Wait for stability',
 *   timeoutMs: 5000,
 * });
 * ```
 */
export class TimeoutError extends PramanError {
  readonly timeoutMs: number;
  readonly elapsed: number | undefined;

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
