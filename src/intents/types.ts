/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Intent module types — IntentResult envelope, IntentOptions, and SAP domain data shapes.
 *
 * @remarks
 * IntentResult is the standard return type for all intent domain functions.
 * It carries execution metadata alongside the typed payload.
 *
 * @module intents
 */

/**
 * Standard result envelope for all SAP intent domain operations.
 *
 * @typeParam T - Payload type for the `data` field (defaults to `void`).
 *
 * @intent Return a consistent result shape from every intent function.
 * @capability intent.core.fillField
 *
 * @example
 * ```typescript
 * import type { IntentResult } from '#intents/types.js';
 *
 * const result: IntentResult<string> = {
 *   status: 'success',
 *   data: 'PO-1000012345',
 *   metadata: {
 *     duration: 1234,
 *     retryable: false,
 *     suggestions: [],
 *     intentName: 'createPurchaseOrder',
 *     sapModule: 'MM',
 *     stepsExecuted: ['navigate', 'fillVendor', 'fillMaterial', 'save'],
 *   },
 * };
 * ```
 */
export interface IntentResult<T = void> {
  readonly status: 'success' | 'error' | 'partial';
  readonly data?: T;
  readonly error?: { readonly code: string; readonly message: string };
  readonly metadata: {
    readonly duration: number;
    readonly retryable: boolean;
    readonly suggestions: string[];
    readonly model?: string;
    readonly tokens?: number;
    readonly intentName: string;
    readonly sapModule: string;
    readonly stepsExecuted: string[];
  };
}

/**
 * Options controlling intent execution behaviour.
 *
 * @remarks
 * All fields are optional. When omitted, the intent function uses built-in defaults.
 *
 * @example
 * ```typescript
 * import type { IntentOptions } from '#intents/types.js';
 *
 * const opts: IntentOptions = { skipNavigation: true, timeout: 60_000 };
 * ```
 */
export interface IntentOptions {
  /** When `true`, skip FLP navigation and assume the correct app is already open. */
  skipNavigation?: boolean;
  /** Override the default interaction timeout (ms). */
  timeout?: number;
  /** When `true`, validate the operation result via an OData GET after save. */
  validateViaOData?: boolean;
  /** Override default app hash, save-button text, or field labels for a specific intent. */
  overrides?: IntentOverrides;
}

/**
 * Allows callers to override default FLP app hashes, button labels, and field names.
 *
 * @remarks
 * Use when the target SAP system customises the default Fiori app hash or
 * renames standard buttons / field labels.
 *
 * @example
 * ```typescript
 * import type { IntentOverrides } from '#intents/types.js';
 *
 * const overrides: IntentOverrides = {
 *   appId: 'ZCustomPO-create',
 *   saveButtonText: 'Submit',
 *   fields: { Vendor: 'Supplier' },
 * };
 * ```
 */
export interface IntentOverrides {
  /** Override the default FLP semantic-object hash (e.g. `'ZCustomPO-create'`). */
  appId?: string;
  /** Override the default save/post button label (e.g. `'Submit'`). */
  saveButtonText?: string;
  /** Override field labels: keys are default labels, values are replacement labels. */
  fields?: Record<string, string>;
}

// ── FI domain data shapes ──────────────────────────────────────────────────

/**
 * Input data for creating a journal entry (FI-GL).
 *
 * @sapModule FI
 * @businessContext General-ledger journal entry posting.
 *
 * @example
 * ```typescript
 * import type { JournalEntryData } from '#intents/types.js';
 *
 * const entry: JournalEntryData = {
 *   documentDate: '2026-02-20',
 *   postingDate: '2026-02-20',
 *   lineItems: [{ glAccount: '400000', debitCredit: 'S', amount: 1000 }],
 * };
 * ```
 */
export interface JournalEntryData {
  /** Document date in ISO 8601 format (YYYY-MM-DD). */
  readonly documentDate: string;
  /** Posting date in ISO 8601 format (YYYY-MM-DD). */
  readonly postingDate: string;
  /** Line items to include in the journal entry. */
  readonly lineItems: {
    readonly glAccount: string;
    readonly debitCredit: 'S' | 'H';
    readonly amount: number;
    readonly costCenter?: string;
  }[];
}

/**
 * Input data for posting a vendor invoice (FI-AP).
 *
 * @sapModule FI
 * @businessContext Accounts-payable vendor invoice posting.
 *
 * @example
 * ```typescript
 * import type { VendorInvoiceData } from '#intents/types.js';
 *
 * const inv: VendorInvoiceData = {
 *   vendor: '100001',
 *   invoiceDate: '2026-02-20',
 *   amount: 5000,
 *   currency: 'EUR',
 * };
 * ```
 */
