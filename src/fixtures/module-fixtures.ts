/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Module fixtures — extends `ui5` with table, dialog, date, and OData sub-namespaces.
 *
 * @ai
 * @aiContext Use `ui5.table` for table row/column operations, `ui5.dialog` for dialog
 * interactions (confirm, dismiss, wait), `ui5.date` for date/time picker controls, and
 * `ui5.odata` for OData model queries and HTTP CRUD operations.
 *
 * @remarks
 * Overrides the `ui5` fixture from `coreTest` to attach `.table`, `.dialog`,
 * `.date`, and `.odata` sub-namespace objects. Each method curries the Playwright
 * `page` into the corresponding module function.
 *
 * @module fixtures
 */

import type { DateInput, DateOptions, DatePage } from '../modules/date.js';
import {
  getDatePickerValue,
  getDateRangeSelection,
  getTimePickerValue,
  setAndValidateDate,
  setDatePickerValue,
  setDateRangeSelection,
  setTimePickerValue,
} from '../modules/date.js';
import type { DialogPage, FindDialogOptions } from '../modules/dialog.js';
import {
  confirmDialog,
  dismissDialog,
  getDialogButtons,
  getOpenDialogs,
  isDialogOpen,
  waitForDialog,
  waitForDialogClosed,
} from '../modules/dialog.js';
import type { ODataHttpOptions, ODataHttpPage, ODataQueryOptions } from '../modules/odata-http.js';
import {
  callFunctionImport,
  createEntity,
  deleteEntity,
  queryEntities,
  updateEntity,
} from '../modules/odata-http.js';
import type { ODataOptions, ODataPage, WaitForODataLoadOptions } from '../modules/odata.js';
import {
  fetchCSRFToken,
  getEntityCount,
  getModelData,
  getModelProperty,
  hasPendingChanges,
  waitForODataLoad,
} from '../modules/odata.js';
import type {
  TableExportOptions,
  TableFilterOptions,
  TableSortOptions,
} from '../modules/table-filter-sort.js';
import {
  clickTableSettingsButton,
  exportTableData,
  filterByColumn,
  getFilterValue,
  getSortOrder,
  sortByColumn,
} from '../modules/table-filter-sort.js';
import type { ColumnValueCriteria } from '../modules/table-operations.js';
import {
  clickRow,
  ensureRowVisible,
  findRowByValues,
  getCellByColumnName,
  getColumnNames,
  getRowCount,
  selectRowByValues,
  setTableCellValue,
} from '../modules/table-operations.js';
import type { TableOptions, TablePage, WaitForTableDataOptions } from '../modules/table.js';
import {
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
} from '../modules/table.js';

import { coreTest } from './core-fixtures.js';
import { attachBridgeNavigationReset } from './navigation-reset.js';
import { UI5Handler } from './ui5-handler.js';

import { createObjectCleanupScript } from '#bridge/browser-scripts/object-map.js';
import { createInteractionStrategy } from '#bridge/interaction-strategies/strategy-factory.js';
import { createLogger } from '#core/logging/index.js';
import { withStep } from '#core/utils/step-decorator.js';
import { waitForUI5Stable } from '#core/utils/wait-helpers.js';
import { getExtensions } from '#extensions/extension-registry.js';
import type { ExtensionContext } from '#extensions/extension-types.js';

