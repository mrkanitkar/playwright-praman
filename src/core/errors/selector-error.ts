/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * SelectorError — error subclass for selector parsing/resolution failures.
 *
 * @remarks
 * Thrown when selectors have invalid syntax, are ambiguous, or can't be parsed.
 * Default code: `ERR_SELECTOR_INVALID`. Default retryable: `false`
 * (selector syntax errors are deterministic).
 *
 * @example
 * ```typescript
 * import { SelectorError } from '#core/errors/selector-error.js';
 *
 * throw new SelectorError({
 *   message: 'Ambiguous selector matched 3 controls',
 *   attempted: 'Resolve selector to single control',
 *   selectorString: 'sap.m.Button',
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
 * Options for constructing a SelectorError.
 */
export interface SelectorErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_SELECTOR_INVALID
    | typeof ErrorCode.ERR_SELECTOR_AMBIGUOUS
    | typeof ErrorCode.ERR_SELECTOR_PARSE;
  readonly retryable?: boolean;
  readonly selectorString?: string;
  readonly parsedSelector?: UI5Selector;
}

/**
 * Error subclass for selector parsing/resolution failures.
 *
 * @remarks
 * Thrown when a UI5 selector string has invalid syntax, matches multiple
 * controls when a single match is expected, or cannot be tokenized by the
 * selector parser. Includes the raw `selectorString` and, when available,
 * the partially `parsedSelector` for diagnostic inspection.
 *
 * @failureMode Invalid syntax — selector string does not match expected format
 * @failureMode Ambiguous match — selector matches multiple controls when single expected
 * @failureMode Parse failure — selector expression could not be tokenized
 * @aiContext Selector correction hints for AI agents — suggestedSelector field provides alternatives
 *
 * @example
 * ```typescript
 * const error = new SelectorError({
 *   message: 'Ambiguous selector matched 3 controls',
 *   attempted: 'Resolve selector to single control',
 *   code: 'ERR_SELECTOR_AMBIGUOUS',
 *   selectorString: 'sap.m.Button',
 * });
 * ```
 */
export class SelectorError extends PramanError {
  readonly selectorString: string | undefined;
  readonly parsedSelector: UI5Selector | undefined;

  /**
   * Creates a new SelectorError instance.
   *
   * @param options - Selector error construction options including the
   *   optional `selectorString` and `parsedSelector` diagnostic fields.
   *   Defaults: `code` = `ERR_SELECTOR_INVALID`, `retryable` = `false`.
   *
   * @example
   * ```typescript
   * import { SelectorError } from '#core/errors/selector-error.js';
   *
   * const error = new SelectorError({
   *   message: 'Invalid selector syntax: missing control type',
   *   attempted: 'Parse selector: ui5=sap.m.Button#save',
   *   selectorString: 'ui5=sap.m.Button#save',
   *   suggestions: ['Use format: controlType=sap.m.Button'],
   * });
   * ```
   */
  constructor(options: SelectorErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_SELECTOR_INVALID,
      retryable: options.retryable ?? false,
    });

    this.name = 'SelectorError';
    this.selectorString = options.selectorString;
    this.parsedSelector = options.parsedSelector;

    Object.defineProperty(this, 'selectorString', { writable: false, configurable: false });
    Object.defineProperty(this, 'parsedSelector', { writable: false, configurable: false });
  }

  /**
   * Serializes the error to a plain JSON-safe object.
   *
   * @returns Base serialized fields plus `selectorString` and `parsedSelector`.
   *
   * @example
   * ```typescript
   * import { SelectorError } from '#core/errors/selector-error.js';
   *
   * const error = new SelectorError({
   *   message: 'Invalid selector',
   *   attempted: 'Parse selector string',
   *   selectorString: 'sap.m.Input',
   * });
   * const json = error.toJSON();
   * // json.selectorString === 'sap.m.Input'
   * ```
   */
  override toJSON(): SerializedPramanError & {
    readonly selectorString: string | undefined;
    readonly parsedSelector: UI5Selector | undefined;
  } {
    return {
      ...super.toJSON(),
      selectorString: this.selectorString,
      parsedSelector: this.parsedSelector,
    };
  }

  /**
   * Returns structured context for AI agents to reason about the selector failure.
   *
   * @remarks
   * Extends the base AI context with `selectorString` and `parsedSelector`
   * so AI agents can suggest corrected selectors.
   *
   * @returns AI-friendly context object with selector diagnostic fields.
   *
   * @example
   * ```typescript
   * import { SelectorError } from '#core/errors/selector-error.js';
   *
   * const error = new SelectorError({
   *   message: 'Ambiguous selector',
   *   attempted: 'Find single control',
   *   selectorString: 'sap.m.Button',
   * });
   * const context = error.toAIContext();
   * // context.selectorString === 'sap.m.Button'
   * ```
   */
  override toAIContext(): AIErrorContext & {
    readonly selectorString: string | undefined;
    readonly parsedSelector: UI5Selector | undefined;
  } {
    return {
      ...super.toAIContext(),
      selectorString: this.selectorString,
      parsedSelector: this.parsedSelector,
    };
  }
}
