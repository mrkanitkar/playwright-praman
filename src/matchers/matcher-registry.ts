/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Custom matcher registration API for domain-specific UI5 assertions.
 *
 * @remarks
 * Provides a `MatcherRegistry` that stores custom matchers and integrates
 * with Playwright's `expect.extend()`. Users register matchers before tests
 * run; the fixture layer calls `applyAll()` to wire them into `expect`.
 *
 * The `createUI5Matcher()` factory wraps user-supplied check logic with
 * {@link pollUntilPass} auto-retry semantics, so custom matchers get the
 * same web-first behavior as built-in Praman matchers.
 *
 * @example
 * ```typescript
 * import { createUI5Matcher, registerUI5Matcher } from 'playwright-praman';
 *
 * const checkUI5Icon = createUI5Matcher(async (page, controlId, expected) => {
 *   const actual = await getControlProperty(page, controlId, 'icon');
 *   const pass = actual === expected;
 *   return {
 *     pass,
 *     message: () =>
 *       pass
 *         ? `Expected control '${controlId}' icon not to be '${expected}'`
 *         : `Expected control '${controlId}' icon to be '${expected}', got '${String(actual)}'`,
 *     actual,
 *     expected,
 *   };
 * });
 *
 * registerUI5Matcher('toHaveUI5Icon', checkUI5Icon);
 * ```
 *
 * @module matchers
 */

import { pollUntilPass } from './matcher-utils.js';
import type { MatcherPage, PollableMatcherResult } from './matcher-utils.js';
import type { MatcherOptions, MatcherResult } from './ui5-matchers.js';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';

/**
 * A raw check function that evaluates a UI5 control assertion without retry.
 *
 * @remarks
 * This is the function shape users provide to {@link createUI5Matcher}.
 * It receives the page, control ID, and any number of additional arguments,
 * and returns a single-shot {@link PollableMatcherResult}.
 *
 * @typeParam TArgs - Tuple of additional arguments after `(page, controlId)`.
 *
 * @example
 * ```typescript
 * const checkFn: MatcherCheckFn<[string]> = async (page, controlId, expected) => {
 *   const actual = await getControlProperty(page, controlId, 'icon');
 *   return { pass: actual === expected, message: () => '...' };
 * };
 * ```
 */
export type MatcherCheckFn<TArgs extends readonly unknown[] = readonly unknown[]> = (
  page: MatcherPage,
  controlId: string,
  ...args: TArgs
) => Promise<PollableMatcherResult>;

/**
 * A matcher function suitable for `expect.extend()` registration.
 *
 * @remarks
 * This is the output of {@link createUI5Matcher} — it wraps the raw check
 * function with {@link pollUntilPass} auto-retry and accepts an optional
 * trailing `MatcherOptions` parameter.
 *
 * @example
 * ```typescript
 * const matcher: UI5MatcherFn = async (page, controlId, expected, options?) => {
 *   // auto-retry logic built-in
 * };
 * ```
 */
export type UI5MatcherFn = (
  page: MatcherPage,
  controlId: string,
  ...args: readonly unknown[]
) => Promise<MatcherResult>;

/**
 * Descriptor for a registered custom matcher.
 *
 * @example
 * ```typescript
 * const entry: MatcherRegistryEntry = {
 *   name: 'toHaveUI5Icon',
 *   matcherFn: checkUI5Icon,
 * };
 * ```
 */
export interface MatcherRegistryEntry {
  /** The `expect()` method name (e.g., `'toHaveUI5Icon'`). */
  readonly name: string;
  /** The matcher function to register with `expect.extend()`. */
  readonly matcherFn: UI5MatcherFn;
}

/** Internal storage for registered matchers. */
const registry = new Map<string, MatcherRegistryEntry>();

/** Whether `applyAll()` has been called (registry frozen after apply). */
let frozen = false;

