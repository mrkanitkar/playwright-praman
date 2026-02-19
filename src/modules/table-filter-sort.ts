/**
 * Table filter, sort, export, and settings operations.
 *
 * @remarks
 * Split from `table-operations.ts` to stay under 300 LOC per file.
 * Browser-context code uses string scripts via `page.evaluate()` (P12 compliant).
 *
 * @module modules
 */
import {
  clickTableSettingsButtonScript,
  exportTableDataScript,
  filterByColumnScript,
  getFilterValueScript,
  getSortOrderScript,
  sortByColumnScript,
} from './table-operations-scripts.js';
import type { TableOptions } from './table.js';
import { detectTableType } from './table.js';

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';

const GRID_VARIANTS: readonly string[] = [
  'sap.ui.table.Table',
  'sap.ui.table.TreeTable',
  'sap.ui.table.AnalyticalTable',
];

/**
 * Minimal page interface for table filter/sort operations.
 *
 * @example
 * ```typescript
 * const page: TableFilterSortPage = playwrightPage;
 * ```
 */
export interface TableFilterSortPage {
  evaluate<TResult>(pageFunction: string, arg?: unknown): Promise<TResult>;
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { timeout?: number; polling?: number },
  ): Promise<unknown>;
}

/**
 * Options for column filtering.
 *
 * @example
 * ```typescript
 * const opts: TableFilterOptions = { operator: 'EQ' };
 * ```
 */
export interface TableFilterOptions extends TableOptions {
  readonly operator?: string | undefined;
}

/**
 * Options for column sorting.
 *
 * @example
 * ```typescript
 * const opts: TableSortOptions = { descending: true };
 * ```
 */
export interface TableSortOptions extends TableOptions {
  readonly descending?: boolean | undefined;
}

/**
 * Sort state information for a table column.
 *
 * @example
 * ```typescript
 * const info: SortOrderInfo = { columnIndex: 0, columnName: 'Name', descending: false };
 * ```
 */
export interface SortOrderInfo {
  readonly columnIndex: number;
  readonly columnName: string;
  readonly descending: boolean;
}

/**
 * Options for table data export.
 *
 * @example
 * ```typescript
 * const opts: TableExportOptions = { format: 'csv', includeHeaders: true };
 * ```
 */
export interface TableExportOptions extends TableOptions {
  readonly format?: 'csv' | 'xlsx' | undefined;
  readonly includeHeaders?: boolean | undefined;
  readonly columns?: readonly number[] | undefined;
}

/** Checks whether a table variant is a grid-based variant. */
function isGridVariant(variant: string): boolean {
  return GRID_VARIANTS.includes(variant);
}

/**
 * Applies a filter to a table column.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param columnIndex - Zero-based column index.
 * @param filterValue - The value to filter by.
 * @param options - Filter options (operator defaults to 'Contains').
 * @throws ControlError if the filter cannot be applied.
 *
 * @example
 * ```typescript
 * await filterByColumn(page, 'myTable', 1, 'Active', { operator: 'EQ' });
 * ```
 */
export async function filterByColumn(
  page: TableFilterSortPage,
  tableId: string,
  columnIndex: number,
  filterValue: string,
  options?: TableFilterOptions,
): Promise<void> {
  const info = await detectTableType(page, tableId);
  const operator = options?.operator ?? 'Contains';
  const script = filterByColumnScript(
    info.effectiveId,
    isGridVariant(info.variant),
    columnIndex,
    filterValue,
    operator,
  );
  const ok = await page.evaluate<boolean>(script);
  if (!ok) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_AGGREGATION,
      message: `Failed to filter column ${String(columnIndex)} in table ${tableId}`,
      attempted: `filterByColumn(${tableId}, ${String(columnIndex)}, ${filterValue})`,
      retryable: false,
      details: { tableId, columnIndex, filterValue, operator },
      suggestions: [
        'Verify the column index is within bounds',
        'Check if the column supports filtering',
      ],
    });
  }
}

/**
 * Sorts a table by a specific column.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param columnIndex - Zero-based column index.
 * @param options - Sort options (descending defaults to false).
 * @throws ControlError if the sort cannot be applied.
 *
 * @example
 * ```typescript
 * await sortByColumn(page, 'myTable', 0, { descending: true });
 * ```
 */
