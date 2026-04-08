/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/* eslint-disable max-lines -- 10 public functions with TSDoc + 6 variant scripts exceed 300 LOC */
/**
 * Table abstraction module for 6 SAP UI5 table variants.
 *
 * @remarks
 * Pure-function module. Browser-context code uses string scripts via `page.evaluate()`.
 *
 * **Standalone vs fixture usage:** These functions require a `page` parameter and are
 * intended for advanced use cases (custom fixtures, non-Playwright runners, library authors).
 * Most users should use the `ui5.table` fixture instead, which injects `page` automatically.
 *
 * @preferFixture ui5.table — use `ui5.table.getRows(id)` instead of `getTableRows(page, id)`.
 *
 * @example
 * ```typescript
 * // Preferred — via fixture (page injected automatically):
 * const rows = await ui5.table.getRows('myTable');
 *
 * // Advanced — standalone (requires manual page parameter):
 * import { detectTableType, getTableData } from 'playwright-praman';
 * const info = await detectTableType(page, 'myTable');
 * ```
 * @module modules
 */
import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';
import { TimeoutError } from '#core/errors/timeout-error.js';
import { createLogger } from '#core/logging/index.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';

/**
 * All supported SAP UI5 table variant class names.
 *
 * @remarks
 * Single source of truth — the {@link TableVariant} type is derived from this array.
 * Adding or removing a variant here automatically updates the union type.
 *
 * @example `VALID_VARIANTS.includes('sap.m.Table') // true`
 */
const VALID_VARIANTS = [
  'sap.m.Table',
  'sap.ui.table.Table',
  'sap.ui.table.TreeTable',
  'sap.ui.table.AnalyticalTable',
  'sap.ui.comp.smarttable.SmartTable',
  'sap.ui.mdc.Table',
] as const;

/**
 * Union of all 6 supported SAP UI5 table variant class names.
 *
 * @remarks
 * Derived from the `VALID_VARIANTS` const tuple — the single source of truth.
 *
 * @example `const v: TableVariant = 'sap.m.Table';`
 */
export type TableVariant = (typeof VALID_VARIANTS)[number];

/** @example `const o: TableOptions = { timeout: 5000 };` */
export interface TableOptions {
  readonly timeout?: number;
  readonly skipStabilityWait?: boolean;
}

/** @example `const o: WaitForTableDataOptions = { minRows: 5 };` */
export interface WaitForTableDataOptions extends TableOptions {
  readonly minRows?: number;
  readonly polling?: number;
}

/**
 * Discriminated union for table detection results.
 *
 * @remarks
 * Use the `kind` discriminant to narrow between standard and SmartTable wrappers.
 *
 * @example
 * ```typescript
 * const info: TableInfo = await detectTableType(page, 'myTable');
 * if (info.kind === 'smart') {
 *   logger.info(info.smartTableId);
 * }
 * ```
 */
export type TableInfo = StandardTableInfo | SmartTableInfo;

/**
 * Info for non-SmartTable variants.
 *
 * @example
 * ```typescript
 * const info: StandardTableInfo = { kind: 'standard', variant: 'sap.m.Table', effectiveId: 't1' };
 * ```
 */
export interface StandardTableInfo {
  readonly kind: 'standard';
  readonly variant: TableVariant;
  readonly effectiveId: string;
}

/**
 * Info for SmartTable wrapper with inner table.
 *
 * @example
 * ```typescript
 * const info: SmartTableInfo = {
 *   kind: 'smart',
 *   variant: 'sap.ui.table.Table',
 *   effectiveId: 'innerGrid',
 *   smartTableId: 'smartTable',
 * };
 * ```
 */
export interface SmartTableInfo {
  readonly kind: 'smart';
  readonly variant: TableVariant;
  readonly effectiveId: string;
  readonly smartTableId: string;
}

/** @example `const p: TablePage = { evaluate: async (s) => ({}), waitForFunction: async () => ({}) };` */
export interface TablePage {
  evaluate<TResult>(pageFunction: string, arg?: unknown): Promise<TResult>;
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { timeout?: number; polling?: number },
  ): Promise<unknown>;
}

const GRID_VARIANTS: readonly TableVariant[] = [
  'sap.ui.table.Table',
  'sap.ui.table.TreeTable',
  'sap.ui.table.AnalyticalTable',
];

