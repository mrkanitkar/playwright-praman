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
