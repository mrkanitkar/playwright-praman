/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Fiori Elements list helper functions for `sap.m.List`-based FE views.
 *
 * @remarks
 * Pure-function module (P1) with minimal page interface (P2).
 * All browser-context code uses string scripts via `page.evaluate()` (P12).
 * Functions use control discovery via `sap.ui.getCore().byId()` (P8).
 *
 * @example
 * ```typescript
 * import {
 *   feGetListItemCount,
 *   feGetListItemTitle,
 *   feClickListItem,
 * } from '../fe/fe-list-helpers.js';
 *
 * const count = await feGetListItemCount(page, 'myList');
 * const title = await feGetListItemTitle(page, 'myList', 0);
 * await feClickListItem(page, 'myList', 0);
 * ```
 *
 * @fioriElement ListReport
 * @sapModule sap.m.List
 * @ui5Version \>= 1.84.0
 *
 * @module fe
 */

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';

/** Shared suggestions for list-not-found errors. */
const LIST_NOT_FOUND_SUGGESTIONS = [
  'Verify the list control ID exists in the UI5 view',
  'Wait for the page to fully load before accessing the list',
] as const;

/** Shared suggestions for item-index-out-of-bounds errors. */
const INDEX_OOB_SUGGESTIONS = [
  'Verify the item index is within the list bounds',
  'Use feGetListItemCount() to check the number of items first',
] as const;

/**
 * Minimal page interface for FE list operations.
 *
 * @example
 * ```typescript
 * const page: FEListPage = { evaluate: async (s) => ({}) };
 * ```
 */
export interface FEListPage {
  /** Executes a script in the browser context and returns the result. */
  evaluate<TResult>(pageFunction: string, arg?: unknown): Promise<TResult>;
}

/**
 * Gets the number of items in a `sap.m.List` control.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param listId - The UI5 control ID of the list.
 * @returns The number of items in the list.
 * @throws ControlError if the list control is not found.
 *
 * @example
 * ```typescript
 * const count = await feGetListItemCount(page, 'myApp--productList');
 * ```
 */
export async function feGetListItemCount(page: FEListPage, listId: string): Promise<number> {
  const script =
    `(function(){try{var c=sap.ui.getCore().byId(${JSON.stringify(listId)});` +
    `if(!c)return{__error:"List not found: ${listId.replaceAll('"', '\\"')}"};` +
    `var items=c.getItems();return{__count:items.length};}catch(e){return{__error:e.message||String(e)};}})()`;

  const result = await page.evaluate<{ __count?: number; __error?: string }>(script);

  if (result.__error !== undefined) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `List control not found: "${listId}"`,
      attempted: `Get item count from list: "${listId}"`,
      retryable: true,
      details: { listId },
      suggestions: [...LIST_NOT_FOUND_SUGGESTIONS],
    });
  }

  return result.__count ?? 0;
}

/**
 * Gets the title of a list item at the specified index.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param listId - The UI5 control ID of the list.
 * @param itemIndex - Zero-based index of the item.
 * @returns The title text of the list item.
 * @throws ControlError with `ERR_CONTROL_AGGREGATION` if the index is out of bounds.
 *
 * @example
 * ```typescript
 * const title = await feGetListItemTitle(page, 'myApp--productList', 0);
 * ```
 */
export async function feGetListItemTitle(
  page: FEListPage,
  listId: string,
  itemIndex: number,
): Promise<string> {
  const script =
    `(function(){try{var c=sap.ui.getCore().byId(${JSON.stringify(listId)});` +
    `if(!c)return{__error:"List not found"};var items=c.getItems();` +
    `if(${String(itemIndex)}<0||${String(itemIndex)}>=items.length)return{__oob:true};` +
    `return{__title:items[${String(itemIndex)}].getTitle()};}catch(e){return{__error:e.message||String(e)};}})()`;

  const result = await page.evaluate<{ __title?: string; __oob?: boolean; __error?: string }>(
    script,
  );

  if (result.__oob === true) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_AGGREGATION,
      message: `List item index ${String(itemIndex)} out of bounds in list "${listId}"`,
      attempted: `Get title of item at index ${String(itemIndex)} in list: "${listId}"`,
      retryable: false,
      details: { listId, itemIndex },
      suggestions: [...INDEX_OOB_SUGGESTIONS],
    });
  }

  if (result.__error !== undefined) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `List control not found: "${listId}"`,
      attempted: `Get title of item at index ${String(itemIndex)} in list: "${listId}"`,
      retryable: true,
      details: { listId, itemIndex },
      suggestions: [...LIST_NOT_FOUND_SUGGESTIONS],
    });
  }

  return result.__title ?? '';
}

