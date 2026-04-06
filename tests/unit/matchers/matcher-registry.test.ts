/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/matchers/matcher-registry.ts` — custom matcher registration API.
 *
 * @remarks
 * Covers: `createUI5Matcher`, `registerUI5Matcher`, `getRegisteredMatchers`,
 * `getRegisteredMatcherCount`, `isMatcherRegistryFrozen`, `resetMatcherRegistry`.
 *
 * @module matchers
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PramanError } from '../../../src/core/errors/base.js';
import {
  applyRegisteredMatchers,
  createUI5Matcher,
  getRegisteredMatcherCount,
  getRegisteredMatchers,
  isMatcherRegistryFrozen,
  registerUI5Matcher,
  resetMatcherRegistry,
} from '../../../src/matchers/matcher-registry.js';
import type { MatcherCheckFn, UI5MatcherFn } from '../../../src/matchers/matcher-registry.js';
import type { MatcherPage } from '../../../src/matchers/matcher-utils.js';

vi.mock('#bridge/injection.js', () => ({
  ensureBridgeInjected: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('#bridge/browser-scripts/execute-method.js', () => ({
  createExecuteMethodScript: vi.fn().mockReturnValue('(function(){})()'),
}));

/**
 * Creates a mock MatcherPage for testing.
 *
 * @param value - The value to return from evaluate.
 * @returns A mock page.
 */
function createMockPage(value?: unknown): MatcherPage {
  return {
    evaluate: vi.fn().mockResolvedValue({ value }),
  } as unknown as MatcherPage;
}

/**
 * Creates a simple check function for testing.
 *
 * @param returnPass - Whether the check should pass.
 * @returns A MatcherCheckFn.
 */
function createSimpleCheck(returnPass: boolean): MatcherCheckFn<[string]> {
  return async (
    _page,
    controlId,
    expected,
  ): Promise<{ pass: boolean; message: () => string; actual: unknown; expected: unknown }> => {
    await Promise.resolve();
    return {
      pass: returnPass,
      message: () =>
        returnPass
          ? `Expected '${controlId}' not to match '${expected}'`
          : `Expected '${controlId}' to match '${expected}'`,
      actual: returnPass ? expected : 'other',
      expected,
    };
  };
}

describe('matcher-registry', () => {
  afterEach(() => {
    resetMatcherRegistry();
  });

  // ── createUI5Matcher ─────────────────────────────────────────────────

  describe('createUI5Matcher', () => {
    it('wraps a check function with auto-retry semantics', async () => {
      const checkFn = createSimpleCheck(true);
      const matcher = createUI5Matcher(checkFn);
      const page = createMockPage();

      const result = await matcher(page, 'ctrl1', 'expected');

      expect(result.pass).toBe(true);
      expect(result.message()).toContain('ctrl1');
    });

    it('returns a failing result when check function fails', async () => {
      const checkFn = createSimpleCheck(false);
      const matcher = createUI5Matcher(checkFn);
      const page = createMockPage();

      const result = await matcher(page, 'ctrl1', 'expected', { timeout: 0 });

      expect(result.pass).toBe(false);
    });

    it('extracts trailing MatcherOptions for timeout', async () => {
      let callCount = 0;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await -- Sync mock with counter, params intentionally unused
      const checkFn: MatcherCheckFn<[string]> = async (_page, _cid, _exp) => {
        callCount++;
        return {
          pass: callCount > 1,
          message: () => 'msg',
        };
      };
      const matcher = createUI5Matcher(checkFn);
      const page = createMockPage();

      const result = await matcher(page, 'ctrl1', 'val', { timeout: 500 });

      expect(result.pass).toBe(true);
      expect(callCount).toBeGreaterThan(1);
    });

    it('passes through all arguments to the check function', async () => {
      const received: unknown[] = [];
      // eslint-disable-next-line @typescript-eslint/require-await -- Sync mock capturing args
      const checkFn: MatcherCheckFn<[string, number]> = async (_page, controlId, arg1, arg2) => {
        received.push(controlId, arg1, arg2);
        return { pass: true, message: () => 'ok' };
      };
      const matcher = createUI5Matcher(checkFn);
      const page = createMockPage();

      await matcher(page, 'myCtrl', 'strArg', 42);

      expect(received).toEqual(['myCtrl', 'strArg', 42]);
    });

    it('throws PramanError when given a non-function', () => {
      expect(() => createUI5Matcher('not a function' as unknown as MatcherCheckFn)).toThrow(
        PramanError,
      );
    });

    it('works with zero extra args (boolean-style matcher)', async () => {
      // eslint-disable-next-line @typescript-eslint/require-await -- Sync mock
      const checkFn: MatcherCheckFn<[]> = async (_page, controlId) => ({
        pass: true,
        message: () => `${controlId} ok`,
      });
      const matcher = createUI5Matcher(checkFn);
      const page = createMockPage();

      const result = await matcher(page, 'ctrl1');

      expect(result.pass).toBe(true);
    });
  });

  // ── registerUI5Matcher ───────────────────────────────────────────────

  describe('registerUI5Matcher', () => {
    it('registers a matcher successfully', () => {
      const matcher: UI5MatcherFn = createUI5Matcher(createSimpleCheck(true));

      registerUI5Matcher('toHaveUI5Icon', matcher);

      expect(getRegisteredMatcherCount()).toBe(1);
    });

    it('throws PramanError for empty name', () => {
      const matcher: UI5MatcherFn = createUI5Matcher(createSimpleCheck(true));

      expect(() => {
        registerUI5Matcher('', matcher);
      }).toThrow(PramanError);
    });

    it('throws PramanError for name not starting with "to"', () => {
      const matcher: UI5MatcherFn = createUI5Matcher(createSimpleCheck(true));

      expect(() => {
        registerUI5Matcher('haveIcon', matcher);
      }).toThrow(PramanError);
      expect(() => {
        registerUI5Matcher('haveIcon', matcher);
      }).toThrow(/must start with 'to'/);
    });

    it('throws PramanError for non-function matcherFn', () => {
      expect(() => {
        registerUI5Matcher('toHaveUI5Icon', 'not a fn' as unknown as UI5MatcherFn);
      }).toThrow(PramanError);
    });

    it('throws PramanError for duplicate registration', () => {
      const matcher: UI5MatcherFn = createUI5Matcher(createSimpleCheck(true));

      registerUI5Matcher('toHaveUI5Icon', matcher);

      expect(() => {
        registerUI5Matcher('toHaveUI5Icon', matcher);
      }).toThrow(PramanError);
      expect(() => {
        registerUI5Matcher('toHaveUI5Icon', matcher);
      }).toThrow(/already registered/);
    });

    it('allows registration after getRegisteredMatchers (read does not freeze)', () => {
      getRegisteredMatchers(); // read-only, does NOT freeze

      const matcher: UI5MatcherFn = createUI5Matcher(createSimpleCheck(true));

      // Should NOT throw — getRegisteredMatchers no longer freezes
      registerUI5Matcher('toHaveUI5Icon', matcher);
      expect(getRegisteredMatcherCount()).toBe(1);
    });

    it('throws PramanError when registry is frozen via applyRegisteredMatchers', () => {
      applyRegisteredMatchers(); // freeze

      const matcher: UI5MatcherFn = createUI5Matcher(createSimpleCheck(true));

      expect(() => {
        registerUI5Matcher('toHaveUI5Icon', matcher);
      }).toThrow(PramanError);
      expect(() => {
        registerUI5Matcher('toHaveUI5Icon', matcher);
      }).toThrow(/frozen/);
    });

    it('allows multiple distinct matchers', () => {
      registerUI5Matcher('toHaveUI5Icon', createUI5Matcher(createSimpleCheck(true)));
      registerUI5Matcher('toHaveUI5Tooltip', createUI5Matcher(createSimpleCheck(true)));
      registerUI5Matcher('toBeUI5Busy', createUI5Matcher(createSimpleCheck(true)));

      expect(getRegisteredMatcherCount()).toBe(3);
    });
  });

  // ── getRegisteredMatchers ────────────────────────────────────────────

  describe('getRegisteredMatchers', () => {
    it('returns an empty frozen object when no matchers registered', () => {
      const result = getRegisteredMatchers();

      expect(Object.keys(result)).toHaveLength(0);
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('returns all registered matchers as a record', () => {
      const iconMatcher = createUI5Matcher(createSimpleCheck(true));
      const tooltipMatcher = createUI5Matcher(createSimpleCheck(false));
      registerUI5Matcher('toHaveUI5Icon', iconMatcher);
      registerUI5Matcher('toHaveUI5Tooltip', tooltipMatcher);

      const result = getRegisteredMatchers();

      expect(Object.keys(result)).toEqual(['toHaveUI5Icon', 'toHaveUI5Tooltip']);
      expect(result['toHaveUI5Icon']).toBe(iconMatcher);
      expect(result['toHaveUI5Tooltip']).toBe(tooltipMatcher);
    });

    it('does not freeze the registry (read-only)', () => {
      getRegisteredMatchers();

      expect(isMatcherRegistryFrozen()).toBe(false);
    });

    it('returns a frozen object', () => {
      registerUI5Matcher('toHaveUI5Icon', createUI5Matcher(createSimpleCheck(true)));

      const result = getRegisteredMatchers();

      expect(Object.isFrozen(result)).toBe(true);
    });
  });

  // ── getRegisteredMatcherCount ────────────────────────────────────────

  describe('getRegisteredMatcherCount', () => {
    it('returns 0 initially', () => {
      expect(getRegisteredMatcherCount()).toBe(0);
    });

    it('increments with each registration', () => {
      registerUI5Matcher('toHaveUI5A', createUI5Matcher(createSimpleCheck(true)));
      expect(getRegisteredMatcherCount()).toBe(1);

      registerUI5Matcher('toHaveUI5B', createUI5Matcher(createSimpleCheck(true)));
      expect(getRegisteredMatcherCount()).toBe(2);
    });
  });

  // ── isMatcherRegistryFrozen ──────────────────────────────────────────

  describe('isMatcherRegistryFrozen', () => {
    it('returns false before applyAll', () => {
      expect(isMatcherRegistryFrozen()).toBe(false);
    });

    it('returns false after getRegisteredMatchers (read does not freeze)', () => {
      getRegisteredMatchers();

      expect(isMatcherRegistryFrozen()).toBe(false);
    });

    it('returns true after applyRegisteredMatchers', () => {
      applyRegisteredMatchers();

      expect(isMatcherRegistryFrozen()).toBe(true);
    });
  });

  // ── resetMatcherRegistry ─────────────────────────────────────────────

  describe('resetMatcherRegistry', () => {
    it('clears all matchers', () => {
      registerUI5Matcher('toHaveUI5Icon', createUI5Matcher(createSimpleCheck(true)));
      expect(getRegisteredMatcherCount()).toBe(1);

      resetMatcherRegistry();

      expect(getRegisteredMatcherCount()).toBe(0);
    });

    it('unfreezes the registry', () => {
      applyRegisteredMatchers();
      expect(isMatcherRegistryFrozen()).toBe(true);

      resetMatcherRegistry();

      expect(isMatcherRegistryFrozen()).toBe(false);
    });

    it('allows re-registration after reset', () => {
      registerUI5Matcher('toHaveUI5Icon', createUI5Matcher(createSimpleCheck(true)));
      applyRegisteredMatchers(); // freeze

      resetMatcherRegistry();

      registerUI5Matcher('toHaveUI5Icon', createUI5Matcher(createSimpleCheck(true)));
      expect(getRegisteredMatcherCount()).toBe(1);
    });
  });

  // ── Integration: createUI5Matcher + registerUI5Matcher ───────────────

  describe('integration: end-to-end custom matcher flow', () => {
    it('creates, registers, and retrieves a working custom matcher', async () => {
      // eslint-disable-next-line @typescript-eslint/require-await -- Sync mock for testing
      const checkUI5Icon: MatcherCheckFn<[string]> = async (_page, controlId, expected) => {
        const actual = 'sap-icon://add';
        const pass = actual === expected;
        return {
          pass,
          message: () =>
            pass
              ? `Expected '${controlId}' icon not to be '${expected}'`
              : `Expected '${controlId}' icon to be '${expected}', got '${actual}'`,
          actual,
          expected,
        };
      };

      const matcher = createUI5Matcher(checkUI5Icon);
      registerUI5Matcher('toHaveUI5Icon', matcher);

      const matchers = getRegisteredMatchers();
      expect(matchers['toHaveUI5Icon']).toBeDefined();

      const page = createMockPage();
      const iconMatcher = matchers['toHaveUI5Icon'];
      expect(iconMatcher).toBeDefined();

      if (iconMatcher !== undefined) {
        const passResult = await iconMatcher(page, 'btn1', 'sap-icon://add');
        expect(passResult.pass).toBe(true);

        const failResult = await iconMatcher(page, 'btn1', 'sap-icon://delete', {
          timeout: 0,
        });
        expect(failResult.pass).toBe(false);
        expect(failResult.message()).toContain('sap-icon://delete');
      }
    });

    it('error codes are correct in thrown errors', () => {
      const matcher = createUI5Matcher(createSimpleCheck(true));
      registerUI5Matcher('toHaveUI5X', matcher);

      try {
        registerUI5Matcher('toHaveUI5X', matcher);
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(PramanError);
        expect((error as PramanError).code).toBe('ERR_MATCHER_DUPLICATE');
        expect((error as PramanError).retryable).toBe(false);
        expect((error as PramanError).suggestions.length).toBeGreaterThan(0);
      }
    });

    it('frozen error includes helpful suggestions', () => {
      applyRegisteredMatchers();

      try {
        registerUI5Matcher('toHaveUI5Y', createUI5Matcher(createSimpleCheck(true)));
        expect.fail('Should have thrown');
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(PramanError);
        expect((error as PramanError).code).toBe('ERR_MATCHER_FROZEN');
        expect((error as PramanError).suggestions).toEqual(
          expect.arrayContaining([expect.stringContaining('before tests run')]),
        );
      }
    });
  });
});
