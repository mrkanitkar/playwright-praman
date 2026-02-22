/**
 * FLPError — error subclass for SAP Fiori Launchpad (FLP) operation failures.
 *
 * @remarks
 * Thrown when FLP shell operations, service calls, or user-context queries fail.
 * Covers shell unavailability, permission denials, API failures, invalid users,
 * and operation timeouts. Default code: `ERR_FLP_SHELL_NOT_FOUND`.
 * Default retryable: `true` (FLP failures are often transient — shell may
 * become available after page load or service restart).
 *
 * @example
 * ```typescript
 * import { FLPError } from '#core/errors/flp-error.js';
 *
 * throw new FLPError({
 *   message: 'FLP shell not available',
 *   attempted: 'Get lock entries via SM12_SRV',
 *   flpService: 'SM12_SRV',
 *   username: 'TESTUSER01',
 * });
 * ```
 *
 * @module errors
 */

import { PramanError } from './base.js';
import type { AIErrorContext, PramanErrorOptions, SerializedPramanError } from './base.js';
import { ErrorCode } from './codes.js';

/**
 * Options for constructing an FLPError.
 */
export interface FLPErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_FLP_SHELL_NOT_FOUND
    | typeof ErrorCode.ERR_FLP_PERMISSION_DENIED
    | typeof ErrorCode.ERR_FLP_API_UNAVAILABLE
    | typeof ErrorCode.ERR_FLP_INVALID_USER
    | typeof ErrorCode.ERR_FLP_OPERATION_TIMEOUT;
  readonly retryable?: boolean;
  /** The OData service that failed (e.g. 'SM12_SRV', 'UI2/INTEROP'). */
  readonly flpService?: string;
  /** The user involved in the operation. */
  readonly username?: string;
}

/**
 * Error subclass for SAP Fiori Launchpad (FLP) operation failures.
 *
 * @example
 * ```typescript
 * const error = new FLPError({
 *   message: 'FLP shell not available',
 *   attempted: 'Get lock entries via SM12_SRV',
 *   flpService: 'SM12_SRV',
 * });
 * ```
 */
export class FLPError extends PramanError {
  readonly flpService: string | undefined;
  readonly username: string | undefined;

  constructor(options: FLPErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_FLP_SHELL_NOT_FOUND,
      retryable: options.retryable ?? true,
    });

    this.name = 'FLPError';
    this.flpService = options.flpService;
    this.username = options.username;

    Object.defineProperty(this, 'flpService', { writable: false, configurable: false });
    Object.defineProperty(this, 'username', { writable: false, configurable: false });
  }

  override toJSON(): SerializedPramanError & {
    readonly flpService: string | undefined;
    readonly username: string | undefined;
  } {
    return {
      ...super.toJSON(),
      flpService: this.flpService,
      username: this.username,
    };
  }

  override toAIContext(): AIErrorContext & {
    readonly flpService: string | undefined;
    readonly username: string | undefined;
  } {
    return {
      ...super.toAIContext(),
      flpService: this.flpService,
      username: this.username,
    };
  }
}
