/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Fiori Elements table helper functions for `sap.m.Table` and `sap.ui.table.Table`-based FE views.
 *
 * @remarks
 * Pure-function module (P1) with minimal page interface (P2).
 * All browser-context code uses string scripts via `page.evaluate()` (P12).
 * Supports both responsive tables (`sap.m.Table`) and grid tables
 * (`sap.ui.table.Table`, `sap.ui.table.TreeTable`, `sap.ui.table.AnalyticalTable`).
 *
 * Grid table detection uses metadata name comparison against known grid variants.
 *
 * @example
 * ```typescript
 * import {
 *   feGetTableRowCount,
 *   feGetCellValue,
 *   feFindRowByValues,
 *   feClickRow,
 *   feGetColumnNames,
 * } from '../fe/fe-table-helpers.js';
 *
 * const count = await feGetTableRowCount(page, 'myTable');
 * const value = await feGetCellValue(page, 'myTable', 0, 'Product');
 * await feClickRow(page, 'myTable', 0);
 * ```
 *
 * @fioriElement Table
 * @sapModule sap.m.Table, sap.ui.table.Table
 * @ui5Version \>= 1.84.0
 *
 * @module fe
 */

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';

/** Shared suggestion: verify table control ID. */
const SUGGEST_VERIFY_TABLE_ID = 'Verify the table control ID exists in the UI5 view';

/** Shared suggestion: wait for page load. */
const SUGGEST_WAIT_FOR_LOAD = 'Wait for the page to fully load before accessing the table';

/** Shared suggestion: check row count. */
const SUGGEST_CHECK_ROW_COUNT = 'Use feGetTableRowCount() to check the number of rows first';

/** Shared suggestion: verify row index. */
const SUGGEST_VERIFY_ROW_INDEX = 'Verify the row index is within the table bounds';

/** Shared suggestion: verify column name. */
const SUGGEST_VERIFY_COLUMN_NAME = 'Verify the column name matches a header in the table';

/** Shared suggestions for table-not-found errors. */
const TABLE_NOT_FOUND_SUGGESTIONS = [SUGGEST_VERIFY_TABLE_ID, SUGGEST_WAIT_FOR_LOAD] as const;

/** Shared suggestions for row-index-out-of-bounds errors. */
const ROW_INDEX_OOB_SUGGESTIONS = [SUGGEST_VERIFY_ROW_INDEX, SUGGEST_CHECK_ROW_COUNT] as const;

/** Shared suggestions for column-not-found errors. */
const COLUMN_NOT_FOUND_SUGGESTIONS = [
  SUGGEST_VERIFY_COLUMN_NAME,
  'Use feGetColumnNames() to list available column names',
] as const;

/**
 * Minimal page interface for FE table operations.
 *
 * @example
 * ```typescript
 * const page: FETablePage = {
 *   evaluate: async (s) => ({}),
 *   waitForFunction: async (s) => undefined,
 * };
 * ```
 */
export interface FETablePage {
  /** Executes a script in the browser context and returns the result. */
  evaluate<TResult>(pageFunction: string, arg?: unknown): Promise<TResult>;
  /** Waits until a browser-side predicate returns a truthy value. */
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { timeout?: number; polling?: number },
  ): Promise<unknown>;
}

/**
 * Gets the number of rows in a UI5 table control.
 *
 * @remarks
 * Supports responsive tables (`sap.m.Table`) via `getItems()` and grid tables
 * (`sap.ui.table.Table` and variants) via `getBinding('rows').getLength()`.
 *
 * @capability fe.table.getRowCount
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID of the table.
 * @returns The number of rows in the table.
 * @throws ControlError if the table control is not found.
 *
 * @example
 * ```typescript
 * const count = await feGetTableRowCount(page, 'myApp--productTable');
 * ```
 */
