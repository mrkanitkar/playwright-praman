/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * FLP Space and Section navigation for modern SAP Fiori Launchpad layouts.
 *
 * @remarks
 * Modern SAP FLP uses Space Tabs (`sap.m.IconTabFilter`) and Section Links
 * instead of flat tile-based layouts. These navigation functions use
 * **Playwright-native DOM interaction** rather than the UI5 bridge because
 * `sap.m.IconTabFilter` extends `sap.ui.core.Item` and does NOT expose
 * `press()`, `firePress()`, `fireSelect()`, or `fireTap()` methods.
 *
 * The UI5-native strategy fallback chain (`getDomRef().click()`) does NOT
 * reliably switch FLP Space Tabs. Playwright-native locators are the only
 * reliable approach for these controls.
 *
 * @see {@link https://ui5.sap.com/#/api/sap.m.IconTabFilter | sap.m.IconTabFilter API Reference}
 *
 * @example
 * ```typescript
 * import { navigateToSpace, navigateToSectionLink } from '../modules/navigation-space.js';
 *
 * await navigateToSpace(page, 'Procurement');
 * await navigateToSectionLink(page, 'Purchase Orders');
 * ```
 *
 * @module modules
 */

import { ErrorCode } from '#core/errors/codes.js';
import { NavigationError } from '#core/errors/navigation-error.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';
import { waitForUI5Stable } from '#core/utils/wait-helpers.js';

/**
 * Minimal subset of Playwright's Page used by Space/Section navigation.
 *
 * @remarks
 * Uses `getByText()` and `getByRole()` — Playwright-native locators —
 * because `sap.m.IconTabFilter` has no `press()` / `firePress()` methods.
 * The UI5 bridge cannot reliably interact with these controls.
 */
export interface SpaceNavigationPage {
  evaluate(pageFunction: string | ((...args: never[]) => unknown), arg?: unknown): Promise<unknown>;
  waitForFunction(
    pageFunction: (() => boolean) | string,
    options?: { readonly timeout?: number; readonly polling?: number },
  ): Promise<unknown>;
  getByText(text: string, options?: { readonly exact?: boolean }): SpaceNavigationLocator;
  getByRole(role: string, options?: { readonly name?: string }): SpaceNavigationLocator;
}

/** Minimal locator interface for Space/Section navigation interactions. */
interface SpaceNavigationLocator {
  click(options?: { readonly timeout?: number }): Promise<void>;
}

/**
 * Options for {@link navigateToSpace}.
 *
 * @example
 * ```typescript
 * const opts: SpaceNavigationOptions = { timeout: 10_000, exact: true };
 * ```
 */
export interface SpaceNavigationOptions {
  /** Timeout in ms for click and stability wait. Defaults to `DEFAULT_TIMEOUTS.UI5_WAIT`. */
  readonly timeout?: number;
  /** Whether to wait for UI5 stability after navigation. Defaults to `true`. */
  readonly waitForStable?: boolean;
  /** Whether to match the space title exactly. Defaults to `true`. */
  readonly exact?: boolean;
}

/**
 * Options for {@link navigateToSectionLink}.
 *
 * @example
 * ```typescript
 * const opts: SectionLinkNavigationOptions = { timeout: 10_000 };
 * ```
 */
export interface SectionLinkNavigationOptions {
  /** Timeout in ms for click and stability wait. Defaults to `DEFAULT_TIMEOUTS.UI5_WAIT`. */
  readonly timeout?: number;
  /** Whether to wait for UI5 stability after navigation. Defaults to `true`. */
  readonly waitForStable?: boolean;
}

/** Performs the stability wait after navigation unless `waitForStable: false`. */
async function stabilityWait(
  page: SpaceNavigationPage,
  timeout: number,
  waitForStable?: boolean,
): Promise<void> {
  if (waitForStable === false) {
    return;
  }
  await waitForUI5Stable(page, { timeout });
}

/**
 * Navigates to an FLP Space Tab by its visible title text.
 *
 * @capability ui5Navigation.navigateToApp
 * @intent Navigate to a specific Space Tab in the modern FLP layout.
 * Use when the SAP FLP uses Space-based navigation (IconTabFilter tabs at the top).
 *
 * @guarantee On success, the Space Tab is clicked and UI5 stability is reached.
 *
 * @prerequisite The FLP must be loaded and use a Space/Section layout
 * (BTP Work Zone or modern S/4HANA FLP).
 *
 * @ai
 * @aiContext Uses **Playwright-native `getByText()`** because `sap.m.IconTabFilter`
 * extends `sap.ui.core.Item` and does NOT have `press()`, `firePress()`,
 * `fireSelect()`, or `fireTap()` methods. The UI5-native strategy fallback
 * (`getDomRef().click()`) does NOT reliably switch Space Tabs.
 * Playwright DOM click is the ONLY reliable approach.
 *
 * @sapModule sap.m.IconTabFilter — FLP Space Tab (no press/firePress methods)
 * @businessContext Navigate between FLP Spaces in modern SAP BTP Work Zone or S/4HANA FLP.
 *
 * @param page - Playwright Page (or compatible subset with `getByText()`).
 * @param spaceTitle - Visible title text of the FLP Space Tab.
 * @param options - Navigation options including timeout and exact match control.
 * @throws NavigationError if spaceTitle is empty.
 *
 * @example
 * ```typescript
 * // Navigate to the "Procurement" space tab (exact match, default)
 * await navigateToSpace(page, 'Procurement');
 *
 * // Navigate with partial match (e.g., "Procure" matches "Procurement")
 * await navigateToSpace(page, 'Procure', { exact: false });
 *
 * // Navigate with custom timeout
 * await navigateToSpace(page, 'Procurement', { timeout: 15_000 });
 * ```
 */
export async function navigateToSpace(
  page: SpaceNavigationPage,
  spaceTitle: string,
  options?: SpaceNavigationOptions,
): Promise<void> {
  if (spaceTitle.trim() === '') {
    throw new NavigationError({
      code: ErrorCode.ERR_NAV_ROUTE_FAILED,
      message: 'Space title must not be empty',
      attempted: 'Navigate to FLP Space Tab by title',
      retryable: false,
      suggestions: [
        'Provide a non-empty space title string',
        'Check the FLP Space configuration for available space names',
      ],
    });
  }

  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.UI5_WAIT;
  const exact = options?.exact ?? true;

  const spaceLocator = page.getByText(spaceTitle, { exact });
  await spaceLocator.click({ timeout });
  await stabilityWait(page, timeout, options?.waitForStable);
}

/**
 * Navigates via an FLP Section Link in a Space-based layout.
 *
 * @capability ui5Navigation.navigateToApp
 * @intent Click a section link within a Space to navigate to a specific area.
 * Use after navigating to a Space when the target content is in a specific section.
 *
 * @guarantee On success, the section link is clicked and UI5 stability is reached.
 *
 * @prerequisite A Space must be active and the section link must be visible
 * in the current FLP view.
 *
 * @ai
 * @aiContext Uses **Playwright-native `getByRole('link')`** to locate the section
 * link by its accessible name. Section links in FLP are standard HTML anchor
 * elements, not UI5 controls, so Playwright-native interaction is the correct
 * approach.
 *
 * @sapModule sap.ushell — FLP section-based navigation within Spaces
 * @businessContext Navigate within FLP Space sections in modern SAP BTP Work Zone layouts.
 *
 * @param page - Playwright Page (or compatible subset with `getByRole()`).
 * @param linkName - Accessible name (visible text) of the section link.
 * @param options - Navigation options including timeout.
 * @throws NavigationError if linkName is empty.
 *
 * @example
 * ```typescript
 * // Navigate to a section link within the current space
 * await navigateToSectionLink(page, 'Purchase Orders');
 *
 * // Navigate with custom timeout
 * await navigateToSectionLink(page, 'Manage Suppliers', { timeout: 10_000 });
 * ```
 */
export async function navigateToSectionLink(
  page: SpaceNavigationPage,
  linkName: string,
  options?: SectionLinkNavigationOptions,
): Promise<void> {
  if (linkName.trim() === '') {
    throw new NavigationError({
      code: ErrorCode.ERR_NAV_ROUTE_FAILED,
      message: 'Section link name must not be empty',
      attempted: 'Navigate via FLP section link',
      retryable: false,
      suggestions: [
        'Provide a non-empty link name string',
        'Check the FLP section layout for available link names',
        'Ensure a Space is active before navigating to a section link',
      ],
    });
  }

  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.UI5_WAIT;

  const linkLocator = page.getByRole('link', { name: linkName });
  await linkLocator.click({ timeout });
  await stabilityWait(page, timeout, options?.waitForStable);
}
