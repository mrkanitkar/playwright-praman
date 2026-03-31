/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * ControlError — error subclass for UI5 control interaction failures.
 *
 * @remarks
 * Thrown when controls are not found, not visible, not enabled, or
 * not interactable. Includes self-healing fields for AI agent recovery:
 * `lastKnownSelector`, `availableControls`, `suggestedSelector`.
 *
 * Default code: `ERR_CONTROL_NOT_FOUND`. Default retryable: `true`
 * (control may appear after UI5 stabilizes).
 *
 * @example
 * ```typescript
 * import { ControlError } from '#core/errors/control-error.js';
 *
 * throw new ControlError({
 *   message: 'Control not found: submitBtn',
 *   attempted: 'Find control with ID: submitBtn',
 *   lastKnownSelector: { id: 'oldSubmitBtn' },
 *   availableControls: ['btn1', 'btn2'],
 *   suggestedSelector: { id: 'btn1' },
 * });
 * ```
 *
 * @module errors
 */

import { PramanError } from './base.js';
import type { AIErrorContext, PramanErrorOptions, SerializedPramanError } from './base.js';
import { ErrorCode } from './codes.js';

import type { UI5Selector } from '#core/types/selectors.js';

/**
 * Options for constructing a ControlError.
 */
export interface ControlErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_CONTROL_NOT_FOUND
    | typeof ErrorCode.ERR_CONTROL_NOT_VISIBLE
    | typeof ErrorCode.ERR_CONTROL_NOT_ENABLED
    | typeof ErrorCode.ERR_CONTROL_NOT_INTERACTABLE
    | typeof ErrorCode.ERR_CONTROL_NOT_UI5
    | typeof ErrorCode.ERR_CONTROL_PROPERTY
    | typeof ErrorCode.ERR_CONTROL_AGGREGATION
    | typeof ErrorCode.ERR_CONTROL_METHOD
    | typeof ErrorCode.ERR_CONTROL_INTERACTION_FAILED
    | typeof ErrorCode.ERR_CONTROL_NO_DOM_REF;
  readonly retryable?: boolean;
  readonly lastKnownSelector?: UI5Selector;
  readonly availableControls?: readonly string[];
  readonly suggestedSelector?: UI5Selector;
}

/**
 * Error subclass for UI5 control interaction failures.
 *
 * @aiContext Self-healing fields: lastKnownSelector, availableControls, suggestedSelector — enable AI agents to suggest corrected selectors
 *
 * @failureMode Not found — control ID or selector matches no controls in the UI5 view
 *
 * @failureMode Not visible — control exists but is hidden or not in the visible DOM
 *
 * @failureMode Not interactable — control is visible but disabled or read-only
 *
 * @browserContext Requires active UI5 page with rendered controls
 *
 * @example
 * ```typescript
 * const error = new ControlError({
 *   message: 'Button not found',
 *   attempted: 'Find button with ID: submitBtn',
 *   suggestedSelector: { id: 'btn1' },
 * });
 * ```
 */
export class ControlError extends PramanError {
  readonly lastKnownSelector: UI5Selector | undefined;
  readonly availableControls: readonly string[];
  readonly suggestedSelector: UI5Selector | undefined;

  /**
   * Creates a new ControlError instance.
   *
   * @param options - Control error construction options including self-healing selector fields.
   *
   * @example
   * ```typescript
   * import { ControlError } from '#core/errors/control-error.js';
   *
   * const error = new ControlError({
   *   message: 'Control not found: submitBtn',
   *   attempted: 'Find control with ID: submitBtn',
   *   lastKnownSelector: { id: 'oldSubmitBtn' },
   *   availableControls: ['btn1', 'btn2'],
   *   suggestedSelector: { id: 'btn1' },
   * });
   * ```
   */
  constructor(options: ControlErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_CONTROL_NOT_FOUND,
      retryable: options.retryable ?? true,
    });

    this.name = 'ControlError';
    this.lastKnownSelector = options.lastKnownSelector;
    this.availableControls = Object.freeze([...(options.availableControls ?? [])]);
    this.suggestedSelector = options.suggestedSelector;

    Object.defineProperty(this, 'lastKnownSelector', { writable: false, configurable: false });
    Object.defineProperty(this, 'availableControls', { writable: false, configurable: false });
    Object.defineProperty(this, 'suggestedSelector', { writable: false, configurable: false });
  }

  /**
   * Serializes the error to a JSON-safe object with control interaction fields.
   *
   * @returns Base fields plus `lastKnownSelector`, `availableControls`, and `suggestedSelector`.
   *
   * @example
   * ```typescript
   * const json = error.toJSON();
   * // json.lastKnownSelector === { id: 'oldSubmitBtn' }
   * // json.availableControls === ['btn1', 'btn2']
   * // json.suggestedSelector === { id: 'btn1' }
   * ```
   */
  override toJSON(): SerializedPramanError & {
    readonly lastKnownSelector: UI5Selector | undefined;
    readonly availableControls: readonly string[];
    readonly suggestedSelector: UI5Selector | undefined;
  } {
    return {
      ...super.toJSON(),
      lastKnownSelector: this.lastKnownSelector,
      availableControls: this.availableControls,
      suggestedSelector: this.suggestedSelector,
    };
  }

  /**
   * Returns structured context for AI agents with control self-healing fields.
   *
   * @returns Base AI context plus `lastKnownSelector`, `availableControls`,
   * and `suggestedSelector` fields to enable AI-driven selector correction.
   *
   * @example
   * ```typescript
   * const context = error.toAIContext();
   * // context.lastKnownSelector — the selector that previously worked
   * // context.availableControls — controls currently in the view
   * // context.suggestedSelector — best-match selector suggestion
   * ```
   */
  override toAIContext(): AIErrorContext & {
    readonly lastKnownSelector: UI5Selector | undefined;
    readonly availableControls: readonly string[];
    readonly suggestedSelector: UI5Selector | undefined;
  } {
    return {
      ...super.toAIContext(),
      lastKnownSelector: this.lastKnownSelector,
      availableControls: this.availableControls,
      suggestedSelector: this.suggestedSelector,
    };
  }
}
