/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/errors/vocabulary-error.ts`.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { VocabularyError } from '#core/errors/vocabulary-error.js';

describe('VocabularyError', () => {
  runBaseErrorTests(
    VocabularyError,
    {
      message: 'Vocabulary term not found',
      attempted: 'Resolve business term: vendor',
    },
    {
      expectedName: 'VocabularyError',
      expectedDefaultCode: ErrorCode.ERR_VOCAB_TERM_NOT_FOUND,
      expectedDefaultRetryable: false,
    },
  );

  it('extends PramanError', () => {
    const error = new VocabularyError({
      message: 'Term not found',
      attempted: 'Resolve term',
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts ERR_VOCAB_DOMAIN_LOAD_FAILED code', () => {
    const error = new VocabularyError({
      code: ErrorCode.ERR_VOCAB_DOMAIN_LOAD_FAILED,
      message: 'Domain load failed',
      attempted: 'Load procurement domain',
    });
    expect(error.code).toBe(ErrorCode.ERR_VOCAB_DOMAIN_LOAD_FAILED);
  });

  it('accepts ERR_VOCAB_JSON_INVALID code', () => {
    const error = new VocabularyError({
      code: ErrorCode.ERR_VOCAB_JSON_INVALID,
      message: 'Invalid JSON',
      attempted: 'Parse procurement.json',
    });
    expect(error.code).toBe(ErrorCode.ERR_VOCAB_JSON_INVALID);
  });

  it('accepts ERR_VOCAB_AMBIGUOUS_MATCH code', () => {
    const error = new VocabularyError({
      code: ErrorCode.ERR_VOCAB_AMBIGUOUS_MATCH,
      message: 'Ambiguous match',
      attempted: 'Resolve term: date',
    });
    expect(error.code).toBe(ErrorCode.ERR_VOCAB_AMBIGUOUS_MATCH);
  });

  it('stores term from options', () => {
    const error = new VocabularyError({
      message: 'Term not found',
      attempted: 'Resolve term',
      term: 'vendorNumber',
    });
    expect(error.term).toBe('vendorNumber');
  });

  it('stores domain from options', () => {
    const error = new VocabularyError({
      message: 'Term not found',
      attempted: 'Resolve term',
      domain: 'procurement',
    });
    expect(error.domain).toBe('procurement');
  });

  it('term and domain are undefined when not provided', () => {
    const error = new VocabularyError({
      message: 'Term not found',
      attempted: 'Resolve term',
    });
    expect(error.term).toBeUndefined();
    expect(error.domain).toBeUndefined();
  });

  it('includes term and domain in toJSON()', () => {
    const error = new VocabularyError({
      message: 'Term not found',
      attempted: 'Resolve term',
      term: 'supplier',
      domain: 'procurement',
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('term', 'supplier');
    expect(json).toHaveProperty('domain', 'procurement');
  });

  it('includes term and domain in toAIContext()', () => {
    const error = new VocabularyError({
      message: 'Term not found',
      attempted: 'Resolve term',
      term: 'customer',
      domain: 'sales',
    });
    const ctx = error.toAIContext();
    expect(ctx).toHaveProperty('term', 'customer');
    expect(ctx).toHaveProperty('domain', 'sales');
  });
});
