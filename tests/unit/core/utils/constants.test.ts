/**
 * Tests for `src/core/utils/constants.ts` — default patterns and timeouts.
 *
 * @remarks
 * Verifies that URL-blocking patterns are valid regex, combined patterns
 * have the correct length, and timeout values are positive integers.
 *
 * @module utils
 */
import { describe, expect, it } from 'vitest';

import {
  ANALYTICS_DEFAULT_PATTERNS,
  DEFAULT_IGNORE_PATTERNS,
  DEFAULT_TIMEOUTS,
  WALKME_DEFAULT_PATTERNS,
} from '#core/utils/constants.js';

describe('WALKME_DEFAULT_PATTERNS', () => {
  it('contains valid regex patterns', () => {
    for (const pattern of WALKME_DEFAULT_PATTERNS) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- Testing pattern validity requires dynamic RegExp
      expect(() => new RegExp(pattern)).not.toThrow();
    }
  });
});

describe('ANALYTICS_DEFAULT_PATTERNS', () => {
  it('contains valid regex patterns', () => {
    for (const pattern of ANALYTICS_DEFAULT_PATTERNS) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- Testing pattern validity requires dynamic RegExp
      expect(() => new RegExp(pattern)).not.toThrow();
    }
  });
});

describe('DEFAULT_IGNORE_PATTERNS', () => {
  it('combines WALKME and ANALYTICS patterns with correct length', () => {
    expect(DEFAULT_IGNORE_PATTERNS).toHaveLength(
      WALKME_DEFAULT_PATTERNS.length + ANALYTICS_DEFAULT_PATTERNS.length,
    );
  });
});

describe('DEFAULT_TIMEOUTS', () => {
  it('has all values as positive integers', () => {
    for (const key of Object.keys(DEFAULT_TIMEOUTS) as readonly (keyof typeof DEFAULT_TIMEOUTS)[]) {
      const value = DEFAULT_TIMEOUTS[key];
      expect(value).toBeGreaterThan(0);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe('WalkMe URL matching', () => {
  it('matches known WalkMe URLs', () => {
    const url = 'https://cdn.walkme.com/script.js';
    // eslint-disable-next-line security/detect-non-literal-regexp -- Testing pattern matching requires dynamic RegExp
    const matchers = WALKME_DEFAULT_PATTERNS.map((p) => new RegExp(p));
    const matched = matchers.some((re) => re.test(url));
    expect(matched).toBe(true);
  });
});
