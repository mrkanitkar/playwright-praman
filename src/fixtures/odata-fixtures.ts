/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Standalone OData fixture — top-level `odata` without the full `ui5` handler.
 *
 * @remarks
 * Provides a lightweight Playwright fixture that exposes OData model-level
 * and HTTP-level operations directly as `odata`, bypassing the full
 * `moduleTest` fixture chain. Useful for focused OData integration tests
 * that do not need the UI5 control proxy.
 *
 * The fixture delegates to {@link createODataFixture} from `module-fixtures`,
 * reusing the same implementation that powers `ui5.odata`.
 *
 * @example
 * ```typescript
 * import { odataTest } from 'playwright-praman';
 *
 * odataTest('read purchase orders', async ({ odata }) => {
 *   const data = await odata.getModelData('/PurchaseOrders');
 *   expect(data).toBeDefined();
 * });
 * ```
 *
 * @module fixtures/odata-fixtures
 */

import { test as base } from '@playwright/test';

import { createODataFixture } from './module-fixtures.js';

// ── Fixture interface ─────────────────────────────────────────────────

/**
 * Standalone OData fixture interface.
 *
 * @capability odata.fixture
 *
 * @example
 * ```typescript
 * import { odataTest } from 'playwright-praman';
 *
 * odataTest('query entities', async ({ odata }) => {
 *   const count = await odata.getEntityCount('/Products/$count');
 * });
 * ```
 */
export interface ODataFixtures {
  odata: ReturnType<typeof createODataFixture>;
}

// ── Fixture extension ─────────────────────────────────────────────────

/**
 * Standalone OData test object for focused OData testing.
 *
 * @remarks
 * Extends Playwright's base `test` with a top-level `odata` fixture.
 * The `odata` fixture name does not collide with `moduleTest`, which
 * declares only `ui5` as its fixture key — `odata` is attached as a
 * sub-property of `ui5` via `Object.assign`, not as a Playwright fixture.
 *
 * @capability odata.fixture
 *
 * @example
 * ```typescript
 * import { odataTest } from 'playwright-praman';
 *
 * odataTest('fetch CSRF token', async ({ odata }) => {
 *   const { token } = await odata.fetchCSRFToken('/sap/opu/odata/sap/SVC/');
 * });
 * ```
 */
export const odataTest = base.extend<ODataFixtures>({
  odata: async ({ page }, use) => {
    await use(createODataFixture(page));
  },
});
