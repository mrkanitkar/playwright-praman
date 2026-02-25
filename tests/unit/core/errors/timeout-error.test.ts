/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/errors/timeout-error.ts`.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { TimeoutError } from '#core/errors/timeout-error.js';

describe('TimeoutError', () => {
  runBaseErrorTests(
    TimeoutError,
    {
      message: 'Operation timed out',
      attempted: 'Wait for UI5 stability',
      timeoutMs: 30000,
    },
    {
      expectedName: 'TimeoutError',
      expectedDefaultCode: ErrorCode.ERR_TIMEOUT_OPERATION,
      expectedDefaultRetryable: true,
    },
  );

  it('extends PramanError', () => {
    const error = new TimeoutError({
      message: 'Timed out',
      attempted: 'Wait',
      timeoutMs: 5000,
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts custom error code', () => {
    const error = new TimeoutError({
      code: ErrorCode.ERR_TIMEOUT_UI5_STABLE,
      message: 'UI5 stability timeout',
      attempted: 'Wait for UI5',
      timeoutMs: 30000,
    });
    expect(error.code).toBe(ErrorCode.ERR_TIMEOUT_UI5_STABLE);
  });

  it('stores timeoutMs from options (required)', () => {
    const error = new TimeoutError({
      message: 'Timed out',
      attempted: 'Wait',
      timeoutMs: 15000,
    });
    expect(error.timeoutMs).toBe(15000);
  });

  it('stores elapsed from options', () => {
    const error = new TimeoutError({
      message: 'Timed out',
      attempted: 'Wait',
      timeoutMs: 5000,
      elapsed: 5123,
    });
    expect(error.elapsed).toBe(5123);
  });

  it('elapsed is undefined when not provided', () => {
    const error = new TimeoutError({
      message: 'Timed out',
      attempted: 'Wait',
      timeoutMs: 5000,
    });
    expect(error.elapsed).toBeUndefined();
  });

  it('includes subclass fields in toJSON()', () => {
    const error = new TimeoutError({
      message: 'Timed out',
      attempted: 'Wait',
      timeoutMs: 30000,
      elapsed: 30500,
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('timeoutMs', 30000);
    expect(json).toHaveProperty('elapsed', 30500);
  });
});
