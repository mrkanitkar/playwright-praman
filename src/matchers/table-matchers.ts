/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

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

import { getControlAggregation, getControlProperty, pollUntilPass } from './matcher-utils.js';
import type { PollableMatcherResult } from './matcher-utils.js';
import type { MatcherOptions, MatcherResult } from './ui5-matchers.js';

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
  options?: MatcherOptions,
): Promise<MatcherResult> {
  return pollUntilPass(async (): Promise<PollableMatcherResult> => {
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
  }, options?.timeout);
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
  options?: MatcherOptions,
): Promise<MatcherResult> {
  return pollUntilPass(async (): Promise<PollableMatcherResult> => {
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

    const pass =
      expected instanceof RegExp ? expected.test(actualString) : actualString === expected;

    return {
      pass,
      message: () =>
        pass
          ? `Expected cell [${String(row)},${String(column)}] text not to match '${String(expected)}', but got '${actualString}'`
          : `Expected cell [${String(row)},${String(column)}] text to match '${String(expected)}', but got '${actualString}'`,
      actual: actualString,
      expected,
    };
  }, options?.timeout);
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
  options?: MatcherOptions,
): Promise<MatcherResult> {
  return pollUntilPass(async (): Promise<PollableMatcherResult> => {
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
  }, options?.timeout);
}
