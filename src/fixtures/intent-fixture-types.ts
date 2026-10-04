/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Intent fixture type definitions for SAP domain intent operations.
 *
 * @remarks
 * Extracted from `intent-fixtures.ts` to stay within the 300-LOC guideline.
 * Contains the `IntentFixture` interface (9 domain namespaces),
 * `IntentTestFixtures`, and `IntentFixtureDeps` types.
 *
 * @module fixtures
 */

import type {
  AbsenceRequestData,
  AssetAcquisitionData,
  AssetRetirementData,
  AssetTransferData,
  CustomerMasterData,
  EmployeeData,
  GoodsMovementData,
  InspectionLotData,
  IntentOptions,
  IntentResult,
  JournalEntryData,
  MaterialMasterData,
  PaymentData,
  ProductionConfirmationData,
  ProductionOrderData,
  QualityNotificationData,
  ResultsRecordingData,
  TimeRecordingData,
  TransferOrderData,
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
 * `finance`, `manufacturing`, `masterData`, and optionally `quality`,
 * `warehouse`, `assetManagement`, and `hr` namespaces. All functions
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

  /**
   * SAP Quality Management (QM) intent operations (optional).
   *
   * @ai
   * @aiContext Use for inspection lots, results recording, and quality notifications.
   *
   * @example
   * ```typescript
   * await intent.quality?.createInspectionLot({ material: 'RAW-0001', plant: '1000' });
   * ```
   */
  quality?: {
    /** Create an inspection lot in QA01. */
    createInspectionLot: (
      input: InspectionLotData,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Record inspection results in QE01. */
    recordResults: (
      input: ResultsRecordingData,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Create a quality notification in QM01. */
    createQualityNotification: (
      input: QualityNotificationData,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
  };

  /**
   * SAP Warehouse Management (WM) intent operations (optional).
   *
   * @ai
   * @aiContext Use for goods movements and transfer orders.
   *
   * @example
   * ```typescript
   * await intent.warehouse?.createGoodsMovement({
   *   movementType: '101', plant: '1000', material: 'RAW-0001', quantity: 100,
   * });
   * ```
   */
  warehouse?: {
    /** Create a goods movement posting in MIGO. */
    createGoodsMovement: (
      input: GoodsMovementData,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Create a transfer order in LT01. */
    createTransferOrder: (
      input: TransferOrderData,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
  };

  /**
   * SAP Asset Management (FI-AA) intent operations (optional).
   *
   * @ai
   * @aiContext Use for asset acquisition, retirement, and transfer.
   *
   * @example
   * ```typescript
   * await intent.assetManagement?.acquireAsset({
   *   assetClass: '1000', description: 'Machine', acquisitionValue: 50000,
   *   capitalizationDate: '2026-04-01',
   * });
   * ```
   */
  assetManagement?: {
    /** Acquire a fixed asset in AS01/ABZON. */
    acquireAsset: (
      input: AssetAcquisitionData,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Retire a fixed asset in ABAVN. */
    retireAsset: (
      input: AssetRetirementData,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
    /** Transfer a fixed asset in ABUMN. */
    transferAsset: (
      input: AssetTransferData,
      options?: IntentOptions,
    ) => Promise<IntentResult>;
  };

  /**
   * SAP Human Resources (HR) intent operations (optional).
   *
   * @ai
   * @aiContext Use for employee creation, time recording, and absence requests.
   *
   * @example
   * ```typescript
   * await intent.hr?.createEmployee({
   *   firstName: 'Max', lastName: 'Mustermann', personnelArea: '1000',
   * });
   * ```
   */
  hr?: {
    /** Create an employee master record in PA30. */
    createEmployee: (input: EmployeeData, options?: IntentOptions) => Promise<IntentResult>;
    /** Record employee time in CAT2. */
    recordTime: (input: TimeRecordingData, options?: IntentOptions) => Promise<IntentResult>;
    /** Create an absence (leave) request in PA61. */
    requestAbsence: (input: AbsenceRequestData, options?: IntentOptions) => Promise<IntentResult>;
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

/**
 * Cross-fixture dependencies injected via PW-MERGE-1 option placeholders.
 *
 * @example
 * ```typescript
 * import type { IntentFixtureDeps } from '#fixtures/intent-fixture-types.js';
 * ```
 */
export interface IntentFixtureDeps {
  /** UI5Handler — overridden at runtime by mergeTests(). */
  ui5: UI5Handler;
  /** Navigation API — overridden at runtime by mergeTests(). */
  ui5Navigation: UI5NavigationAPI;
}
