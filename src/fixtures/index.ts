/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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

import { aiTest } from './ai-fixtures.js';
import { authTest } from './auth-fixtures.js';
import { controlTreeTest } from './control-tree-fixtures.js';
import { feTest } from './fe-fixtures.js';
import { flpLocksTest } from './flp-locks-fixtures.js';
import { flpSettingsTest } from './flp-settings-fixtures.js';
import { intentTest } from './intent-fixtures.js';
import { moduleTest } from './module-fixtures.js';
import { navTest } from './nav-fixtures.js';
import { odataTraceTest } from './odata-trace-fixtures.js';
import { shellFooterTest } from './shell-footer-fixtures.js';
import { stabilityTest } from './stability-fixtures.js';
import { testDataTest } from './test-data-fixtures.js';

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
export const test = mergeTests(
  moduleTest,
  authTest,
  navTest,
  stabilityTest,
  controlTreeTest,
  feTest,
  aiTest,
  intentTest,
  shellFooterTest,
  flpLocksTest,
  flpSettingsTest,
  testDataTest,
  odataTraceTest,
);

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

export { aiTest } from './ai-fixtures.js';
export type { AIFixtures, AIWorkerDeps, PramanAIFixture } from './ai-fixtures.js';

export { intentTest } from './intent-fixtures.js';
export type { IntentFixture, IntentFixtureDeps, IntentTestFixtures } from './intent-fixtures.js';

export { shellFooterTest } from './shell-footer-fixtures.js';
export type { ShellFooterFixtures } from './shell-footer-fixtures.js';

export { flpLocksTest } from './flp-locks-fixtures.js';
export type { FLPLocksFixtures } from './flp-locks-fixtures.js';

export { flpSettingsTest } from './flp-settings-fixtures.js';
export type { FLPSettingsFixtures } from './flp-settings-fixtures.js';

export { testDataTest } from './test-data-fixtures.js';
export type { TestDataFixtures } from './test-data-fixtures.js';

export { odataTraceTest } from './odata-trace-fixtures.js';
export type { ODataTraceFixtures } from './odata-trace-fixtures.js';

export { controlTreeTest } from './control-tree-fixtures.js';
export type { ControlTreeFixtures } from './control-tree-fixtures.js';