/**
 * Creates the table sub-namespace fixture object.
 *
 * @example `const t = createTableFixture(page); await t.getRows('myTable');`
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function createTableFixture(page: TablePage) {
  return {
    detectType: async (tableId: string) => detectTableType(page, tableId),
    getRows: async (tableId: string, opts?: TableOptions) => getTableRows(page, tableId, opts),
    getRowCount: async (tableId: string, opts?: TableOptions) =>
      getTableRowCount(page, tableId, opts),
    getCellValue: async (tableId: string, row: number, col: number, opts?: TableOptions) =>
      getTableCellValue(page, tableId, row, col, opts),
    getData: async (tableId: string, opts?: TableOptions) => getTableData(page, tableId, opts),
    selectRow: async (tableId: string, row: number, opts?: TableOptions) =>
      selectTableRow(page, tableId, row, opts),
    selectAll: async (tableId: string, opts?: TableOptions) =>
      selectAllTableRows(page, tableId, opts),
    deselectAll: async (tableId: string, opts?: TableOptions) =>
      deselectAllTableRows(page, tableId, opts),
    waitForData: async (tableId: string, opts?: WaitForTableDataOptions) =>
      waitForTableData(page, tableId, opts),
    getSelectedRows: async (tableId: string, opts?: TableOptions) =>
      getSelectedRows(page, tableId, opts),
    getColumnNames: async (tableId: string) => getColumnNames(page, tableId),
    findRowByValues: async (tableId: string, values: ColumnValueCriteria) =>
      findRowByValues(page, tableId, values),
    getCellByColumnName: async (
      tableId: string,
      row: number,
      colName: string,
      opts?: TableOptions,
    ) => getCellByColumnName(page, tableId, row, colName, opts),
    clickRow: async (tableId: string, row: number) => clickRow(page, tableId, row),
    selectRowByValues: async (tableId: string, values: ColumnValueCriteria, opts?: TableOptions) =>
      selectRowByValues(page, tableId, values, opts),
    ensureRowVisible: async (tableId: string, row: number) => ensureRowVisible(page, tableId, row),
    setTableCellValue: async (tableId: string, row: number, col: number, value: string) =>
      setTableCellValue(page, tableId, row, col, value),
    getRowCountAlt: async (tableId: string, opts?: TableOptions) =>
      getRowCount(page, tableId, opts),
    filterByColumn: async (
      tableId: string,
      col: number,
      value: string,
      opts?: TableFilterOptions,
    ) => filterByColumn(page, tableId, col, value, opts),
    sortByColumn: async (tableId: string, col: number, opts?: TableSortOptions) =>
      sortByColumn(page, tableId, col, opts),
    getSortOrder: async (tableId: string, col: number) => getSortOrder(page, tableId, col),
    getFilterValue: async (tableId: string, col: number) => getFilterValue(page, tableId, col),
    exportData: async (tableId: string, opts?: TableExportOptions) =>
      exportTableData(page, tableId, opts),
    clickSettings: async (tableId: string, opts?: TableOptions) =>
      clickTableSettingsButton(page, tableId, opts),
  } as const;
}

/**
 * Creates the dialog sub-namespace fixture object.
 *
 * @example `const d = createDialogFixture(page); await d.confirm();`
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function createDialogFixture(page: DialogPage) {
  return {
    waitFor: async (opts?: FindDialogOptions) => waitForDialog(page, opts),
    getOpen: async () => getOpenDialogs(page),
    isOpen: async (dialogId: string) => isDialogOpen(page, dialogId),
    dismiss: async (opts?: FindDialogOptions) => dismissDialog(page, opts),
    confirm: async (opts?: FindDialogOptions) => confirmDialog(page, opts),
    waitForClosed: async (dialogId: string, opts?: { timeout?: number }) =>
      waitForDialogClosed(page, dialogId, opts),
    getButtons: async (dialogId: string) => getDialogButtons(page, dialogId),
  } as const;
}

/**
 * Creates the date sub-namespace fixture object.
 *
 * @example `const d = createDateFixture(page); await d.setDatePicker('dp1', '2024-01-01');`
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function createDateFixture(page: DatePage) {
  return {
    setDatePicker: async (controlId: string, date: DateInput, opts?: DateOptions) =>
      setDatePickerValue(page, controlId, date, opts),
    getDatePicker: async (controlId: string) => getDatePickerValue(page, controlId),
    setDateRange: async (controlId: string, start: DateInput, end: DateInput, opts?: DateOptions) =>
      setDateRangeSelection(page, controlId, start, end, opts),
    getDateRange: async (controlId: string) => getDateRangeSelection(page, controlId),
    setTimePicker: async (controlId: string, time: string, opts?: DateOptions) =>
      setTimePickerValue(page, controlId, time, opts),
    getTimePicker: async (controlId: string) => getTimePickerValue(page, controlId),
    setAndValidate: async (controlId: string, date: DateInput, opts?: DateOptions) =>
      setAndValidateDate(page, controlId, date, opts),
  } as const;
}

/**
 * Creates the OData sub-namespace fixture object (`ui5.odata.*`).
 *
 * @remarks
 * Exposes two categories of OData operations under a single namespace:
 *
 * **Model-level** (browser-side, via `page.evaluate()`):
 * - `getModelData()`, `getModelProperty()` — read from UI5 OData model
 * - `waitForLoad()` — poll until model data loads
 * - `fetchCSRFToken()` — HEAD request for CSRF token
 * - `getEntityCount()`, `hasPendingChanges()` — model inspection
 *
 * **HTTP-level** (server-side, via Playwright `page.request`):
 * - `createEntity()`, `updateEntity()`, `deleteEntity()` — CRUD (require CSRF token)
 * - `queryEntities()` — GET with $filter/$select/$expand/$orderby/$top/$skip
 * - `callFunctionImport()` — invoke OData function imports (GET or POST)
 *
 * All methods are auto-wrapped with `withStability()` (UI5 stability guard)
 * and `withStep()` (Playwright trace viewer integration).
 *
 * @param page - Playwright Page satisfying both ODataPage and ODataHttpPage interfaces.
 *
 * @example
 * ```typescript
 * // Model-level: read data from UI5 model
 * const products = await ui5.odata.getModelData('/Products');
 *
 * // HTTP-level: create entity via POST
 * const { token } = await ui5.odata.fetchCSRFToken('/sap/opu/odata/sap/SVC/');
 * await ui5.odata.createEntity('/sap/opu/odata/sap/SVC/', 'Products', { Name: 'A' }, { csrfToken: token });
 * ```
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types
export function createODataFixture(page: ODataPage & ODataHttpPage) {
  return {
    getModelData: async (path: string, opts?: ODataOptions) => getModelData(page, path, opts),
    getModelProperty: async (path: string, opts?: ODataOptions) =>
      getModelProperty(page, path, opts),
    waitForLoad: async (opts?: WaitForODataLoadOptions) => waitForODataLoad(page, opts),
    fetchCSRFToken: async (serviceUrl: string) => fetchCSRFToken(page, serviceUrl),
    getEntityCount: async (path: string, opts?: ODataOptions) => getEntityCount(page, path, opts),
    hasPendingChanges: async (opts?: ODataOptions) => hasPendingChanges(page, opts),
    createEntity: async (
      serviceUrl: string,
      entitySet: string,
      data: unknown,
      opts?: ODataHttpOptions,
    ) => createEntity(page, serviceUrl, entitySet, data, opts),
    updateEntity: async (
      serviceUrl: string,
      entitySet: string,
      key: string,
      data: unknown,
      opts?: ODataHttpOptions,
    ) => updateEntity(page, serviceUrl, entitySet, key, data, opts),
    deleteEntity: async (
      serviceUrl: string,
      entitySet: string,
      key: string,
      opts?: ODataHttpOptions,
    ) => deleteEntity(page, serviceUrl, entitySet, key, opts),
    queryEntities: async (serviceUrl: string, entitySet: string, opts?: ODataQueryOptions) =>
      queryEntities(page, serviceUrl, entitySet, opts),
    callFunctionImport: async (
      serviceUrl: string,
      fn: string,
      params?: Record<string, unknown>,
      method?: 'GET' | 'POST',
      opts?: ODataHttpOptions,
    ) => callFunctionImport(page, serviceUrl, fn, params, method, opts),
  } as const;
}

/**
 * Wraps all async methods in an object with a stability guard and `test.step()`.
 *
 * @remarks
 * Calls `guard()` before each async method in `obj` to ensure UI5 is stable,
 * and wraps the call in `withStep()` so every invocation appears as a named
 * step in the Playwright trace viewer (BF-014).
 * Type-safe: preserves the original object's method signatures.
 *
 * @param obj - Object whose methods to wrap.
 * @param guard - Async stability guard called before each method.
 * @param namespace - Namespace prefix for step names (e.g., `'table'`, `'dialog'`).
 *
 * @example
 * ```typescript
 * import { withStability } from '#fixtures/module-fixtures.js';
 *
 * const stableUi5 = withStability(ui5Methods, async () => {
 *   await waitForUI5Stable(page, config);
 * }, 'ui5');
 * // Every method on stableUi5 now auto-waits for UI5 stability before execution
 * ```
 */