export interface VendorInvoiceData {
  /** SAP vendor number. */
  readonly vendor: string;
  /** Invoice date in ISO 8601 format (YYYY-MM-DD). */
  readonly invoiceDate: string;
  /** Invoice amount (gross). */
  readonly amount: number;
  /** ISO 4217 currency code (defaults to company-code currency). */
  readonly currency?: string;
  /** Reference purchase order number. */
  readonly poNumber?: string;
}

/**
 * Input data for processing a vendor payment (FI-AP).
 *
 * @sapModule FI
 * @businessContext Accounts-payable outgoing payment processing.
 *
 * @example
 * ```typescript
 * import type { PaymentData } from '#intents/types.js';
 *
 * const pmt: PaymentData = { vendor: '100001', amount: 5000, paymentDate: '2026-02-28' };
 * ```
 */
export interface PaymentData {
  /** SAP vendor number. */
  readonly vendor: string;
  /** Payment amount. */
  readonly amount: number;
  /** Payment date in ISO 8601 format (YYYY-MM-DD). */
  readonly paymentDate: string;
  /** ISO 4217 currency code. */
  readonly currency?: string;
}

// ── PP domain data shapes ──────────────────────────────────────────────────

/**
 * Input data for creating a production order (PP-SFC).
 *
 * @sapModule PP
 * @businessContext Production planning — shop-floor order creation.
 *
 * @example
 * ```typescript
 * import type { ProductionOrderData } from '#intents/types.js';
 *
 * const order: ProductionOrderData = {
 *   material: 'FG-1000',
 *   plant: '1000',
 *   quantity: 50,
 * };
 * ```
 */
export interface ProductionOrderData {
  /** Material number to produce. */
  readonly material: string;
  /** Production plant code. */
  readonly plant: string;
  /** Order quantity (base unit of measure). */
  readonly quantity: number;
  /** Scheduled start date in ISO 8601 format (YYYY-MM-DD). */
  readonly scheduledStart?: string;
}

/**
 * Input data for confirming a production order operation (PP-SFC).
 *
 * @sapModule PP
 * @businessContext Production order operation confirmation (goods produced).
 *
 * @example
 * ```typescript
 * import type { ProductionConfirmationData } from '#intents/types.js';
 *
 * const conf: ProductionConfirmationData = { orderNumber: '1000012', quantity: 50 };
 * ```
 */
export interface ProductionConfirmationData {
  /** Production order number. */
  readonly orderNumber: string;
  /** Confirmed quantity. */
  readonly quantity: number;
  /** Operation number within the order (routing step). */
  readonly operationNumber?: string;
}

// ── MD domain data shapes ──────────────────────────────────────────────────

/**
 * Input data for creating a vendor master record (MM-MK / LO-MD).
 *
 * @sapModule MD
 * @businessContext Vendor master data creation.
 *
 * @example
 * ```typescript
 * import type { VendorMasterData } from '#intents/types.js';
 *
 * const vendor: VendorMasterData = { name: 'Acme GmbH', country: 'DE' };
 * ```
 */
export interface VendorMasterData {
  /** Vendor company name. */
  readonly name: string;
  /** ISO 3166-1 alpha-2 country code. */
  readonly country: string;
  /** Tax identification number. */
  readonly taxId?: string;
  /** SAP account group for the vendor. */
  readonly accountGroup?: string;
}

/**
 * Input data for creating a customer master record (SD-MD / LO-MD).
 *
 * @sapModule MD
 * @businessContext Customer master data creation.
 *
 * @example
 * ```typescript
 * import type { CustomerMasterData } from '#intents/types.js';
 *
 * const customer: CustomerMasterData = {
 *   name: 'Globex Corp',
 *   country: 'US',
 *   salesOrganization: '1000',
 * };
 * ```
 */
export interface CustomerMasterData {
  /** Customer company name. */
  readonly name: string;
  /** ISO 3166-1 alpha-2 country code. */
  readonly country: string;
  /** SAP sales organization code. */
  readonly salesOrganization?: string;
  /** Tax identification number. */
  readonly taxId?: string;
}

/**
 * Input data for creating a material master record (MM-MM / LO-MD).
 *
 * @sapModule MD
 * @businessContext Material master data creation.
 *
 * @example
 * ```typescript
 * import type { MaterialMasterData } from '#intents/types.js';
 *
 * const mat: MaterialMasterData = {
 *   materialNumber: 'RAW-0001',
 *   description: 'Raw material A',
 *   materialType: 'ROH',
 *   baseUnit: 'KG',
 * };
 * ```
 */
