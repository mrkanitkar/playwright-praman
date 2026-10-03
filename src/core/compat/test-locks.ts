/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Playwright test locks for SAP shared state.
 *
 * @remarks
 * Playwright 1.63 added `lock` to the test-details object: tests holding the
 * same lock name never run concurrently, across files, workers and projects.
 * Praman cannot wrap that — it is declared at the `test()` call site — so this
 * module supplies the two things Praman *can* own: a runtime guard, and
 * conventional names so a team does not invent three spellings of the same
 * lock.
 *
 * **Why the guard is not belt-and-braces.** `playwright test` does not
 * typecheck — `@playwright/test` declares exactly one dependency, `playwright`,
 * with no `typescript`. A `lock` passed on 1.57-1.62 is therefore an unknown
 * property that JavaScript silently ignores: the tests run **in parallel**, the
 * shared state corrupts, and nothing reports it. The TypeScript error only
 * appears if the user separately runs `tsc`. So the floor behaviour here is
 * fail-open, and {@link requireTestLocks} converts it to fail-closed.
 *
 * **Naming hazard.** Praman's `flpLocks` fixture manages SAP **SM12 lock
 * entries** — server-side locks held by the SAP system. Playwright's `lock` is
 * client-side mutual exclusion between test workers. Same word, unrelated
 * mechanisms. They **compose**: the Playwright lock stops two workers racing
 * for the same business object, which is what produces the SM12 collision the
 * fixture would otherwise only be able to clean up afterwards.
 *
 * @example
 * ```typescript
 * import { test } from 'playwright-praman';
 * import { requireTestLocks, SAP_LOCKS } from 'playwright-praman';
 *
 * requireTestLocks(); // fails fast at collection time below 1.63
 *
 * test('changes the FLP language', { lock: SAP_LOCKS.flpSettings }, async ({ ui5 }) => {
 *   // no other locked test runs while this one does
 * });
 * ```
 *
 * @module compat
 */

import { hasFeature } from '#core/compat/playwright-compat.js';
import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';

/**
 * Minimum Playwright version providing `lock` on test details.
 *
 * @example
 * ```typescript
 * import { MIN_TEST_LOCKS_VERSION } from '#core/compat/test-locks.js';
 *
 * MIN_TEST_LOCKS_VERSION; // '1.63.0'
 * ```
 */
export const MIN_TEST_LOCKS_VERSION = '1.63.0';

/** Prefix on every Praman-supplied lock name, so user locks cannot collide. */
const LOCK_NAMESPACE = 'sap';

/**
 * Conventional lock names for state SAP tests actually share.
 *
 * @remarks
 * Each entry corresponds to a contention source verified in the code, not a
 * guess:
 *
 * - `flpSettings` — FLP user settings (language, timezone, number format).
 *   `FLPSettingsHandler` is **read-only**, so it is the *victim* here rather
 *   than the cause: a test that changes the language through the FLP UI
 *   corrupts a concurrent reader. Lock the test that mutates.
 * - `testUser` — a single named SAP user shared by a suite. Logging in,
 *   personalizing, or holding a transaction affects every other test using it.
 * - `testData` — `TestDataHandler.cleanup()` calls
 *   `rm(baseDir, { recursive: true, force: true })`. Without a lock, one
 *   worker's teardown deletes another worker's fixtures mid-test.
 *
 * For a specific business object use {@link sapObjectLock} instead, so two
 * tests editing *different* purchase orders still run in parallel.
 *
 * @example
 * ```typescript
 * import { SAP_LOCKS } from 'playwright-praman';
 *
 * test('cleans up fixtures', { lock: SAP_LOCKS.testData }, async () => { ... });
 * ```
 */
