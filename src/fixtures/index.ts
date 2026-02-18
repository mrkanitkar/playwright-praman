/**
 * Fixture assembly — single entry point for all Praman test fixtures.
 *
 * @remarks
 * Merges all fixture modules into a unified `test` object using Playwright's
 * `mergeTests()`. Consumers use `test` and `expect` from this barrel.
 *
 * Individual fixture test objects (`coreTest`, `authTest`, `navTest`,
 * `stabilityTest`) are also re-exported for standalone usage.
 *
 * @example
 * ```typescript
 * import { test, expect } from 'playwright-praman';
 *
 * test('SAP UI5 login', async ({ ui5, sapAuth, ui5Navigation }) => {
 *   await ui5Navigation.navigateToApp('PurchaseOrder-manage');
 *   const button = await ui5.control({ id: 'submitBtn' });
 *   expect(button).toBeDefined();
 * });
 * ```
 *
 * @module fixtures
 */

import { expect, mergeTests } from '@playwright/test';

import { authTest } from './auth-fixtures.js';
import { coreTest } from './core-fixtures.js';
import { navTest } from './nav-fixtures.js';
import { stabilityTest } from './stability-fixtures.js';

// ── Merged test fixture ─────────────────────────────────────────────

/**
 * Unified Playwright test object with all Praman fixtures.
 *
 * @remarks
 * Combines coreTest (config, logger, adapter, ui5), authTest (sapAuth),
 * navTest (ui5Navigation, btpWorkZone), and stabilityTest (auto-wait,
 * request interception) via `mergeTests()`.
 *
 * @example
 * ```typescript
 * import { test } from 'playwright-praman';
 *
 * test('navigate to app', async ({ ui5Navigation, pramanConfig }) => {
 *   await ui5Navigation.navigateToApp('PurchaseOrder-manage');
 * });
 * ```
 */
export const test = mergeTests(coreTest, authTest, navTest, stabilityTest);

export { expect };

// ── Individual fixture modules (for standalone usage) ───────────────

export { coreTest } from './core-fixtures.js';
export type { TestFixtures, WorkerFixtures } from './core-fixtures.js';

export { stabilityTest } from './stability-fixtures.js';
export type { StabilityFixtures, StabilityWorkerFixtures } from './stability-fixtures.js';

export { authTest } from './auth-fixtures.js';
export type { AuthDeps, AuthFixtureOptions, AuthFixtures } from './auth-fixtures.js';

export { navTest } from './nav-fixtures.js';
export type { NavDeps, NavFixtures, UI5NavigationAPI } from './nav-fixtures.js';
