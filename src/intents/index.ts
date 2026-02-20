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
 *
 * @module intents
 */

// ── Types ────────────────────────────────────────────────────────────────────
export type {
  IntentResult,
  IntentOptions,
  JournalEntryData,
  VendorInvoiceData,
  PaymentData,
  ProductionOrderData,
  ProductionConfirmationData,
  VendorMasterData,
  CustomerMasterData,
  MaterialMasterData,
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
