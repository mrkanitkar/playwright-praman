/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Playwright version detection and feature flags.
 *
 * @remarks
 * Detects the installed Playwright version at runtime and exposes feature
 * flags indicating which APIs are available. Used by higher layers to
 * conditionally enable capabilities (e.g., Clock API, aria snapshots).
 *
 * Pure functions (`parsePlaywrightVersion`, `detectFeatures`) are separated
 * from the I/O-bound `getPlaywrightVersion` for testability.
 *
 * @example
 * ```typescript
 * import {
 *   getPlaywrightVersion,
 *   getPlaywrightFeatures,
 *   hasFeature,
 *   assertMinVersion,
 * } from '#core/compat/playwright-compat.js';
 *
 * assertMinVersion('1.40.0');
 * if (hasFeature('hasClockAPI')) {
 *   // use clock API
 * }
 * ```
 *
 * @module compat
 */

import { createRequire } from 'node:module';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { isAtLeast, parseSemVer } from '#core/utils/version-compare.js';

/**
 * Parsed Playwright version components.
 *
 * @example
 * ```typescript
 * const ver: PlaywrightVersion = {
 *   major: 1, minor: 58, patch: 2, raw: '1.58.2',
 * };
 * ```
 */
export interface PlaywrightVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly raw: string;
}

/**
 * Feature flags indicating available Playwright APIs.
 *
 * @example
 * ```typescript
 * const features: PlaywrightFeatures = detectFeatures(version);
 * if (features.hasClockAPI) { ... }
 * ```
 */
export interface PlaywrightFeatures {
  readonly hasRouteFromHAR: boolean;
  readonly hasScreenshotCaret: boolean;
  readonly hasClockAPI: boolean;
  readonly hasAriaSnapshot: boolean;
  readonly hasCustomExpect: boolean;
  readonly hasLocatorAssertions: boolean;
  readonly hasFilterLocator: boolean;
  readonly hasBoxedStep: boolean;
  readonly hasScreencastAPI: boolean;
  readonly hasAriaSnapshotDepth: boolean;
  readonly hasSetStorageState: boolean;
  readonly hasLocatorNormalize: boolean;
  readonly hasURLPatternMatcher: boolean;
  readonly hasTestAbort: boolean;
  readonly hasGetByRoleDescription: boolean;
  readonly hasPageAriaSnapshot: boolean;
  readonly hasAriaSnapshotBoxes: boolean;
  readonly hasTracingHAR: boolean;
  readonly hasLocatorDrop: boolean;
  readonly hasLocatorHighlightStyle: boolean;
  readonly hasBrowserContextEvent: boolean;
}

/**
 * Parses a version string into a {@link PlaywrightVersion} object.
 *
 * @param versionString - Semver string (e.g., `'1.58.2'`).
 * @returns Parsed version with `raw` field.
 *
 * @example
 * ```typescript
 * const ver = parsePlaywrightVersion('1.58.2');
 * // { major: 1, minor: 58, patch: 2, raw: '1.58.2' }
 * ```
 */
export function parsePlaywrightVersion(versionString: string): PlaywrightVersion {
  const parsed = parseSemVer(versionString);
  return {
    major: parsed.major,
    minor: parsed.minor,
    patch: parsed.patch,
    raw: versionString,
  };
}

/**
 * Detects available Playwright features for a given version.
 *
 * @param version - Parsed Playwright version.
 * @returns Feature flags object.
 *
 * @example
 * ```typescript
 * const features = detectFeatures({ major: 1, minor: 58, patch: 0, raw: '1.58.0' });
 * features.hasClockAPI; // true
 * ```
 */
