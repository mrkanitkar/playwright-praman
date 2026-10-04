/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Unit tests for `src/reporters/allure-categories.ts`.
 *
 * @remarks
 * Validates the shape, content, and regex validity of the pre-defined
 * Allure SAP failure categories.
 */

import { describe, expect, it } from 'vitest';

import { ALLURE_SAP_CATEGORIES } from '../../../src/reporters/allure-categories.js';
import type { AllureSapCategory } from '../../../src/reporters/allure-categories.js';

describe('ALLURE_SAP_CATEGORIES', () => {
  it('contains exactly 5 categories', () => {
    expect(ALLURE_SAP_CATEGORIES).toHaveLength(5);
  });

  it('each category has name, messageRegex, and traceRegex', () => {
    for (const category of ALLURE_SAP_CATEGORIES) {
      expect(typeof category.name).toBe('string');
      expect(typeof category.messageRegex).toBe('string');
      expect(typeof category.traceRegex).toBe('string');
      expect(category.name.length).toBeGreaterThan(0);
      expect(category.messageRegex.length).toBeGreaterThan(0);
      expect(category.traceRegex.length).toBeGreaterThan(0);
    }
  });

  it('category names match expected SAP error domains', () => {
    const names = ALLURE_SAP_CATEGORIES.map((c) => c.name);

    expect(names).toContain('UI5 Control Errors');
    expect(names).toContain('Navigation Errors');
    expect(names).toContain('OData Errors');
    expect(names).toContain('Authentication Errors');
    expect(names).toContain('Bridge Communication Errors');
  });

  it('messageRegex patterns compile to valid RegExp', () => {
    for (const category of ALLURE_SAP_CATEGORIES) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- test-only: validating our own constant
      expect(() => new RegExp(category.messageRegex, 'u')).not.toThrow();
    }
  });

  it('traceRegex patterns compile to valid RegExp', () => {
    for (const category of ALLURE_SAP_CATEGORIES) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- test-only: validating our own constant
      expect(() => new RegExp(category.traceRegex, 'u')).not.toThrow();
    }
  });

  it('messageRegex patterns match their corresponding error codes', () => {
    const errorCodes = [
      'ERR_CONTROL_NOT_FOUND',
      'ERR_NAV_TILE_NOT_FOUND',
      'ERR_ODATA_REQUEST_FAILED',
      'ERR_AUTH_FAILED',
      'ERR_BRIDGE_TIMEOUT',
    ];

    for (const [index, category] of ALLURE_SAP_CATEGORIES.entries()) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- test-only: patterns from our own constant
      const regex = new RegExp(category.messageRegex, 'u');
      const code = errorCodes[index] ?? '';
      expect(regex.test(code), `${code} should match "${category.name}"`).toBe(true);
    }
  });

  it('traceRegex patterns match their corresponding error class names', () => {
    const traceLines = [
      'at ControlError.constructor (src/core/errors/control-error.ts:10:5)',
      'at NavigationError.constructor (src/core/errors/navigation-error.ts:8:5)',
      'at ODataError.constructor (src/core/errors/odata-error.ts:12:5)',
      'at AuthError.constructor (src/core/errors/auth-error.ts:9:5)',
      'at BridgeError.constructor (src/core/errors/bridge-error.ts:11:5)',
    ];

    for (const [index, category] of ALLURE_SAP_CATEGORIES.entries()) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- test-only: patterns from our own constant
      const regex = new RegExp(category.traceRegex, 'u');
      const trace = traceLines[index] ?? '';
      expect(regex.test(trace), `trace should match "${category.name}"`).toBe(true);
    }
  });

  it('exported type AllureSapCategory matches the array element shape', () => {
    // Type-level verification: assignment succeeds only if the type is correct
    const firstCategory: AllureSapCategory = ALLURE_SAP_CATEGORIES[0];
    expect(firstCategory.name).toBe('UI5 Control Errors');
  });
});
