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
import { browserBindTest } from './browser-bind-fixture.js';
import { controlTreeTest } from './control-tree-fixtures.js';
import { failureArtifactsTest } from './failure-artifacts-fixture.js';
import { feTest } from './fe-fixtures.js';
import { flpLocksTest } from './flp-locks-fixtures.js';
import { flpSettingsTest } from './flp-settings-fixtures.js';
import { intentTest } from './intent-fixtures.js';
import { moduleTest } from './module-fixtures.js';
import { navTest } from './nav-fixtures.js';
import { odataTraceTest } from './odata-trace-fixtures.js';
import { screencastTest } from './screencast-fixture.js';
import { shellFooterTest } from './shell-footer-fixtures.js';
import { stabilityTest } from './stability-fixtures.js';
import { testDataTest } from './test-data-fixtures.js';
import { webStorageTest } from './web-storage-fixture.js';

// ── Merged test fixture ─────────────────────────────────────────────

/**
 * Unified Playwright test object with all Praman fixtures.
 *
 * @remarks
 * Combines moduleTest (config, logger, ui5 + table/dialog/date/odata),
 * authTest (sapAuth), navTest (ui5Navigation, btpWorkZone),
 * stabilityTest (auto-wait, request interception), and feTest (fe).
 *
 * **Fixture override precedence in `mergeTests()`:**
 *
 * When multiple modules declare the same fixture name, Playwright resolves
 * them using last-writer-wins semantics — the last module in the argument
 * list that provides a real (non-placeholder) implementation wins.
 *
 * Overlapping fixtures and their resolution:
 *
 * - `pramanConfig` / `rootLogger` — real impl in `coreTest` (pulled in
 *   transitively via `moduleTest`); 7 other modules declare placeholders
 *   (`option: true`) that are satisfied by the real provider.
 *
 * - `ui5` — base impl in `coreTest`, **overridden** by `moduleTest`
 *   (adds `.table`, `.dialog`, `.date`, `.odata` sub-namespaces).
 *   `intentTest` declares a placeholder that resolves to `moduleTest`'s
 *   enriched version. `moduleTest` must appear before `intentTest`.
 *
 * - All remaining fixture names (`sapAuth`, `fe`, `intent`, `flpLocks`,
 *   etc.) are unique to their respective modules — no precedence concern.
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
  webStorageTest,
  navTest,
  stabilityTest,
  controlTreeTest,
  failureArtifactsTest,
  feTest,
  aiTest,
  intentTest,
  shellFooterTest,
  flpLocksTest,
  flpSettingsTest,
  testDataTest,
  odataTraceTest,
  browserBindTest,
  screencastTest,
);

export { expect };

// ── Individual fixture modules (for standalone usage) ───────────────

/**
 * Core fixture providing `page`, `pramanConfig`, and `rootLogger`.
 *
 * @remarks
 * Base fixture that all other Praman fixtures depend on.
 * Provides worker-scoped config loading and logger creation.
 *
 * @example
 * ```typescript
 * import { coreTest } from 'playwright-praman';
 *
 * coreTest('basic page check', async ({ page, pramanConfig }) => {
 *   expect(pramanConfig.logLevel).toBeDefined();
 * });
 * ```
 */
export { coreTest } from './core-fixtures.js';
export type { TestFixtures, WorkerFixtures } from './core-fixtures.js';

/**
 * Module fixture extending `ui5` with table, dialog, date, and OData sub-namespaces.
 *
 * @remarks
 * Overrides the `ui5` fixture from `coreTest` to attach `.table`, `.dialog`,
 * `.date`, and `.odata` sub-namespace objects with automatic stability guards.
 *
 * @example
 * ```typescript
 * import { moduleTest } from 'playwright-praman';
 *
 * moduleTest('table and dialog ops', async ({ ui5 }) => {
 *   await ui5.table.getRows('ordersTable');
 *   await ui5.dialog.confirm();
 * });
 * ```
 */
export { moduleTest } from './module-fixtures.js';
export type { ExtendedUI5Handler } from './module-fixtures.js';

/**
 * Fiori Elements fixture providing list report, object page, and FE table APIs.
 *
 * @remarks
 * Exposes `fe.listReport`, `fe.objectPage`, `fe.table`, and `fe.list`
 * for standard Fiori Elements application testing.
 *
 * @example
 * ```typescript
 * import { feTest } from 'playwright-praman';
 *
 * feTest('filter and navigate', async ({ fe }) => {
 *   await fe.listReport.setFilter('Status', 'Open');
 *   await fe.listReport.search();
 *   await fe.listReport.navigateToItem(0);
 * });
 * ```
 */
export { feTest } from './fe-fixtures.js';

/**
 * Stability fixture providing auto-wait and request interception.
 *
 * @remarks
 * Ensures UI5 stability before test interactions via automatic
 * `waitForUI5Stable()` calls and network request tracking.
 *
 * @example
 * ```typescript
 * import { stabilityTest } from 'playwright-praman';
 *
 * stabilityTest('stable interaction', async ({ page }) => {
 *   // Stability guards are automatically applied
 * });
 * ```
 */
