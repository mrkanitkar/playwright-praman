/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Fiori Elements List Report page operations.
 * Pure-function module. Browser scripts in `list-report-scripts.ts`.
 * @remarks 9 public functions exceed 300 LOC due to mandatory TSDoc per function.
 * @example
 * ```typescript
 * const tableId = await getListReportTable(page);
 * const fbId = await getFilterBar(page);
 * await setFilterBarField(page, fbId, 'CompanyCode', '1000');
 * await executeSearch(page, fbId);
 * ```
 * @module fe
 */
import {
  LR_CLEAR_FILTER_BAR_SCRIPT,
  LR_EXECUTE_SEARCH_SCRIPT,
  LR_FIND_FILTER_BAR_SCRIPT,
  LR_FIND_TABLE_SCRIPT,
  LR_GET_FILTER_FIELD_SCRIPT,
  LR_GET_VARIANTS_SCRIPT,
  LR_NAVIGATE_TO_ITEM_SCRIPT,
  LR_SELECT_VARIANT_SCRIPT,
  LR_SET_FILTER_FIELD_SCRIPT,
  LR_STABILITY_SCRIPT,
} from './list-report-scripts.js';

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';

/** Shared suggestions for table-not-found errors. */
const TABLE_NOT_FOUND_SUGGESTIONS = [
  'Verify the current page is a Fiori Elements List Report',
  'Wait for the page to fully load before accessing the table',
] as const;
/** Shared suggestions for filter-bar-not-found errors. */
const FILTER_BAR_NOT_FOUND_SUGGESTIONS = [
  'Verify the current page is a Fiori Elements List Report',
  'Wait for the page to fully load before accessing the filter bar',
] as const;
/** Shared suggestions for variant-management errors. */
const VARIANT_NOT_FOUND_SUGGESTIONS = [
  'Verify the List Report has variant management enabled',
  'Use getAvailableVariants() to list available variant names',
] as const;

/** Minimal page interface for List Report operations.
 * @example
 * ```typescript
 * const page: ListReportPage = { evaluate: async () => ({}), waitForFunction: async () => ({}) };
 * ```
 */
export interface ListReportPage {
  /** Executes a script in the browser context and returns the result. */
  evaluate<TResult>(pageFunction: string, arg?: unknown): Promise<TResult>;
  /** Waits until a browser-side predicate returns a truthy value. */
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { timeout?: number; polling?: number },
  ): Promise<unknown>;
}

/** Options for List Report operations.
 * @example
 * ```typescript
 * const opts: ListReportOptions = { timeout: 10_000 };
 * ```
 */
export interface ListReportOptions {
  /** Timeout in ms. Defaults to `DEFAULT_TIMEOUTS.CONTROL_DISCOVERY`. */
  readonly timeout?: number | undefined;
  /** Skip UI5 stability wait after actions. Defaults to `false`. */
  readonly skipStabilityWait?: boolean | undefined;
}

/** Waits for UI5 stability unless `skipStabilityWait` is set. */
async function stabilityWait(page: ListReportPage, options?: ListReportOptions): Promise<void> {
  if (options?.skipStabilityWait === true) return;
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.CONTROL_DISCOVERY;
  await page.waitForFunction(LR_STABILITY_SCRIPT, undefined, { timeout, polling: 100 });
}

/** Finds the main table on a List Report page (SmartTable first, then MDC Table).
 *
 * @intent Discover the main table control on a Fiori Elements List Report page.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param options - Optional timeout settings.
 * @returns The control ID of the table.
 * @throws ControlError if no table control is found.
 * @example
 * ```typescript
 * const tableId = await getListReportTable(page);
 * ```
 */
export async function getListReportTable(
  page: ListReportPage,
  options?: ListReportOptions,
): Promise<string> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.CONTROL_DISCOVERY;
  const result = await page.evaluate<{ found: boolean; id: string; type: string }>(
    LR_FIND_TABLE_SCRIPT,
  );
  if (!result.found) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: 'List Report table not found on current page',
      attempted: 'Find SmartTable or MDC Table on List Report page',
      retryable: true,
      details: { timeout },
      suggestions: [...TABLE_NOT_FOUND_SUGGESTIONS],
    });
  }
  return result.id;
}