export async function sortByColumn(
  page: TableFilterSortPage,
  tableId: string,
  columnIndex: number,
  options?: TableSortOptions,
): Promise<void> {
  const info = await detectTableType(page, tableId);
  const descending = options?.descending ?? false;
  const script = sortByColumnScript(
    info.effectiveId,
    isGridVariant(info.variant),
    columnIndex,
    descending,
  );
  const ok = await page.evaluate<boolean>(script);
  if (!ok) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_AGGREGATION,
      message: `Failed to sort column ${String(columnIndex)} in table ${tableId}`,
      attempted: `sortByColumn(${tableId}, ${String(columnIndex)})`,
      retryable: false,
      details: { tableId, columnIndex, descending },
      suggestions: [
        'Verify the column index is within bounds',
        'Check if the column supports sorting',
      ],
    });
  }
}

/**
 * Returns the current sort state of a table column.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param columnIndex - Zero-based column index.
 * @returns Sort info, or null if the column is not sorted.
 *
 * @example
 * ```typescript
 * const sort = await getSortOrder(page, 'myTable', 0);
 * ```
 */
export async function getSortOrder(
  page: TableFilterSortPage,
  tableId: string,
  columnIndex: number,
): Promise<SortOrderInfo | null> {
  const info = await detectTableType(page, tableId);
  const script = getSortOrderScript(info.effectiveId, isGridVariant(info.variant), columnIndex);
  return page.evaluate<SortOrderInfo | null>(script);
}

/**
 * Returns the current filter value of a table column.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param columnIndex - Zero-based column index.
 * @returns Filter value string, or null if the column is not filtered.
 *
 * @example
 * ```typescript
 * const filter = await getFilterValue(page, 'myTable', 0);
 * ```
 */
export async function getFilterValue(
  page: TableFilterSortPage,
  tableId: string,
  columnIndex: number,
): Promise<string | null> {
  const info = await detectTableType(page, tableId);
  const script = getFilterValueScript(info.effectiveId, isGridVariant(info.variant), columnIndex);
  return page.evaluate<string | null>(script);
}

/**
 * Exports visible table data as an array of objects keyed by column header text.
 *
 * @remarks This does NOT create a file export; it reads cell values as JSON objects.
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param options - Export options (columns to include, etc.).
 * @returns Array of row objects keyed by column header text.
 *
 * @example
 * ```typescript
 * const data = await exportTableData(page, 'myTable');
 * // [{ Name: 'Alice', Status: 'Active' }, ...]
 * ```
 */
export async function exportTableData(
  page: TableFilterSortPage,
  tableId: string,
  options?: TableExportOptions,
): Promise<readonly Record<string, string>[]> {
  const info = await detectTableType(page, tableId);
  const grid = isGridVariant(info.variant);
  // Get column names first via a separate evaluate
  const colNamesScript =
    `(function(){try{var c=sap.ui.getCore().byId(${JSON.stringify(info.effectiveId)});if(!c)return[];` +
    (grid
      ? 'var cols=c.getColumns();var names=[];for(var i=0;i<cols.length;i++){var lbl=cols[i].getLabel();names.push(typeof lbl==="string"?lbl:(lbl&&typeof lbl.getText==="function"?lbl.getText():""));}return names;'
      : 'var cols=c.getColumns();var names=[];for(var i=0;i<cols.length;i++){var hdr=cols[i].getHeader();names.push(hdr&&typeof hdr.getText==="function"?hdr.getText():"");}return names;') +
    '}catch(e){return[];}})()';
  const colNames = await page.evaluate<readonly string[]>(colNamesScript);
  const columnsJson = options?.columns !== undefined ? JSON.stringify(options.columns) : 'null';
  const script = exportTableDataScript(
    info.effectiveId,
    grid,
    JSON.stringify(colNames),
    columnsJson,
  );
  return page.evaluate<readonly Record<string, string>[]>(script);
}

/**
 * Clicks the settings/personalization button in the table toolbar.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID.
 * @param options - Table options.
 * @throws ControlError if the settings button is not found.
 *
 * @example
 * ```typescript
 * await clickTableSettingsButton(page, 'myTable');
 * ```
 */
export async function clickTableSettingsButton(
  page: TableFilterSortPage,
  tableId: string,
  options?: TableOptions,
): Promise<void> {
  const info = await detectTableType(page, tableId);
  const script = clickTableSettingsButtonScript(info.effectiveId);
  const ok = await page.evaluate<boolean>(script);
  if (!ok) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Settings button not found in table toolbar: ${tableId}`,
      attempted: `clickTableSettingsButton(${tableId})`,
      retryable: true,
      details: { tableId, ...options },
      suggestions: [
        'Verify the table has a toolbar with a settings/personalization button',
        'Check if the button uses a "settings" or "personalization" icon',
      ],
    });
  }
}