export function withStability<T extends Record<string, (...args: never[]) => Promise<unknown>>>(
  obj: T,
  guard: () => Promise<void>,
  namespace = '',
): T {
  const wrapped: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    // eslint-disable-next-line security/detect-object-injection -- key comes from Object.keys(obj), not user input
    const fn = obj[key]; // noUncheckedIndexedAccess: key is guaranteed by Object.keys
    if (fn === undefined) continue;
    const capturedFn = fn;
    const stepPrefix = namespace !== '' ? `ui5.${namespace}` : 'ui5';
    // eslint-disable-next-line security/detect-object-injection -- key comes from Object.keys(obj), not user input
    wrapped[key] = (async (...args: never[]): Promise<unknown> => {
      await guard();
      return withStep(`${stepPrefix}.${String(key)}`, async () => capturedFn(...args));
    }) as T[keyof T];
  }
  return wrapped as T;
}

/** Type of the extended UI5Handler with sub-namespaces. */
export type ExtendedUI5Handler = UI5Handler & {
  readonly table: ReturnType<typeof createTableFixture>;
  readonly dialog: ReturnType<typeof createDialogFixture>;
  readonly date: ReturnType<typeof createDateFixture>;
  readonly odata: ReturnType<typeof createODataFixture>;
};

export interface ModuleFixtures {
  ui5: ExtendedUI5Handler;
}