export async function feGetTableRowCount(page: FETablePage, tableId: string): Promise<number> {
  const script =
    `(function(){try{var c=sap.ui.getCore().byId(${JSON.stringify(tableId)});` +
    `if(!c)return{__error:"Table not found"};` +
    `var mn=c.getMetadata().getName();` +
    `var isGrid=["sap.ui.table.Table","sap.ui.table.TreeTable","sap.ui.table.AnalyticalTable"].indexOf(mn)!==-1;` +
    `if(isGrid){var b=c.getBinding("rows");return{__count:b?b.getLength():0};}` +
    `return{__count:c.getItems().length};}catch(e){return{__error:e.message||String(e)};}})()`;

  const result = await page.evaluate<{ __count?: number; __error?: string }>(script);

  if (result.__error !== undefined) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Table control not found: "${tableId}"`,
      attempted: `Get row count from table: "${tableId}"`,
      retryable: true,
      details: { tableId },
      suggestions: [...TABLE_NOT_FOUND_SUGGESTIONS],
    });
  }

  return result.__count ?? 0;
}

/**
 * Gets the text value of a cell in a UI5 table at the given row index and column name.
 *
 * @remarks
 * Looks up the column index by matching header text, then reads the cell value.
 * For responsive tables, uses `getItems()[row].getCells()[col]`.
 * For grid tables, uses `getRows()[row].getCells()[col]`.
 *
 * @capability fe.table.getCellValue
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID of the table.
 * @param rowIndex - Zero-based row index.
 * @param columnName - The column header text to match.
 * @returns The text content of the cell.
 * @throws ControlError with `ERR_CONTROL_AGGREGATION` if the column is not found or index is out of bounds.
 *
 * @example
 * ```typescript
 * const value = await feGetCellValue(page, 'myApp--productTable', 0, 'Product Name');
 * ```
 */
export async function feGetCellValue(
  page: FETablePage,
  tableId: string,
  rowIndex: number,
  columnName: string,
): Promise<string> {
  const script =
    `(function(){try{var c=sap.ui.getCore().byId(${JSON.stringify(tableId)});` +
    `if(!c)return{__error:"Table not found"};` +
    `var mn=c.getMetadata().getName();` +
    `var isGrid=["sap.ui.table.Table","sap.ui.table.TreeTable","sap.ui.table.AnalyticalTable"].indexOf(mn)!==-1;` +
    `var cols=c.getColumns();var colIdx=-1;` +
    `for(var i=0;i<cols.length;i++){` +
    `var lbl=isGrid?(typeof cols[i].getLabel==="function"?cols[i].getLabel():null):(typeof cols[i].getHeader==="function"?cols[i].getHeader():null);` +
    `var txt=lbl&&typeof lbl.getText==="function"?lbl.getText():String(lbl||"");` +
    `if(txt===${JSON.stringify(columnName)}){colIdx=i;break;}}` +
    `if(colIdx===-1)return{__nocol:true};` +
    `var rows=isGrid?c.getRows():c.getItems();` +
    `if(${String(rowIndex)}<0||${String(rowIndex)}>=rows.length)return{__oob:true};` +
    `var cell=rows[${String(rowIndex)}].getCells()[colIdx];` +
    `if(!cell)return{__nocol:true};` +
    `var val=typeof cell.getValue==="function"?cell.getValue():(typeof cell.getText==="function"?cell.getText():String(cell));` +
    `return{__val:val};}catch(e){return{__error:e.message||String(e)};}})()`;

  const result = await page.evaluate<{
    __val?: string;
    __oob?: boolean;
    __nocol?: boolean;
    __error?: string;
  }>(script);

  if (result.__nocol === true) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_AGGREGATION,
      message: `Column "${columnName}" not found in table "${tableId}"`,
      attempted: `Get cell value at row ${String(rowIndex)}, column "${columnName}" in table: "${tableId}"`,
      retryable: false,
      details: { tableId, rowIndex, columnName },
      suggestions: [...COLUMN_NOT_FOUND_SUGGESTIONS],
    });
  }

  if (result.__oob === true) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_AGGREGATION,
      message: `Row index ${String(rowIndex)} out of bounds in table "${tableId}"`,
      attempted: `Get cell value at row ${String(rowIndex)}, column "${columnName}" in table: "${tableId}"`,
      retryable: false,
      details: { tableId, rowIndex, columnName },
      suggestions: [...ROW_INDEX_OOB_SUGGESTIONS],
    });
  }

  if (result.__error !== undefined) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Table control not found: "${tableId}"`,
      attempted: `Get cell value at row ${String(rowIndex)}, column "${columnName}" in table: "${tableId}"`,
      retryable: true,
      details: { tableId, rowIndex, columnName },
      suggestions: [...TABLE_NOT_FOUND_SUGGESTIONS],
    });
  }

  return result.__val ?? '';
}