/**
 * Type guard narrowing a string to {@link TableVariant}.
 *
 * @param variant - The string to check.
 * @returns `true` if the string is a valid table variant.
 *
 * @example `if (isTableVariant(name)) { /* name is TableVariant *\/ }`
 */
function isTableVariant(variant: string): variant is TableVariant {
  return (VALID_VARIANTS as readonly string[]).includes(variant);
}

function iife(body: string, fallback: string): string {
  return `(function(){try{${body}}catch(e){return ${fallback};}})()`;
}
function escStr(s: string): string {
  return JSON.stringify(s)
    .replaceAll('<', '\\u003C')
    .replaceAll('>', '\\u003E')
    .replaceAll('/', '\\u002F');
}
function ctrl(id: string, fb: string): string {
  return `var c=sap.ui.getCore().byId(${escStr(id)});if(!c)return ${fb};`;
}
function br(isGrid: boolean, g: string, r: string): string {
  return isGrid ? g : r;
}

const PLUGIN =
  "var pl=c.getPlugins&&c.getPlugins().find(function(p){return p.isA&&p.isA('sap.ui.table.plugins.SelectionPlugin');});";

async function stabilityWait(page: TablePage, options?: TableOptions): Promise<void> {
  if (options?.skipStabilityWait === true) return;
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.UI5_WAIT;
  try {
    await page.waitForFunction(
      iife(
        "return typeof sap!=='undefined'&&sap.ui&&sap.ui.getCore&&sap.ui.getCore().getUIPending()===0;",
        'true',
      ),
      undefined,
      { timeout, polling: DEFAULT_TIMEOUTS.POLLING_INTERVAL },
    );
  } catch (error: unknown) {
    const log = createLogger('table');
    log.debug({ err: error }, 'UI5 stability wait failed (non-fatal)');
  }
}

/**
 * Detects the UI5 table variant for a given control ID.
 *
 * @capability ui5.table.detectType
 * @intent Identify the table type (sap.m.Table, sap.ui.table.Table, SmartTable, MDC Table)
 * so subsequent table operations use the correct API calls.
 * @guarantee On success, returns a TableInfo with correct variant and effectiveId.
 * @prerequisite The tableId must reference a valid UI5 table control in the DOM.
 * @ai
 * @aiContext Always call this first before other table operations. SmartTable wraps
 * an inner table; the effectiveId points to the actual table control inside.
 * @sapModule sap.ui.comp.smarttable.SmartTable, sap.m.Table, sap.ui.table.Table, sap.ui.mdc.Table
 * @businessContext Unified table detection across all 6 SAP UI5 table variants.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @example `const info = await detectTableType(page, 'myTable');`
 */
export async function detectTableType(page: TablePage, tableId: string): Promise<TableInfo> {
  const id = JSON.stringify(tableId);
  const result = await page.evaluate<{
    kind: 'standard' | 'smart';
    variant: string;
    effectiveId: string;
    smartTableId?: string;
  } | null>(
    iife(
      `var c=sap.ui.getCore().byId(${id});if(!c)return null;var t=c.getMetadata().getName();` +
        `if(t==='sap.ui.comp.smarttable.SmartTable'){var inner=c.getTable();` +
        `if(!inner)return{kind:'smart',variant:t,effectiveId:${id},smartTableId:${id}};` +
        `return{kind:'smart',variant:inner.getMetadata().getName(),effectiveId:inner.getId(),smartTableId:${id}};}` +
        `return{kind:'standard',variant:t,effectiveId:${id}};`,
      'null',
    ),
  );
  if (result === null) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Table control not found: ${tableId}`,
      attempted: `detectTableType(${tableId})`,
      retryable: true,
      suggestions: ['Verify the table control ID exists in the UI5 view'],
    });
  }
  const { variant } = result;
  if (!isTableVariant(variant)) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Control is not a table variant: ${variant}`,
      attempted: `detectTableType(${tableId})`,
      retryable: false,
      details: { actualType: variant },
      suggestions: ['Verify the control ID points to a table, not another control type'],
    });
  }
  if (result.kind === 'smart') {
    return {
      kind: 'smart',
      variant,
      effectiveId: result.effectiveId,
      smartTableId: result.smartTableId ?? result.effectiveId,
    };
  }
  return {
    kind: 'standard',
    variant,
    effectiveId: result.effectiveId,
  };
}

