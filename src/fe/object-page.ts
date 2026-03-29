/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Fiori Elements Object Page operations for sap.uxap.ObjectPageLayout.
 * Pure-function module using string scripts via `page.evaluate()`.
 *
 * @module fe
 */

import {
  OP_CLICK_BUTTON_SCRIPT,
  OP_FIND_LAYOUT_SCRIPT,
  OP_GET_HEADER_TITLE_SCRIPT,
  OP_GET_SECTION_DATA_SCRIPT,
  OP_GET_SECTIONS_SCRIPT,
  OP_IS_EDIT_MODE_SCRIPT,
  OP_NAVIGATE_SECTION_SCRIPT,
  OP_STABILITY_SCRIPT,
} from './object-page-scripts.js';

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';
import { NavigationError } from '#core/errors/navigation-error.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';

/**
 * Options for Object Page operations.
 *
 * @example
 * ```typescript
 * const opts: ObjectPageOptions = { timeout: 10_000 };
 * ```
 */
export interface ObjectPageOptions {
  /** Timeout in ms. Defaults to `DEFAULT_TIMEOUTS.CONTROL_DISCOVERY`. */
  readonly timeout?: number;
  /** Skip UI5 stability wait after actions. Defaults to `false`. */
  readonly skipStabilityWait?: boolean;
}

/** Describes a section within an Object Page layout.
 * @example
 * ```typescript
 * const s: ObjectPageSection = { id: 'sec1', title: 'General', visible: true, index: 0, subSections: [] };
 * ```
 */
export interface ObjectPageSection {
  readonly id: string;
  readonly title: string;
  readonly visible: boolean;
  readonly index: number;
  readonly subSections: readonly { readonly id: string; readonly title: string }[];
}

/** Key-value pairs representing form field data from a section.
 * @example
 * ```typescript
 * const data: SectionData = { 'Product Name': 'Widget A' };
 * ```
 */
export type SectionData = Readonly<Record<string, unknown>>;

/** Minimal page interface for Object Page operations.
 * @example
 * ```typescript
 * const page: ObjectPagePage = { evaluate: async () => ({}), waitForFunction: async () => ({}) };
 * ```
 */
export interface ObjectPagePage {
  /** Executes a script in the browser context and returns the result. */
  evaluate<TResult>(pageFunction: string, arg?: unknown): Promise<TResult>;
  /** Waits until a browser-side predicate returns a truthy value. */
  waitForFunction(
    pageFunction: string,
    arg?: unknown,
    options?: { timeout?: number; polling?: number },
  ): Promise<unknown>;
}

/** Waits for UI5 stability unless `skipStabilityWait` is set. */
async function stabilityWait(page: ObjectPagePage, options?: ObjectPageOptions): Promise<void> {
  if (options?.skipStabilityWait === true) return;
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.CONTROL_DISCOVERY;
  await page.waitForFunction(OP_STABILITY_SCRIPT, undefined, { timeout, polling: 100 });
}

/** Finds the sap.uxap.ObjectPageLayout control on the current page.
 *
 * @intent Discover the Object Page layout control on a Fiori Elements Object Page.
 *
 * @param page - Page to evaluate on.
 * @param options - Optional timeout settings.
 * @returns The control ID of the ObjectPageLayout.
 * @throws ControlError if no ObjectPageLayout is found.
 * @example
 * ```typescript
 * const layoutId = await getObjectPageLayout(page);
 * ```
 */
export async function getObjectPageLayout(
  page: ObjectPagePage,
  options?: ObjectPageOptions,
): Promise<string> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.CONTROL_DISCOVERY;
  const result = await page.evaluate<{ found: boolean; id: string }>(OP_FIND_LAYOUT_SCRIPT);
  if (!result.found) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: 'ObjectPageLayout not found on current page',
      attempted: 'Find sap.uxap.ObjectPageLayout control',
      retryable: true,
      details: { timeout },
      suggestions: [
        'Verify the current page is a Fiori Elements Object Page',
        'Wait for the page to fully load before calling getObjectPageLayout',
        'Check if the app uses sap.uxap.ObjectPageLayout',
      ],
    });
  }
  return result.id;
}

/** Navigates to a specific section within the Object Page by title or ID.
 *
 * @intent Scroll to and activate a specific section on the Object Page.
 *
 * @param page - Page to evaluate on.
 * @param sectionIdentifier - Section title or ID.
 * @param options - Optional timeout and stability settings.
 * @throws NavigationError if the section is not found.
 * @example
 * ```typescript
 * await navigateToSection(page, 'General Information');
 * ```
 */
export async function navigateToSection(
  page: ObjectPagePage,
  sectionIdentifier: string,
  options?: ObjectPageOptions,
): Promise<void> {
  const result = await page.evaluate<{ success: boolean; reason?: string }>(
    OP_NAVIGATE_SECTION_SCRIPT,
    sectionIdentifier,
  );
  if (!result.success) {
    throw new NavigationError({
      code: ErrorCode.ERR_NAV_ROUTE_FAILED,
      message: `Object Page section not found: "${sectionIdentifier}"`,
      attempted: `Navigate to Object Page section: "${sectionIdentifier}"`,
      retryable: true,
      details: { sectionIdentifier },
      suggestions: [
        'Verify the section title or ID is correct',
        'Use getObjectPageSections() to list available sections',
        'Check if the section is visible on the page',
      ],
    });
  }
  await stabilityWait(page, options);
}