/**
 * Finds the first row index where all specified column values match.
 *
 * @remarks
 * All column lookup and row matching logic runs inside the browser script.
 * Returns -1 if no matching row is found.
 *
 * @capability fe.table.findRow
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID of the table.
 * @param values - A record mapping column names to expected cell values.
 * @returns The zero-based index of the first matching row, or -1 if not found.
 * @throws ControlError if the table control is not found.
 *
 * @example
 * ```typescript
 * const rowIdx = await feFindRowByValues(page, 'myApp--productTable', { Product: 'Widget A', Status: 'Active' });
 * ```
 */
export async function feFindRowByValues(
  page: FETablePage,
  tableId: string,
  values: Readonly<Record<string, string>>,
): Promise<number> {
  const valuesJson = JSON.stringify(values);
  const script =
    `(function(){try{var c=sap.ui.getCore().byId(${JSON.stringify(tableId)});` +
    `if(!c)return{__error:"Table not found"};` +
    `var mn=c.getMetadata().getName();` +
    `var isGrid=["sap.ui.table.Table","sap.ui.table.TreeTable","sap.ui.table.AnalyticalTable"].indexOf(mn)!==-1;` +
    `var cols=c.getColumns();var criteria=${valuesJson};` +
    `var colMap={};` +
    `for(var ci=0;ci<cols.length;ci++){` +
    `var lbl=isGrid?(typeof cols[ci].getLabel==="function"?cols[ci].getLabel():null):(typeof cols[ci].getHeader==="function"?cols[ci].getHeader():null);` +
    `var txt=lbl&&typeof lbl.getText==="function"?lbl.getText():String(lbl||"");` +
    `colMap[txt]=ci;}` +
    `var rows=isGrid?c.getRows():c.getItems();` +
    `for(var ri=0;ri<rows.length;ri++){var match=true;` +
    `var colNames=Object.keys(criteria);` +
    `for(var ki=0;ki<colNames.length;ki++){var cname=colNames[ki];var cidx=colMap[cname];` +
    `if(cidx===undefined){match=false;break;}` +
    `var cell=rows[ri].getCells()[cidx];` +
    `var cval=cell?(typeof cell.getValue==="function"?cell.getValue():(typeof cell.getText==="function"?cell.getText():String(cell))):"";` +
    `if(cval!==criteria[cname]){match=false;break;}}` +
    `if(match)return{__index:ri};}` +
    `return{__index:-1};}catch(e){return{__error:e.message||String(e)};}})()`;

  const result = await page.evaluate<{ __index?: number; __error?: string }>(script);

  if (result.__error !== undefined) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Table control not found: "${tableId}"`,
      attempted: `Find row matching values in table: "${tableId}"`,
      retryable: true,
      details: { tableId, values },
      suggestions: [...TABLE_NOT_FOUND_SUGGESTIONS],
    });
  }

  return result.__index ?? -1;
}

/**
 * Clicks (presses) a row at the specified index in a UI5 table.
 *
 * @remarks
 * For responsive tables, fires the `press` event on the item or triggers a `tap`.
 * For grid tables, fires `rowSelectionChange` or triggers a DOM click on the row element.
 *
 * @capability fe.table.clickRow
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID of the table.
 * @param rowIndex - Zero-based index of the row to click.
 * @throws ControlError with `ERR_CONTROL_AGGREGATION` if the row index is out of bounds.
 *
 * @example
 * ```typescript
 * await feClickRow(page, 'myApp--productTable', 0);
 * ```
 */
export async function feClickRow(
  page: FETablePage,
  tableId: string,
  rowIndex: number,
): Promise<void> {
  const script =
    `(function(){try{var c=sap.ui.getCore().byId(${JSON.stringify(tableId)});` +
    `if(!c)return{__error:"Table not found"};` +
    `var mn=c.getMetadata().getName();` +
    `var isGrid=["sap.ui.table.Table","sap.ui.table.TreeTable","sap.ui.table.AnalyticalTable"].indexOf(mn)!==-1;` +
    `if(isGrid){var rows=c.getRows();` +
    `if(${String(rowIndex)}<0||${String(rowIndex)}>=rows.length)return{__oob:true};` +
    `var row=rows[${String(rowIndex)}];` +
    `if(typeof c.fireRowSelectionChange==="function"){c.fireRowSelectionChange({rowIndex:${String(rowIndex)}});}` +
    `else if(row.$&&row.$().length){row.$().trigger("click");}` +
    `return{__ok:true};}` +
    `var items=c.getItems();` +
    `if(${String(rowIndex)}<0||${String(rowIndex)}>=items.length)return{__oob:true};` +
    `var item=items[${String(rowIndex)}];` +
    `if(typeof item.firePress==="function"){item.firePress();}` +
    `else if(item.$&&item.$().length){item.$().trigger("tap");}` +
    `return{__ok:true};}catch(e){return{__error:e.message||String(e)};}})()`;

  const result = await page.evaluate<{ __ok?: boolean; __oob?: boolean; __error?: string }>(script);

  if (result.__oob === true) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_AGGREGATION,
      message: `Row index ${String(rowIndex)} out of bounds in table "${tableId}"`,
      attempted: `Click row at index ${String(rowIndex)} in table: "${tableId}"`,
      retryable: false,
      details: { tableId, rowIndex },
      suggestions: [...ROW_INDEX_OOB_SUGGESTIONS],
    });
  }

  if (result.__error !== undefined) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Table control not found: "${tableId}"`,
      attempted: `Click row at index ${String(rowIndex)} in table: "${tableId}"`,
      retryable: true,
      details: { tableId, rowIndex },
      suggestions: [...TABLE_NOT_FOUND_SUGGESTIONS],
    });
  }
}

