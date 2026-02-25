/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * IntentError — error subclass for SAP intent domain operation failures.
 *
 * @remarks
 * Thrown when intent domain functions fail to fill fields, trigger actions,
 * navigate to SAP apps, or validate form state. Default code:
 * `ERR_INTENT_FIELD_NOT_FOUND`. Default retryable: `false`
 * (intent failures are typically structural — wrong selector, missing vocabulary
 * entry, or app layout mismatch — not transient network issues).
 *
 * @example
 * ```typescript
 * import { IntentError } from '#core/errors/intent-error.js';
 *
 * throw new IntentError({
 *   message: `Field selector not resolved: ${fieldName}`,
 *   attempted: `Fill field via vocabulary: ${fieldName}`,
 *   fieldName: 'supplier',
 *   sapDomain: 'procurement',
 *   suggestions: [
 *     'Verify the field name exists in vocabulary/domains/procurement.json',
 *     'Provide a custom selector via options.selectors',
 *   ],
 * });
 * ```
 *
 * @module errors
 */

import { PramanError } from './base.js';
import type { AIErrorContext, PramanErrorOptions, SerializedPramanError } from './base.js';
import { ErrorCode } from './codes.js';

/**
 * Options for constructing an IntentError.
 */
export interface IntentErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_INTENT_FIELD_NOT_FOUND
    | typeof ErrorCode.ERR_INTENT_ACTION_FAILED
    | typeof ErrorCode.ERR_INTENT_NAVIGATION_FAILED
    | typeof ErrorCode.ERR_INTENT_VALIDATION_FAILED;
  readonly retryable?: boolean;
  /** The SAP field name that could not be resolved (e.g. 'supplier', 'material'). */
  readonly fieldName?: string;
  /** The SAP module/domain being tested (e.g. 'procurement', 'sales', 'finance'). */
  readonly sapDomain?: string;
}

/**
 * Error subclass for SAP intent domain operation failures.
 *
 * @example
 * ```typescript
 * const error = new IntentError({
 *   message: 'Field not found',
 *   attempted: 'Fill supplier field',
 *   fieldName: 'supplier',
 *   sapDomain: 'procurement',
 * });
 * ```
 */
export class IntentError extends PramanError {
  readonly fieldName: string | undefined;
  readonly sapDomain: string | undefined;

  constructor(options: IntentErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_INTENT_FIELD_NOT_FOUND,
      retryable: options.retryable ?? false,
    });

    this.name = 'IntentError';
    this.fieldName = options.fieldName;
    this.sapDomain = options.sapDomain;

    Object.defineProperty(this, 'fieldName', { writable: false, configurable: false });
    Object.defineProperty(this, 'sapDomain', { writable: false, configurable: false });
  }

  override toJSON(): SerializedPramanError & {
    readonly fieldName: string | undefined;
    readonly sapDomain: string | undefined;
  } {
    return {
      ...super.toJSON(),
      fieldName: this.fieldName,
      sapDomain: this.sapDomain,
    };
  }

  override toAIContext(): AIErrorContext & {
    readonly fieldName: string | undefined;
    readonly sapDomain: string | undefined;
  } {
    return {
      ...super.toAIContext(),
      fieldName: this.fieldName,
      sapDomain: this.sapDomain,
    };
  }
}