/**
 * Returns row IDs from a UI5 table.
 *
 * @capability ui5.table.getRows
 * @intent Retrieve the UI5 control IDs of all visible rows in a table.
 * @guarantee Returns an array of UI5 control IDs for visible rows (empty array if no rows).
 * @ai
 * @aiContext Returns DOM row IDs (not OData keys). Use for iterating rows or passing to other APIs.
 * @sapModule sap.m.Table, sap.ui.table.Table — getItems() / getRows() aggregation
 * @businessContext Read table row references for subsequent row-level operations.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param options - Table options.
 * @example `const rows = await getTableRows(page, 'myTable');`
 */
export async function getTableRows(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<readonly string[]> {
  const info = await detectTableType(page, tableId);
  const g = GRID_VARIANTS.includes(info.variant);
  const result = await page.evaluate<readonly string[]>(
    iife(
      ctrl(info.effectiveId, '[]') +
        `var r=${br(g, 'c.getRows()', 'c.getItems()')};return r.map(function(x){return x.getId();});`,
      '[]',
    ),
  );
  await stabilityWait(page, options);
  return result;
}

/**
 * Returns the total row count from a UI5 table's binding.
 *
 * @capability ui5.table.getRowCount
 * @intent Get the total number of rows in a table (from binding length or items count).
 * @guarantee Returns the row count from the table binding (0 if no binding or no data).
 * @ai
 * @aiContext For grid tables, reads binding.getLength(). For responsive tables, reads items.length.
 * @sapModule sap.m.Table, sap.ui.table.Table — row binding length
 * @businessContext Verify expected data volume in a table before proceeding with row operations.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param options - Table options.
 * @example `const count = await getTableRowCount(page, 'myTable');`
 */
export async function getTableRowCount(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<number> {
  const info = await detectTableType(page, tableId);
  const g = GRID_VARIANTS.includes(info.variant);
  const result = await page.evaluate<number>(
    iife(
      ctrl(info.effectiveId, '0') +
        br(
          g,
          'var b=c.getBinding("rows");return b?b.getLength():0;',
          'var it=c.getItems();return it?it.length:0;',
        ),
      '0',
    ),
  );
  await stabilityWait(page, options);
  return result;
}

/**
 * Returns the text value of a specific table cell.
 *
 * @capability ui5.table.getCellValue
 * @intent Read the display text of a cell at a specific row and column position.
 * @guarantee On success, returns the text or value of the cell control at the given position.
 * @ai
 * @aiContext Uses getText() or getValue() on the inner cell control. Returns text representation.
 * @sapModule sap.m.Table, sap.ui.table.Table — cell control text/value access
 * @businessContext Extract specific cell values for assertion or data extraction in E2E tests.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param rowIndex - Zero-based row index.
 * @param colIndex - Zero-based column index.
 * @param options - Table options.
 * @example `const val = await getTableCellValue(page, 'myTable', 0, 1);`
 */
export async function getTableCellValue(
  page: TablePage,
  tableId: string,
  rowIndex: number,
  colIndex: number,
  options?: TableOptions,
): Promise<string> {
  const info = await detectTableType(page, tableId);
  const g = GRID_VARIANTS.includes(info.variant);
  const ri = JSON.stringify(rowIndex);
  const ci = JSON.stringify(colIndex);
  const rd = `var cl=r.getCells();var cell=cl[${ci}];if(!cell)return null;return typeof cell.getText==='function'?cell.getText():String(cell.getValue?cell.getValue():'');`;
  const result = await page.evaluate<string | null>(
    iife(
      ctrl(info.effectiveId, 'null') +
        br(
          g,
          `var rows=c.getRows();var r=rows[${ri}];if(!r)return null;${rd}`,
          `var items=c.getItems();var r=items[${ri}];if(!r)return null;${rd}`,
        ),
      'null',
    ),
  );
  if (result === null) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_PROPERTY,
      message: `Cell not found at row ${String(rowIndex)}, col ${String(colIndex)} in table ${tableId}`,
      attempted: `getTableCellValue(${tableId}, ${String(rowIndex)}, ${String(colIndex)})`,
      retryable: false,
      details: { tableId, rowIndex, colIndex },
      suggestions: ['Verify row and column indices are within bounds'],
    });
  }
  await stabilityWait(page, options);
  return result;
}