/**
 * Wraps a raw check function with {@link pollUntilPass} auto-retry semantics.
 *
 * @intent Provide a factory so custom matchers automatically get web-first
 * retry behavior identical to built-in Praman matchers.
 *
 * @remarks
 * The returned function:
 * 1. Extracts an optional trailing `MatcherOptions` from the arguments
 * 2. Calls the user's check function inside `pollUntilPass`
 * 3. Returns a standard {@link MatcherResult}
 *
 * @typeParam TArgs - Tuple of additional arguments the check function expects.
 * @param checkFn - Raw check function that performs a single assertion attempt.
 * @returns A matcher function with auto-retry, suitable for {@link registerUI5Matcher}.
 *
 * @example
 * ```typescript
 * import { createUI5Matcher, registerUI5Matcher } from 'playwright-praman';
 * import { getControlProperty } from 'playwright-praman';
 *
 * const checkUI5Icon = createUI5Matcher<[string]>(
 *   async (page, controlId, expected) => {
 *     const actual = await getControlProperty(page, controlId, 'icon');
 *     const pass = actual === expected;
 *     return {
 *       pass,
 *       message: () =>
 *         pass
 *           ? `Expected icon not to be '${expected}'`
 *           : `Expected icon to be '${expected}', got '${String(actual)}'`,
 *       actual,
 *       expected,
 *     };
 *   },
 * );
 *
 * registerUI5Matcher('toHaveUI5Icon', checkUI5Icon);
 * ```
 */
export function createUI5Matcher<TArgs extends readonly unknown[] = readonly unknown[]>(
  checkFn: MatcherCheckFn<TArgs>,
): UI5MatcherFn {
  if (typeof checkFn !== 'function') {
    throw new PramanError({
      code: ErrorCode.ERR_MATCHER_INVALID,
      message: 'createUI5Matcher requires a function argument',
      attempted: 'Create custom UI5 matcher',
      retryable: false,
      suggestions: [
        'Pass an async function: createUI5Matcher(async (page, controlId, ...args) => { ... })',
      ],
    });
  }

  // Single assertion: MatcherCheckFn<TArgs> → MatcherCheckFn.
  // Safe because expect.extend() erases TArgs at the call boundary — the
  // runtime args are always unknown[]. This avoids double-cast assertions.
  const erased = checkFn as MatcherCheckFn;

  return async (
    page: MatcherPage,
    controlId: string,
    ...args: readonly unknown[]
  ): Promise<MatcherResult> => {
    // Extract optional trailing MatcherOptions
    const lastArg = args.length > 0 ? args[args.length - 1] : undefined;
    const hasOptions =
      lastArg !== null &&
      typeof lastArg === 'object' &&
      !Array.isArray(lastArg) &&
      'timeout' in lastArg;

    const options = hasOptions ? (lastArg as MatcherOptions) : undefined;
    const checkArgs = hasOptions ? args.slice(0, -1) : args;

    return pollUntilPass(async () => erased(page, controlId, ...checkArgs), options?.timeout);
  };
}

/**
 * Registers a custom UI5 matcher for use with `expect(control).toXxx()`.
 *
 * @intent Allow users to extend Praman's assertion vocabulary with
 * domain-specific matchers that use the same semantics as built-in matchers.
 *
 * @remarks
 * Matchers must be registered before the Playwright worker initializes
 * (typically in a `playwright.config.ts` global setup or a test file's
 * top-level scope). The name must start with `to` (Playwright convention).
 *
 * After the fixture calls `applyAll()`, the registry is frozen and no
 * further registrations are accepted.
 *
 * @param name - The `expect()` method name (must start with `'to'`).
 * @param matcherFn - The matcher function (use {@link createUI5Matcher} to create one).
 *
 * @example
 * ```typescript
 * import { createUI5Matcher, registerUI5Matcher } from 'playwright-praman';
 *
 * const checkUI5Icon = createUI5Matcher<[string]>(
 *   async (page, controlId, expected) => {
 *     const actual = await getControlProperty(page, controlId, 'icon');
 *     return {
 *       pass: actual === expected,
 *       message: () => `Expected icon '${expected}', got '${String(actual)}'`,
 *     };
 *   },
 * );
 *
 * registerUI5Matcher('toHaveUI5Icon', checkUI5Icon);
 *
 * // Now usable in tests:
 * // await expect(page).toHaveUI5Icon('sap-icon://add');
 * ```
 */