/** Finds the filter bar on a List Report page (SmartFilterBar first, then MDC FilterBar).
 *
 * @intent Discover the filter bar control on a Fiori Elements List Report page.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param options - Optional timeout settings.
 * @returns The control ID of the filter bar.
 * @throws ControlError if no filter bar control is found.
 * @example
 * ```typescript
 * const filterBarId = await getFilterBar(page);
 * ```
 */
export async function getFilterBar(
  page: ListReportPage,
  options?: ListReportOptions,
): Promise<string> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.CONTROL_DISCOVERY;
  const result = await page.evaluate<{ found: boolean; id: string; type: string }>(
    LR_FIND_FILTER_BAR_SCRIPT,
  );
  if (!result.found) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: 'List Report filter bar not found on current page',
      attempted: 'Find SmartFilterBar or MDC FilterBar on List Report page',
      retryable: true,
      details: { timeout },
      suggestions: [...FILTER_BAR_NOT_FOUND_SUGGESTIONS],
    });
  }
  return result.id;
}

/** Sets a filter field value on the filter bar.
 *
 * @intent Set a filter field value on the SmartFilterBar or MDC FilterBar.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param filterBarId - The UI5 control ID of the filter bar.
 * @param fieldName - The name/key of the filter field.
 * @param value - The value to set.
 * @param options - Optional timeout and stability settings.
 * @throws ControlError if the filter bar or field is not found.
 * @example
 * ```typescript
 * await setFilterBarField(page, 'app--filterBar', 'CompanyCode', '1000');
 * ```
 */
export async function setFilterBarField(
  page: ListReportPage,
  filterBarId: string,
  fieldName: string,
  value: string,
  options?: ListReportOptions,
): Promise<void> {
  const result = await page.evaluate<{ success: boolean; reason?: string }>(
    LR_SET_FILTER_FIELD_SCRIPT,
    { filterBarId, fieldName, value },
  );
  if (!result.success) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Filter field "${fieldName}" not found on filter bar "${filterBarId}"`,
      attempted: `Set filter field "${fieldName}" to "${value}" on filter bar "${filterBarId}"`,
      retryable: true,
      details: { filterBarId, fieldName, value },
      suggestions: [
        'Verify the field name matches a filter field on the SmartFilterBar',
        'Check if the filter field is visible and not hidden by personalization',
      ],
    });
  }
  await stabilityWait(page, options);
}

/** Gets the current value of a filter field on the filter bar.
 *
 * @intent Read the current value of a filter field on the filter bar.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param filterBarId - The UI5 control ID of the filter bar.
 * @param fieldName - The name/key of the filter field.
 * @returns The current value of the filter field, or empty string if not set.
 * @example
 * ```typescript
 * const value = await getFilterBarFieldValue(page, 'app--filterBar', 'CompanyCode');
 * ```
 */
export async function getFilterBarFieldValue(
  page: ListReportPage,
  filterBarId: string,
  fieldName: string,
): Promise<string> {
  const result = await page.evaluate<{ found: boolean; value: string }>(
    LR_GET_FILTER_FIELD_SCRIPT,
    { filterBarId, fieldName },
  );
  return result.value;
}

/** Executes search on the filter bar (Go button). Waits for UI5 stability after.
 *
 * @intent Trigger the filter bar search (equivalent to pressing the Go button).
 *
 * @param page - Playwright Page (or compatible subset).
 * @param filterBarId - The UI5 control ID of the filter bar.
 * @param options - Optional timeout and stability settings.
 * @throws ControlError if the filter bar is not found or has no search method.
 * @example
 * ```typescript
 * await executeSearch(page, 'app--filterBar');
 * ```
 */
export async function executeSearch(
  page: ListReportPage,
  filterBarId: string,
  options?: ListReportOptions,
): Promise<void> {
  const result = await page.evaluate<{ success: boolean; reason?: string }>(
    LR_EXECUTE_SEARCH_SCRIPT,
    filterBarId,
  );
  if (!result.success) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Filter bar not found or search failed: "${filterBarId}"`,
      attempted: `Execute search on filter bar: "${filterBarId}"`,
      retryable: true,
      details: { filterBarId },
      suggestions: [...FILTER_BAR_NOT_FOUND_SUGGESTIONS],
    });
  }
  await stabilityWait(page, options);
}

