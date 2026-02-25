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
 * @example
 * ```typescript
 * const error = new SelectorError({
 *   message: 'Invalid selector',
 *   attempted: 'Parse selector string',
 * });
 * ```
 */
export class SelectorError extends PramanError {
  readonly selectorString: string | undefined;
  readonly parsedSelector: UI5Selector | undefined;

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
