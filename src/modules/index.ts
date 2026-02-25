/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Modules barrel -- re-exports for navigation, WorkZone, table, dialog, date, and OData.
 *
 * @module modules
 */

// ── Navigation ────────────────────────────────────────────────────────
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
} from './navigation.js';
export type { NavigationIntent, NavigationOptions, NavigationPage } from './navigation.js';

// ── WorkZone ──────────────────────────────────────────────────────────
export { createWorkZoneManager } from './workzone.js';
export type {
  BTPWorkZoneManager,
  WorkZoneAdapter,
  WorkZoneFrame,
  WorkZoneFrameLocator,
  WorkZonePage,
} from './workzone.js';

// ── Table (core) ─────────────────────────────────────────────────────
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
} from './table.js';
export type {
  SmartTableInfo,
  StandardTableInfo,
  TableInfo,
  TableOptions,
  TablePage,
  TableVariant,
  WaitForTableDataOptions,
} from './table.js';

// ── Table (operations) ───────────────────────────────────────────────
export {
  clickRow,
  ensureRowVisible,
  findRowByValues,
  getCellByColumnName,
  getColumnNames,
  getRowCount,
  selectRowByValues,
  setTableCellValue,
} from './table-operations.js';
export type { ColumnValueCriteria, TableOperationsPage } from './table-operations.js';

// ── Table (filter/sort) ──────────────────────────────────────────────
export {
  clickTableSettingsButton,
  exportTableData,
  filterByColumn,
  getFilterValue,
  getSortOrder,
  sortByColumn,
} from './table-filter-sort.js';
export type {
  SortOrderInfo,
  TableExportOptions,
  TableFilterOptions,
  TableFilterSortPage,
  TableSortOptions,
} from './table-filter-sort.js';

// ── Dialog ───────────────────────────────────────────────────────────
export {
  confirmDialog,
  DIALOG_CONTROL_TYPES,
  dismissDialog,
  getDialogButtons,
  getOpenDialogs,
  isDialogOpen,
  waitForDialog,
  waitForDialogClosed,
} from './dialog.js';
export type {
  DialogButtonInfo,
  DialogControlType,
  DialogInfo,
  DialogOptions,
  DialogPage,
  FindDialogOptions,
} from './dialog.js';

// ── Date ─────────────────────────────────────────────────────────────
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
} from './date.js';
export type {
  DateFormatPattern,
  DateInput,
  DateOptions,
  DatePage,
  DateRangeResult,
} from './date.js';

// ── OData (model-level) ─────────────────────────────────────────────
export {
  fetchCSRFToken,
  getEntityCount,
  getModelData,
  getModelProperty,
  hasPendingChanges,
  waitForODataLoad,
} from './odata.js';
export type {
  CSRFTokenResult,
  ODataCSRFPage,
  ODataOptions,
  ODataPage,
  WaitForODataLoadOptions,
} from './odata.js';

// ── OData (HTTP-level) ──────────────────────────────────────────────
export {
  callFunctionImport,
  createEntity,
  deleteEntity,
  queryEntities,
  updateEntity,
} from './odata-http.js';
export type {
  ODataHttpOptions,
  ODataHttpPage,
  ODataHttpResult,
  ODataQueryOptions,
} from './odata-http.js';