/**
 * Gets the description of a list item at the specified index.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param listId - The UI5 control ID of the list.
 * @param itemIndex - Zero-based index of the item.
 * @returns The description text of the list item, or empty string if none.
 * @throws ControlError with `ERR_CONTROL_AGGREGATION` if the index is out of bounds.
 *
 * @example
 * ```typescript
 * const desc = await feGetListItemDescription(page, 'myApp--productList', 0);
 * ```
 */
export async function feGetListItemDescription(
  page: FEListPage,
  listId: string,
  itemIndex: number,
): Promise<string> {
  const script =
    `(function(){try{var c=sap.ui.getCore().byId(${JSON.stringify(listId)});` +
    `if(!c)return{__error:"List not found"};var items=c.getItems();` +
    `if(${String(itemIndex)}<0||${String(itemIndex)}>=items.length)return{__oob:true};` +
    `var item=items[${String(itemIndex)}];` +
    `var desc=typeof item.getDescription==="function"?item.getDescription():"";` +
    `return{__desc:desc};}catch(e){return{__error:e.message||String(e)};}})()`;

  const result = await page.evaluate<{ __desc?: string; __oob?: boolean; __error?: string }>(
    script,
  );

  if (result.__oob === true) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_AGGREGATION,
      message: `List item index ${String(itemIndex)} out of bounds in list "${listId}"`,
      attempted: `Get description of item at index ${String(itemIndex)} in list: "${listId}"`,
      retryable: false,
      details: { listId, itemIndex },
      suggestions: [...INDEX_OOB_SUGGESTIONS],
    });
  }

  if (result.__error !== undefined) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `List control not found: "${listId}"`,
      attempted: `Get description of item at index ${String(itemIndex)} in list: "${listId}"`,
      retryable: true,
      details: { listId, itemIndex },
      suggestions: [...LIST_NOT_FOUND_SUGGESTIONS],
    });
  }

  return result.__desc ?? '';
}

/**
 * Finds the index of a list item by its title text.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param listId - The UI5 control ID of the list.
 * @param title - The title text to search for (exact match).
 * @returns The zero-based index of the matching item, or -1 if not found.
 * @throws ControlError if the list control is not found.
 *
 * @example
 * ```typescript
 * const index = await feFindListItemByTitle(page, 'myApp--productList', 'Widget A');
 * ```
 */
export async function feFindListItemByTitle(
  page: FEListPage,
  listId: string,
  title: string,
): Promise<number> {
  const script =
    `(function(){try{var c=sap.ui.getCore().byId(${JSON.stringify(listId)});` +
    `if(!c)return{__error:"List not found"};var items=c.getItems();` +
    `for(var i=0;i<items.length;i++){if(items[i].getTitle()===${JSON.stringify(title)})return{__index:i};}` +
    `return{__index:-1};}catch(e){return{__error:e.message||String(e)};}})()`;

  const result = await page.evaluate<{ __index?: number; __error?: string }>(script);

  if (result.__error !== undefined) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `List control not found: "${listId}"`,
      attempted: `Find list item by title "${title}" in list: "${listId}"`,
      retryable: true,
      details: { listId, title },
      suggestions: [...LIST_NOT_FOUND_SUGGESTIONS],
    });
  }

  return result.__index ?? -1;
}

