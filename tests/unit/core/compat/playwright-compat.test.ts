/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Tests for `src/core/compat/playwright-compat.ts` — Playwright version detection and feature flags.
 *
 * @remarks
 * Tests pure functions (`parsePlaywrightVersion`, `detectFeatures`) directly
 * without mocking `node:module`. The `getPlaywrightVersion` integration test
 * uses the real installed `@playwright/test` package.
 *
 * @module compat
 */
import { describe, expect, it } from 'vitest';

import {
  assertMinVersion,
  detectFeatures,
  getPlaywrightFeatures,
  getPlaywrightVersion,
  hasFeature,
  parsePlaywrightVersion,
} from '#core/compat/playwright-compat.js';
import { PramanError } from '#core/errors/base.js';

describe('parsePlaywrightVersion', () => {
  it('parses a valid version string', () => {
    const result = parsePlaywrightVersion('1.58.2');
    expect(result).toEqual({ major: 1, minor: 58, patch: 2, raw: '1.58.2' });
  });
});

describe('detectFeatures', () => {
  it('returns all features true for version 1.59.0', () => {
    const version = { major: 1, minor: 59, patch: 0, raw: '1.59.0' };
    const features = detectFeatures(version);

    expect(features.hasLocatorAssertions).toBe(true);
    expect(features.hasFilterLocator).toBe(true);
    expect(features.hasRouteFromHAR).toBe(true);
    expect(features.hasScreenshotCaret).toBe(true);
    expect(features.hasBoxedStep).toBe(true);
    expect(features.hasCustomExpect).toBe(true);
    expect(features.hasClockAPI).toBe(true);
    expect(features.hasAriaSnapshot).toBe(true);
    expect(features.hasScreencastAPI).toBe(true);
    expect(features.hasAriaSnapshotDepth).toBe(true);
    expect(features.hasSetStorageState).toBe(true);
    expect(features.hasLocatorNormalize).toBe(true);
    expect(features.hasURLPatternMatcher).toBe(true);
  });

  it('returns no features for version 1.19.0', () => {
    const version = { major: 1, minor: 19, patch: 0, raw: '1.19.0' };
    const features = detectFeatures(version);

    expect(features.hasLocatorAssertions).toBe(false);
    expect(features.hasFilterLocator).toBe(false);
    expect(features.hasRouteFromHAR).toBe(false);
    expect(features.hasScreenshotCaret).toBe(false);
    expect(features.hasBoxedStep).toBe(false);
    expect(features.hasCustomExpect).toBe(false);
    expect(features.hasClockAPI).toBe(false);
    expect(features.hasAriaSnapshot).toBe(false);
    expect(features.hasScreencastAPI).toBe(false);
    expect(features.hasAriaSnapshotDepth).toBe(false);
    expect(features.hasSetStorageState).toBe(false);
    expect(features.hasLocatorNormalize).toBe(false);
    expect(features.hasURLPatternMatcher).toBe(false);
  });

  it('returns partial features for version 1.40.0', () => {
    const version = { major: 1, minor: 40, patch: 0, raw: '1.40.0' };
    const features = detectFeatures(version);

    expect(features.hasLocatorAssertions).toBe(true);
    expect(features.hasFilterLocator).toBe(true);
    expect(features.hasRouteFromHAR).toBe(true);
    expect(features.hasScreenshotCaret).toBe(true);
    expect(features.hasBoxedStep).toBe(true);
    expect(features.hasCustomExpect).toBe(false);
    expect(features.hasClockAPI).toBe(false);
    expect(features.hasAriaSnapshot).toBe(false);
  });

  it('returns correct features for boundary version 1.45.0', () => {
    const version = { major: 1, minor: 45, patch: 0, raw: '1.45.0' };
    const features = detectFeatures(version);

    expect(features.hasClockAPI).toBe(true);
    expect(features.hasAriaSnapshot).toBe(false);
  });

  it('returns pre-1.59 features true but 1.59 features false for version 1.58.0', () => {
    const version = { major: 1, minor: 58, patch: 0, raw: '1.58.0' };
    const features = detectFeatures(version);

    expect(features.hasAriaSnapshot).toBe(true);
    expect(features.hasScreencastAPI).toBe(false);
    expect(features.hasAriaSnapshotDepth).toBe(false);
    expect(features.hasSetStorageState).toBe(false);
    expect(features.hasLocatorNormalize).toBe(false);
    expect(features.hasURLPatternMatcher).toBe(false);
  });
});

describe('hasFeature', () => {
  it('returns correct boolean for installed Playwright version', () => {
    // Playwright 1.59.0 is installed — all features should be true
    expect(hasFeature('hasClockAPI')).toBe(true);
    expect(hasFeature('hasAriaSnapshot')).toBe(true);
    expect(hasFeature('hasLocatorAssertions')).toBe(true);
    expect(hasFeature('hasScreencastAPI')).toBe(true);
    expect(hasFeature('hasLocatorNormalize')).toBe(true);
  });
});

describe('assertMinVersion', () => {
  it('passes when installed version satisfies minimum', () => {
    // Should not throw — installed Playwright is 1.58.2
    expect(() => {
      assertMinVersion('1.0.0');
    }).not.toThrow();
  });

  it('throws PramanError when installed version is below minimum', () => {
    expect(() => {
      assertMinVersion('99.0.0');
    }).toThrow(PramanError);
  });

  it('includes version info in error message', () => {
    try {
      assertMinVersion('99.0.0');
      // Should not reach here
      expect.fail('Expected PramanError to be thrown');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(PramanError);
      const pramanError = error as PramanError;
      expect(pramanError.message).toContain('99.0.0');
      expect(pramanError.code).toBe('ERR_CONFIG_INVALID');
    }
  });
});

describe('getPlaywrightVersion', () => {
  it('returns valid version object from installed @playwright/test', () => {
    const version = getPlaywrightVersion();

    expect(version.major).toBeGreaterThanOrEqual(1);
    expect(version.minor).toBeGreaterThanOrEqual(0);
    expect(version.patch).toBeGreaterThanOrEqual(0);
    expect(version.raw).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('getPlaywrightFeatures', () => {
  it('returns feature flags for installed Playwright version', () => {
    const features = getPlaywrightFeatures();

    // All features should have boolean values
    expect(typeof features.hasRouteFromHAR).toBe('boolean');
    expect(typeof features.hasScreenshotCaret).toBe('boolean');
    expect(typeof features.hasClockAPI).toBe('boolean');
    expect(typeof features.hasAriaSnapshot).toBe('boolean');
    expect(typeof features.hasCustomExpect).toBe('boolean');
    expect(typeof features.hasLocatorAssertions).toBe('boolean');
    expect(typeof features.hasFilterLocator).toBe('boolean');
    expect(typeof features.hasBoxedStep).toBe('boolean');
    expect(typeof features.hasScreencastAPI).toBe('boolean');
    expect(typeof features.hasAriaSnapshotDepth).toBe('boolean');
    expect(typeof features.hasSetStorageState).toBe('boolean');
    expect(typeof features.hasLocatorNormalize).toBe('boolean');
    expect(typeof features.hasURLPatternMatcher).toBe('boolean');
  });
});
