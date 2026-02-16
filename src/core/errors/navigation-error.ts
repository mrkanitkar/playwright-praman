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
 */
export class NavigationError extends PramanError {
  readonly targetUrl: string | undefined;
  readonly currentUrl: string | undefined;

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
