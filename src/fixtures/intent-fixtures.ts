/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Intent fixtures — provides `intent` fixture for SAP domain intent operations.
 *
 * @remarks
 * Extends `aiTest` with an `intent` fixture that provides typed wrappers around
 * all procurement and sales domain intent functions. Vocabulary domain preloads
 * for all 8 supported domains are fully awaited BEFORE `use()` is called, so
 * the fixture is ready to use immediately in the test body.
 *
 * Cross-fixture dependencies (`ui5`, `ui5Navigation`) are declared as `option`
 * placeholders (PW-MERGE-1) and overridden by `mergeTests()` in the fixture
 * assembly. This ensures intent functions receive the properly-initialized
 * UI5Handler and UI5NavigationAPI, not a raw Playwright Page.
 *
 * Type definitions for {@link IntentFixture}, {@link IntentTestFixtures}, and
 * {@link IntentFixtureDeps} are in `intent-fixture-types.ts` to stay within the
 * 300-LOC guideline.
 *
 * @example
 * ```typescript
 * import { intentTest } from 'playwright-praman';
 *
 * intentTest('create purchase order', async ({ intent }) => {
 *   const result = await intent.procurement.createPurchaseOrder(
 *     { vendor: '100001', material: 'MAT-001', quantity: 10, plant: '1000' },
 *   );
 *   expect(result.status).toBe('success');
 * });
 * ```
 *
 * @module fixtures
 */

import { test as base } from '@playwright/test';

import type { IntentFixtureDeps, IntentTestFixtures } from './intent-fixture-types.js';

export type { IntentFixture, IntentFixtureDeps, IntentTestFixtures } from './intent-fixture-types.js';

// ── Fixture definition ──────────────────────────────────────────────────────

/**
 * Playwright test object extended with the `intent` fixture.
 *
 * @remarks
 * Extends `aiTest` so all AI fixtures are also available. Dynamic imports for
 * `#intents/index.js` and `#vocabulary/index.js` ensure optional dependencies
 * are only loaded when intent testing is actually used.
 *
 * Vocabulary domain preloads run in parallel with `Promise.all()` and are
 * fully awaited BEFORE `use()` — the test body can call intent methods
 * immediately without a separate setup step.
 *
 * @intent Provide typed SAP business intent operations to Playwright tests
 * @capability intent.core.fillField
 *
 * @example
 * ```typescript
 * import { intentTest } from 'playwright-praman';
 *
 * intentTest('create PO', async ({ intent }) => {
 *   const result = await intent.procurement.createPurchaseOrder(
 *     { vendor: '100001', material: 'MAT-001', quantity: 10, plant: '1000' },
 *   );
 * });
 * ```
 */
