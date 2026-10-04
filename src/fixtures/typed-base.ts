/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Type-only base test objects for cross-fixture dependency resolution.
 *
 * @remarks
 * Provides type-cast versions of the Playwright `base` test that include
 * fixture types from upstream providers (coreTest, navTest) without
 * registering any runtime placeholders. This avoids the `option` flag
 * mismatch that Playwright 1.62+ checks for in `FixturePool`.
 *
 * If a module is used standalone (without `mergeTests` with the real
 * provider), Playwright reports a clear "unknown parameter" error.
 *
 * @module fixtures
 */

import { test as base } from '@playwright/test';
import type {
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
  TestType,
} from '@playwright/test';

import type {
  TestFixtures as CoreTestFixtures,
  WorkerFixtures as CoreWorkerFixtures,
} from './core-fixtures.js';
import type { NavFixtures } from './nav-fixtures.js';

/**
 * Type-only view of `base` that already "has" coreTest's worker and test fixtures.
 *
 * @remarks
 * No runtime registration — the real fixtures are provided by `coreTest` via
 * `mergeTests()`. Used by modules that depend on `pramanConfig`, `rootLogger`,
 * or `ui5` without declaring PW-MERGE-1 placeholders.
 *
 * @example
 * ```typescript
 * import { withCore as base } from './typed-base.js';
 *
 * export const myTest = base.extend<MyFixtures>({
 *   myFixture: async ({ pramanConfig }, use) => { await use(...); },
 * });
 * ```
 */
export const withCore = base as unknown as TestType<
  PlaywrightTestArgs & PlaywrightTestOptions & CoreTestFixtures,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions & CoreWorkerFixtures
>;

/**
 * Type-only view of `base` with coreTest + navTest fixture types.
 *
 * @remarks
 * Includes `ui5Navigation` and `btpWorkZone` from navTest in addition to
 * all core fixtures. Used by intentTest which depends on both ui5 (core)
 * and ui5Navigation (nav).
 *
 * @example
 * ```typescript
 * import { withCoreNav as base } from './typed-base.js';
 *
 * export const intentTest = base.extend<IntentFixtures>({
 *   intent: async ({ ui5, ui5Navigation }, use) => { await use(...); },
 * });
 * ```
 */
export const withCoreNav = base as unknown as TestType<
  PlaywrightTestArgs & PlaywrightTestOptions & CoreTestFixtures & NavFixtures,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions & CoreWorkerFixtures
>;
