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
 * for all 4 supported domains are fully awaited BEFORE `use()` is called, so
 * the fixture is ready to use immediately in the test body.
 *
 * Cross-fixture dependencies (`ui5`, `ui5Navigation`) are declared as `option`
 * placeholders (PW-MERGE-1) and overridden by `mergeTests()` in the fixture
 * assembly. This ensures intent functions receive the properly-initialized
 * UI5Handler and UI5NavigationAPI, not a raw Playwright Page.
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

import type {
  CustomerMasterData,
  IntentOptions,
  IntentResult,
  JournalEntryData,
  MaterialMasterData,
  PaymentData,
  ProductionConfirmationData,
  ProductionOrderData,
  VendorInvoiceData,
  VendorMasterData,
} from '../intents/types.js';

import type { UI5NavigationAPI } from './nav-fixtures.js';
import type { UI5Handler } from './ui5-handler.js';

// ── Public fixture type ─────────────────────────────────────────────────────

/**
 * The `intent` fixture object provided to intent-enabled Playwright tests.
 *
 * @ai
 * @aiContext Use to execute SAP business operations (PO, SO, invoices, etc.).
 *
 * @remarks
 * Groups domain intent functions into `core`, `procurement`, `sales`,
 * `finance`, `manufacturing`, and `masterData` namespaces. All functions
 * delegate to the corresponding intent module functions with `ui5`,
 * `ui5Navigation`, and `vocabulary` pre-injected.
 *
 * @intent Provide typed SAP business intent operations to Playwright tests.
 * @capability intent.core.fillField
 *
 * @example
 * ```typescript
 * intentTest('search POs', async ({ intent }) => {
 *   await intent.procurement.searchPurchaseOrders({ Vendor: '100001' });
 * });
 * ```
 */
