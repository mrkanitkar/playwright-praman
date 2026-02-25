/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/errors/auth-error.ts`.
 */
import { describe, expect, it } from 'vitest';

import { runBaseErrorTests } from '../../../helpers/error-test-runner.js';

import { AuthError } from '#core/errors/auth-error.js';
import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';

describe('AuthError', () => {
  runBaseErrorTests(
    AuthError,
    {
      message: 'Authentication failed',
      attempted: 'Login to SAP system',
    },
    {
      expectedName: 'AuthError',
      expectedDefaultCode: ErrorCode.ERR_AUTH_FAILED,
      expectedDefaultRetryable: false,
    },
  );

  it('extends PramanError', () => {
    const error = new AuthError({
      message: 'Auth failed',
      attempted: 'Login',
    });
    expect(error).toBeInstanceOf(PramanError);
  });

  it('accepts custom error code', () => {
    const error = new AuthError({
      code: ErrorCode.ERR_AUTH_SESSION_EXPIRED,
      message: 'Session expired',
      attempted: 'Refresh session',
    });
    expect(error.code).toBe(ErrorCode.ERR_AUTH_SESSION_EXPIRED);
  });

  it('stores strategy from options', () => {
    const error = new AuthError({
      message: 'Auth failed',
      attempted: 'Login',
      strategy: 'btp-saml',
    });
    expect(error.strategy).toBe('btp-saml');
  });

  it('stores loginUrl from options', () => {
    const error = new AuthError({
      message: 'Auth failed',
      attempted: 'Login',
      loginUrl: 'https://accounts.sap.com/login',
    });
    expect(error.loginUrl).toBe('https://accounts.sap.com/login');
  });

  it('includes subclass fields in toJSON()', () => {
    const error = new AuthError({
      message: 'Auth failed',
      attempted: 'Login',
      strategy: 'office365',
      loginUrl: 'https://login.microsoft.com',
    });
    const json = error.toJSON();
    expect(json).toHaveProperty('strategy', 'office365');
    expect(json).toHaveProperty('loginUrl', 'https://login.microsoft.com');
  });
});
