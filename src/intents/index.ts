/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Intents module barrel — re-exports all public types, core wrappers, and SAP domain namespaces.
 *
 * @remarks
 * Sub-path export: `playwright-praman/intents`
 *
 * Domain namespaces:
 * - `procurement` — MM (Materials Management)
 * - `sales` — SD (Sales & Distribution)
 * - `finance` — FI (Financial Accounting)
 * - `manufacturing` — PP (Production Planning)
 * - `masterData` — MD (cross-module master data)
 * - `quality` — QM (Quality Management)
 * - `warehouse` — WM (Warehouse Management)
 * - `assetManagement` — AM (Asset Accounting / FI-AA)
 * - `hr` — HR (Human Capital Management)
 *
 * @module intents
 */

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  IntentResult,
  IntentOptions,
  IntentOverrides,
  JournalEntryData,
  VendorInvoiceData,
  PaymentData,
  ProductionOrderData,
  ProductionConfirmationData,
  VendorMasterData,
  CustomerMasterData,
  MaterialMasterData,
  InspectionLotData,
  ResultsRecordingData,
  QualityNotificationData,
  GoodsMovementData,
  TransferOrderData,
  AssetAcquisitionData,
  AssetRetirementData,
  AssetTransferData,
  EmployeeData,
  TimeRecordingData,
  AbsenceRequestData,
} from './types.js';

// ── Core wrappers ────────────────────────────────────────────────────────────
export type { UI5HandlerSlice, VocabLookup } from './core-wrappers.js';
export {
  fillField,
  clickButton,
  selectOption,
  assertField,
  navigateAndSearch,
  confirmAndWait,
  waitForSave,
} from './core-wrappers.js';

// ── SAP domain namespaces ────────────────────────────────────────────────────
export * as procurement from './domains/procurement.js';
export * as sales from './domains/sales.js';
export * as finance from './domains/finance.js';
export * as manufacturing from './domains/manufacturing.js';
export * as masterData from './domains/master-data.js';
export * as quality from './domains/quality.js';
export * as warehouse from './domains/warehouse.js';
export * as assetManagement from './domains/asset-management.js';
export * as hr from './domains/hr.js';