export interface IntentFixture {
  /**
   * Core intent wrappers for low-level SAP field interactions.
   *
   * @ai
   * @aiContext Use for low-level field fill, button click, and assertions.
   *
   * @example
   * ```typescript
   * await intent.core.fillField('Vendor', '100001');
   * await intent.core.clickButton('Save');
   * ```
   */
  core: {
    /** Fill a labeled form field using vocabulary resolution. */
    fillField: (label: string, value: string, options?: IntentOptions) => Promise<IntentResult>;
    /** Click a button by its text label. */
    clickButton: (text: string, options?: IntentOptions) => Promise<IntentResult>;
    /** Select an option from a labeled select or combo box. */
    selectOption: (label: string, option: string, options?: IntentOptions) => Promise<IntentResult>;
    /** Assert the current value of a labeled field. */
    assertField: (
      label: string,
      expected: string,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Click the Confirm button and wait for the dialog to close. */
    confirmAndWait: (options?: IntentOptions) => Promise<IntentResult>;
    /** Wait for the page to complete a save operation. */
    waitForSave: (options?: IntentOptions) => Promise<IntentResult>;
  };

  /**
   * SAP Materials Management (MM) procurement intent operations.
   *
   * @ai
   * @aiContext Use for purchase orders, requisitions, and goods receipt.
   *
   * @example
   * ```typescript
   * await intent.procurement.createPurchaseOrder(
   *   { vendor: '100001', material: 'MAT-001', quantity: 10, plant: '1000' },
   * );
   * ```
   */
  procurement: {
    /** Create a purchase order in ME21N. */
    createPurchaseOrder: (
      input: {
        readonly vendor: string;
        readonly material: string;
        readonly quantity: number;
        readonly plant: string;
      },
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Approve a purchase order by PO number. */
    approvePurchaseOrder: (
      input: { readonly poNumber: string },
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Search purchase orders with filter criteria. */
    searchPurchaseOrders: (
      criteria: Readonly<Record<string, string>>,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Create a purchase requisition in ME51N. */
    createPurchaseRequisition: (
      input: { readonly material: string; readonly quantity: number; readonly plant: string },
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Confirm goods receipt for a purchase order (MIGO). */
    confirmGoodsReceipt: (
      input: { readonly poNumber: string; readonly quantity: number },
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Search vendor master records. */
    searchVendors: (options?: IntentOptions) => Promise<IntentResult>;
  };

  /**
   * SAP Sales & Distribution (SD) intent operations.
   *
   * @ai
   * @aiContext Use for sales orders, quotations, and delivery status.
   *
   * @example
   * ```typescript
   * await intent.sales.createSalesOrder({
   *   customer: '200001',
   *   material: 'FG-1000',
   *   quantity: 5,
   *   salesOrganization: '1000',
   * });
   * ```
   */
  sales: {
    /** Create a sales order in VA01. */
    createSalesOrder: (
      input: {
        readonly customer: string;
        readonly material: string;
        readonly quantity: number;
        readonly salesOrganization: string;
      },
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Create a quotation in VA21. */
    createQuotation: (
      input: { readonly customer: string; readonly material: string; readonly quantity: number },
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Approve a quotation by quotation number. */
    approveQuotation: (
      input: { readonly quotationNumber: string },
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Search sales orders with filter criteria. */
    searchSalesOrders: (
      criteria: Readonly<Record<string, string>>,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Search customer master records. */
    searchCustomers: (options?: IntentOptions) => Promise<IntentResult>;
    /** Check delivery status for a sales order. */
    checkDeliveryStatus: (
      input: { readonly salesOrderNumber: string },
      options?: IntentOptions,
    ) => Promise<IntentResult<string>>;
  };

  /**
   * SAP Financial Accounting (FI) intent operations.
   *
   * @ai
   * @aiContext Use for journal entries, vendor invoices, and payments.
   *
   * @example
   * ```typescript
   * await intent.finance.createJournalEntry({
   *   documentDate: '2026-02-20',
   *   postingDate: '2026-02-20',
   *   lineItems: [{ glAccount: '400000', debitCredit: 'S', amount: 1000 }],
   * });
   * ```
   */
  finance: {
    /** Create a journal entry in FB50. */
    createJournalEntry: (input: JournalEntryData, options?: IntentOptions) => Promise<IntentResult>;
    /** Post a vendor invoice in FB60. */
    postVendorInvoice: (input: VendorInvoiceData, options?: IntentOptions) => Promise<IntentResult>;
    /** Process a vendor payment in F-53. */
    processPayment: (input: PaymentData, options?: IntentOptions) => Promise<IntentResult>;
  };

  /**
   * SAP Production Planning (PP) manufacturing intent operations.
   *
   * @ai
   * @aiContext Use for production orders and confirmations.
   *
   * @example
   * ```typescript
   * await intent.manufacturing.createProductionOrder({
   *   material: 'FG-1000', plant: '1000', quantity: 50,
   * });
   * ```
   */
  manufacturing: {
    /** Create a production order in CO01. */
    createProductionOrder: (
      input: ProductionOrderData,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Confirm a production order operation in CO11N. */
    confirmProductionOrder: (
      input: ProductionConfirmationData,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
  };

  /**
   * SAP Master Data (MD) intent operations — cross-module.
   *
   * @ai
   * @aiContext Use to create vendor, customer, or material master records.
   *
   * @example
   * ```typescript
   * await intent.masterData.createVendorMaster({ name: 'Acme GmbH', country: 'DE' });
   * ```
   */
  masterData: {
    /** Create a vendor master record in XK01/BP. */
    createVendorMaster: (input: VendorMasterData, options?: IntentOptions) => Promise<IntentResult>;
    /** Create a customer master record in XD01/BP. */
    createCustomerMaster: (
      input: CustomerMasterData,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Create a material master record in MM01. */
    createMaterialMaster: (
      input: MaterialMasterData,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
  };
}

/**
 * Test fixture map for the intentTest extension.
 *
 * @example
 * ```typescript
 * test('uses intents', async ({ intent }) => {
 *   await intent.core.fillField('Name', 'Test');
 * });
 * ```
 */
export interface IntentTestFixtures {
  /** SAP business intent operations. */
  intent: IntentFixture;
}

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

/**
 * Cross-fixture dependencies injected via PW-MERGE-1 option placeholders.
 *
 * @example
 * ```typescript
 * import type { IntentFixtureDeps } from '#fixtures/intent-fixtures.js';
 * ```
 */
export interface IntentFixtureDeps {
  /** UI5Handler — overridden at runtime by mergeTests(). */
  ui5: UI5Handler;
  /** Navigation API — overridden at runtime by mergeTests(). */
  ui5Navigation: UI5NavigationAPI;
}

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
    ]);

    await use({
      core: {
        // fillField, clickButton, selectOption, assertField, confirmAndWait do not
        // accept IntentOptions — trailing optional params are simply omitted.
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
    });
  },
});
