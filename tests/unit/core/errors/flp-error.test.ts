/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/errors/flp-error.ts`.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { FLPError } from '#core/errors/flp-error.js';

describe('FLPError', () => {
  runBaseErrorTests(
    FLPError,
    {
      message: 'FLP shell not available',
      attempted: 'Get lock entries via SM12_SRV',
    },
    {
      expectedName: 'FLPError',
      expectedDefaultCode: ErrorCode.ERR_FLP_SHELL_NOT_FOUND,
      expectedDefaultRetryable: true,
    },
  );

  it('extends PramanError', () => {
    const error = new FLPError({
      message: 'FLP shell not available',
      attempted: 'Get lock entries',
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts ERR_FLP_PERMISSION_DENIED code', () => {
    const error = new FLPError({
      code: ErrorCode.ERR_FLP_PERMISSION_DENIED,
      message: 'Permission denied for FLP service',
      attempted: 'Access UI2/INTEROP service',
    });
    expect(error.code).toBe(ErrorCode.ERR_FLP_PERMISSION_DENIED);
  });

  it('accepts ERR_FLP_API_UNAVAILABLE code', () => {
    const error = new FLPError({
      code: ErrorCode.ERR_FLP_API_UNAVAILABLE,
      message: 'FLP API not available',
      attempted: 'Call sap.ushell.Container',
    });
    expect(error.code).toBe(ErrorCode.ERR_FLP_API_UNAVAILABLE);
  });

  it('accepts ERR_FLP_INVALID_USER code', () => {
    const error = new FLPError({
      code: ErrorCode.ERR_FLP_INVALID_USER,
      message: 'Invalid FLP user',
      attempted: 'Resolve user context',
    });
    expect(error.code).toBe(ErrorCode.ERR_FLP_INVALID_USER);
  });

  it('accepts ERR_FLP_OPERATION_TIMEOUT code', () => {
    const error = new FLPError({
      code: ErrorCode.ERR_FLP_OPERATION_TIMEOUT,
      message: 'FLP operation timed out',
      attempted: 'Wait for FLP shell initialization',
    });
    expect(error.code).toBe(ErrorCode.ERR_FLP_OPERATION_TIMEOUT);
  });

  it('stores flpService from options', () => {
    const error = new FLPError({
      message: 'FLP shell not available',
      attempted: 'Get lock entries',
      flpService: 'SM12_SRV',
    });
    expect(error.flpService).toBe('SM12_SRV');
  });

  it('stores username from options', () => {
    const error = new FLPError({
      message: 'FLP shell not available',
      attempted: 'Get lock entries',
      username: 'TESTUSER01',
    });
    expect(error.username).toBe('TESTUSER01');
  });

  it('flpService and username are undefined when not provided', () => {
    const error = new FLPError({
      message: 'FLP shell not available',
      attempted: 'Get lock entries',
    });
    expect(error.flpService).toBeUndefined();
    expect(error.username).toBeUndefined();
  });

  it('includes flpService and username in toJSON()', () => {
    const error = new FLPError({
      message: 'FLP shell not available',
      attempted: 'Get lock entries',
      flpService: 'UI2/INTEROP',
      username: 'ADMIN',
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('flpService', 'UI2/INTEROP');
    expect(json).toHaveProperty('username', 'ADMIN');
  });

  it('includes flpService and username in toAIContext()', () => {
    const error = new FLPError({
      message: 'FLP shell not available',
      attempted: 'Get lock entries',
      flpService: 'SM12_SRV',
      username: 'DEVELOPER',
    });
    const ctx = error.toAIContext();
    expect(ctx).toHaveProperty('flpService', 'SM12_SRV');
    expect(ctx).toHaveProperty('username', 'DEVELOPER');
  });

  it('allows overriding retryable to false', () => {
    const error = new FLPError({
      code: ErrorCode.ERR_FLP_PERMISSION_DENIED,
      message: 'Permission denied',
      attempted: 'Access FLP service',
      retryable: false,
    });
    expect(error.retryable).toBe(false);
  });

  it('makes flpService immutable', () => {
    const error = new FLPError({
      message: 'FLP shell not available',
      attempted: 'Get lock entries',
      flpService: 'SM12_SRV',
    });
    expect(() => {
      // @ts-expect-error -- testing runtime immutability
      error.flpService = 'OTHER_SRV';
    }).toThrow();
  });

  it('makes username immutable', () => {
    const error = new FLPError({
      message: 'FLP shell not available',
      attempted: 'Get lock entries',
      username: 'TESTUSER01',
    });
    expect(() => {
      // @ts-expect-error -- testing runtime immutability
      error.username = 'OTHER_USER';
    }).toThrow();
  });
});
