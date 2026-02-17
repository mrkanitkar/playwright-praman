/**
 * Tests for `src/bridge/method-blacklist.ts`.
 *
 * @remarks
 * Verifies the method blacklist contents, isBlacklisted() dynamic rules,
 * and filterMethods() array filtering.
 */
import { describe, expect, it } from 'vitest';

import { METHOD_BLACKLIST, filterMethods, isBlacklisted } from '#bridge/method-blacklist.js';

describe('METHOD_BLACKLIST', () => {
  it('contains expected count of items', () => {
    expect(METHOD_BLACKLIST.size).toBeGreaterThanOrEqual(40);
  });

  it('blocks constructor', () => {
    expect(METHOD_BLACKLIST.has('constructor')).toBe(true);
  });

  it('blocks destroy', () => {
    expect(METHOD_BLACKLIST.has('destroy')).toBe(true);
  });

  it('blocks fireEvent', () => {
    expect(METHOD_BLACKLIST.has('fireEvent')).toBe(true);
  });

  it('blocks rerender', () => {
    expect(METHOD_BLACKLIST.has('rerender')).toBe(true);
  });

  it('blocks clone', () => {
    expect(METHOD_BLACKLIST.has('clone')).toBe(true);
  });

  it('does not contain common safe methods', () => {
    expect(METHOD_BLACKLIST.has('getText')).toBe(false);
    expect(METHOD_BLACKLIST.has('setValue')).toBe(false);
    expect(METHOD_BLACKLIST.has('getProperty')).toBe(false);
    expect(METHOD_BLACKLIST.has('getId')).toBe(false);
  });
});

describe('isBlacklisted', () => {
  it('returns true for static blacklist items', () => {
    expect(isBlacklisted('constructor')).toBe(true);
    expect(isBlacklisted('fireEvent')).toBe(true);
  });

  it('returns true for underscore-prefixed methods', () => {
    expect(isBlacklisted('_getBindingContext')).toBe(true);
    expect(isBlacklisted('_internal')).toBe(true);
  });

  it('returns true for Render-suffixed methods', () => {
    expect(isBlacklisted('onAfterRender')).toBe(true);
    expect(isBlacklisted('customRender')).toBe(true);
  });

  it('returns false for safe methods', () => {
    expect(isBlacklisted('getText')).toBe(false);
    expect(isBlacklisted('getProperty')).toBe(false);
    expect(isBlacklisted('getId')).toBe(false);
    expect(isBlacklisted('firePress')).toBe(false);
    expect(isBlacklisted('setValue')).toBe(false);
  });
});

describe('filterMethods', () => {
  it('removes blacklisted methods', () => {
    const input = ['getText', 'constructor', 'setValue', 'destroy'];
    const result = filterMethods(input);
    expect(result).toEqual(['getText', 'setValue']);
  });

  it('removes underscore-prefixed methods', () => {
    const input = ['getText', '_internal', 'setValue'];
    const result = filterMethods(input);
    expect(result).toEqual(['getText', 'setValue']);
  });

  it('preserves order of non-blacklisted methods', () => {
    const input = ['setValue', 'getText', 'getProperty', 'getId'];
    const result = filterMethods(input);
    expect(result).toEqual(['setValue', 'getText', 'getProperty', 'getId']);
  });

  it('returns empty array when all methods are blacklisted', () => {
    const input = ['constructor', 'destroy', '_private'];
    const result = filterMethods(input);
    expect(result).toEqual([]);
  });

  it('handles empty input', () => {
    expect(filterMethods([])).toEqual([]);
  });
});