export { stabilityTest } from './stability-fixtures.js';
export type { StabilityFixtures, StabilityWorkerFixtures } from './stability-fixtures.js';

/**
 * Authentication fixture providing SAP login/logout via `sapAuth`.
 *
 * @remarks
 * Supports BTP SAML, basic auth, Office 365, and custom strategies.
 * Authentication is typically performed in a seed setup project.
 *
 * @example
 * ```typescript
 * import { authTest } from 'playwright-praman';
 *
 * authTest('authenticated session', async ({ sapAuth }) => {
 *   const info = await sapAuth.getSessionInfo();
 *   expect(info).toBeDefined();
 * });
 * ```
 */
export { authTest } from './auth-fixtures.js';
export type { AuthDeps, AuthFixtureOptions, AuthFixtures } from './auth-fixtures.js';

/**
 * Navigation fixture providing `ui5Navigation` and `btpWorkZone` APIs.
 *
 * @remarks
 * Supports intent-based navigation, tile navigation, hash navigation,
 * and BTP Work Zone app search.
 *
 * @example
 * ```typescript
 * import { navTest } from 'playwright-praman';
 *
 * navTest('navigate to PO app', async ({ ui5Navigation }) => {
 *   await ui5Navigation.navigateToApp('PurchaseOrder-manage');
 * });
 * ```
 */
export { navTest } from './nav-fixtures.js';
export type { NavFixtures, NavWorkerDeps, UI5NavigationAPI } from './nav-fixtures.js';

/**
 * AI fixture providing `pramanAI` for page discovery, context building, and LLM integration.
 *
 * @remarks
 * Provides the `pramanAI` fixture with capabilities registry, recipe registry,
 * agentic handler, LLM service, and vocabulary for AI-assisted test authoring.
 *
 * @example
 * ```typescript
 * import { aiTest } from 'playwright-praman';
 *
 * aiTest('discover page controls', async ({ pramanAI }) => {
 *   const context = await pramanAI.buildContext();
 *   expect(context).toBeDefined();
 * });
 * ```
 */
export { aiTest } from './ai-fixtures.js';
export type { AIFixtures, AIWorkerDeps, PramanAIFixture } from './ai-fixtures.js';

/**
 * Intent fixture providing domain-specific business action helpers.
 *
 * @remarks
 * Exposes `intent.core`, `intent.procurement`, `intent.sales`,
 * `intent.finance`, `intent.manufacturing`, and `intent.masterData`
 * for high-level SAP business process automation.
 *
 * @example
 * ```typescript
 * import { intentTest } from 'playwright-praman';
 *
 * intentTest('create purchase order', async ({ intent }) => {
 *   await intent.procurement.createPurchaseOrder({ vendor: 'V100' });
 * });
 * ```
 */
export { intentTest } from './intent-fixtures.js';
export type { IntentFixture, IntentFixtureDeps, IntentTestFixtures } from './intent-fixtures.js';

/**
 * Shell and footer fixture providing `ui5Shell` and `ui5Footer` APIs.
 *
 * @remarks
 * Provides access to the Fiori Launchpad shell bar (notifications, user menu)
 * and footer bar (message popover, draft indicator) for cross-app interactions.
 *
 * @example
 * ```typescript
 * import { shellFooterTest } from 'playwright-praman';
 *
 * shellFooterTest('check shell bar', async ({ ui5Shell }) => {
 *   const title = await ui5Shell.getTitle();
 *   expect(title).toBeDefined();
 * });
 * ```
 */
export { shellFooterTest } from './shell-footer-fixtures.js';
export type { ShellFooterFixtures } from './shell-footer-fixtures.js';

/**
 * Fiori Launchpad edit-mode lock management fixture.
 *
 * @remarks
 * Prevents concurrent edit conflicts in Fiori apps by managing
 * FLP-level locks. Available as `flpLocks` in test fixtures.
 *
 * @example
 * ```typescript
 * import { flpLocksTest } from 'playwright-praman';
 *
 * flpLocksTest('edit with lock', async ({ flpLocks }) => {
 *   await flpLocks.acquire();
 *   // ... perform edits ...
 *   await flpLocks.release();
 * });
 * ```
 */
export { flpLocksTest } from './flp-locks-fixtures.js';
export type { FLPLocksFixtures } from './flp-locks-fixtures.js';

/**
 * Fiori Launchpad settings management fixture.
 *
 * @remarks
 * Provides access to FLP user settings, personalization, and theme
 * configuration for cross-app settings verification and modification.
 *
 * @example
 * ```typescript
 * import { flpSettingsTest } from 'playwright-praman';
 *
 * flpSettingsTest('check user settings', async ({ flpSettings }) => {
 *   const theme = await flpSettings.getTheme();
 *   expect(theme).toBeDefined();
 * });
 * ```
 */
export { flpSettingsTest } from './flp-settings-fixtures.js';
export type { FLPSettingsFixtures } from './flp-settings-fixtures.js';

