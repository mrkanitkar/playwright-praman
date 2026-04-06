/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * FLP navigation functions for SAP Fiori Launchpad.
 *
 * @remarks
 * All navigation functions (except {@link getCurrentHash}) call
 * `waitForUI5Stable()` after the action unless `waitForStable: false`.
 *
 * @example
 * ```typescript
 * import { navigateToApp, navigateToHome } from '../modules/navigation.js';
 *
 * await navigateToApp(page, 'PurchaseOrder-manage');
 * await navigateToHome(page);
 * ```
 *
 * @module modules
 */

import { ErrorCode } from '#core/errors/codes.js';
import { NavigationError } from '#core/errors/navigation-error.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';
import { waitForUI5Stable } from '#core/utils/wait-helpers.js';

/**
 * Escapes a string for safe interpolation into a CSS attribute selector.
 *
 * @remarks
 * Prevents selector injection when tile/app titles contain `"`, `\`, or `]`.
 *
 * @param value - Raw attribute value.
 * @returns Escaped string safe for `[attr="value"]` selectors.
 */
function escapeCssAttr(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"');
}

/** Minimal subset of Playwright's Page used by navigation functions. */
export interface NavigationPage {
  evaluate(pageFunction: string | ((...args: never[]) => unknown), arg?: unknown): Promise<unknown>;
  waitForFunction(
    pageFunction: (() => boolean) | string,
    options?: { readonly timeout?: number; readonly polling?: number },
  ): Promise<unknown>;
  goBack(options?: { readonly timeout?: number }): Promise<unknown>;
  goForward(options?: { readonly timeout?: number }): Promise<unknown>;
  locator(selector: string): NavigationLocator;
}

/** Minimal subset of Playwright's Locator used by navigation functions. */
interface NavigationLocator {
  click(): Promise<void>;
  fill(value: string): Promise<void>;
  isVisible(): Promise<boolean>;
}

/**
 * Options for navigation functions.
 *
 * @example
 * ```typescript
 * const opts: NavigationOptions = { timeout: 10_000, waitForStable: true };
 * ```
 */
export interface NavigationOptions {
  /** Timeout in ms for stability wait. Defaults to `DEFAULT_TIMEOUTS.UI5_WAIT`. */
  readonly timeout?: number;
  /** Whether to wait for UI5 stability after navigation. Defaults to `true`. */
  readonly waitForStable?: boolean;
  /** Base URL for the application. Reserved for future use. */
  readonly baseURL?: string;
}

/**
 * Intent descriptor for SAP intent-based navigation.
 *
 * @example
 * ```typescript
 * const intent: NavigationIntent = { semanticObject: 'PurchaseOrder', action: 'manage' };
 * ```
 */
export interface NavigationIntent {
  /** SAP semantic object (e.g., 'PurchaseOrder'). */
  readonly semanticObject: string;
  /** SAP action (e.g., 'manage', 'display', 'create'). */
  readonly action: string;
}

/** Performs the stability wait after navigation unless `waitForStable: false`. */
async function stabilityWait(page: NavigationPage, options?: NavigationOptions): Promise<void> {
  if (options?.waitForStable === false) {
    return;
  }
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.UI5_WAIT;
  await waitForUI5Stable(page, { timeout });
}

/** Sets the FLP hash via `page.evaluate` using `window.hasher.setHash`. */
async function setHash(page: NavigationPage, hash: string): Promise<void> {
  await page.evaluate(
    /* v8 ignore start -- browser-context: executed in Chromium, not Node.js */
    ((h: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- browser context: window.hasher is an FLP runtime global (Hasher.js) with no Node.js type declarations
      const w = (window as any).hasher as { setHash?: (hash: string) => void } | undefined;
      w?.setHash?.(h);
    }) as (...args: never[]) => unknown,
    /* v8 ignore stop */
    hash,
  );
}

/**
 * Navigates to a SAP app by semantic object hash.
 *
 * @intent Navigate to a specific SAP Fiori app using its semantic object hash.
 * Use when the AI agent needs to open a particular app from the FLP.
 * @guarantee On success, the FLP hash is set to the given appId and UI5 is stable.
 * @prerequisite The page must be on the SAP Fiori Launchpad (FLP).
 * @ai
 * @aiContext Commonly used as the first step after authentication to reach the target app.
 * @sapModule sap.ushell.Container — FLP shell navigation via hasher.setHash()
 * @businessContext SAP Fiori Launchpad cross-app navigation using semantic objects.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param appId - Semantic object hash (e.g., 'PurchaseOrder-manage').
 * @param options - Navigation options.
 * @throws NavigationError if appId is empty.
 *
 * @example
 * ```typescript
 * await navigateToApp(page, 'PurchaseOrder-manage');
 * ```
 */
