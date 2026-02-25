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
 * @remarks Pure-function module. Browser-context code uses string scripts via `page.evaluate()`.
 * @example
 * ```typescript
 * import { detectTableType, getTableData } from '../modules/table.js';
 * const info = await detectTableType(page, 'myTable');
 * ```
 * @module modules
 */
import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';
import { TimeoutError } from '#core/errors/timeout-error.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';

/** @example `const v: TableVariant = 'sap.m.Table';` */
export type TableVariant =
  | 'sap.m.Table'
  | 'sap.ui.table.Table'
  | 'sap.ui.table.TreeTable'
  | 'sap.ui.table.AnalyticalTable'
  | 'sap.ui.comp.smarttable.SmartTable'
  | 'sap.ui.mdc.Table';

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

const VALID_VARIANTS: readonly string[] = [
  'sap.m.Table',
  'sap.ui.table.Table',
  'sap.ui.table.TreeTable',
  'sap.ui.table.AnalyticalTable',
  'sap.ui.comp.smarttable.SmartTable',
  'sap.ui.mdc.Table',
];
const GRID_VARIANTS: readonly string[] = [
  'sap.ui.table.Table',
  'sap.ui.table.TreeTable',
  'sap.ui.table.AnalyticalTable',
];

function iife(body: string, fallback: string): string {
  return `(function(){try{${body}}catch(e){return ${fallback};}})()`;
}
function ctrl(id: string, fb: string): string {
  return `var c=sap.ui.getCore().byId(${JSON.stringify(id)});if(!c)return ${fb};`;
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
  } catch {
    /* non-fatal */
  }
}

/**
 * Detects the UI5 table variant for a given control ID.
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
  if (!VALID_VARIANTS.includes(result.variant)) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Control is not a table variant: ${result.variant}`,
      attempted: `detectTableType(${tableId})`,
      retryable: false,
      details: { actualType: result.variant },
      suggestions: ['Verify the control ID points to a table, not another control type'],
    });
  }
  if (result.kind === 'smart') {
    return {
      kind: 'smart',
      variant: result.variant as TableVariant,
      effectiveId: result.effectiveId,
      smartTableId: result.smartTableId ?? result.effectiveId,
    };
  }
  return {
    kind: 'standard',
    variant: result.variant as TableVariant,
    effectiveId: result.effectiveId,
  };
}

/**
 * Returns row IDs from a UI5 table.
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