export function detectFeatures(version: PlaywrightVersion): PlaywrightFeatures {
  const ver = `${String(version.major)}.${String(version.minor)}.${String(version.patch)}`;

  return {
    hasLocatorAssertions: isAtLeast(ver, '1.20.0'),
    hasFilterLocator: isAtLeast(ver, '1.22.0'),
    hasRouteFromHAR: isAtLeast(ver, '1.23.0'),
    hasScreenshotCaret: isAtLeast(ver, '1.36.0'),
    hasBoxedStep: isAtLeast(ver, '1.38.0'),
    hasCustomExpect: isAtLeast(ver, '1.44.0'),
    hasClockAPI: isAtLeast(ver, '1.45.0'),
    hasAriaSnapshot: isAtLeast(ver, '1.49.0'),
    hasScreencastAPI: isAtLeast(ver, '1.59.0'),
    hasAriaSnapshotDepth: isAtLeast(ver, '1.59.0'),
    hasSetStorageState: isAtLeast(ver, '1.59.0'),
    hasLocatorNormalize: isAtLeast(ver, '1.59.0'),
    hasURLPatternMatcher: isAtLeast(ver, '1.59.0'),
    hasTestAbort: isAtLeast(ver, '1.60.0'),
    hasGetByRoleDescription: isAtLeast(ver, '1.60.0'),
    hasPageAriaSnapshot: isAtLeast(ver, '1.60.0'),
    hasAriaSnapshotBoxes: isAtLeast(ver, '1.60.0'),
    hasTracingHAR: isAtLeast(ver, '1.60.0'),
    hasLocatorDrop: isAtLeast(ver, '1.60.0'),
    hasLocatorHighlightStyle: isAtLeast(ver, '1.60.0'),
    hasBrowserContextEvent: isAtLeast(ver, '1.60.0'),
  };
}

/**
 * Reads the installed `@playwright/test` version from disk.
 *
 * @remarks
 * Uses `createRequire` to resolve and load the `@playwright/test/package.json`.
 * This works in both ESM and CJS contexts.
 *
 * @returns Parsed Playwright version.
 *
 * @example
 * ```typescript
 * const version = getPlaywrightVersion();
 * logger.info(version.raw); // '1.58.2'
 * ```
 */
export function getPlaywrightVersion(): PlaywrightVersion {
  const esmRequire = createRequire(import.meta.url);
  const pkg = esmRequire('@playwright/test/package.json') as { version: string };
  return parsePlaywrightVersion(pkg.version);
}

/**
 * Returns feature flags for the currently installed Playwright version.
 *
 * @returns Feature flags object.
 *
 * @example
 * ```typescript
 * const features = getPlaywrightFeatures();
 * if (features.hasClockAPI) { ... }
 * ```
 */
export function getPlaywrightFeatures(): PlaywrightFeatures {
  return detectFeatures(getPlaywrightVersion());
}

/**
 * Returns whether a specific Playwright feature is available.
 *
 * @param feature - Feature flag key from {@link PlaywrightFeatures}.
 * @returns True if the installed Playwright version supports the feature.
 *
 * @example
 * ```typescript
 * if (hasFeature('hasAriaSnapshot')) {
 *   // aria snapshot assertions available
 * }
 * ```
 */
export function hasFeature(feature: keyof PlaywrightFeatures): boolean {
  const features = getPlaywrightFeatures();
  // eslint-disable-next-line security/detect-object-injection -- feature is typed keyof PlaywrightFeatures, not user input
  return features[feature];
}

/**
 * Asserts that the installed Playwright version meets a minimum requirement.
 *
 * @param minVersion - Minimum required version string (e.g., `'1.40.0'`).
 * @throws PramanError with `ERR_CONFIG_INVALID` if the version is too low.
 *
 * @example
 * ```typescript
 * assertMinVersion('1.40.0'); // throws if Playwright &lt; 1.40.0
 * ```
 */
export function assertMinVersion(minVersion: string): void {
  const current = getPlaywrightVersion();

  if (!isAtLeast(current.raw, minVersion)) {
    throw new PramanError({
      code: ErrorCode.ERR_CONFIG_INVALID,
      message: `Playwright ${current.raw} does not satisfy minimum version ${minVersion}`,
      attempted: `Assert Playwright version >= ${minVersion}`,
      retryable: false,
      suggestions: [
        `Upgrade Playwright: npm install @playwright/test@${minVersion}`,
        'Check package.json for version constraints',
      ],
    });
  }
}
