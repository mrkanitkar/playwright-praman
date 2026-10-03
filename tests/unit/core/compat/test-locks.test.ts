/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for `src/core/compat/test-locks.ts`.
 *
 * @remarks
 * `hasFeature` is mocked so both sides of the gate are asserted. The flag-off
 * side matters most here: Playwright does not typecheck, so an unguarded
 * `lock` on 1.57-1.62 is silently dropped and the tests run in parallel. A
 * helper that returned quietly would be worse than nothing.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';

const mockHasFeature = vi.fn();
vi.mock('#core/compat/playwright-compat.js', () => ({
  hasFeature: mockHasFeature,
}));

const { MIN_TEST_LOCKS_VERSION, requireTestLocks, SAP_LOCKS, sapObjectLock } =
  await import('#core/compat/test-locks.js');

describe('requireTestLocks', () => {
  beforeEach(() => {
    mockHasFeature.mockReset();
  });

  it('returns silently on Playwright 1.63+', () => {
    mockHasFeature.mockReturnValue(true);

    expect(() => {
      requireTestLocks();
    }).not.toThrow();
  });

  it('throws rather than letting a lock be silently dropped below 1.63', () => {
    mockHasFeature.mockReturnValue(false);

    expect(() => {
      requireTestLocks();
    }).toThrow(PramanError);
  });

  it('throws ERR_COMPAT_FEATURE_UNAVAILABLE, not a generic error', () => {
    mockHasFeature.mockReturnValue(false);

    try {
      requireTestLocks();
      expect.unreachable('requireTestLocks should have thrown');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(PramanError);
      const pramanError = error as PramanError;
      expect(pramanError.code).toBe(ErrorCode.ERR_COMPAT_FEATURE_UNAVAILABLE);
      expect(pramanError.retryable).toBe(false);
    }
  });

  it('names the required version in the message and the details', () => {
    mockHasFeature.mockReturnValue(false);

    try {
      requireTestLocks();
      expect.unreachable('requireTestLocks should have thrown');
    } catch (error: unknown) {
      const pramanError = error as PramanError;
      expect(pramanError.message).toContain(MIN_TEST_LOCKS_VERSION);
      expect(pramanError.details).toMatchObject({
        requiredVersion: MIN_TEST_LOCKS_VERSION,
        feature: 'hasTestLocks',
      });
    }
  });

  it('suggests the upgrade and the fullyParallel fallback', () => {
    mockHasFeature.mockReturnValue(false);

    try {
      requireTestLocks();
      expect.unreachable('requireTestLocks should have thrown');
    } catch (error: unknown) {
      const { suggestions } = error as PramanError;
      expect(suggestions.length).toBeGreaterThanOrEqual(2);
      expect(suggestions.join(' ')).toContain(MIN_TEST_LOCKS_VERSION);
      // The blunt floor workaround must be named, not merely hinted at.
      expect(suggestions.join(' ')).toContain('fullyParallel');
    }
  });

  it('gates on hasTestLocks specifically', () => {
    mockHasFeature.mockReturnValue(true);
    requireTestLocks();

    expect(mockHasFeature).toHaveBeenCalledWith('hasTestLocks');
  });

  it('mentions the operation it was attempting', () => {
    mockHasFeature.mockReturnValue(false);

    try {
      requireTestLocks();
      expect.unreachable('requireTestLocks should have thrown');
    } catch (error: unknown) {
      expect((error as PramanError).attempted).toBeTruthy();
    }
  });
});

describe('SAP_LOCKS', () => {
  it('namespaces every name under sap: so user locks cannot collide', () => {
    for (const name of Object.values(SAP_LOCKS)) {
      expect(name.startsWith('sap:')).toBe(true);
    }
  });

  it('covers the three verified contention sources', () => {
    expect(SAP_LOCKS.flpSettings).toBe('sap:flp-settings');
    expect(SAP_LOCKS.testUser).toBe('sap:test-user');
    expect(SAP_LOCKS.testData).toBe('sap:test-data');
  });

  it('has no duplicate values, which would silently merge two locks', () => {
    const values = Object.values(SAP_LOCKS);

    expect(new Set(values).size).toBe(values.length);
  });
});

describe('sapObjectLock', () => {
  it('builds a per-object lock name under the sm12 namespace', () => {
    expect(sapObjectLock('PurchaseOrder', '4500000123')).toBe('sap:sm12:PurchaseOrder:4500000123');
  });

  it('distinguishes two keys of the same object type', () => {
    expect(sapObjectLock('PurchaseOrder', '1')).not.toBe(sapObjectLock('PurchaseOrder', '2'));
  });

  it('does not collide with the fixed SAP_LOCKS names', () => {
    const fixed = new Set<string>(Object.values(SAP_LOCKS));

    expect(fixed.has(sapObjectLock('PurchaseOrder', '1'))).toBe(false);
  });

  it('rejects an empty object type rather than building a colliding name', () => {
    // 'sap:sm12::key' would be shared by every object type, which is a lock
    // that looks specific and is not.
    expect(() => sapObjectLock('', '4500000123')).toThrow(PramanError);
  });

  it('rejects an empty object key', () => {
    expect(() => sapObjectLock('PurchaseOrder', '')).toThrow(PramanError);
  });

  it('rejects whitespace-only input', () => {
    expect(() => sapObjectLock('   ', '4500000123')).toThrow(PramanError);
    expect(() => sapObjectLock('PurchaseOrder', '  ')).toThrow(PramanError);
  });

  it('trims surrounding whitespace rather than embedding it in the name', () => {
    expect(sapObjectLock('  PurchaseOrder  ', ' 4500000123 ')).toBe(
      'sap:sm12:PurchaseOrder:4500000123',
    );
  });

  it('does not require Playwright 1.63 — it only builds a string', () => {
    // Deliberate: composing a name is free, and a user may want it in a
    // config or a log line without asserting the runtime gate.
    mockHasFeature.mockReturnValue(false);

    expect(() => sapObjectLock('PurchaseOrder', '1')).not.toThrow();
  });
});
