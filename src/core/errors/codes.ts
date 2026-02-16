/**
 * Structured error codes for all Praman error categories.
 *
 * @remarks
 * Each code follows the pattern `ERR_<CATEGORY>_<REASON>`.
 * The constant object is frozen for runtime immutability.
 * The derived `ErrorCode` type is a union of all string literal values.
 *
 * @example
 * ```typescript
 * import { ErrorCode } from '#core/errors/codes.js';
 * import type { ErrorCode as ErrorCodeType } from '#core/errors/codes.js';
 *
 * const code: ErrorCodeType = ErrorCode.ERR_CONFIG_INVALID;
 * ```
 *
 * @module errors
 */

/**
 * All Praman error codes as a frozen constant object.
 *
 * @remarks
 * Categories (10):
 * - Config (3): schema validation, file not found, parse failure
 * - Bridge (4): timeout, injection, readiness, version mismatch
 * - Control (6): not found, visibility, enabled, interactable, property, aggregation
 * - Auth (4): failure, timeout, session expired, invalid strategy
 * - Navigation (3): tile not found, route failed, timeout
 * - OData (3): request failed, parse, CSRF token
 * - Selector (3): invalid, ambiguous, parse
 * - Timeout (3): UI5 stability, control discovery, generic operation
 * - AI (4): provider unavailable, invalid response, token limit, rate limited
 * - Plugin (3): load failure, init failure, incompatible version
 */
export const ErrorCode = Object.freeze({
  // ── Config errors ──────────────────────────────────────────────────
  ERR_CONFIG_INVALID: 'ERR_CONFIG_INVALID',
  ERR_CONFIG_NOT_FOUND: 'ERR_CONFIG_NOT_FOUND',
  ERR_CONFIG_PARSE: 'ERR_CONFIG_PARSE',

  // ── Bridge errors ──────────────────────────────────────────────────
  ERR_BRIDGE_TIMEOUT: 'ERR_BRIDGE_TIMEOUT',
  ERR_BRIDGE_INJECTION: 'ERR_BRIDGE_INJECTION',
  ERR_BRIDGE_NOT_READY: 'ERR_BRIDGE_NOT_READY',
  ERR_BRIDGE_VERSION: 'ERR_BRIDGE_VERSION',

  // ── Control errors ─────────────────────────────────────────────────
  ERR_CONTROL_NOT_FOUND: 'ERR_CONTROL_NOT_FOUND',
  ERR_CONTROL_NOT_VISIBLE: 'ERR_CONTROL_NOT_VISIBLE',
  ERR_CONTROL_NOT_ENABLED: 'ERR_CONTROL_NOT_ENABLED',
  ERR_CONTROL_NOT_INTERACTABLE: 'ERR_CONTROL_NOT_INTERACTABLE',
  ERR_CONTROL_PROPERTY: 'ERR_CONTROL_PROPERTY',
  ERR_CONTROL_AGGREGATION: 'ERR_CONTROL_AGGREGATION',

  // ── Auth errors ────────────────────────────────────────────────────
  ERR_AUTH_FAILED: 'ERR_AUTH_FAILED',
  ERR_AUTH_TIMEOUT: 'ERR_AUTH_TIMEOUT',
  ERR_AUTH_SESSION_EXPIRED: 'ERR_AUTH_SESSION_EXPIRED',
  ERR_AUTH_STRATEGY_INVALID: 'ERR_AUTH_STRATEGY_INVALID',

  // ── Navigation errors ──────────────────────────────────────────────
  ERR_NAV_TILE_NOT_FOUND: 'ERR_NAV_TILE_NOT_FOUND',
  ERR_NAV_ROUTE_FAILED: 'ERR_NAV_ROUTE_FAILED',
  ERR_NAV_TIMEOUT: 'ERR_NAV_TIMEOUT',

  // ── OData errors ───────────────────────────────────────────────────
  ERR_ODATA_REQUEST_FAILED: 'ERR_ODATA_REQUEST_FAILED',
  ERR_ODATA_PARSE: 'ERR_ODATA_PARSE',
  ERR_ODATA_CSRF: 'ERR_ODATA_CSRF',

  // ── Selector errors ────────────────────────────────────────────────
  ERR_SELECTOR_INVALID: 'ERR_SELECTOR_INVALID',
  ERR_SELECTOR_AMBIGUOUS: 'ERR_SELECTOR_AMBIGUOUS',
  ERR_SELECTOR_PARSE: 'ERR_SELECTOR_PARSE',

  // ── Timeout errors ─────────────────────────────────────────────────
  ERR_TIMEOUT_UI5_STABLE: 'ERR_TIMEOUT_UI5_STABLE',
  ERR_TIMEOUT_CONTROL_DISCOVERY: 'ERR_TIMEOUT_CONTROL_DISCOVERY',
  ERR_TIMEOUT_OPERATION: 'ERR_TIMEOUT_OPERATION',

  // ── AI errors ──────────────────────────────────────────────────────
  ERR_AI_PROVIDER_UNAVAILABLE: 'ERR_AI_PROVIDER_UNAVAILABLE',
  ERR_AI_RESPONSE_INVALID: 'ERR_AI_RESPONSE_INVALID',
  ERR_AI_TOKEN_LIMIT: 'ERR_AI_TOKEN_LIMIT',
  ERR_AI_RATE_LIMITED: 'ERR_AI_RATE_LIMITED',

  // ── Plugin errors ──────────────────────────────────────────────────
  ERR_PLUGIN_LOAD: 'ERR_PLUGIN_LOAD',
  ERR_PLUGIN_INIT: 'ERR_PLUGIN_INIT',
  ERR_PLUGIN_INCOMPATIBLE: 'ERR_PLUGIN_INCOMPATIBLE',
} as const);

/**
 * Union type of all valid Praman error code string literals.
 *
 * @example
 * ```typescript
 * import type { ErrorCode } from '#core/errors/codes.js';
 * function handleError(code: ErrorCode): void { ... }
 * ```
 */
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