/**
 * Returns all table data as plain JSON objects from OData binding contexts.
 *
 * @capability ui5.table.getData
 * @intent Extract all OData entity data bound to the table rows as JSON objects.
 * @guarantee Returns an array of binding context objects for each row (empty array if no data).
 * @ai
 * @aiContext Reads binding contexts (getObject()) for each row. Returns raw OData entity data,
 * not display text. Useful for data-level assertions.
 * @sapModule sap.m.Table, sap.ui.table.Table — OData binding context data extraction
 * @businessContext Bulk data extraction from SAP tables for validation against business rules.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param options - Table options.
 * @example `const data = await getTableData(page, 'myTable');`
 */
export async function getTableData(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<readonly Record<string, unknown>[]> {
  const info = await detectTableType(page, tableId);
  const g = GRID_VARIANTS.includes(info.variant);
  const result = await page.evaluate<readonly Record<string, unknown>[]>(
    iife(
      ctrl(info.effectiveId, '[]') +
        br(
          g,
          "var b=c.getBinding('rows');if(!b)return[];var d=[];for(var i=0;i<b.getLength();i++){var ctx=b.getContextByIndex?b.getContextByIndex(i):null;if(ctx)d.push(ctx.getObject());}return d;",
          'var it=c.getItems();if(!it)return[];var d=[];for(var i=0;i<it.length;i++){var ctx=it[i].getBindingContext();if(ctx)d.push(ctx.getObject());}return d;',
        ),
      '[]',
    ),
  );
  await stabilityWait(page, options);
  return result;
}

/**
 * Selects a table row by index.
 *
 * @capability ui5.table.selectRow
 * @intent Select (highlight) a table row by its zero-based index.
 * @guarantee On success, the row is selected in the table's selection model.
 * @ai
 * @aiContext Uses SelectionPlugin for grid tables, setSelectedItem for responsive tables.
 * @sapModule sap.m.Table, sap.ui.table.Table — row selection API
 * @businessContext Select a specific row for subsequent actions (delete, edit, navigate).
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param rowIndex - Zero-based row index.
 * @param options - Table options.
 * @example `await selectTableRow(page, 'myTable', 0);`
 */
export async function selectTableRow(
  page: TablePage,
  tableId: string,
  rowIndex: number,
  options?: TableOptions,
): Promise<void> {
  const info = await detectTableType(page, tableId);
  const g = GRID_VARIANTS.includes(info.variant);
  const ri = JSON.stringify(rowIndex);
  const ok = await page.evaluate<boolean>(
    iife(
      ctrl(info.effectiveId, 'false') +
        br(
          g,
          `${PLUGIN}if(pl){pl.setSelectedIndex(${ri});return true;}c.setSelectedIndex(${ri});return true;`,
          `var it=c.getItems();var item=it[${ri}];if(!item)return false;c.setSelectedItem(item,true);return true;`,
        ),
      'false',
    ),
  );
  if (!ok) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_INTERACTABLE,
      message: `Failed to select row ${String(rowIndex)} in table ${tableId}`,
      attempted: `selectTableRow(${tableId}, ${String(rowIndex)})`,
      retryable: true,
      details: { tableId, rowIndex },
      suggestions: ['Verify the row index is within bounds'],
    });
  }
  await stabilityWait(page, options);
}

/**
 * Selects all rows in a UI5 table.
 *
 * @capability ui5.table.selectAll
 * @intent Select all rows in the table (equivalent to "Select All" checkbox).
 * @guarantee On success, all rows in the table are selected.
 * @ai
 * @aiContext Uses selectAll() on both grid and responsive table variants.
 * @sapModule sap.m.Table, sap.ui.table.Table — selectAll() API
 * @businessContext Mass selection for bulk operations like delete or export.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param options - Table options.
 * @example `await selectAllTableRows(page, 'myTable');`
 */
