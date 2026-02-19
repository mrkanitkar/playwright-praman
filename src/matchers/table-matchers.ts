/**
 * Table-specific matcher functions for sap.m.Table row/cell assertions.
 *
 * @remarks
 * These matchers operate on table controls via `page.evaluate()` with bridge
 * scripts, using aggregation access (`items`, `cells`) to navigate the table
 * structure and property access (`text`, `selectedItems`) for assertions.
 *
 * @example
 * ```typescript
 * import { checkUI5RowCount, checkUI5CellText } from './table-matchers.js';
 *
 * const rowResult = await checkUI5RowCount(page, 'table1', 3);
 * const cellResult = await checkUI5CellText(page, 'table1', 0, 1, 'Hello');
 * ```
 *
 * @module matchers
 */

import type { Page } from '@playwright/test';

import type { MatcherResult } from './ui5-matchers.js';

import type { BridgeControlRef, MethodExecutionResult } from '#bridge/bridge-types.js';
import { createExecuteMethodScript } from '#bridge/browser-scripts/execute-method.js';
import { ensureBridgeInjected } from '#bridge/injection.js';

/**
 * Retrieves a control property via `page.evaluate()` using the bridge.
 *
 * @param page - The Playwright page to evaluate on.
 * @param controlId - The ID of the UI5 control.
 * @param propertyName - The property to read (e.g., `'text'`, `'selectedItems'`).
 * @returns The property value from the browser context.
 */
async function getControlProperty(
  page: Page,
  controlId: string,
  propertyName: string,
): Promise<unknown> {
  await ensureBridgeInjected(page);
  const methodName = `get${propertyName.charAt(0).toUpperCase()}${propertyName.slice(1)}`;
  const script = createExecuteMethodScript();
  const withArgs = script.replace(
    /\)\(\)$/,
    `)(${JSON.stringify(controlId)}, ${JSON.stringify(methodName)}, [])`,
  );
  const result = await page.evaluate<MethodExecutionResult>(withArgs);
  return result.value;
}

/**
 * Retrieves a control aggregation via `page.evaluate()` using the bridge.
 *
 * @param page - The Playwright page to evaluate on.
 * @param controlId - The ID of the UI5 control.
 * @param aggregationName - The aggregation to read (e.g., `'items'`, `'cells'`).
 * @returns An array of control references from the browser context.
 */
async function getControlAggregation(
  page: Page,
  controlId: string,
  aggregationName: string,
): Promise<readonly BridgeControlRef[]> {
  await ensureBridgeInjected(page);
  const methodName = `get${aggregationName.charAt(0).toUpperCase()}${aggregationName.slice(1)}`;
  const script = createExecuteMethodScript();
  const withArgs = script.replace(
    /\)\(\)$/,
    `)(${JSON.stringify(controlId)}, ${JSON.stringify(methodName)}, [])`,
  );
  const result = await page.evaluate<MethodExecutionResult>(withArgs);

  if (
    result.returnType === 'aggregation' &&
    result.uuids !== undefined &&
    result.objectTypes !== undefined
  ) {
    const types = result.objectTypes;
    return result.uuids.map((id, i) => ({
      id,
      // eslint-disable-next-line security/detect-object-injection
      controlType: types[i] ?? 'unknown',
    }));
  }
  return [];
}

/**
 * Checks that a UI5 table has the expected number of rows.
 *
 * @remarks
 * Retrieves rows via `page.evaluate()` with bridge scripts using the
 * `items` aggregation and compares the array length to the expected count.
 *
 * @param page - The Playwright page to query the table control on.
 * @param controlId - The ID of the sap.m.Table control.
 * @param expected - The expected number of rows.
 * @returns A {@link MatcherResult} indicating pass/fail with row count details.
 *
 * @example
 * ```typescript
 * const result = await checkUI5RowCount(page, 'productTable', 5);
 * expect(result.pass).toBe(true);
 * ```
 */
export async function checkUI5RowCount(
  page: Page,
  controlId: string,
  expected: number,
): Promise<MatcherResult> {
  const rows = await getControlAggregation(page, controlId, 'items');
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
 * 1. Gets rows via `page.evaluate()` with bridge scripts (`items` aggregation)
 * 2. Gets cells of the target row via `page.evaluate()` (`cells` aggregation)
 * 3. Gets text of the target cell via `page.evaluate()` (`text` property)
 *
 * Supports both exact string comparison and RegExp pattern matching.
 *
 * @param page - The Playwright page to query the table control on.
 * @param controlId - The ID of the sap.m.Table control.
 * @param row - Zero-based row index.
 * @param column - Zero-based column index.
 * @param expected - The expected text value (string for exact match, RegExp for pattern).
 * @returns A {@link MatcherResult} indicating pass/fail with cell text details.
 *
 * @example
 * ```typescript
 * const result = await checkUI5CellText(page, 'table1', 0, 2, 'Active');
 * ```
 */
export async function checkUI5CellText(
  page: Page,
  controlId: string,
  row: number,
  column: number,
  expected: string | RegExp,
): Promise<MatcherResult> {
  const rows = await getControlAggregation(page, controlId, 'items');
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

  const cells = await getControlAggregation(page, targetRow.id, 'cells');
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

  const actual = await getControlProperty(page, targetCell.id, 'text');
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
 * @param page - The Playwright page to query the table control on.
 * @param controlId - The ID of the sap.m.Table control.
 * @param expected - The expected number of selected rows.
 * @returns A {@link MatcherResult} indicating pass/fail with selection count details.
 *
 * @example
 * ```typescript
 * const result = await checkUI5SelectedRows(page, 'table1', 2);
 * expect(result.pass).toBe(true);
 * ```
 */
export async function checkUI5SelectedRows(
  page: Page,
  controlId: string,
  expected: number,
): Promise<MatcherResult> {
  const selectedItems = await getControlProperty(page, controlId, 'selectedItems');

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
