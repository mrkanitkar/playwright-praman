/**
 * Tests for `src/core/errors/codes.ts`.
 *
 * @remarks
 * Verifies the ErrorCode constant object and its derived type:
 * - All expected error codes are present
 * - Values are string literals matching keys
 * - No duplicate values
 * - ErrorCode type narrows to union of values
 */
import { describe, expect, expectTypeOf, it } from 'vitest';

import { ErrorCode } from '#core/errors/codes.js';
import type { ErrorCode as ErrorCodeType } from '#core/errors/codes.js';

describe('ErrorCode', () => {
  // ── Existence tests ──────────────────────────────────────────────────
  it('defines config error codes', () => {
    expect(ErrorCode.ERR_CONFIG_INVALID).toBe('ERR_CONFIG_INVALID');
    expect(ErrorCode.ERR_CONFIG_NOT_FOUND).toBe('ERR_CONFIG_NOT_FOUND');
    expect(ErrorCode.ERR_CONFIG_PARSE).toBe('ERR_CONFIG_PARSE');
  });

  it('defines bridge error codes', () => {
    expect(ErrorCode.ERR_BRIDGE_TIMEOUT).toBe('ERR_BRIDGE_TIMEOUT');
    expect(ErrorCode.ERR_BRIDGE_INJECTION).toBe('ERR_BRIDGE_INJECTION');
    expect(ErrorCode.ERR_BRIDGE_NOT_READY).toBe('ERR_BRIDGE_NOT_READY');
    expect(ErrorCode.ERR_BRIDGE_VERSION).toBe('ERR_BRIDGE_VERSION');
    expect(ErrorCode.ERR_BRIDGE_EXECUTION).toBe('ERR_BRIDGE_EXECUTION');
  });

  it('defines control error codes', () => {
    expect(ErrorCode.ERR_CONTROL_NOT_FOUND).toBe('ERR_CONTROL_NOT_FOUND');
    expect(ErrorCode.ERR_CONTROL_NOT_VISIBLE).toBe('ERR_CONTROL_NOT_VISIBLE');
    expect(ErrorCode.ERR_CONTROL_NOT_ENABLED).toBe('ERR_CONTROL_NOT_ENABLED');
    expect(ErrorCode.ERR_CONTROL_NOT_INTERACTABLE).toBe('ERR_CONTROL_NOT_INTERACTABLE');
    expect(ErrorCode.ERR_CONTROL_PROPERTY).toBe('ERR_CONTROL_PROPERTY');
    expect(ErrorCode.ERR_CONTROL_AGGREGATION).toBe('ERR_CONTROL_AGGREGATION');
    expect(ErrorCode.ERR_CONTROL_METHOD).toBe('ERR_CONTROL_METHOD');
  });

  it('defines auth error codes', () => {
    expect(ErrorCode.ERR_AUTH_FAILED).toBe('ERR_AUTH_FAILED');
    expect(ErrorCode.ERR_AUTH_TIMEOUT).toBe('ERR_AUTH_TIMEOUT');
    expect(ErrorCode.ERR_AUTH_SESSION_EXPIRED).toBe('ERR_AUTH_SESSION_EXPIRED');
    expect(ErrorCode.ERR_AUTH_STRATEGY_INVALID).toBe('ERR_AUTH_STRATEGY_INVALID');
  });

  it('defines navigation error codes', () => {
    expect(ErrorCode.ERR_NAV_TILE_NOT_FOUND).toBe('ERR_NAV_TILE_NOT_FOUND');
    expect(ErrorCode.ERR_NAV_ROUTE_FAILED).toBe('ERR_NAV_ROUTE_FAILED');
    expect(ErrorCode.ERR_NAV_TIMEOUT).toBe('ERR_NAV_TIMEOUT');
  });

  it('defines OData error codes', () => {
    expect(ErrorCode.ERR_ODATA_REQUEST_FAILED).toBe('ERR_ODATA_REQUEST_FAILED');
    expect(ErrorCode.ERR_ODATA_PARSE).toBe('ERR_ODATA_PARSE');
    expect(ErrorCode.ERR_ODATA_CSRF).toBe('ERR_ODATA_CSRF');
  });

  it('defines selector error codes', () => {
    expect(ErrorCode.ERR_SELECTOR_INVALID).toBe('ERR_SELECTOR_INVALID');
    expect(ErrorCode.ERR_SELECTOR_AMBIGUOUS).toBe('ERR_SELECTOR_AMBIGUOUS');
    expect(ErrorCode.ERR_SELECTOR_PARSE).toBe('ERR_SELECTOR_PARSE');
  });

  it('defines timeout error codes', () => {
    expect(ErrorCode.ERR_TIMEOUT_UI5_STABLE).toBe('ERR_TIMEOUT_UI5_STABLE');
    expect(ErrorCode.ERR_TIMEOUT_CONTROL_DISCOVERY).toBe('ERR_TIMEOUT_CONTROL_DISCOVERY');
    expect(ErrorCode.ERR_TIMEOUT_OPERATION).toBe('ERR_TIMEOUT_OPERATION');
  });

  it('defines AI error codes', () => {
    expect(ErrorCode.ERR_AI_PROVIDER_UNAVAILABLE).toBe('ERR_AI_PROVIDER_UNAVAILABLE');
    expect(ErrorCode.ERR_AI_RESPONSE_INVALID).toBe('ERR_AI_RESPONSE_INVALID');
    expect(ErrorCode.ERR_AI_TOKEN_LIMIT).toBe('ERR_AI_TOKEN_LIMIT');
    expect(ErrorCode.ERR_AI_RATE_LIMITED).toBe('ERR_AI_RATE_LIMITED');
  });

  it('defines plugin error codes', () => {
    expect(ErrorCode.ERR_PLUGIN_LOAD).toBe('ERR_PLUGIN_LOAD');
    expect(ErrorCode.ERR_PLUGIN_INIT).toBe('ERR_PLUGIN_INIT');
    expect(ErrorCode.ERR_PLUGIN_INCOMPATIBLE).toBe('ERR_PLUGIN_INCOMPATIBLE');
  });

  // ── Uniqueness test ──────────────────────────────────────────────────
  it('has no duplicate error code values', () => {
    const values = Object.values(ErrorCode);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });

  // ── Count test (detect accidental additions/removals) ────────────────
  it('has exactly 38 error codes', () => {
    expect(Object.keys(ErrorCode)).toHaveLength(38);
  });

  // ── Immutability test ────────────────────────────────────────────────
  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(ErrorCode)).toBe(true);
  });

  // ── Type-level tests ─────────────────────────────────────────────────
  it('ErrorCode type is a union of string literal values', () => {
    expectTypeOf<ErrorCodeType>().toExtend<string>();
    expectTypeOf<'ERR_CONFIG_INVALID'>().toExtend<ErrorCodeType>();
    expectTypeOf<'ERR_BRIDGE_TIMEOUT'>().toExtend<ErrorCodeType>();
  });

  it('rejects invalid error codes at type level', () => {
    expectTypeOf<'INVALID_CODE'>().not.toExtend<ErrorCodeType>();
    expectTypeOf<'ERR_UNKNOWN'>().not.toExtend<ErrorCodeType>();
  });
});