export async function selectAllTableRows(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<void> {
  const info = await detectTableType(page, tableId);
  const g = GRID_VARIANTS.includes(info.variant);
  await page.evaluate<boolean>(
    iife(
      ctrl(info.effectiveId, 'false') +
        br(
          g,
          `${PLUGIN}if(pl){pl.selectAll();return true;}c.selectAll();return true;`,
          'c.selectAll();return true;',
        ),
      'false',
    ),
  );
  await stabilityWait(page, options);
}

/**
 * Deselects all rows in a UI5 table.
 *
 * @capability ui5.table.deselectAll
 * @intent Clear all row selections in the table.
 * @guarantee On success, all row selections are cleared (no rows selected).
 * @ai
 * @aiContext Uses clearSelection() for grid tables, removeSelections(true) for responsive tables.
 * @sapModule sap.m.Table, sap.ui.table.Table — clearSelection() / removeSelections()
 * @businessContext Reset table selection state before a new selection operation.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param options - Table options.
 * @example `await deselectAllTableRows(page, 'myTable');`
 */
export async function deselectAllTableRows(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<void> {
  const info = await detectTableType(page, tableId);
  const g = GRID_VARIANTS.includes(info.variant);
  await page.evaluate<boolean>(
    iife(
      ctrl(info.effectiveId, 'false') +
        br(
          g,
          `${PLUGIN}if(pl){pl.clearSelection();return true;}c.clearSelection();return true;`,
          'c.removeSelections(true);return true;',
        ),
      'false',
    ),
  );
  await stabilityWait(page, options);
}

/**
 * Waits for table data to load with a minimum row count.
 *
 * @capability ui5.table.waitForData
 * @intent Wait until the table has loaded at least N rows of data.
 * @guarantee On success, the table binding has at least minRows entries.
 * @prerequisite The table must be bound to an OData model that will eventually load data.
 * @ai
 * @aiContext Polls via waitForFunction() until row count meets minRows threshold or timeout. Use after
 * navigation or search to ensure data is loaded before reading cell values.
 * @sapModule sap.m.Table, sap.ui.table.Table — binding length polling
 * @businessContext Wait for OData response to populate table before proceeding with assertions.
 *
 * @remarks Uses `page.waitForFunction()` with a browser-side predicate. Throws `TimeoutError` on timeout.
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param options - Wait options.
 * @example `await waitForTableData(page, 'myTable', { minRows: 5 });`
 */
export async function waitForTableData(
  page: TablePage,
  tableId: string,
  options?: WaitForTableDataOptions,
): Promise<void> {
  const minRows = options?.minRows ?? 1;
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.UI5_WAIT;
  const polling = options?.polling ?? DEFAULT_TIMEOUTS.POLLING_INTERVAL;
  const info = await detectTableType(page, tableId);
  const g = GRID_VARIANTS.includes(info.variant);
  const script = iife(
    ctrl(info.effectiveId, 'false') +
      br(
        g,
        'var b=c.getBinding("rows");var n=b?b.getLength():0;',
        'var n=c.getItems()?c.getItems().length:0;',
      ) +
      `return n>=${JSON.stringify(minRows)};`,
    'false',
  );
  try {
    await page.waitForFunction(script, undefined, { timeout, polling });
  } catch (error: unknown) {
    const base = {
      code: ErrorCode.ERR_TIMEOUT_OPERATION,
      message: `Table ${tableId} did not reach ${String(minRows)} rows within ${String(timeout)}ms`,
      attempted: `waitForTableData(${tableId}, minRows=${String(minRows)})`,
      timeoutMs: timeout,
      suggestions: ['Increase the timeout if the OData service is slow'],
    } as const;
    throw new TimeoutError(error instanceof Error ? { ...base, cause: error } : base);
  }
}

/**
 * Returns the indices of selected rows.
 *
 * @capability ui5.table.getSelectedRows
 * @intent Get the zero-based indices of all currently selected rows.
 * @guarantee Returns an array of zero-based row indices that are currently selected (empty array if none).
 * @ai
 * @aiContext Uses getSelectedIndices() for grid tables, getSelectedItems() for responsive tables.
 * @sapModule sap.m.Table, sap.ui.table.Table — selection state query
 * @businessContext Verify or capture which rows the user has selected for subsequent actions.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param options - Table options.
 * @example `const sel = await getSelectedRows(page, 'myTable');`
 */
export async function getSelectedRows(
  page: TablePage,
  tableId: string,
  options?: TableOptions,
): Promise<readonly number[]> {
  const info = await detectTableType(page, tableId);
  const g = GRID_VARIANTS.includes(info.variant);
  const result = await page.evaluate<readonly number[]>(
    iife(
      ctrl(info.effectiveId, '[]') +
        br(
          g,
          `${PLUGIN}if(pl&&typeof pl.getSelectedIndices==='function'){return pl.getSelectedIndices();}return c.getSelectedIndices();`,
          'var it=c.getItems();var si=c.getSelectedItems();var idx=[];for(var i=0;i<si.length;i++){var x=it.indexOf(si[i]);if(x>=0)idx.push(x);}return idx;',
        ),
      '[]',
    ),
  );
  await stabilityWait(page, options);
  return result;
}