export interface MaterialMasterData {
  /** SAP material number. */
  readonly materialNumber: string;
  /** Short description of the material. */
  readonly description: string;
  /** SAP material type (e.g. `'FERT'`, `'ROH'`, `'HALB'`). */
  readonly materialType?: string;
  /** Base unit of measure (e.g. `'EA'`, `'KG'`, `'L'`). */
  readonly baseUnit?: string;
}

// ── QM domain data shapes ──────────────────────────────────────────────────

/**
 * Input data for creating an inspection lot (QM-IM).
 *
 * @sapModule QM
 * @businessContext Quality inspection lot creation.
 *
 * @example
 * ```typescript
 * import type { InspectionLotData } from '#intents/types.js';
 *
 * const lot: InspectionLotData = { material: 'RAW-0001', plant: '1000' };
 * ```
 */
export interface InspectionLotData {
  /** Material number to inspect. */
  readonly material: string;
  /** Plant where inspection occurs. */
  readonly plant: string;
  /** Inspection type code (e.g. `'01'` goods receipt, `'08'` stock transfer). */
  readonly inspectionType?: string;
  /** Lot quantity in base unit of measure. */
  readonly lotQuantity?: string;
}

/**
 * Input data for recording inspection results (QM-IM).
 *
 * @sapModule QM
 * @businessContext Inspection results recording against a lot.
 *
 * @example
 * ```typescript
 * import type { ResultsRecordingData } from '#intents/types.js';
 *
 * const rec: ResultsRecordingData = { inspectionLot: '000012345678', result: '10.5' };
 * ```
 */
export interface ResultsRecordingData {
  /** Inspection lot number. */
  readonly inspectionLot: string;
  /** Inspection characteristic name. */
  readonly characteristic?: string;
  /** Measured or observed result value. */
  readonly result?: string;
}

/**
 * Input data for creating a quality notification (QM-QN).
 *
 * @sapModule QM
 * @businessContext Quality notification creation for defects/complaints.
 *
 * @example
 * ```typescript
 * import type { QualityNotificationData } from '#intents/types.js';
 *
 * const qn: QualityNotificationData = {
 *   notificationType: 'Q1',
 *   description: 'Surface defect on batch 2026-03',
 * };
 * ```
 */
export interface QualityNotificationData {
  /** SAP notification type code (e.g. `'Q1'` customer, `'Q2'` vendor, `'Q3'` internal). */
  readonly notificationType: string;
  /** Material number related to the notification. */
  readonly material?: string;
  /** Short description of the quality issue. */
  readonly description: string;
  /** Priority code (e.g. `'1'` high, `'2'` medium, `'3'` low). */
  readonly priority?: string;
}

// ── WM domain data shapes ──────────────────────────────────────────────────

/**
 * Input data for creating a goods movement (WM-GR / MIGO).
 *
 * @sapModule WM
 * @businessContext Warehouse goods movement (receipt, issue, transfer posting).
 *
 * @example
 * ```typescript
 * import type { GoodsMovementData } from '#intents/types.js';
 *
 * const gm: GoodsMovementData = {
 *   movementType: '101',
 *   plant: '1000',
 *   material: 'RAW-0001',
 *   quantity: 100,
 * };
 * ```
 */
export interface GoodsMovementData {
  /** SAP movement type code (e.g. `'101'` GR, `'201'` GI, `'301'` transfer). */
  readonly movementType: string;
  /** Plant code for the movement. */
  readonly plant: string;
  /** Material number. */
  readonly material: string;
  /** Movement quantity in base unit of measure. */
  readonly quantity: number;
  /** Storage location (optional). */
  readonly storageLocation?: string;
}

/**
 * Input data for creating a transfer order (WM-TO / EWM).
 *
 * @sapModule WM
 * @businessContext Warehouse transfer order for bin-to-bin movement.
 *
 * @example
 * ```typescript
 * import type { TransferOrderData } from '#intents/types.js';
 *
 * const to: TransferOrderData = {
 *   warehouseNumber: '100',
 *   material: 'FG-1000',
 *   quantity: 25,
 * };
 * ```
 */
export interface TransferOrderData {
  /** Warehouse number. */
  readonly warehouseNumber: string;
  /** Material number to transfer. */
  readonly material: string;
  /** Transfer quantity. */
  readonly quantity: number;
  /** Source storage bin. */
  readonly sourceStorageBin?: string;
  /** Destination storage bin. */
  readonly destStorageBin?: string;
}

// ── AM domain data shapes ──────────────────────────────────────────────────

