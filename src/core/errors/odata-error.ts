/**
 * ODataError — error subclass for OData request failures.
 *
 * @remarks
 * Thrown when OData requests fail, responses can't be parsed, or CSRF tokens expire.
 * Default code: `ERR_ODATA_REQUEST_FAILED`. Default retryable: `true`
 * (network transient errors are retryable).
 *
 * @example
 * ```typescript
 * import { ODataError } from '#core/errors/odata-error.js';
 *
 * throw new ODataError({
 *   message: 'OData request failed with status 403',
 *   attempted: 'Fetch purchase orders',
 *   statusCode: 403,
 *   entitySet: 'PurchaseOrder',
 * });
 * ```
 *
 * @module errors
 */

import { PramanError } from './base.js';
import type { AIErrorContext, PramanErrorOptions, SerializedPramanError } from './base.js';
import { ErrorCode } from './codes.js';

/**
 * Options for constructing an ODataError.
 */
export interface ODataErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_ODATA_REQUEST_FAILED
    | typeof ErrorCode.ERR_ODATA_PARSE
    | typeof ErrorCode.ERR_ODATA_CSRF;
  readonly retryable?: boolean;
  readonly statusCode?: number;
  readonly requestUrl?: string;
  readonly entitySet?: string;
}

/**
 * Error subclass for OData request failures.
 *
 * @example
 * ```typescript
 * const error = new ODataError({
 *   message: 'OData request failed',
 *   attempted: 'Fetch entity set',
 *   statusCode: 500,
 * });
 * ```
 */
export class ODataError extends PramanError {
  readonly statusCode: number | undefined;
  readonly requestUrl: string | undefined;
  readonly entitySet: string | undefined;

  constructor(options: ODataErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_ODATA_REQUEST_FAILED,
      retryable: options.retryable ?? true,
    });

    this.name = 'ODataError';
    this.statusCode = options.statusCode;
    this.requestUrl = options.requestUrl;
    this.entitySet = options.entitySet;

    Object.defineProperty(this, 'statusCode', { writable: false, configurable: false });
    Object.defineProperty(this, 'requestUrl', { writable: false, configurable: false });
    Object.defineProperty(this, 'entitySet', { writable: false, configurable: false });
  }

  override toJSON(): SerializedPramanError & {
    readonly statusCode: number | undefined;
    readonly requestUrl: string | undefined;
    readonly entitySet: string | undefined;
  } {
    return {
      ...super.toJSON(),
      statusCode: this.statusCode,
      requestUrl: this.requestUrl,
      entitySet: this.entitySet,
    };
  }

  override toAIContext(): AIErrorContext & {
    readonly statusCode: number | undefined;
    readonly requestUrl: string | undefined;
    readonly entitySet: string | undefined;
  } {
    return {
      ...super.toAIContext(),
      statusCode: this.statusCode,
      requestUrl: this.requestUrl,
      entitySet: this.entitySet,
    };
  }
}