export async function navigateToApp(
  page: NavigationPage,
  appId: string,
  options?: NavigationOptions,
): Promise<void> {
  if (appId.trim() === '') {
    throw new NavigationError({
      code: ErrorCode.ERR_NAV_ROUTE_FAILED,
      message: 'Application ID must not be empty',
      attempted: 'Navigate to SAP application by semantic object hash',
      retryable: false,
      suggestions: [
        'Provide a valid semantic object hash (e.g., "PurchaseOrder-manage")',
        'Check the FLP tile configuration for the correct app ID',
      ],
    });
  }
  await setHash(page, appId);
  await stabilityWait(page, options);
}

/**
 * Navigates to an FLP tile by its title text.
 *
 * @remarks
 * This function only works for **GenericTile-based FLP layouts** (classic FLP).
 * For modern Space/Section-based FLP layouts (BTP Work Zone, S/4HANA 2021+),
 * use {@link navigateToSpace} and {@link navigateToSectionLink} from
 * `navigation-space.ts` instead.
 *
 * @intent Open a Fiori Launchpad tile by its visible title.
 * Use when the agent needs to navigate via UI interaction rather than hash.
 * @guarantee On success, the tile is clicked and UI5 stability is reached.
 * @prerequisite The FLP home page must be loaded and the tile must be visible.
 * @ai
 * @aiContext Use navigateToApp() for hash-based navigation; use this when
 * the semantic object hash is unknown but the tile title is visible.
 * For Space-based FLP layouts, use navigateToSpace() + navigateToSectionLink().
 * @sapModule sap.ushell.ui.launchpad.Tile — FLP tile click navigation (GenericTile layout only)
 * @businessContext User-facing tile-based navigation on SAP Fiori Launchpad home screen.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param tileTitle - Title text of the FLP tile.
 * @param options - Navigation options.
 * @throws NavigationError if tile is not found or not visible.
 *
 * @example
 * ```typescript
 * await navigateToTile(page, 'Purchase Orders');
 * ```
 */
export async function navigateToTile(
  page: NavigationPage,
  tileTitle: string,
  options?: NavigationOptions,
): Promise<void> {
  const escaped = escapeCssAttr(tileTitle);
  const tileLocator = page.locator(`[aria-label="${escaped}"], [title="${escaped}"]`);
  const visible = await tileLocator.isVisible();
  if (!visible) {
    throw new NavigationError({
      code: ErrorCode.ERR_NAV_TILE_NOT_FOUND,
      message: `FLP tile not found: "${tileTitle}"`,
      attempted: `Navigate to FLP tile with title: "${tileTitle}"`,
      retryable: true,
      suggestions: [
        'Verify the tile title matches exactly (case-sensitive)',
        'Check if the FLP page has fully loaded (waitForUI5Stable)',
        'Try using navigateToApp with the semantic object hash instead',
      ],
    });
  }
  await tileLocator.click();
  await stabilityWait(page, options);
}

/**
 * Navigates to an SAP intent with optional parameters.
 *
 * @intent Navigate using a structured semantic object + action pair with optional query params.
 * Prefer this over navigateToApp() when parameters need to be passed to the target app.
 * @guarantee On success, the FLP hash is set to the intent with parameters and UI5 is stable.
 * @ai
 * @aiContext Build the intent from the app's cross-navigation inbound config.
 * Parameters are appended as URL query string (e.g., `#PurchaseOrder-manage?PurchaseOrder=4500001234`).
 * @sapModule sap.ushell.Container — FLP intent-based navigation with parameters
 * @businessContext Cross-app navigation with context parameters in SAP Fiori.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param intent - Semantic object and action descriptor.
 * @param params - Optional query parameters for the intent.
 * @param options - Navigation options.
 *
 * @example
 * ```typescript
 * await navigateToIntent(page, { semanticObject: 'PurchaseOrder', action: 'manage' });
 * ```
 */
export async function navigateToIntent(
  page: NavigationPage,
  intent: NavigationIntent,
  params?: Readonly<Record<string, string>>,
  options?: NavigationOptions,
): Promise<void> {
  let hash = `${intent.semanticObject}-${intent.action}`;
  if (params !== undefined && Object.keys(params).length > 0) {
    // Type assertion: URLSearchParams constructor does not accept Readonly<Record<>>, but does not mutate input
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    hash = `${hash}?${queryString}`;
  }
  await setHash(page, hash);
  await stabilityWait(page, options);
}

/**
 * Navigates to a specific hash directly.
 *
 * @intent Set the FLP URL hash directly for low-level navigation.
 * @guarantee On success, the FLP hash is set to the given value and UI5 is stable.
 * @ai
 * @aiContext Use when the full hash is known. For structured navigation, prefer navigateToIntent().
 * @sapModule sap.ushell.Container — Direct hash manipulation via window.hasher
 *
 * @param page - Playwright Page (or compatible subset).
 * @param hash - The hash to navigate to (without leading '#').
 * @param options - Navigation options.
 *
 * @example
 * ```typescript
 * await navigateToHash(page, 'Shell-home');
 * ```
 */
