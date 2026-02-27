/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Advanced table operations module building on `table.ts`.
 *
 * @remarks
 * Provides column-aware lookups, row clicking, cell editing, and scrolling.
 * Browser-context code uses string scripts via `page.evaluate()` (P12 compliant).
 * Browser scripts are extracted to `table-operations-scripts.ts` for LOC compliance.
 *
 * @example
 * ```typescript
 * import { getColumnNames, findRowByValues } from '../modules/table-operations.js';
 * const cols = await getColumnNames(page, 'myTable');
 * const idx = await findRowByValues(page, 'myTable', { Name: 'Alice' });
 * ```
 *
 * @module modules
 */
import {
  clickRowScript,
  columnNamesScript,
  ensureRowVisibleScript,
  findRowScript,
  setCellValueScript,
} from './table-operations-scripts.js';
import type { TableInfo, TableOptions } from './table.js';
import { detectTableType, getTableCellValue, getTableRowCount, selectTableRow } from './table.js';

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';

const GRID_VARIANTS: readonly string[] = [
  'sap.ui.table.Table',
  'sap.ui.table.TreeTable',
  'sap.ui.table.AnalyticalTable',
];

/**
 * Minimal page interface for table operations.
 *
 * @example
 * ```typescript
 * const page: TableOperationsPage = playwrightPage;
 * ```
 */
export interface TableOperationsPage {
  evaluate<TResult>(pageFunction: string, arg?: unknown): Promise<TResult>;
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { timeout?: number; polling?: number },
  ): Promise<unknown>;
}

/**
 * Column-value criteria for row matching.
 *
 * @example
 * ```typescript
 * const criteria: ColumnValueCriteria = { Name: 'Alice', Status: 'Active' };
 * ```
 */
export type ColumnValueCriteria = Readonly<Record<string, string>>;

/** Checks whether a table variant is a grid-based variant. */
function isGridVariant(info: TableInfo): boolean {
  return GRID_VARIANTS.includes(info.variant);
}

/**
 * Returns the column header names from a UI5 table.
 *
 * @intent Retrieve all column header texts from a UI5 table for column-aware lookups.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @returns Ordered array of column header texts.
 *
 * @example
 * ```typescript
 * const cols = await getColumnNames(page, 'myTable');
 * // ['Name', 'Status', 'Amount']
 * ```
 */
export async function getColumnNames(
  page: TableOperationsPage,
  tableId: string,
): Promise<readonly string[]> {
  const info = await detectTableType(page, tableId);
  const script = columnNamesScript(info.effectiveId, isGridVariant(info));
  return page.evaluate<readonly string[]>(script);
}

/**
 * Finds the first row whose cells match all specified column-value criteria.
 *
 * @intent Search a UI5 table for the first row matching column-value criteria.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param columnValues - Column name to expected value mapping.
 * @returns Zero-based row index, or -1 if not found.
 *
 * @example
 * ```typescript
 * const idx = await findRowByValues(page, 'myTable', { Name: 'Alice' });
 * ```
 */
export async function findRowByValues(
  page: TableOperationsPage,
  tableId: string,
  columnValues: ColumnValueCriteria,
): Promise<number> {
  const info = await detectTableType(page, tableId);
  const colNames = await getColumnNames(page, info.effectiveId);
  const script = findRowScript(
    info.effectiveId,
    isGridVariant(info),
    JSON.stringify(colNames),
    JSON.stringify(columnValues),
  );
  return page.evaluate<number>(script);
}

/**
 * Returns the cell text at a given row and column name.
 *
 * @intent Read a table cell value using a column header name instead of a numeric index.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param rowIndex - Zero-based row index.
 * @param columnName - Column header text.
 * @param options - Table options.
 * @returns Cell text value.
 * @throws ControlError if the column name is not found.
 *
 * @example
 * ```typescript
 * const val = await getCellByColumnName(page, 'myTable', 0, 'Status');
 * ```
 */
export async function getCellByColumnName(
  page: TableOperationsPage,
  tableId: string,
  rowIndex: number,
  columnName: string,
  options?: TableOptions,
): Promise<string> {
  const colNames = await getColumnNames(page, tableId);
  const colIndex = colNames.indexOf(columnName);
  if (colIndex < 0) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_AGGREGATION,
      message: `Column "${columnName}" not found in table ${tableId}`,
      attempted: `getCellByColumnName(${tableId}, ${String(rowIndex)}, ${columnName})`,
      retryable: false,
      details: { tableId, columnName, availableColumns: colNames },
      suggestions: [
        'Verify the column name matches the header text exactly',
        `Available columns: ${colNames.join(', ')}`,
      ],
    });
  }
  return getTableCellValue(page, tableId, rowIndex, colIndex, options);
}