/**
 * Clicks (presses) a list item at the specified index.
 *
 * @remarks
 * Fires the `press` event on the list item. Falls back to `tap` if `firePress` is unavailable.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param listId - The UI5 control ID of the list.
 * @param itemIndex - Zero-based index of the item to click.
 * @throws ControlError with `ERR_CONTROL_AGGREGATION` if the index is invalid.
 *
 * @example
 * ```typescript
 * await feClickListItem(page, 'myApp--productList', 0);
 * ```
 */
export async function feClickListItem(
  page: FEListPage,
  listId: string,
  itemIndex: number,
): Promise<void> {
  const script =
    `(function(){try{var c=sap.ui.getCore().byId(${JSON.stringify(listId)});` +
    `if(!c)return{__error:"List not found"};var items=c.getItems();` +
    `if(${String(itemIndex)}<0||${String(itemIndex)}>=items.length)return{__oob:true};` +
    `var item=items[${String(itemIndex)}];` +
    `if(typeof item.firePress==="function"){item.firePress();}` +
    `else if(typeof item.fireSelect==="function"){item.fireSelect();}` +
    `else if(typeof item.fireTap==="function"){item.fireTap();}` +
    `return{__ok:true};}catch(e){return{__error:e.message||String(e)};}})()`;

  const result = await page.evaluate<{ __ok?: boolean; __oob?: boolean; __error?: string }>(script);

  if (result.__oob === true) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_AGGREGATION,
      message: `List item index ${String(itemIndex)} out of bounds in list "${listId}"`,
      attempted: `Click item at index ${String(itemIndex)} in list: "${listId}"`,
      retryable: false,
      details: { listId, itemIndex },
      suggestions: [...INDEX_OOB_SUGGESTIONS],
    });
  }

  if (result.__error !== undefined) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `List control not found: "${listId}"`,
      attempted: `Click item at index ${String(itemIndex)} in list: "${listId}"`,
      retryable: true,
      details: { listId, itemIndex },
      suggestions: [...LIST_NOT_FOUND_SUGGESTIONS],
    });
  }
}

/**
 * Selects or deselects a list item at the specified index.
 *
 * @remarks
 * Calls `setSelected(selected)` on the list item and fires `selectionChange` on the list.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param listId - The UI5 control ID of the list.
 * @param itemIndex - Zero-based index of the item to select.
 * @param selected - `true` to select, `false` to deselect.
 * @throws ControlError with `ERR_CONTROL_AGGREGATION` if the index is invalid.
 *
 * @example
 * ```typescript
 * await feSelectListItem(page, 'myApp--productList', 0, true);
 * ```
 */
export async function feSelectListItem(
  page: FEListPage,
  listId: string,
  itemIndex: number,
  selected: boolean,
): Promise<void> {
  const selStr = selected ? 'true' : 'false';
  const script =
    `(function(){try{var c=sap.ui.getCore().byId(${JSON.stringify(listId)});` +
    `if(!c)return{__error:"List not found"};var items=c.getItems();` +
    `if(${String(itemIndex)}<0||${String(itemIndex)}>=items.length)return{__oob:true};` +
    `var item=items[${String(itemIndex)}];item.setSelected(${selStr});` +
    `c.fireSelectionChange({listItem:item,selected:${selStr}});` +
    `return{__ok:true};}catch(e){return{__error:e.message||String(e)};}})()`;

  const result = await page.evaluate<{ __ok?: boolean; __oob?: boolean; __error?: string }>(script);

  if (result.__oob === true) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_AGGREGATION,
      message: `List item index ${String(itemIndex)} out of bounds in list "${listId}"`,
      attempted: `${selected ? 'Select' : 'Deselect'} item at index ${String(itemIndex)} in list: "${listId}"`,
      retryable: false,
      details: { listId, itemIndex, selected },
      suggestions: [...INDEX_OOB_SUGGESTIONS],
    });
  }

  if (result.__error !== undefined) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `List control not found: "${listId}"`,
      attempted: `${selected ? 'Select' : 'Deselect'} item at index ${String(itemIndex)} in list: "${listId}"`,
      retryable: true,
      details: { listId, itemIndex, selected },
      suggestions: [...LIST_NOT_FOUND_SUGGESTIONS],
    });
  }
}