export async function navigateToHash(
  page: NavigationPage,
  hash: string,
  options?: NavigationOptions,
): Promise<void> {
  await setHash(page, hash);
  await stabilityWait(page, options);
}

/**
 * Navigates to the FLP home screen (#Shell-home).
 *
 * @intent Return to the Fiori Launchpad home screen.
 * Use between test scenarios or to reset the navigation state.
 * @guarantee On success, the hash is set to 'Shell-home' and UI5 is stable.
 * @ai
 * @aiContext Commonly used to return to the launchpad between tests or after completing a flow.
 * @sapModule sap.ushell.Container — FLP home navigation
 * @businessContext Reset navigation to the SAP Fiori Launchpad home screen.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param options - Navigation options.
 *
 * @example
 * ```typescript
 * await navigateToHome(page);
 * ```
 */
export async function navigateToHome(
  page: NavigationPage,
  options?: NavigationOptions,
): Promise<void> {
  await setHash(page, 'Shell-home');
  await stabilityWait(page, options);
}

/**
 * Navigates back in browser history.
 *
 * @intent Go back to the previous page in browser history.
 * @guarantee On success, the browser has navigated back and UI5 is stable.
 * @ai
 * @aiContext Uses Playwright's goBack(). Waits for UI5 stability after navigation.
 * @sapModule sap.ushell.Container — Browser history back navigation
 *
 * @param page - Playwright Page (or compatible subset).
 * @param options - Navigation options.
 *
 * @example
 * ```typescript
 * await navigateBack(page);
 * ```
 */
export async function navigateBack(
  page: NavigationPage,
  options?: NavigationOptions,
): Promise<void> {
  await page.goBack();
  await stabilityWait(page, options);
}

/**
 * Navigates forward in browser history.
 *
 * @intent Go forward in browser history after a back navigation.
 * @guarantee On success, the browser has navigated forward and UI5 is stable.
 * @ai
 * @aiContext Uses Playwright's goForward(). Waits for UI5 stability after navigation.
 * @sapModule sap.ushell.Container — Browser history forward navigation
 *
 * @param page - Playwright Page (or compatible subset).
 * @param options - Navigation options.
 *
 * @example
 * ```typescript
 * await navigateForward(page);
 * ```
 */
export async function navigateForward(
  page: NavigationPage,
  options?: NavigationOptions,
): Promise<void> {
  await page.goForward();
  await stabilityWait(page, options);
}

/**
 * Searches for an app in the FLP shell search bar and opens it.
 *
 * @intent Search for and open an application using the FLP shell search bar.
 * Use when the tile is not visible on the home screen but can be found via search.
 * @guarantee On success, the app matching the title is opened and UI5 is stable.
 * @ai
 * @aiContext Types the app title into the shell search field, then clicks the matching result.
 * Fallback navigation method when tile-based or hash-based navigation is not feasible.
 * @sapModule sap.ushell.ui.shell.ShellHeadItem — FLP shell search bar interaction
 * @businessContext App discovery via FLP search when the user has many tiles or the tile is hidden.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param appTitle - Title of the app to search for.
 * @param options - Navigation options.
 *
 * @example
 * ```typescript
 * await searchAndOpenApp(page, 'Purchase Orders');
 * ```
 */
export async function searchAndOpenApp(
  page: NavigationPage,
  appTitle: string,
  options?: NavigationOptions,
): Promise<void> {
  const searchField = page.locator('#shellSearchField, [id$="shellSearch-input"]');
  await searchField.fill(appTitle);
  const escapedTitle = escapeCssAttr(appTitle);
  const appTile = page.locator(`[aria-label="${escapedTitle}"], [title="${escapedTitle}"]`);
  await appTile.click();
  await stabilityWait(page, options);
}

/**
 * Returns the current URL hash (without leading '#').
 *
 * @intent Read the current FLP navigation hash to determine which app is active.
 * @guarantee Returns the current hash string without the leading '#'.
 * @ai
 * @aiContext Pure read operation (no stability wait). Use for assertions or conditional navigation.
 * @sapModule sap.ushell.Container — Read current FLP hash from window.location.hash
 * @businessContext Determine the current active SAP Fiori app from the URL hash.
 *
 * @param page - Playwright Page (or compatible subset).
 * @returns The current hash string.
 *
 * @example
 * ```typescript
 * const hash = await getCurrentHash(page);
 * // 'PurchaseOrder-manage'
 * ```
 */
export async function getCurrentHash(page: NavigationPage): Promise<string> {
  const hash = await page.evaluate(
    /* v8 ignore start -- browser-context: executed in Chromium, not Node.js */
    (() => window.location.hash.replace('#', '')) as (...args: never[]) => unknown,
    /* v8 ignore stop */
  );
  // Type assertion: page.evaluate returns unknown; browser lambda always returns a string
  return hash as string;
}
