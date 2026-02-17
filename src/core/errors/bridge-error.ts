/**
 * BridgeError — error subclass for bridge adapter failures.
 *
 * @remarks
 * Thrown when bridge injection, communication, or version checks fail.
 * Default code: `ERR_BRIDGE_NOT_READY`. Default retryable: `true`
 * (bridge may recover after page navigation/reload).
 *
 * @example
 * ```typescript
 * import { BridgeError } from '#core/errors/bridge-error.js';
 *
 * throw new BridgeError({
 *   message: 'Bridge injection timed out',
 *   attempted: 'Inject RecordReplay bridge adapter',
 *   ui5Version: '1.120.0',
 *   adapterType: 'record-replay',
 * });
 * ```
 *
 * @module errors
 */

import { PramanError } from './base.js';
import type { AIErrorContext, PramanErrorOptions, SerializedPramanError } from './base.js';
import { ErrorCode } from './codes.js';

/**
 * Options for constructing a BridgeError.
 */
export interface BridgeErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_BRIDGE_TIMEOUT
    | typeof ErrorCode.ERR_BRIDGE_INJECTION
    | typeof ErrorCode.ERR_BRIDGE_NOT_READY
    | typeof ErrorCode.ERR_BRIDGE_VERSION
    | typeof ErrorCode.ERR_BRIDGE_EXECUTION;
  readonly retryable?: boolean;
  readonly ui5Version?: string;
  readonly adapterType?: string;
}

/**
 * Error subclass for bridge adapter failures.
 *
 * @example
 * ```typescript
 * const error = new BridgeError({
 *   message: 'Bridge not ready',
 *   attempted: 'Inject bridge adapter',
 * });
 * ```
 */
export class BridgeError extends PramanError {
  readonly ui5Version: string | undefined;
  readonly adapterType: string | undefined;

  constructor(options: BridgeErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_BRIDGE_NOT_READY,
      retryable: options.retryable ?? true,
    });

    this.name = 'BridgeError';
    this.ui5Version = options.ui5Version;
    this.adapterType = options.adapterType;

    Object.defineProperty(this, 'ui5Version', { writable: false, configurable: false });
    Object.defineProperty(this, 'adapterType', { writable: false, configurable: false });
  }

  override toJSON(): SerializedPramanError & {
    readonly ui5Version: string | undefined;
    readonly adapterType: string | undefined;
  } {
    return {
      ...super.toJSON(),
      ui5Version: this.ui5Version,
      adapterType: this.adapterType,
    };
  }

  override toAIContext(): AIErrorContext & {
    readonly ui5Version: string | undefined;
    readonly adapterType: string | undefined;
  } {
    return {
      ...super.toAIContext(),
      ui5Version: this.ui5Version,
      adapterType: this.adapterType,
    };
  }
}
