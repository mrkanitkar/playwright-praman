/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * VocabularyError — error subclass for business vocabulary resolution failures.
 *
 * @remarks
 * Thrown when vocabulary term lookup, domain loading, or JSON parsing fails.
 * Default code: `ERR_VOCAB_TERM_NOT_FOUND`. Default retryable: `false`
 * (vocabulary failures are structural, not transient — retrying without a fix
 * will not resolve them).
 *
 * @example
 * ```typescript
 * import { VocabularyError } from '#core/errors/vocabulary-error.js';
 *
 * throw new VocabularyError({
 *   message: `Term not found in vocabulary: ${term}`,
 *   attempted: `Resolve business term: ${term}`,
 *   term: 'vendorNumber',
 *   domain: 'procurement',
 *   suggestions: [
 *     'Check spelling — did you mean "vendor"?',
 *     'Use getBusinessTermSuggestions() to find available terms',
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
 * Options for constructing a VocabularyError.
 */
export interface VocabularyErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_VOCAB_TERM_NOT_FOUND
    | typeof ErrorCode.ERR_VOCAB_DOMAIN_LOAD_FAILED
    | typeof ErrorCode.ERR_VOCAB_JSON_INVALID
    | typeof ErrorCode.ERR_VOCAB_AMBIGUOUS_MATCH;
  readonly retryable?: boolean;
  /** The business term that failed to resolve. */
  readonly term?: string;
  /** The SAP vocabulary domain being searched (e.g. 'procurement', 'sales'). */
  readonly domain?: string;
}

/**
 * Error subclass for business vocabulary resolution failures.
 *
 * @example
 * ```typescript
 * const error = new VocabularyError({
 *   message: 'Term not found',
 *   attempted: 'Resolve vocabulary term: vendor',
 *   term: 'vendor',
 *   domain: 'procurement',
 * });
 * ```
 */
export class VocabularyError extends PramanError {
  readonly term: string | undefined;
  readonly domain: string | undefined;

  constructor(options: VocabularyErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_VOCAB_TERM_NOT_FOUND,
      retryable: options.retryable ?? false,
    });

    this.name = 'VocabularyError';
    this.term = options.term;
    this.domain = options.domain;

    Object.defineProperty(this, 'term', { writable: false, configurable: false });
    Object.defineProperty(this, 'domain', { writable: false, configurable: false });
  }

  override toJSON(): SerializedPramanError & {
    readonly term: string | undefined;
    readonly domain: string | undefined;
  } {
    return {
      ...super.toJSON(),
      term: this.term,
      domain: this.domain,
    };
  }

  override toAIContext(): AIErrorContext & {
    readonly term: string | undefined;
    readonly domain: string | undefined;
  } {
    return {
      ...super.toAIContext(),
      term: this.term,
      domain: this.domain,
    };
  }
}
