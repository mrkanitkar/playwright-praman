/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Praman v1.0 — Agent-First SAP UI5 Test Automation Plugin for Playwright.
 *
 * @remarks
 * Main entry exports test fixtures, configuration, error hierarchy,
 * AI discovery (CapabilityRegistry, RecipeRegistry), and SAP UI5 modules.
 * For advanced AI agent building, use the `playwright-praman/ai` sub-path.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { test, expect } from 'playwright-praman';
 *
 * test('create purchase order', async ({ ui5, ui5Navigation }) => {
 *   await ui5Navigation.navigateToApp('PurchaseOrder-manage');
 *   const input = await ui5.control({ id: 'vendorInput' });
 *   expect(input).toBeDefined();
 * });
 * ```
 */

// ─────────────────────────────────────────────────────────────────────
// API Surface Summary — 6 sub-path exports
//
//   "."              Fixtures (test/expect), config, errors, utils,
//                    navigation, table, dialog, date, OData, AI discovery,
//                    auth types, branded types, version constants.
//   "./ai"           AI agent types, registries, provider config,
//                    agentic checkpoint, page context, test generation.
//   "./intents"      SAP domain intent wrappers — procurement, sales,
//                    finance, manufacturing, master data.
//   "./vocabulary"   Business term resolution with fuzzy matching and
//                    synonym search across SAP S/4HANA domains.
//   "./fe"           Fiori Elements helpers — List Report, Object Page,
//                    FE table/list, FE Test Library, browser scripts.
//   "./reporters"    Playwright reporters — ComplianceReporter,
//                    ODataTraceReporter.
// ─────────────────────────────────────────────────────────────────────

// ── Fixtures (merged test + expect) ─────────────────────────────────
export { expect, test } from './fixtures/index.js';

// ── Standalone fixture modules (for tree-shaking / selective merge) ──
export { authTest, coreTest } from './fixtures/index.js';
export type { ExtendedUI5Handler } from './fixtures/index.js';

// ── Config ──────────────────────────────────────────────────────────
export { defineConfig, loadConfig } from './core/config/index.js';
export type { PramanConfig, PramanConfigInput, LoadConfigOptions } from './core/config/index.js';

// ── Errors ──────────────────────────────────────────────────────────
export {
  AIError,
  AuthError,
  BridgeError,
  ConfigError,
  ControlError,
  ErrorCode,
  FLPError,
  IntentError,
  NavigationError,
  ODataError,
  PluginError,
  PramanError,
  SelectorError,
  TimeoutError,
  VocabularyError,
} from './core/errors/index.js';

// ── Utils ───────────────────────────────────────────────────────────
export {
  DEFAULT_TIMEOUTS,
  retry,
  waitForUI5Bootstrap,
  waitForUI5Stable,
} from './core/utils/index.js';

// ── AI Discovery ───────────────────────────────────────────────────
export { CapabilityRegistry } from './ai/capability-registry.js';
export { capabilities } from './ai/capabilities.js';
export { RecipeRegistry } from './ai/recipe-registry.js';
export { recipes } from './ai/recipes.js';
export type {
  AiResponse,
  CapabilitiesJSON,
  CapabilityEntry,
  CapabilityStats,
  RecipeEntry,
  RecipePriority,
} from './ai/types.js';

// ── Auth types ───────────────────────────────────────────────────────
export type { AuthStrategy, SAPAuthConfig, SessionInfo } from './auth/index.js';

// ── Types ────────────────────────────────────────────────────────────
export type { UI5Selector } from './core/types/selectors.js';
export type { UI5ControlBase, UI5ControlMap } from './core/types/controls.js';
export type {
  AppId,
  BindingPath,
  ControlId,
  CSSSelector,
  ODataPath,
  SemanticObjectAction,
  ViewName,
} from './core/types/branded.js';
export { appId, bindingPath, controlId, cssSelector, viewName } from './core/types/branded.js';

// ── Navigation ──────────────────────────────────────────────────────
export {
  getCurrentHash,
  navigateBack,
  navigateForward,
  navigateToApp,
  navigateToHash,
  navigateToHome,
  navigateToIntent,
  navigateToTile,
  searchAndOpenApp,
} from './modules/index.js';
export type { NavigationOptions } from './modules/navigation.js';
export type { UI5NavigationAPI } from './fixtures/nav-fixtures.js';

// ── Table (core) ────────────────────────────────────────────────────
export {
  deselectAllTableRows,
  detectTableType,
  getSelectedRows,
  getTableCellValue,
  getTableData,
  getTableRowCount,
  getTableRows,
  selectAllTableRows,
  selectTableRow,
  waitForTableData,
} from './modules/table.js';
export type {
  SmartTableInfo,
  StandardTableInfo,
  TableInfo,
  TableOptions,
  TableVariant,
  WaitForTableDataOptions,
} from './modules/table.js';

// ── Table (operations) ──────────────────────────────────────────────
export {
  clickRow,
  ensureRowVisible,
  findRowByValues,
  getCellByColumnName,
  getColumnNames,
  getRowCount,
  selectRowByValues,
  setTableCellValue,
} from './modules/table-operations.js';
export type { ColumnValueCriteria } from './modules/table-operations.js';

// ── Table (filter/sort) ─────────────────────────────────────────────
export {
  clickTableSettingsButton,
  exportTableData,
  filterByColumn,
  getFilterValue,
  getSortOrder,
  sortByColumn,
} from './modules/table-filter-sort.js';
export type {
  SortOrderInfo,
  TableExportOptions,
  TableFilterOptions,
  TableSortOptions,
} from './modules/table-filter-sort.js';

// ── Dialog ──────────────────────────────────────────────────────────
export {
  confirmDialog,
  dismissDialog,
  getDialogButtons,
  getOpenDialogs,
  isDialogOpen,
  waitForDialog,
  waitForDialogClosed,
} from './modules/dialog.js';
export type {
  DialogButtonInfo,
  DialogControlType,
  DialogInfo,
  DialogOptions,
  FindDialogOptions,
} from './modules/dialog.js';

// ── Date ────────────────────────────────────────────────────────────
export {
  DATE_FORMATS,
  formatDateForUI5,
  getDatePickerValue,
  getDateRangeSelection,
  getTimePickerValue,
  setAndValidateDate,
  setDatePickerValue,
  setDateRangeSelection,
  setTimePickerValue,
} from './modules/date.js';
export type { DateFormatPattern, DateInput, DateOptions, DateRangeResult } from './modules/date.js';

// ── OData (model-level) ─────────────────────────────────────────────
export {
  fetchCSRFToken,
  getEntityCount,
  getModelData,
  getModelProperty,
  hasPendingChanges,
  waitForODataLoad,
} from './modules/odata.js';
export type { CSRFTokenResult, ODataOptions, WaitForODataLoadOptions } from './modules/odata.js';

// ── OData (HTTP-level) ──────────────────────────────────────────────
export {
  callFunctionImport,
  createEntity,
  deleteEntity,
  queryEntities,
  updateEntity,
} from './modules/odata-http.js';
export type { ODataHttpOptions, ODataHttpResult, ODataQueryOptions } from './modules/odata-http.js';

// ── Custom Matcher Registration ─────────────────────────────────────
export { createUI5Matcher, registerUI5Matcher } from './matchers/index.js';
export type { MatcherCheckFn, MatcherResult, UI5MatcherFn } from './matchers/index.js';

// ── Matcher Utilities (for custom matcher authors) ──────────────────
export { getControlProperty, getControlAggregation } from './matchers/matcher-utils.js';
export type { MatcherPage } from './matchers/matcher-utils.js';

// ── Extensions ───────────────────────────────────────────────────────
export { extendUI5Handler } from './extensions/index.js';
export type { ExtensionContext, ExtensionFactory } from './extensions/index.js';

// ── Version ──────────────────────────────────────────────────────────
export { PACKAGE_NAME, VERSION } from './version.js';