/**
 * Gets all column header names from a UI5 table control.
 *
 * @remarks
 * For responsive tables, reads `getHeader().getText()` on each column.
 * For grid tables, reads `getLabel().getText()` or stringifies the label.
 *
 * @capability fe.table.getColumnNames
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID of the table.
 * @returns A readonly array of column header strings.
 * @throws ControlError if the table control is not found.
 *
 * @example
 * ```typescript
 * const columns = await feGetColumnNames(page, 'myApp--productTable');
 * // ['Product', 'Status', 'Price']
 * ```
 */
export async function feGetColumnNames(
  page: FETablePage,
  tableId: string,
): Promise<readonly string[]> {
  const script =
    `(function(){try{var c=sap.ui.getCore().byId(${JSON.stringify(tableId)});` +
    `if(!c)return{__error:"Table not found"};` +
    `var mn=c.getMetadata().getName();` +
    `var isGrid=["sap.ui.table.Table","sap.ui.table.TreeTable","sap.ui.table.AnalyticalTable"].indexOf(mn)!==-1;` +
    `var cols=c.getColumns();var names=[];` +
    `for(var i=0;i<cols.length;i++){` +
    `var lbl=isGrid?(typeof cols[i].getLabel==="function"?cols[i].getLabel():null):(typeof cols[i].getHeader==="function"?cols[i].getHeader():null);` +
    `var txt=lbl&&typeof lbl.getText==="function"?lbl.getText():String(lbl||"");` +
    `names.push(txt);}` +
    `return{__names:names};}catch(e){return{__error:e.message||String(e)};}})()`;

  const result = await page.evaluate<{ __names?: string[]; __error?: string }>(script);

  if (result.__error !== undefined) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Table control not found: "${tableId}"`,
      attempted: `Get column names from table: "${tableId}"`,
      retryable: true,
      details: { tableId },
      suggestions: [...TABLE_NOT_FOUND_SUGGESTIONS],
    });
  }

  return Object.freeze(result.__names ?? []);
}
