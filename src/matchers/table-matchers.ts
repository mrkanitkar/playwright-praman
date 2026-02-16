/**
 * Table-specific matcher functions for sap.m.Table row/cell assertions.
 *
 * @remarks
 * These matchers operate on table controls via the bridge adapter,
 * using aggregation access (`items`, `cells`) to navigate the table
 * structure and property access (`text`, `selectedItems`) for assertions.
 *
 * @example
 * ```typescript
 * import { checkUI5RowCount, checkUI5CellText } from './table-matchers.js';
 *
 * const rowResult = await checkUI5RowCount(adapter, 'table1', 3);
 * const cellResult = await checkUI5CellText(adapter, 'table1', 0, 1, 'Hello');
 * ```
 *
 * @module matchers
 */

import type { MatcherResult } from './ui5-matchers.js';

import type { BridgeAdapter } from '#bridge/adapter.js';

/**
 * Checks that a UI5 table has the expected number of rows.
 *
 * @remarks
 * Retrieves rows via `adapter.getControlAggregation(controlId, 'items')`
 * and compares the array length to the expected count.
 *
 * @param adapter - The bridge adapter to query the table control.
 * @param controlId - The ID of the sap.m.Table control.
 * @param expected - The expected number of rows.
 * @returns A {@link MatcherResult} indicating pass/fail with row count details.
 *
 * @example
 * ```typescript
 * const result = await checkUI5RowCount(adapter, 'productTable', 5);
 * expect(result.pass).toBe(true);
 * ```
 */
export async function checkUI5RowCount(
  adapter: BridgeAdapter,
  controlId: string,
  expected: number,
): Promise<MatcherResult> {
  const rows = await adapter.getControlAggregation(controlId, 'items');
  const actual = rows.length;
  const pass = actual === expected;

  return {
    pass,
    message: () =>
      pass
        ? `Expected table '${controlId}' not to have ${String(expected)} rows, but it did`
        : `Expected table '${controlId}' to have ${String(expected)} rows, but got ${String(actual)}`,
    actual,
    expected,
  };
}

/**
 * Checks that a specific cell in a UI5 table has the expected text.
 *
 * @remarks
 * Navigates the table structure via aggregations:
 * 1. Gets rows via `adapter.getControlAggregation(controlId, 'items')`
 * 2. Gets cells of the target row via `adapter.getControlAggregation(row.id, 'cells')`
 * 3. Gets text of the target cell via `adapter.getControlProperty(cell.id, 'text')`
 *
 * Supports both exact string comparison and RegExp pattern matching.
 *
 * @param adapter - The bridge adapter to query the table control.
 * @param controlId - The ID of the sap.m.Table control.
 * @param row - Zero-based row index.
 * @param column - Zero-based column index.
 * @param expected - The expected text value (string for exact match, RegExp for pattern).
 * @returns A {@link MatcherResult} indicating pass/fail with cell text details.
 *
 * @example
 * ```typescript
 * const result = await checkUI5CellText(adapter, 'table1', 0, 2, 'Active');
 * ```
 */
export async function checkUI5CellText(
  adapter: BridgeAdapter,
  controlId: string,
  row: number,
  column: number,
  expected: string | RegExp,
): Promise<MatcherResult> {
  const rows = await adapter.getControlAggregation(controlId, 'items');
  const targetRow = rows.at(row);

  if (targetRow === undefined) {
    return {
      pass: false,
      message: () =>
        `Expected cell text at row ${String(row)}, column ${String(column)}, but row ${String(row)} does not exist (table has ${String(rows.length)} rows)`,
      actual: undefined,
      expected,
    };
  }

  const cells = await adapter.getControlAggregation(targetRow.id, 'cells');
  const targetCell = cells.at(column);

  if (targetCell === undefined) {
    return {
      pass: false,
      message: () =>
        `Expected cell text at row ${String(row)}, column ${String(column)}, but column ${String(column)} does not exist (row has ${String(cells.length)} cells)`,
      actual: undefined,
      expected,
    };
  }

  const actual = await adapter.getControlProperty(targetCell.id, 'text');
  const actualString = String(actual);

  const pass = expected instanceof RegExp ? expected.test(actualString) : actualString === expected;

  return {
    pass,
    message: () =>
      pass
        ? `Expected cell [${String(row)},${String(column)}] text not to match '${String(expected)}', but got '${actualString}'`
        : `Expected cell [${String(row)},${String(column)}] text to match '${String(expected)}', but got '${actualString}'`,
    actual: actualString,
    expected,
  };
}

/**
 * Checks that a UI5 table has the expected number of selected rows.
 *
 * @remarks
 * Reads `selectedItems` property from the table control. If the value
 * is an array, compares its length to the expected count. Otherwise,
 * the check fails.
 *
 * @param adapter - The bridge adapter to query the table control.
 * @param controlId - The ID of the sap.m.Table control.
 * @param expected - The expected number of selected rows.
 * @returns A {@link MatcherResult} indicating pass/fail with selection count details.
 *
 * @example
 * ```typescript
 * const result = await checkUI5SelectedRows(adapter, 'table1', 2);
 * expect(result.pass).toBe(true);
 * ```
 */
export async function checkUI5SelectedRows(
  adapter: BridgeAdapter,
  controlId: string,
  expected: number,
): Promise<MatcherResult> {
  const selectedItems = await adapter.getControlProperty(controlId, 'selectedItems');

  if (!Array.isArray(selectedItems)) {
    return {
      pass: false,
      message: () =>
        `Expected table '${controlId}' to have ${String(expected)} selected rows, but selectedItems is not an array`,
      actual: selectedItems,
      expected,
    };
  }

  const actual = selectedItems.length;
  const pass = actual === expected;

  return {
    pass,
    message: () =>
      pass
        ? `Expected table '${controlId}' not to have ${String(expected)} selected rows, but it did`
        : `Expected table '${controlId}' to have ${String(expected)} selected rows, but got ${String(actual)}`,
    actual,
    expected,
  };
}
