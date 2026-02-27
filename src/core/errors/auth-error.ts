/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * AuthError — error subclass for authentication failures.
 *
 * @remarks
 * Thrown when SAP system authentication fails, times out, or session expires.
 * Default code: `ERR_AUTH_FAILED`. Default retryable: `false`
 * (auth failures need credential/config fix).
 *
 * @example
 * ```typescript
 * import { AuthError } from '#core/errors/auth-error.js';
 *
 * throw new AuthError({
 *   message: 'SAML authentication failed',
 *   attempted: 'Login to SAP BTP',
 *   strategy: 'btp-saml',
 *   loginUrl: 'https://accounts.sap.com/login',
 * });
 * ```
 *
 * @module errors
 */

import { PramanError } from './base.js';
import type { AIErrorContext, PramanErrorOptions, SerializedPramanError } from './base.js';
import { ErrorCode } from './codes.js';

/**
 * Options for constructing an AuthError.
 */
export interface AuthErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_AUTH_FAILED
    | typeof ErrorCode.ERR_AUTH_TIMEOUT
    | typeof ErrorCode.ERR_AUTH_SESSION_EXPIRED
    | typeof ErrorCode.ERR_AUTH_STRATEGY_INVALID;
  readonly retryable?: boolean;
  readonly strategy?: string;
  readonly loginUrl?: string;
}

/**
 * Error subclass for authentication failures.
 *
 * @sapModule BC-SEC
 *
 * @businessContext SAP authentication lifecycle — login, session refresh, SSO token handling
 *
 * @example
 * ```typescript
 * const error = new AuthError({
 *   message: 'Auth failed',
 *   attempted: 'Login to SAP',
 *   strategy: 'btp-saml',
 * });
 * ```
 */
export class AuthError extends PramanError {
  readonly strategy: string | undefined;
  readonly loginUrl: string | undefined;

  /**
   * Creates a new AuthError instance.
   *
   * @param options - Auth error construction options including strategy and login URL.
   *
   * @example
   * ```typescript
   * import { AuthError } from '#core/errors/auth-error.js';
   *
   * const error = new AuthError({
   *   message: 'SAML authentication failed',
   *   attempted: 'Login to SAP BTP',
   *   strategy: 'btp-saml',
   *   loginUrl: 'https://accounts.sap.com/login',
   * });
   * ```
   */
  constructor(options: AuthErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_AUTH_FAILED,
      retryable: options.retryable ?? false,
    });

    this.name = 'AuthError';
    this.strategy = options.strategy;
    this.loginUrl = options.loginUrl;

    Object.defineProperty(this, 'strategy', { writable: false, configurable: false });
    Object.defineProperty(this, 'loginUrl', { writable: false, configurable: false });
  }

  /**
   * Serializes the error to a JSON-safe object with authentication fields.
   *
   * @returns Base fields plus `strategy` and `loginUrl`.
   *
   * @example
   * ```typescript
   * const json = error.toJSON();
   * // json.strategy === 'btp-saml'
   * // json.loginUrl === 'https://accounts.sap.com/login'
   * ```
   */
  override toJSON(): SerializedPramanError & {
    readonly strategy: string | undefined;
    readonly loginUrl: string | undefined;
  } {
    return {
      ...super.toJSON(),
      strategy: this.strategy,
      loginUrl: this.loginUrl,
    };
  }

  /**
   * Returns structured context for AI agents with authentication diagnostics.
   *
   * @returns Base AI context plus `strategy` and `loginUrl` fields
   * to help diagnose authentication configuration issues.
   *
   * @example
   * ```typescript
   * const context = error.toAIContext();
   * // context.strategy, context.loginUrl available
   * // Send to LLM for auth troubleshooting suggestions
   * ```
   */
  override toAIContext(): AIErrorContext & {
    readonly strategy: string | undefined;
    readonly loginUrl: string | undefined;
  } {
    return {
      ...super.toAIContext(),
      strategy: this.strategy,
      loginUrl: this.loginUrl,
    };
  }
}
