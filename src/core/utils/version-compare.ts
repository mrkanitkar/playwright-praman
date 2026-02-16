/**
 * Semver comparison utilities for Playwright and UI5 version checks.
 *
 * @remarks
 * Lightweight semver implementation covering the subset needed for
 * Playwright/UI5 version detection. NOT a full npm semver implementation.
 *
 * Supported range formats: `>=1.50.0`, `^1.50.0`, `~1.50.0`, `>=1.50.0 <2.0.0`
 *
 * Used by `playwright-compat.ts` for version detection instead of
 * duplicating semver parsing (resolved dependency S1).
 *
 * @example
 * ```typescript
 * import { parseSemVer, isAtLeast } from '#core/utils/version-compare.js';
 *
 * const ver = parseSemVer('1.58.2');
 * if (isAtLeast('1.58.2', '1.50.0')) {
 *   // Playwright 1.50+ features available
 * }
 * ```
 *
 * @module utils
 */

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';

/**
 * Parsed semver components.
 */
export interface SemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease?: string;
}

// eslint-disable-next-line security/detect-unsafe-regex -- bounded semver format, no backtracking risk
const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/;

/**
 * Parses a version string into semver components.
 *
 * @param version - Version string in `major.minor.patch[-prerelease]` format.
 * @returns Parsed SemVer object.
 * @throws PramanError with ERR_CONFIG_INVALID if the version string is invalid.
 *
 * @example
 * ```typescript
 * const ver = parseSemVer('1.50.0-beta.1');
 * // { major: 1, minor: 50, patch: 0, prerelease: 'beta.1' }
 * ```
 */
export function parseSemVer(version: string): SemVer {
  const match = SEMVER_REGEX.exec(version);

  if (match === null) {
    throw new PramanError({
      code: ErrorCode.ERR_CONFIG_INVALID,
      message: `Invalid semver string: "${version}"`,
      attempted: `Parse version string "${version}"`,
      retryable: false,
      suggestions: [
        'Use the format "major.minor.patch" (e.g., "1.50.0")',
        'Prerelease is optional: "1.50.0-beta.1"',
      ],
    });
  }

  const result: SemVer = {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };

  if (match[4] !== undefined) {
    return { ...result, prerelease: match[4] };
  }

  return result;
}

/**
 * Compares two semver values.
 *
 * @param a - First version.
 * @param b - Second version.
 * @returns -1 if a less than b, 0 if equal, 1 if a greater than b.
 *
 * @example
 * ```typescript
 * compareSemVer(parseSemVer('1.49.0'), parseSemVer('1.50.0')); // -1
 * ```
 */
export function compareSemVer(a: SemVer, b: SemVer): -1 | 0 | 1 {
  if (a.major !== b.major) return a.major > b.major ? 1 : -1;
  if (a.minor !== b.minor) return a.minor > b.minor ? 1 : -1;
  if (a.patch !== b.patch) return a.patch > b.patch ? 1 : -1;
  return 0;
}

/**
 * Checks if a version satisfies a simple range expression.
 *
 * @remarks
 * Supported formats:
 * - `>=1.50.0` — greater than or equal
 * - `^1.50.0` — compatible (same major)
 * - `~1.50.0` — approximately (same major.minor)
 * - `>=1.50.0 <2.0.0` — compound range (space-separated, all must match)
 *
 * @param version - Parsed semver to check.
 * @param range - Range expression string.
 * @returns True if version satisfies the range.
 *
 * @example
 * ```typescript
 * satisfiesRange(parseSemVer('1.55.0'), '>=1.50.0 <2.0.0'); // true
 * ```
 */
export function satisfiesRange(version: SemVer, range: string): boolean {
  const parts = range.split(' ');

  return parts.every((part) => satisfiesSingleRange(version, part));
}

function satisfiesSingleRange(version: SemVer, range: string): boolean {
  if (range.startsWith('>=')) {
    const target = parseSemVer(range.slice(2));
    return compareSemVer(version, target) >= 0;
  }

  if (range.startsWith('<')) {
    const target = parseSemVer(range.slice(1));
    return compareSemVer(version, target) < 0;
  }

  if (range.startsWith('^')) {
    const target = parseSemVer(range.slice(1));
    // Same major, >= target
    return version.major === target.major && compareSemVer(version, target) >= 0;
  }

  if (range.startsWith('~')) {
    const target = parseSemVer(range.slice(1));
    // Same major.minor, >= target
    return (
      version.major === target.major &&
      version.minor === target.minor &&
      compareSemVer(version, target) >= 0
    );
  }

  // Exact match
  const target = parseSemVer(range);
  return compareSemVer(version, target) === 0;
}

/**
 * Shorthand: checks if a version string is at least the given minimum.
 *
 * @param version - Version string to check.
 * @param minimum - Minimum version required.
 * @returns True if version is greater than or equal to minimum.
 *
 * @example
 * ```typescript
 * isAtLeast('1.58.2', '1.50.0'); // true
 * ```
 */
export function isAtLeast(version: string, minimum: string): boolean {
  return compareSemVer(parseSemVer(version), parseSemVer(minimum)) >= 0;
}