/**
 * Clicks (presses) a table row by index.
 *
 * @intent Trigger a press/tap event on a specific table row for navigation or selection.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param rowIndex - Zero-based row index.
 * @throws ControlError if the row cannot be clicked.
 *
 * @example
 * ```typescript
 * await clickRow(page, 'myTable', 2);
 * ```
 */
export async function clickRow(
  page: TableOperationsPage,
  tableId: string,
  rowIndex: number,
): Promise<void> {
  const info = await detectTableType(page, tableId);
  const script = clickRowScript(info.effectiveId, isGridVariant(info), rowIndex);
  const ok = await page.evaluate<boolean>(script);
  if (!ok) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_INTERACTABLE,
      message: `Failed to click row ${String(rowIndex)} in table ${tableId}`,
      attempted: `clickRow(${tableId}, ${String(rowIndex)})`,
      retryable: true,
      details: { tableId, rowIndex },
      suggestions: ['Verify the row index is within bounds', 'Ensure the table has loaded data'],
    });
  }
}

/**
 * Finds a row by column values and selects it.
 *
 * @intent Locate a table row matching column criteria and select it programmatically.
 *
 * @recipe Table row selection by value: 1. Resolve column names via `getColumnNames()`,
 * 2. Search rows for matching cell values via `findRowByValues()`,
 * 3. Select the matched row via `selectTableRow()`.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param columnValues - Column name to expected value mapping.
 * @param options - Table options.
 * @throws ControlError if no matching row is found.
 *
 * @example
 * ```typescript
 * await selectRowByValues(page, 'myTable', { Name: 'Alice' });
 * ```
 */
export async function selectRowByValues(
  page: TableOperationsPage,
  tableId: string,
  columnValues: ColumnValueCriteria,
  options?: TableOptions,
): Promise<void> {
  const rowIndex = await findRowByValues(page, tableId, columnValues);
  if (rowIndex < 0) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `No row matching criteria in table ${tableId}`,
      attempted: `selectRowByValues(${tableId}, ${JSON.stringify(columnValues)})`,
      retryable: false,
      details: { tableId, columnValues },
      suggestions: [
        'Verify the column names and values are correct',
        'Check if the table data has loaded',
      ],
    });
  }
  await selectTableRow(page, tableId, rowIndex, options);
}

/**
 * Ensures a table row is visible by scrolling if needed (grid tables only).
 *
 * @intent Scroll a grid table to bring a specific row into the visible viewport.
 *
 * @remarks For responsive tables this is a no-op since they auto-scroll.
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param rowIndex - Zero-based row index.
 *
 * @example
 * ```typescript
 * await ensureRowVisible(page, 'gridTable', 50);
 * ```
 */
export async function ensureRowVisible(
  page: TableOperationsPage,
  tableId: string,
  rowIndex: number,
): Promise<void> {
  const info = await detectTableType(page, tableId);
  if (!isGridVariant(info)) {
    return;
  }
  const script = ensureRowVisibleScript(info.effectiveId, rowIndex);
  await page.evaluate<boolean>(script);
}

/**
 * Sets a table cell value via inner control interaction.
 *
 * @intent Write a value to a specific editable table cell by row and column index.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param rowIndex - Zero-based row index.
 * @param colIndex - Zero-based column index.
 * @param value - The value to set.
 * @throws ControlError if the cell cannot be edited.
 *
 * @example
 * ```typescript
 * await setTableCellValue(page, 'myTable', 0, 1, 'New Value');
 * ```
 */
export async function setTableCellValue(
  page: TableOperationsPage,
  tableId: string,
  rowIndex: number,
  colIndex: number,
  value: string,
): Promise<void> {
  const info = await detectTableType(page, tableId);
  const script = setCellValueScript(
    info.effectiveId,
    isGridVariant(info),
    rowIndex,
    colIndex,
    value,
  );
  const ok = await page.evaluate<boolean>(script);
  if (!ok) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_INTERACTABLE,
      message: `Failed to set cell value at row ${String(rowIndex)}, col ${String(colIndex)} in table ${tableId}`,
      attempted: `setTableCellValue(${tableId}, ${String(rowIndex)}, ${String(colIndex)}, ${value})`,
      retryable: false,
      details: { tableId, rowIndex, colIndex, value },
      suggestions: [
        'Verify row and column indices are within bounds',
        'Check if the cell control supports setValue or setText',
      ],
    });
  }
}

/**
 * Returns the total row count from a UI5 table.
 *
 * @intent Read the total number of rows currently loaded in a UI5 table.
 *
 * @remarks Convenience wrapper around `getTableRowCount` from `table.ts`.
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param options - Table options.
 * @returns Total number of rows.
 *
 * @example
 * ```typescript
 * const count = await getRowCount(page, 'myTable');
 * ```
 */
export async function getRowCount(
  page: TableOperationsPage,
  tableId: string,
  options?: TableOptions,
): Promise<number> {
  return getTableRowCount(page, tableId, options);
}