/**
 * Test data management fixture for generating and cleaning up test data.
 *
 * @remarks
 * Provides `testData` fixture for creating, managing, and cleaning up
 * test data across SAP business objects with automatic teardown.
 *
 * @example
 * ```typescript
 * import { testDataTest } from 'playwright-praman';
 *
 * testDataTest('create test vendor', async ({ testData }) => {
 *   const vendor = await testData.create('vendor', { name: 'Test Vendor' });
 *   expect(vendor).toBeDefined();
 * });
 * ```
 */
export { testDataTest } from './test-data-fixtures.js';
export type { TestDataFixtures } from './test-data-fixtures.js';

/**
 * OData request tracing fixture for capturing and analyzing OData traffic.
 *
 * @remarks
 * Intercepts OData HTTP requests/responses during test execution and
 * attaches them as test artifacts for debugging and compliance reporting.
 *
 * @example
 * ```typescript
 * import { odataTraceTest } from 'playwright-praman';
 *
 * odataTraceTest('trace OData calls', async ({ page }) => {
 *   // OData tracing is auto-active when enabled in config
 *   await page.goto('/sap/opu/odata/sap/API_PURCHASE_ORDER_SRV');
 * });
 * ```
 */
export { odataTraceTest } from './odata-trace-fixtures.js';
export type { ODataTraceFixtures } from './odata-trace-fixtures.js';

/**
 * UI5 control tree capture fixture for automatic control registry serialization.
 *
 * @remarks
 * Auto-enabled fixture that serializes the UI5 control registry into a
 * hierarchical tree and attaches it as a Playwright test artifact on teardown.
 *
 * @example
 * ```typescript
 * import { controlTreeTest } from 'playwright-praman';
 *
 * controlTreeTest('page loads with tree capture', async ({ page }) => {
 *   // controlTreeCapture is auto-active
 * });
 * ```
 */
export { controlTreeTest } from './control-tree-fixtures.js';
export type { ControlTreeFixtures } from './control-tree-fixtures.js';

/**
 * Browser bind fixture for exposing Node.js functions to the browser context.
 *
 * @remarks
 * Uses `page.exposeBinding()` to make Node.js functions callable from
 * browser-side scripts, enabling bridge communication patterns.
 *
 * @example
 * ```typescript
 * import { browserBindTest } from 'playwright-praman';
 *
 * browserBindTest('bind node function', async ({ browserBind }) => {
 *   const result = await browserBind.bind('myFn', () => 'hello');
 *   expect(result.success).toBe(true);
 * });
 * ```
 */
export { browserBindTest } from './browser-bind-fixture.js';
export type {
  BrowserBindFixtures,
  BrowserBindResult,
  BrowserBindWorkerDeps,
} from './browser-bind-fixture.js';

/**
 * Screencast fixture for Playwright 1.59+ video recording with AI frame streaming.
 *
 * @remarks
 * Wraps `page.screencast` to provide structured video recording with chapters,
 * action annotations, UI5 control-tree overlays, and real-time frame streaming
 * for AI vision pipelines.
 *
 * @example
 * ```typescript
 * import { screencastTest } from 'playwright-praman';
 *
 * screencastTest('record workflow', async ({ screencast }) => {
 *   await screencast.showChapter('Navigate to PO list');
 *   await screencast.showActions({ position: 'bottom' });
 * });
 * ```
 */
export { screencastTest } from './screencast-fixture.js';
export type {
  ScreencastFixture,
  ScreencastFixtures,
  ScreencastFrame,
  ScreencastFrameHandler,
  ScreencastWorkerDeps,
} from './screencast-fixture.js';

/**
 * Web Storage fixture providing typed localStorage and sessionStorage access.
 *
 * @remarks
 * Wraps Playwright 1.61+ `page.localStorage` and `page.sessionStorage` APIs with
 * a typed helper interface. Feature-gated via `hasWebStorageAPI` — throws on
 * older Playwright versions. Available as `webStorage` in test fixtures.
 *
 * @example
 * ```typescript
 * import { webStorageTest } from 'playwright-praman';
 *
 * webStorageTest('seed localStorage', async ({ webStorage }) => {
 *   await webStorage.localStorage.seed({ theme: 'dark', lang: 'en' });
 * });
 * ```
 */
export { webStorageTest } from './web-storage-fixture.js';
export type { WebStorageFixture, WebStorageHelper } from './web-storage-fixture.js';

/**
 * Failure artifacts fixture for auto-capturing diagnostics on test failure.
 *
 * @remarks
 * Auto-enabled fixture that captures screenshot (PNG), UI5 control tree (JSON),
 * and page context (URL + title) when a test fails. Artifacts appear in the
 * Playwright HTML reporter and trace viewer.
 *
 * @example
 * ```typescript
 * import { failureArtifactsTest } from 'playwright-praman';
 *
 * failureArtifactsTest('auto-capture on failure', async ({ page }) => {
 *   // failureArtifactsCapture is auto-active on failure
 * });
 * ```
 */
export { failureArtifactsTest } from './failure-artifacts-fixture.js';
export type { FailureArtifactsFixtures } from './failure-artifacts-fixture.js';