export function registerUI5Matcher(name: string, matcherFn: UI5MatcherFn): void {
  if (frozen) {
    throw new PramanError({
      code: ErrorCode.ERR_MATCHER_FROZEN,
      message: `Cannot register matcher '${name}': registry is frozen after applyAll()`,
      attempted: `Register custom matcher '${name}'`,
      retryable: false,
      suggestions: [
        'Register matchers before tests run (e.g., in playwright.config.ts or top-level test scope)',
        'Ensure registerUI5Matcher() is called before the Praman fixture initializes',
      ],
    });
  }

  if (typeof name !== 'string' || name.length === 0) {
    throw new PramanError({
      code: ErrorCode.ERR_MATCHER_INVALID,
      message: 'Matcher name must be a non-empty string',
      attempted: 'Register custom matcher with invalid name',
      retryable: false,
      suggestions: ['Provide a string name starting with "to" (e.g., "toHaveUI5Icon")'],
    });
  }

  if (!name.startsWith('to')) {
    throw new PramanError({
      code: ErrorCode.ERR_MATCHER_INVALID,
      message: `Matcher name '${name}' must start with 'to' (Playwright convention)`,
      attempted: `Register custom matcher '${name}'`,
      retryable: false,
      details: { name },
      suggestions: [
        `Rename to 'to${name.charAt(0).toUpperCase()}${name.slice(1)}' or use a 'toHaveUI5' / 'toBeUI5' prefix`,
      ],
    });
  }

  if (typeof matcherFn !== 'function') {
    throw new PramanError({
      code: ErrorCode.ERR_MATCHER_INVALID,
      message: `Matcher '${name}' must be a function, got ${typeof matcherFn}`,
      attempted: `Register custom matcher '${name}'`,
      retryable: false,
      suggestions: [
        'Use createUI5Matcher() to create a matcher function with auto-retry semantics',
      ],
    });
  }

  if (registry.has(name)) {
    throw new PramanError({
      code: ErrorCode.ERR_MATCHER_DUPLICATE,
      message: `Matcher '${name}' is already registered`,
      attempted: `Register duplicate matcher '${name}'`,
      retryable: false,
      details: { name },
      suggestions: [
        `Choose a different name for your matcher`,
        `If replacing a built-in matcher, use a unique prefix (e.g., 'toHaveCustom...')`,
      ],
    });
  }

  registry.set(name, { name, matcherFn });
}

/**
 * Returns all registered custom matchers as a record for `expect.extend()`.
 *
 * @intent Provide the fixture layer with a snapshot of registered matchers
 * to wire into Playwright's assertion system.
 *
 * @remarks
 * This is called internally by the `matcherRegistration` fixture.
 * After the first call, the registry is frozen — no further registrations
 * are accepted. Returns a plain object keyed by matcher name.
 *
 * @returns Record mapping matcher names to matcher functions.
 *
 * @example
 * ```typescript
 * // Internal fixture usage:
 * const customMatchers = getRegisteredMatchers();
 * expect.extend(customMatchers);
 * ```
 */
export function getRegisteredMatchers(): Readonly<Record<string, UI5MatcherFn>> {
  frozen = true;

  const result: Record<string, UI5MatcherFn> = {};
  for (const [name, entry] of registry) {
    // eslint-disable-next-line security/detect-object-injection
    result[name] = entry.matcherFn;
  }
  return Object.freeze(result);
}

/**
 * Returns the number of custom matchers currently registered.
 *
 * @remarks
 * Useful for diagnostics and test assertions. Does not include
 * built-in matchers — only those added via {@link registerUI5Matcher}.
 *
 * @returns The count of registered custom matchers.
 *
 * @example
 * ```typescript
 * registerUI5Matcher('toHaveUI5Icon', iconMatcher);
 * console.log(getRegisteredMatcherCount()); // 1
 * ```
 */
export function getRegisteredMatcherCount(): number {
  return registry.size;
}

/**
 * Returns whether the registry has been frozen (after `applyAll()`).
 *
 * @returns `true` if no further registrations are accepted.
 *
 * @example
 * ```typescript
 * console.log(isMatcherRegistryFrozen()); // false (before apply)
 * getRegisteredMatchers();
 * console.log(isMatcherRegistryFrozen()); // true (after apply)
 * ```
 */
export function isMatcherRegistryFrozen(): boolean {
  return frozen;
}

/**
 * Resets the matcher registry to its initial state.
 *
 * @remarks
 * **Testing only.** Clears all registered matchers and unfreezes the
 * registry. This is NOT exported from the public API — it is used
 * exclusively in unit tests to ensure test isolation.
 *
 * @example
 * ```typescript
 * // In test setup:
 * resetMatcherRegistry();
 * ```
 */
export function resetMatcherRegistry(): void {
  registry.clear();
  frozen = false;
}