/** Clears all filter fields on the filter bar.
 *
 * @intent Reset all filter fields on the filter bar to their default values.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param filterBarId - The UI5 control ID of the filter bar.
 * @param options - Optional timeout and stability settings.
 * @throws ControlError if the filter bar is not found.
 * @example
 * ```typescript
 * await clearFilterBar(page, 'app--filterBar');
 * ```
 */
export async function clearFilterBar(
  page: ListReportPage,
  filterBarId: string,
  options?: ListReportOptions,
): Promise<void> {
  const result = await page.evaluate<{ success: boolean; reason?: string }>(
    LR_CLEAR_FILTER_BAR_SCRIPT,
    filterBarId,
  );
  if (!result.success) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Filter bar not found: "${filterBarId}"`,
      attempted: `Clear all fields on filter bar: "${filterBarId}"`,
      retryable: true,
      details: { filterBarId },
      suggestions: [...FILTER_BAR_NOT_FOUND_SUGGESTIONS],
    });
  }
  await stabilityWait(page, options);
}

/** Navigates to a table item by row index. Fires press/tap on the row.
 *
 * @intent Navigate from the List Report to an Object Page by clicking a table row.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tableId - The UI5 control ID of the table.
 * @param rowIndex - Zero-based row index to navigate to.
 * @param options - Optional timeout and stability settings.
 * @throws ControlError if the table is not found or the index is out of bounds.
 * @example
 * ```typescript
 * await navigateToItem(page, 'app--table', 0);
 * ```
 */
export async function navigateToItem(
  page: ListReportPage,
  tableId: string,
  rowIndex: number,
  options?: ListReportOptions,
): Promise<void> {
  const result = await page.evaluate<{ success: boolean; reason?: string }>(
    LR_NAVIGATE_TO_ITEM_SCRIPT,
    { tableId, rowIndex },
  );
  if (!result.success) {
    const isOob = result.reason === 'index_out_of_bounds';
    throw new ControlError({
      code: isOob ? ErrorCode.ERR_CONTROL_AGGREGATION : ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: isOob
        ? `Row index ${String(rowIndex)} out of bounds in table "${tableId}"`
        : `Table not found: "${tableId}"`,
      attempted: `Navigate to row ${String(rowIndex)} in table: "${tableId}"`,
      retryable: !isOob,
      details: { tableId, rowIndex },
      suggestions: isOob
        ? [
            'Verify the row index is within the table bounds',
            'Use getTableRowCount() to check the number of rows first',
          ]
        : [...TABLE_NOT_FOUND_SUGGESTIONS],
    });
  }
  await stabilityWait(page, options);
}

/** Gets the names of all available variants on the List Report page.
 *
 * @intent List all available view variants on the List Report page.
 *
 * @param page - Playwright Page (or compatible subset).
 * @returns Array of variant names. Empty array if no VariantManagement control exists.
 * @example
 * ```typescript
 * const variants = await getAvailableVariants(page);
 * ```
 */
export async function getAvailableVariants(page: ListReportPage): Promise<readonly string[]> {
  const result = await page.evaluate<{ found: boolean; variants: readonly string[] }>(
    LR_GET_VARIANTS_SCRIPT,
  );
  return result.variants;
}

/** Selects a variant by name on the List Report page.
 *
 * @intent Select a saved view variant by its display name on the List Report.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param variantName - The display name of the variant to select.
 * @param options - Optional timeout and stability settings.
 * @throws ControlError if VariantManagement is not found or variant name does not exist.
 * @example
 * ```typescript
 * await selectVariant(page, 'My Saved View');
 * ```
 */
export async function selectVariant(
  page: ListReportPage,
  variantName: string,
  options?: ListReportOptions,
): Promise<void> {
  const result = await page.evaluate<{ success: boolean; reason?: string }>(
    LR_SELECT_VARIANT_SCRIPT,
    variantName,
  );
  if (!result.success) {
    const isNotFound = result.reason === 'variant_not_found';
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: isNotFound
        ? `Variant "${variantName}" not found`
        : 'VariantManagement control not found on current page',
      attempted: `Select variant: "${variantName}"`,
      retryable: !isNotFound,
      details: { variantName },
      suggestions: [...VARIANT_NOT_FOUND_SUGGESTIONS],
    });
  }
  await stabilityWait(page, options);
}