/** Reads form field data from a section of the Object Page.
 *
 * @intent Extract all form field key-value pairs from an Object Page section.
 *
 * @param page - Page to evaluate on.
 * @param sectionIdentifier - Section title or ID.
 * @returns Key-value pairs from form controls in the section.
 * @throws NavigationError if the section is not found.
 * @example
 * ```typescript
 * const data = await getSectionData(page, 'General Information');
 * ```
 */
export async function getSectionData(
  page: ObjectPagePage,
  sectionIdentifier: string,
): Promise<SectionData> {
  const result = await page.evaluate<{ found: boolean; data: Record<string, unknown> }>(
    OP_GET_SECTION_DATA_SCRIPT,
    sectionIdentifier,
  );
  if (!result.found) {
    throw new NavigationError({
      code: ErrorCode.ERR_NAV_ROUTE_FAILED,
      message: `Object Page section not found: "${sectionIdentifier}"`,
      attempted: `Read form data from Object Page section: "${sectionIdentifier}"`,
      retryable: true,
      details: { sectionIdentifier },
      suggestions: [
        'Verify the section title or ID is correct',
        'Use getObjectPageSections() to list available sections',
      ],
    });
  }
  return result.data;
}

/** Clicks a button in the Object Page header actions or footer bar.
 *
 * @intent Click a named button in the Object Page header or footer toolbar.
 *
 * @param page - Page to evaluate on.
 * @param buttonName - Text label of the button.
 * @param options - Optional timeout and stability settings.
 * @throws ControlError if the button is not found.
 * @example
 * ```typescript
 * await clickObjectPageButton(page, 'Edit');
 * ```
 */
export async function clickObjectPageButton(
  page: ObjectPagePage,
  buttonName: string,
  options?: ObjectPageOptions,
): Promise<void> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.CONTROL_DISCOVERY;
  const result = await page.evaluate<{ clicked: boolean; location?: string; reason?: string }>(
    OP_CLICK_BUTTON_SCRIPT,
    buttonName,
  );
  if (!result.clicked) {
    throw new ControlError({
      code: ErrorCode.ERR_CONTROL_NOT_FOUND,
      message: `Object Page button not found: "${buttonName}"`,
      attempted: `Click Object Page button: "${buttonName}"`,
      retryable: true,
      details: { buttonName, timeout },
      suggestions: [
        'Verify the button text matches exactly (case-sensitive)',
        'Check if the button is in the header actions or footer bar',
        'Ensure the Object Page has loaded completely',
      ],
    });
  }
  await stabilityWait(page, options);
}

/** Clicks the "Edit" button on the Object Page.
 *
 * @intent Switch the Object Page to edit mode by clicking the Edit button.
 *
 * @example
 * ```typescript
 * await clickEditButton(page);
 * ```
 */
export async function clickEditButton(
  page: ObjectPagePage,
  options?: ObjectPageOptions,
): Promise<void> {
  await clickObjectPageButton(page, 'Edit', options);
}

/** Clicks the "Save" button on the Object Page.
 *
 * @intent Persist changes by clicking the Save button on the Object Page footer.
 *
 * @example
 * ```typescript
 * await clickSaveButton(page);
 * ```
 */
export async function clickSaveButton(
  page: ObjectPagePage,
  options?: ObjectPageOptions,
): Promise<void> {
  await clickObjectPageButton(page, 'Save', options);
}

/** Returns all sections in the Object Page with visibility, index, and sub-sections.
 *
 * @intent List all sections in the Object Page layout for discovery or assertion.
 *
 * @param page - Page to evaluate on.
 * @returns Array of section descriptors.
 * @example
 * ```typescript
 * const sections = await getObjectPageSections(page);
 * ```
 */
export async function getObjectPageSections(
  page: ObjectPagePage,
): Promise<readonly ObjectPageSection[]> {
  return page.evaluate<ObjectPageSection[]>(OP_GET_SECTIONS_SCRIPT);
}

/** Returns the header title of the Object Page.
 *
 * @intent Read the Object Page header title for assertion or identification.
 *
 * @param page - Page to evaluate on.
 * @returns The header title string, or empty string if not found.
 * @example
 * ```typescript
 * const title = await getHeaderTitle(page);
 * ```
 */
export async function getHeaderTitle(page: ObjectPagePage): Promise<string> {
  return page.evaluate<string>(OP_GET_HEADER_TITLE_SCRIPT);
}

/** Checks whether the Object Page is currently in edit mode.
 *
 * @intent Determine the current edit/display state of the Object Page.
 *
 * @remarks Checks `showFooter` property and `ui` model `/editable`/`/editMode`.
 * @param page - Page to evaluate on.
 * @returns `true` if in edit mode, `false` otherwise.
 * @example
 * ```typescript
 * const editing = await isInEditMode(page);
 * ```
 */
export async function isInEditMode(page: ObjectPagePage): Promise<boolean> {
  return page.evaluate<boolean>(OP_IS_EDIT_MODE_SCRIPT);
}