/**
 * Module test — extends coreTest, overriding `ui5` with sub-namespaces.
 *
 * @remarks
 * Inherits all worker-scoped fixtures (pramanConfig, rootLogger, etc.)
 * from coreTest. Only overrides the `ui5` fixture to attach
 * `.table`, `.dialog`, `.date`, `.odata` sub-namespaces.
 *
 * @capability ui5.table.getRows
 *
 * @example
 * ```typescript
 * import { moduleTest } from '#fixtures/module-fixtures.js';
 * moduleTest('table ops', async ({ ui5 }) => {
 *   await ui5.table.getRows('myTable');
 * });
 * ```
 */
export const moduleTest = coreTest.extend<ModuleFixtures>({
  ui5: async ({ page, pramanConfig, rootLogger }, use) => {
    const logger = createLogger('bridge', rootLogger);
    const strategy = createInteractionStrategy(pramanConfig.interactionStrategy, pramanConfig.opa5);

    const detachNavigationReset = attachBridgeNavigationReset(page, logger);

    const handler = new UI5Handler({
      page,
      interactionStrategy: strategy,
      discoveryStrategies: pramanConfig.discoveryStrategies,
      config: {
        ui5WaitTimeout: pramanConfig.ui5WaitTimeout,
        controlDiscoveryTimeout:
          // eslint-disable-next-line @typescript-eslint/no-deprecated, sonarjs/deprecation -- backward-compat fallback
          pramanConfig.selectors?.defaultTimeout ?? pramanConfig.controlDiscoveryTimeout,
        preferVisibleControls:
          pramanConfig.selectors?.preferVisibleControls ?? pramanConfig.preferVisibleControls,
        skipStabilityWait:
          pramanConfig.selectors?.skipStabilityWait ?? pramanConfig.skipStabilityWait,
      },
    });

    // Stability guard: wait for UI5 to be stable before each module method call
    const guard = async (): Promise<void> => {
      await waitForUI5Stable(page, {
        timeout: pramanConfig.ui5WaitTimeout,
        skipStabilityWait: pramanConfig.skipStabilityWait,
      });
    };

    // `as ExtendedUI5Handler` narrows Object.assign result to the branded union type
    const extended = Object.assign(handler, {
      table: withStability(createTableFixture(page), guard, 'table'),
      dialog: withStability(createDialogFixture(page), guard, 'dialog'),
      date: withStability(createDateFixture(page), guard, 'date'),
      odata: withStability(createODataFixture(page), guard, 'odata'),
    }) as ExtendedUI5Handler;

    // Apply registered custom extensions as sub-namespaces
    const extensionContext: ExtensionContext = { page, handler, config: pramanConfig };
    for (const ext of getExtensions()) {
      const methods = ext.factory(extensionContext);
      const wrapped = withStability(methods, guard, ext.name);
      Object.assign(extended, { [ext.name]: wrapped });
    }

    try {
      await use(extended);
    } finally {
      // Teardown: remove navigation listener (always — even if use() throws)
      detachNavigationReset();
      try {
        // Clean up browser-side object map to prevent memory leaks
        const cleanupScript = createObjectCleanupScript();
        await page.evaluate(cleanupScript).catch((error: unknown) => {
          logger.debug(
            { err: error },
            'Object map cleanup failed (non-fatal — page may have navigated away)',
          );
        });
      } finally {
        await handler.destroy();
      }
    }
  },
});
