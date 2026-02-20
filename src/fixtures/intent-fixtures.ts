/**
 * Intent fixtures — provides `intent` fixture for SAP domain intent operations.
 *
 * @remarks
 * Extends `aiTest` with an `intent` fixture that provides typed wrappers around
 * all procurement and sales domain intent functions. Vocabulary domain preloads
 * for all 4 supported domains are fully awaited BEFORE `use()` is called, so
 * the fixture is ready to use immediately in the test body.
 *
 * Cross-fixture dependencies (`pramanConfig`, `ui5`, `ui5Navigation`) are
 * declared as `option` placeholders (PW-MERGE-1) and overridden by
 * `mergeTests()` in the fixture assembly.
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

/* eslint-disable @typescript-eslint/no-unsafe-argument -- Playwright fixture args have any types from test.extend */

import type { test as base } from '@playwright/test';

import type { IntentOptions, IntentResult } from '../intents/types.js';

import { aiTest } from './ai-fixtures.js';

// ── Public fixture type ─────────────────────────────────────────────────────

/**
 * The `intent` fixture object provided to intent-enabled Playwright tests.
 *
 * @remarks
 * Groups domain intent functions into `core`, `procurement`, and `sales`
 * namespaces. All functions delegate to the corresponding intent module
 * functions with `ui5`, `ui5Navigation`, and `vocabulary` pre-injected.
 *
 * @intent Provide typed SAP business intent operations to Playwright tests.
 * @capability intent-fixture, procurement, sales
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
    ) => Promise<IntentResult<boolean>>;
    /** Click the Confirm button and wait for the dialog to close. */
    confirmAndWait: (options?: IntentOptions) => Promise<IntentResult>;
    /** Wait for the page to complete a save operation. */
    waitForSave: (options?: IntentOptions) => Promise<IntentResult>;
  };

  /**
   * SAP Materials Management (MM) procurement intent operations.
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
}

/** Test fixture map for the intentTest extension. */
interface IntentTestFixtures {
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
 * @capability intent-fixture
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
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
export const intentTest = (aiTest as unknown as typeof base).extend<IntentTestFixtures>({
  intent: async ({ page }, use) => {
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
    ]);

    // Cast page to UI5HandlerSlice-compatible shape and nav to NavAPI-compatible
    const ui5 = page as never;
    const ui5Navigation = page as never;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- Playwright `use` is any-typed in fixture context
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
    });
  },
});
