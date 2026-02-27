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
 * @remarks
 * Thrown when a business vocabulary term cannot be resolved, a domain
 * vocabulary file fails to load, or a term maps ambiguously to multiple
 * SAP controls or actions. Includes the `term` and `domain` fields for
 * diagnostic context.
 *
 * @sapModule cross-module
 * @businessContext Business vocabulary resolution for SAP domain terms
 * @failureMode Term not found — vocabulary term has no registered definition
 * @failureMode Domain load failed — vocabulary JSON file could not be loaded
 * @failureMode Ambiguous match — term maps to multiple SAP controls or actions
 * @aiContext Vocabulary term suggestions for AI — nearestTerms field provides alternatives
 *
 * @example
 * ```typescript
 * const error = new VocabularyError({
 *   message: 'Term not found in procurement domain',
 *   attempted: 'Resolve vocabulary term: vendorNumber',
 *   term: 'vendorNumber',
 *   domain: 'procurement',
 *   suggestions: ['Check spelling — did you mean "vendor"?'],
 * });
 * ```
 */
export class VocabularyError extends PramanError {
  readonly term: string | undefined;
  readonly domain: string | undefined;

  /**
   * Creates a new VocabularyError instance.
   *
   * @param options - Vocabulary error construction options including the
   *   optional `term` and `domain` diagnostic fields.
   *   Defaults: `code` = `ERR_VOCAB_TERM_NOT_FOUND`, `retryable` = `false`.
   *
   * @example
   * ```typescript
   * import { VocabularyError } from '#core/errors/vocabulary-error.js';
   *
   * const error = new VocabularyError({
   *   message: 'Term "vendorNum" not found in procurement domain',
   *   attempted: 'Resolve business term: vendorNum',
   *   term: 'vendorNum',
   *   domain: 'procurement',
   *   suggestions: [
   *     'Did you mean "vendorNumber"?',
   *     'Use getBusinessTermSuggestions() to list available terms',
   *   ],
   * });
   * ```
   */
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

  /**
   * Serializes the error to a plain JSON-safe object.
   *
   * @returns Base serialized fields plus `term` and `domain`.
   *
   * @example
   * ```typescript
   * import { VocabularyError } from '#core/errors/vocabulary-error.js';
   *
   * const error = new VocabularyError({
   *   message: 'Term not found',
   *   attempted: 'Resolve term: vendor',
   *   term: 'vendor',
   *   domain: 'procurement',
   * });
   * const json = error.toJSON();
   * // json.term === 'vendor', json.domain === 'procurement'
   * ```
   */
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

  /**
   * Returns structured context for AI agents to reason about the vocabulary failure.
   *
   * @remarks
   * Extends the base AI context with `term` and `domain` so AI agents
   * can suggest alternative business terms or correct domain references.
   *
   * @returns AI-friendly context object with vocabulary diagnostic fields.
   *
   * @example
   * ```typescript
   * import { VocabularyError } from '#core/errors/vocabulary-error.js';
   *
   * const error = new VocabularyError({
   *   message: 'Ambiguous term matches 2 controls',
   *   attempted: 'Resolve term: amount',
   *   code: 'ERR_VOCAB_AMBIGUOUS_MATCH',
   *   term: 'amount',
   *   domain: 'sales',
   * });
   * const context = error.toAIContext();
   * // context.term === 'amount', context.domain === 'sales'
   * ```
   */
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