/**
 * Input data for acquiring a fixed asset (FI-AA).
 *
 * @sapModule AM
 * @businessContext Fixed asset acquisition posting.
 *
 * @example
 * ```typescript
 * import type { AssetAcquisitionData } from '#intents/types.js';
 *
 * const acq: AssetAcquisitionData = {
 *   assetClass: '1000',
 *   description: 'CNC Milling Machine',
 *   acquisitionValue: 150_000,
 *   capitalizationDate: '2026-04-01',
 * };
 * ```
 */
export interface AssetAcquisitionData {
  /** Asset class code. */
  readonly assetClass: string;
  /** Short description of the asset. */
  readonly description: string;
  /** Acquisition value in company-code currency. */
  readonly acquisitionValue: number;
  /** Capitalization date in ISO 8601 format (YYYY-MM-DD). */
  readonly capitalizationDate: string;
  /** Cost center to charge (optional). */
  readonly costCenter?: string;
}

/**
 * Input data for retiring a fixed asset (FI-AA).
 *
 * @sapModule AM
 * @businessContext Fixed asset retirement (scrapping or sale).
 *
 * @example
 * ```typescript
 * import type { AssetRetirementData } from '#intents/types.js';
 *
 * const ret: AssetRetirementData = {
 *   assetNumber: '000000001000',
 *   retirementDate: '2026-06-30',
 * };
 * ```
 */
export interface AssetRetirementData {
  /** SAP asset main number. */
  readonly assetNumber: string;
  /** Retirement date in ISO 8601 format (YYYY-MM-DD). */
  readonly retirementDate: string;
  /** Revenue from sale (zero for scrapping). */
  readonly revenue?: number;
}

/**
 * Input data for transferring a fixed asset (FI-AA).
 *
 * @sapModule AM
 * @businessContext Fixed asset inter-company or intra-company transfer.
 *
 * @example
 * ```typescript
 * import type { AssetTransferData } from '#intents/types.js';
 *
 * const xfr: AssetTransferData = {
 *   sourceAsset: '000000001000',
 *   targetAsset: '000000002000',
 *   transferDate: '2026-07-01',
 * };
 * ```
 */
export interface AssetTransferData {
  /** Source asset main number. */
  readonly sourceAsset: string;
  /** Target asset main number. */
  readonly targetAsset: string;
  /** Transfer date in ISO 8601 format (YYYY-MM-DD). */
  readonly transferDate: string;
  /** Partial transfer amount (omit for full transfer). */
  readonly amount?: number;
}

// ── HR domain data shapes ──────────────────────────────────────────────────

/**
 * Input data for creating an employee master record (PA).
 *
 * @sapModule HR
 * @businessContext HR personnel master — employee creation.
 *
 * @example
 * ```typescript
 * import type { EmployeeData } from '#intents/types.js';
 *
 * const emp: EmployeeData = {
 *   firstName: 'Max',
 *   lastName: 'Mustermann',
 *   personnelArea: '1000',
 * };
 * ```
 */
export interface EmployeeData {
  /** Employee first name. */
  readonly firstName: string;
  /** Employee last name. */
  readonly lastName: string;
  /** SAP personnel area code. */
  readonly personnelArea: string;
  /** Employee group code (optional). */
  readonly employeeGroup?: string;
}

/**
 * Input data for recording employee time (PT).
 *
 * @sapModule HR
 * @businessContext Time management — recording work time.
 *
 * @example
 * ```typescript
 * import type { TimeRecordingData } from '#intents/types.js';
 *
 * const time: TimeRecordingData = {
 *   employeeId: '00001234',
 *   date: '2026-04-15',
 *   hours: 8,
 * };
 * ```
 */
export interface TimeRecordingData {
  /** SAP personnel number. */
  readonly employeeId: string;
  /** Work date in ISO 8601 format (YYYY-MM-DD). */
  readonly date: string;
  /** Hours worked. */
  readonly hours: number;
  /** Attendance/absence type code (optional). */
  readonly attendanceType?: string;
}

/**
 * Input data for creating an absence (leave) request (PT).
 *
 * @sapModule HR
 * @businessContext Time management — absence/leave request.
 *
 * @example
 * ```typescript
 * import type { AbsenceRequestData } from '#intents/types.js';
 *
 * const leave: AbsenceRequestData = {
 *   employeeId: '00001234',
 *   absenceType: '0100',
 *   startDate: '2026-05-01',
 *   endDate: '2026-05-05',
 * };
 * ```
 */
export interface AbsenceRequestData {
  /** SAP personnel number. */
  readonly employeeId: string;
  /** Absence type code (e.g. `'0100'` vacation, `'0200'` sick leave). */
  readonly absenceType: string;
  /** Start date in ISO 8601 format (YYYY-MM-DD). */
  readonly startDate: string;
  /** End date in ISO 8601 format (YYYY-MM-DD). */
  readonly endDate: string;
}
