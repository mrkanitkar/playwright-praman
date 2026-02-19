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

/** Minimal subset of Playwright's Page used by navigation functions. */
export interface NavigationPage {
  evaluate(pageFunction: string | ((...args: never[]) => unknown), arg?: unknown): Promise<unknown>;
  waitForFunction(
    pageFunction: (() => boolean) | string,
    options?: { readonly timeout?: number; readonly polling?: number },
  ): Promise<unknown>;
  goBack(options?: { readonly timeout?: number }): Promise<void>;
  goForward(options?: { readonly timeout?: number }): Promise<void>;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- browser-evaluated: window.hasher has no Node types
      (window as any).hasher.setHash(h);
    }) as (...args: never[]) => unknown,
    /* v8 ignore stop */
    hash,
  );
}

/**
 * Navigates to a SAP app by semantic object hash.
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
  const tileLocator = page.locator(`[aria-label="${tileTitle}"], [title="${tileTitle}"]`);
  const visible = await tileLocator.isVisible();
  if (!visible) {
    throw new NavigationError({
      code: ErrorCode.ERR_NAV_TILE_NOT_FOUND,
      message: `FLP tile not found: "${tileTitle}"`,
      attempted: `Navigate to FLP tile with title: "${tileTitle}"`,
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
    const queryString = new URLSearchParams(params as Record<string, string>).toString();
    hash = `${hash}?${queryString}`;
  }
  await setHash(page, hash);
  await stabilityWait(page, options);
}

/**
 * Navigates to a specific hash directly.
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
  const appTile = page.locator(`[aria-label="${appTitle}"], [title="${appTitle}"]`);
  await appTile.click();
  await stabilityWait(page, options);
}

/**
 * Returns the current URL hash (without leading '#').
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
  return hash as string;
}
