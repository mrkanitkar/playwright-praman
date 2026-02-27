/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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
 *
 * @sapModule BC-SRV-OData
 * @failureMode Request failed — OData HTTP request returned error status
 * @failureMode Parse error — OData response body could not be parsed as JSON/XML
 * @failureMode CSRF expired — x-csrf-token is stale and needs refresh
 */
export class ODataError extends PramanError {
  readonly statusCode: number | undefined;
  readonly requestUrl: string | undefined;
  readonly entitySet: string | undefined;

  /**
   * Creates a new ODataError instance.
   *
   * @param options - OData error construction options including HTTP status code,
   *   request URL, and entity set context for the failing operation.
   *
   * @example
   * ```typescript
   * import { ODataError } from '#core/errors/odata-error.js';
   *
   * const error = new ODataError({
   *   message: 'OData request failed with status 403',
   *   attempted: 'Fetch purchase orders from PurchaseOrder entity set',
   *   statusCode: 403,
   *   requestUrl: '/sap/opu/odata/sap/API_PURCHASEORDER_PROCESS_SRV/PurchaseOrder',
   *   entitySet: 'PurchaseOrder',
   * });
   * ```
   */
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

  /**
   * Serializes this error to a JSON-safe object with OData-specific fields.
   *
   * @returns Base serialization extended with `statusCode`, `requestUrl`, and `entitySet`.
   *
   * @example
   * ```typescript
   * const json = error.toJSON();
   * console.log(json.statusCode); // 403
   * console.log(json.entitySet);  // 'PurchaseOrder'
   * console.log(json.requestUrl); // '/sap/opu/odata/sap/.../PurchaseOrder'
   * ```
   */
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

  /**
   * Returns AI-agent-friendly context with OData-specific diagnostic fields.
   *
   * @returns Base AI context extended with HTTP status, request URL, and entity set details.
   *
   * @example
   * ```typescript
   * const ctx = error.toAIContext();
   * // LLM can use ctx.statusCode to determine if the error is auth-related (401/403)
   * // and ctx.entitySet to suggest the correct OData service path
   * ```
   */
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
