/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * NavigationError — error subclass for FLP/route navigation failures.
 *
 * @remarks
 * Thrown when FLP tile navigation, route changes, or page loads fail.
 * Default code: `ERR_NAV_ROUTE_FAILED`. Default retryable: `true`
 * (navigation may succeed after brief wait).
 *
 * @example
 * ```typescript
 * import { NavigationError } from '#core/errors/navigation-error.js';
 *
 * throw new NavigationError({
 *   message: 'FLP tile not found',
 *   attempted: 'Navigate to Purchase Order app',
 *   targetUrl: 'https://sap.example.com/app/po',
 *   currentUrl: 'https://sap.example.com/flp',
 * });
 * ```
 *
 * @module errors
 */

import { PramanError } from './base.js';
import type { AIErrorContext, PramanErrorOptions, SerializedPramanError } from './base.js';
import { ErrorCode } from './codes.js';

/**
 * Options for constructing a NavigationError.
 */
export interface NavigationErrorOptions extends Omit<PramanErrorOptions, 'code' | 'retryable'> {
  readonly code?:
    | typeof ErrorCode.ERR_NAV_TILE_NOT_FOUND
    | typeof ErrorCode.ERR_NAV_ROUTE_FAILED
    | typeof ErrorCode.ERR_NAV_TIMEOUT;
  readonly retryable?: boolean;
  readonly targetUrl?: string;
  readonly currentUrl?: string;
}

/**
 * Error subclass for FLP/route navigation failures.
 *
 * @example
 * ```typescript
 * const error = new NavigationError({
 *   message: 'Route failed',
 *   attempted: 'Navigate to app',
 * });
 * ```
 *
 * @sapModule FLP
 * @browserContext Requires active browser with FLP loaded
 * @failureMode Tile not found — semantic object or action not available in FLP
 * @failureMode Route failed — hash-based navigation did not resolve to a valid view
 * @failureMode Timeout — navigation did not complete within configured timeout
 */
export class NavigationError extends PramanError {
  readonly targetUrl: string | undefined;
  readonly currentUrl: string | undefined;

  /**
   * Creates a new NavigationError instance.
   *
   * @param options - Navigation error construction options including target
   *   and current URLs for diagnostic context.
   *
   * @example
   * ```typescript
   * import { NavigationError } from '#core/errors/navigation-error.js';
   *
   * const error = new NavigationError({
   *   message: 'FLP tile not found',
   *   attempted: 'Navigate to Purchase Order app',
   *   targetUrl: 'https://sap.example.com/app/po',
   *   currentUrl: 'https://sap.example.com/flp',
   * });
   * ```
   */
  constructor(options: NavigationErrorOptions) {
    super({
      ...options,
      code: options.code ?? ErrorCode.ERR_NAV_ROUTE_FAILED,
      retryable: options.retryable ?? true,
    });

    this.name = 'NavigationError';
    this.targetUrl = options.targetUrl;
    this.currentUrl = options.currentUrl;

    Object.defineProperty(this, 'targetUrl', { writable: false, configurable: false });
    Object.defineProperty(this, 'currentUrl', { writable: false, configurable: false });
  }

  /**
   * Serializes this error to a JSON-safe object with navigation-specific fields.
   *
   * @returns Base serialization extended with `targetUrl` and `currentUrl`.
   *
   * @example
   * ```typescript
   * const json = error.toJSON();
   * console.log(json.targetUrl);  // 'https://sap.example.com/app/po'
   * console.log(json.currentUrl); // 'https://sap.example.com/flp'
   * ```
   */
  override toJSON(): SerializedPramanError & {
    readonly targetUrl: string | undefined;
    readonly currentUrl: string | undefined;
  } {
    return {
      ...super.toJSON(),
      targetUrl: this.targetUrl,
      currentUrl: this.currentUrl,
    };
  }

  /**
   * Returns AI-agent-friendly context with navigation-specific diagnostic fields.
   *
   * @returns Base AI context extended with target and current URL details.
   *
   * @example
   * ```typescript
   * const ctx = error.toAIContext();
   * // LLM can compare ctx.targetUrl and ctx.currentUrl to diagnose
   * // whether navigation started but resolved to the wrong view
   * ```
   */
  override toAIContext(): AIErrorContext & {
    readonly targetUrl: string | undefined;
    readonly currentUrl: string | undefined;
  } {
    return {
      ...super.toAIContext(),
      targetUrl: this.targetUrl,
      currentUrl: this.currentUrl,
    };
  }
}
