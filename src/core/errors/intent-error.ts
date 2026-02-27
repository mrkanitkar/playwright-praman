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
 *
 * @sapModule MM/SD/FI/PP
 * @businessContext SAP domain intent operations — field fill, button click, navigation, assertion
 * @failureMode Field not found — intent target field does not exist in the current view
 * @failureMode Action failed — SAP business action did not complete successfully
 */
export class IntentError extends PramanError {
  readonly fieldName: string | undefined;
  readonly sapDomain: string | undefined;

  /**
   * Creates a new IntentError instance.
   *
   * @param options - Intent error construction options including field name
   *   and SAP domain context for the failing operation.
   *
   * @example
   * ```typescript
   * import { IntentError } from '#core/errors/intent-error.js';
   *
   * const error = new IntentError({
   *   message: 'Field selector not resolved: supplier',
   *   attempted: 'Fill field via vocabulary: supplier',
   *   fieldName: 'supplier',
   *   sapDomain: 'procurement',
   *   suggestions: [
   *     'Verify the field name exists in vocabulary/domains/procurement.json',
   *     'Provide a custom selector via options.selectors',
   *   ],
   * });
   * ```
   */
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

  /**
   * Serializes this error to a JSON-safe object with intent-specific fields.
   *
   * @returns Base serialization extended with `fieldName` and `sapDomain`.
   *
   * @example
   * ```typescript
   * const json = error.toJSON();
   * console.log(json.fieldName); // 'supplier'
   * console.log(json.sapDomain); // 'procurement'
   * ```
   */
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

  /**
   * Returns AI-agent-friendly context with intent-specific diagnostic fields.
   *
   * @returns Base AI context extended with field name and SAP domain details.
   *
   * @example
   * ```typescript
   * const ctx = error.toAIContext();
   * // LLM can use ctx.fieldName to look up vocabulary alternatives
   * // and ctx.sapDomain to narrow the search scope
   * ```
   */
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
