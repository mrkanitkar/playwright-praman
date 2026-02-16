/**
 * Tests for `src/core/utils/version-compare.ts` — semver comparison utilities.
 *
 * @remarks
 * Verifies parsing, comparison, and range satisfaction for Playwright/UI5 version checks.
 *
 * @module utils
 */
import { describe, expect, it } from 'vitest';

import { PramanError } from '#core/errors/base.js';
import {
  compareSemVer,
  isAtLeast,
  parseSemVer,
  satisfiesRange,
} from '#core/utils/version-compare.js';

describe('parseSemVer', () => {
  it('parses a valid version string', () => {
    const result = parseSemVer('1.50.0');
    expect(result).toEqual({ major: 1, minor: 50, patch: 0 });
  });

  it('parses version with prerelease', () => {
    const result = parseSemVer('1.50.0-beta.1');
    expect(result).toEqual({ major: 1, minor: 50, patch: 0, prerelease: 'beta.1' });
  });

  it('throws PramanError for invalid string', () => {
    expect(() => parseSemVer('not-a-version')).toThrow(PramanError);
  });

  it('throws PramanError for empty string', () => {
    expect(() => parseSemVer('')).toThrow(PramanError);
  });

  it('throws PramanError for partial version', () => {
    expect(() => parseSemVer('1.50')).toThrow(PramanError);
  });
});

describe('compareSemVer', () => {
  it('returns -1 when a < b (minor)', () => {
    expect(compareSemVer(parseSemVer('1.49.0'), parseSemVer('1.50.0'))).toBe(-1);
  });

  it('returns 0 when a === b', () => {
    expect(compareSemVer(parseSemVer('1.50.0'), parseSemVer('1.50.0'))).toBe(0);
  });

  it('returns 1 when a > b (minor)', () => {
    expect(compareSemVer(parseSemVer('1.51.0'), parseSemVer('1.50.0'))).toBe(1);
  });

  it('returns 1 when major difference outweighs minor', () => {
    expect(compareSemVer(parseSemVer('2.0.0'), parseSemVer('1.99.99'))).toBe(1);
  });

  it('returns -1 for patch difference', () => {
    expect(compareSemVer(parseSemVer('1.50.0'), parseSemVer('1.50.1'))).toBe(-1);
  });
});

describe('satisfiesRange', () => {
  it('>= passes when equal', () => {
    expect(satisfiesRange(parseSemVer('1.50.0'), '>=1.50.0')).toBe(true);
  });

  it('>= fails when below', () => {
    expect(satisfiesRange(parseSemVer('1.49.9'), '>=1.50.0')).toBe(false);
  });

  it('^ passes for minor bump within same major', () => {
    expect(satisfiesRange(parseSemVer('1.50.1'), '^1.50.0')).toBe(true);
  });

  it('^ fails for major bump', () => {
    expect(satisfiesRange(parseSemVer('2.0.0'), '^1.50.0')).toBe(false);
  });

  it('~ passes for patch bump within same minor', () => {
    expect(satisfiesRange(parseSemVer('1.50.9'), '~1.50.0')).toBe(true);
  });

  it('~ fails for minor bump', () => {
    expect(satisfiesRange(parseSemVer('1.51.0'), '~1.50.0')).toBe(false);
  });

  it('compound range works', () => {
    expect(satisfiesRange(parseSemVer('1.55.0'), '>=1.50.0 <2.0.0')).toBe(true);
  });

  it('exact version match (no operator prefix)', () => {
    expect(satisfiesRange(parseSemVer('1.50.0'), '1.50.0')).toBe(true);
  });

  it('exact version mismatch (no operator prefix)', () => {
    expect(satisfiesRange(parseSemVer('1.50.1'), '1.50.0')).toBe(false);
  });

  it('< operator passes when below', () => {
    expect(satisfiesRange(parseSemVer('1.49.0'), '<1.50.0')).toBe(true);
  });

  it('< operator fails when equal or above', () => {
    expect(satisfiesRange(parseSemVer('1.50.0'), '<1.50.0')).toBe(false);
  });
});

describe('isAtLeast', () => {
  it('returns true when version meets minimum', () => {
    expect(isAtLeast('1.58.2', '1.50.0')).toBe(true);
  });

  it('returns false when version is below minimum', () => {
    expect(isAtLeast('1.40.0', '1.50.0')).toBe(false);
  });

  it('returns true when versions are equal', () => {
    expect(isAtLeast('1.50.0', '1.50.0')).toBe(true);
  });
});
