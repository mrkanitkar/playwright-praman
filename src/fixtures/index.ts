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
import { feTest } from './fe-fixtures.js';
import { moduleTest } from './module-fixtures.js';
import { navTest } from './nav-fixtures.js';
import { stabilityTest } from './stability-fixtures.js';

// ── Merged test fixture ─────────────────────────────────────────────

/**
 * Unified Playwright test object with all Praman fixtures.
 *
 * @remarks
 * Combines moduleTest (config, logger, ui5 + table/dialog/date/odata),
 * authTest (sapAuth), navTest (ui5Navigation, btpWorkZone),
 * stabilityTest (auto-wait, request interception), and feTest (fe).
 *
 * @example
 * ```typescript
 * import { test } from 'playwright-praman';
 *
 * test('table and FE ops', async ({ ui5, ui5Navigation, fe }) => {
 *   await ui5Navigation.navigateToApp('PurchaseOrder-manage');
 *   await ui5.table.getRows('myTable');
 *   await fe.listReport.search();
 * });
 * ```
 */
export const test = mergeTests(moduleTest, authTest, navTest, stabilityTest, feTest);

export { expect };

// ── Individual fixture modules (for standalone usage) ───────────────

export { coreTest } from './core-fixtures.js';
export type { TestFixtures, WorkerFixtures } from './core-fixtures.js';

export { moduleTest } from './module-fixtures.js';
export type { ExtendedUI5Handler } from './module-fixtures.js';

export { feTest } from './fe-fixtures.js';

export { stabilityTest } from './stability-fixtures.js';
export type { StabilityFixtures, StabilityWorkerFixtures } from './stability-fixtures.js';

export { authTest } from './auth-fixtures.js';
export type { AuthDeps, AuthFixtureOptions, AuthFixtures } from './auth-fixtures.js';

export { navTest } from './nav-fixtures.js';
export type { NavFixtures, NavWorkerDeps, UI5NavigationAPI } from './nav-fixtures.js';
