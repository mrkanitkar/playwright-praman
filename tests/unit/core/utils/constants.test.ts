/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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
  ODATA_DEFAULT_URL_PATTERNS,
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

describe('ODATA_DEFAULT_URL_PATTERNS', () => {
  it('is a non-empty readonly array', () => {
    expect(Array.isArray(ODATA_DEFAULT_URL_PATTERNS)).toBe(true);
    expect(ODATA_DEFAULT_URL_PATTERNS.length).toBeGreaterThan(0);
  });

  it('has exactly 4 default patterns', () => {
    expect(ODATA_DEFAULT_URL_PATTERNS).toHaveLength(4);
  });

  it('includes SAP OData V2 path', () => {
    expect(ODATA_DEFAULT_URL_PATTERNS).toContain('/sap/opu/odata/');
  });

  it('includes SAP OData V4 path', () => {
    expect(ODATA_DEFAULT_URL_PATTERNS).toContain('/sap/opu/odata4/');
  });

  it('includes generic OData V2 path', () => {
    expect(ODATA_DEFAULT_URL_PATTERNS).toContain('/odata/v2/');
  });

  it('includes generic OData V4 path', () => {
    expect(ODATA_DEFAULT_URL_PATTERNS).toContain('/odata/v4/');
  });

  it('matches SAP OData URLs via substring', () => {
    const url = 'https://host.sap.com/sap/opu/odata/sap/API_PRODUCT/Products';
    const matched = ODATA_DEFAULT_URL_PATTERNS.some((p) => url.includes(p));
    expect(matched).toBe(true);
  });

  it('does not match non-OData URLs', () => {
    const url = 'https://host.sap.com/sap/bc/ui5_ui5/some-app/index.html';
    const matched = ODATA_DEFAULT_URL_PATTERNS.some((p) => url.includes(p));
    expect(matched).toBe(false);
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
