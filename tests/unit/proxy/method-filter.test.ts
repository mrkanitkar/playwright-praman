/**
 * Tests for `src/proxy/method-filter.ts`.
 *
 * @remarks
 * Validates method filtering logic that wraps the bridge-layer blacklist
 * and adds proxy-specific rules (Playwright API allowlist).
 */
import { describe, expect, it } from 'vitest';

import { extractAllowedMethods, isMethodAllowed } from '#proxy/method-filter.js';

describe('method-filter', () => {
  describe('isMethodAllowed', () => {
    it('allows regular UI5 getter methods', () => {
      expect(isMethodAllowed('getText')).toBe(true);
      expect(isMethodAllowed('getEnabled')).toBe(true);
      expect(isMethodAllowed('getVisible')).toBe(true);
    });

    it('allows regular UI5 setter methods', () => {
      expect(isMethodAllowed('setText')).toBe(true);
      expect(isMethodAllowed('setValue')).toBe(true);
    });

    it('blocks blacklisted methods', () => {
      expect(isMethodAllowed('constructor')).toBe(false);
      expect(isMethodAllowed('destroy')).toBe(false);
      expect(isMethodAllowed('rerender')).toBe(false);
    });

    it('blocks underscore-prefixed internal methods', () => {
      expect(isMethodAllowed('_getModel')).toBe(false);
      expect(isMethodAllowed('_internal')).toBe(false);
    });

    it('blocks Render-suffixed methods', () => {
      expect(isMethodAllowed('onAfterRender')).toBe(false);
      expect(isMethodAllowed('customRender')).toBe(false);
    });

    it('allows fire* event methods that are NOT fireEvent', () => {
      expect(isMethodAllowed('firePress')).toBe(true);
      expect(isMethodAllowed('fireSelect')).toBe(true);
      expect(isMethodAllowed('fireEvent')).toBe(false);
    });
  });

  describe('extractAllowedMethods', () => {
    it('filters out blacklisted methods', () => {
      const all = ['getText', 'constructor', 'destroy', 'setValue', '_internal'];
      const allowed = extractAllowedMethods(all);
      expect(allowed).toEqual(['getText', 'setValue']);
    });

    it('returns empty array for all-blacklisted input', () => {
      const all = ['constructor', 'destroy', '_foo'];
      expect(extractAllowedMethods(all)).toEqual([]);
    });

    it('preserves order of allowed methods', () => {
      const all = ['setText', 'getText', 'getEnabled'];
      expect(extractAllowedMethods(all)).toEqual(['setText', 'getText', 'getEnabled']);
    });
  });
});