export const SAP_LOCKS = {
  /** FLP user settings — language, timezone, date/number format. */
  flpSettings: `${LOCK_NAMESPACE}:flp-settings`,
  /** A single named SAP test user shared across a suite. */
  testUser: `${LOCK_NAMESPACE}:test-user`,
  /** The shared test-data directory, whose cleanup is recursive. */
  testData: `${LOCK_NAMESPACE}:test-data`,
} as const satisfies Record<string, string>;

/**
 * Builds a lock name scoped to one SAP business object.
 *
 * @remarks
 * Named after SM12, the SAP lock-entry transaction, because this is the
 * client-side counterpart: it stops two workers reaching the same object at
 * once, rather than reporting the collision after the fact.
 *
 * Scoped deliberately — two tests editing *different* purchase orders should
 * still run in parallel, which a single blanket `sap:purchase-order` lock would
 * prevent.
 *
 * @param objectType - Business object type, e.g. `'PurchaseOrder'`.
 * @param objectKey - The instance key, e.g. `'4500000123'`.
 * @returns A lock name of the form `sap:sm12:<objectType>:<objectKey>`.
 * @throws PramanError with `ERR_CONFIG_INVALID` when either part is blank.
 *
 * @example
 * ```typescript
 * import { sapObjectLock } from 'playwright-praman';
 *
 * const lock = sapObjectLock('PurchaseOrder', '4500000123');
 * // 'sap:sm12:PurchaseOrder:4500000123'
 *
 * test('approves the PO', { lock }, async ({ ui5 }) => { ... });
 * ```
 */
export function sapObjectLock(objectType: string, objectKey: string): string {
  const type = objectType.trim();
  const key = objectKey.trim();

  if (type === '' || key === '') {
    throw new PramanError({
      code: ErrorCode.ERR_CONFIG_INVALID,
      message: 'sapObjectLock requires a non-empty object type and key.',
      attempted: `Build a lock name for object type "${objectType}" and key "${objectKey}"`,
      retryable: false,
      details: { objectType, objectKey },
      suggestions: [
        'Pass both the business object type and its instance key',
        'Use a SAP_LOCKS entry when the contention is not object-specific',
      ],
    });
  }

  return `${LOCK_NAMESPACE}:sm12:${type}:${key}`;
}

/**
 * Asserts that the installed Playwright supports test locks.
 *
 * @remarks
 * Call this at module scope in a spec that uses `lock`, so it fails at
 * collection time rather than after the suite has already run unlocked.
 *
 * Throws rather than degrading, per the policy in `playwright-compat.ts`: the
 * 1.57 floor has no equivalent. `fullyParallel: false` is the nearest thing and
 * is far blunter — it serialises an entire project rather than the handful of
 * tests that touch one piece of shared state. Returning quietly would leave the
 * caller believing they had mutual exclusion while the tests ran in parallel.
 *
 * @throws PramanError with `ERR_COMPAT_FEATURE_UNAVAILABLE` below
 *   {@link MIN_TEST_LOCKS_VERSION}.
 *
 * @example
 * ```typescript
 * import { requireTestLocks, SAP_LOCKS } from 'playwright-praman';
 *
 * requireTestLocks();
 *
 * test('edits shared config', { lock: SAP_LOCKS.flpSettings }, async () => { ... });
 * ```
 */
export function requireTestLocks(): void {
  if (hasFeature('hasTestLocks')) return;

  throw new PramanError({
    code: ErrorCode.ERR_COMPAT_FEATURE_UNAVAILABLE,
    message: `Test locks require Playwright ${MIN_TEST_LOCKS_VERSION} or later.`,
    attempted: 'Use a test lock to serialise access to shared SAP state',
    retryable: false,
    details: { requiredVersion: MIN_TEST_LOCKS_VERSION, feature: 'hasTestLocks' },
    suggestions: [
      `Upgrade Playwright: npm install -D @playwright/test@${MIN_TEST_LOCKS_VERSION}`,
      'Or set fullyParallel: false on the project as a blunter fallback',
      'Check your installed version: npx playwright --version',
    ],
  });
}