export const intentTest = base.extend<IntentTestFixtures & IntentFixtureDeps>({
  // ── Cross-fixture option placeholders (PW-MERGE-1) ──────────────────────
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- PW-MERGE-1: placeholder overridden by mergeTests
  ui5: [undefined!, { option: true }],
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- PW-MERGE-1: placeholder overridden by mergeTests
  ui5Navigation: [undefined!, { option: true }],

  intent: async ({ ui5, ui5Navigation }, use) => {
    const [intentModule, vocabModule] = await Promise.all([
      import('#intents/index.js'),
      import('#vocabulary/index.js'),
    ]);

    const vocabulary = vocabModule.createVocabularyService();

    // MUST be fully awaited BEFORE use() — fix B10
    await Promise.all([
      vocabulary.loadDomain('procurement'),
      vocabulary.loadDomain('sales'),
      vocabulary.loadDomain('finance'),
      vocabulary.loadDomain('manufacturing'),
      // masterData terms are spread across procurement/sales/finance domains
      vocabulary.loadDomain('quality'),
      vocabulary.loadDomain('warehouse'),
      vocabulary.loadDomain('asset-management'),
      vocabulary.loadDomain('hr'),
    ]);

    await use({
      core: {
        fillField: async (label, value) => intentModule.fillField(ui5, vocabulary, label, value),
        clickButton: async (text) => intentModule.clickButton(ui5, text),
        selectOption: async (label, option) =>
          intentModule.selectOption(ui5, vocabulary, label, option),
        assertField: async (label, expected) =>
          intentModule.assertField(ui5, vocabulary, label, expected),
        confirmAndWait: async () => intentModule.confirmAndWait(ui5),
        waitForSave: async (opts) => intentModule.waitForSave(ui5, opts),
      },
      procurement: {
        createPurchaseOrder: async (input, opts) =>
          intentModule.procurement.createPurchaseOrder(ui5, ui5Navigation, vocabulary, input, opts),
        approvePurchaseOrder: async (input, opts) =>
          intentModule.procurement.approvePurchaseOrder(ui5, ui5Navigation, input, opts),
        searchPurchaseOrders: async (criteria, opts) =>
          intentModule.procurement.searchPurchaseOrders(
            ui5,
            ui5Navigation,
            vocabulary,
            criteria,
            opts,
          ),
        createPurchaseRequisition: async (input, opts) =>
          intentModule.procurement.createPurchaseRequisition(
            ui5,
            ui5Navigation,
            vocabulary,
            input,
            opts,
          ),
        confirmGoodsReceipt: async (input, opts) =>
          intentModule.procurement.confirmGoodsReceipt(ui5, ui5Navigation, input, opts),
        searchVendors: async (opts) =>
          intentModule.procurement.searchVendors(ui5, ui5Navigation, opts),
      },
      sales: {
        createSalesOrder: async (input, opts) =>
          intentModule.sales.createSalesOrder(ui5, ui5Navigation, vocabulary, input, opts),
        createQuotation: async (input, opts) =>
          intentModule.sales.createQuotation(ui5, ui5Navigation, vocabulary, input, opts),
        approveQuotation: async (input, opts) =>
          intentModule.sales.approveQuotation(ui5, ui5Navigation, input, opts),
        searchSalesOrders: async (criteria, opts) =>
          intentModule.sales.searchSalesOrders(ui5, ui5Navigation, vocabulary, criteria, opts),
        searchCustomers: async (opts) =>
          intentModule.sales.searchCustomers(ui5, ui5Navigation, opts),
        checkDeliveryStatus: async (input, opts) =>
          intentModule.sales.checkDeliveryStatus(ui5, ui5Navigation, input, opts),
      },
      finance: {
        createJournalEntry: async (input, opts) =>
          intentModule.finance.createJournalEntry(ui5, ui5Navigation, vocabulary, input, opts),
        postVendorInvoice: async (input, opts) =>
          intentModule.finance.postVendorInvoice(ui5, ui5Navigation, vocabulary, input, opts),
        processPayment: async (input, opts) =>
          intentModule.finance.processPayment(ui5, ui5Navigation, vocabulary, input, opts),
      },
      manufacturing: {
        createProductionOrder: async (input, opts) =>
          intentModule.manufacturing.createProductionOrder(
            ui5,
            ui5Navigation,
            vocabulary,
            input,
            opts,
          ),
        confirmProductionOrder: async (input, opts) =>
          intentModule.manufacturing.confirmProductionOrder(
            ui5,
            ui5Navigation,
            vocabulary,
            input,
            opts,
          ),
      },
      masterData: {
        createVendorMaster: async (input, opts) =>
          intentModule.masterData.createVendorMaster(ui5, ui5Navigation, vocabulary, input, opts),
        createCustomerMaster: async (input, opts) =>
          intentModule.masterData.createCustomerMaster(ui5, ui5Navigation, vocabulary, input, opts),
        createMaterialMaster: async (input, opts) =>
          intentModule.masterData.createMaterialMaster(ui5, ui5Navigation, vocabulary, input, opts),
      },
      quality: {
        createInspectionLot: async (input, opts) =>
          intentModule.quality.createInspectionLot(ui5, ui5Navigation, vocabulary, input, opts),
        recordResults: async (input, opts) =>
          intentModule.quality.recordResults(ui5, ui5Navigation, vocabulary, input, opts),
        createQualityNotification: async (input, opts) =>
          intentModule.quality.createQualityNotification(
            ui5,
            ui5Navigation,
            vocabulary,
            input,
            opts,
          ),
      },
      warehouse: {
        createGoodsMovement: async (input, opts) =>
          intentModule.warehouse.createGoodsMovement(ui5, ui5Navigation, vocabulary, input, opts),
        createTransferOrder: async (input, opts) =>
          intentModule.warehouse.createTransferOrder(ui5, ui5Navigation, vocabulary, input, opts),
      },
      assetManagement: {
        acquireAsset: async (input, opts) =>
          intentModule.assetManagement.acquireAsset(ui5, ui5Navigation, vocabulary, input, opts),
        retireAsset: async (input, opts) =>
          intentModule.assetManagement.retireAsset(ui5, ui5Navigation, vocabulary, input, opts),
        transferAsset: async (input, opts) =>
          intentModule.assetManagement.transferAsset(ui5, ui5Navigation, vocabulary, input, opts),
      },
      hr: {
        createEmployee: async (input, opts) =>
          intentModule.hr.createEmployee(ui5, ui5Navigation, vocabulary, input, opts),
        recordTime: async (input, opts) =>
          intentModule.hr.recordTime(ui5, ui5Navigation, vocabulary, input, opts),
        requestAbsence: async (input, opts) =>
          intentModule.hr.requestAbsence(ui5, ui5Navigation, vocabulary, input, opts),
      },
    });
  },
});
