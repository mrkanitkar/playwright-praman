/**
 * Navigation fixtures — Playwright fixture wrapping FLP navigation functions.
 *
 * @remarks
 * Provides two fixtures for SAP Fiori Launchpad navigation:
 *
 * - `ui5Navigation` — wraps all 9 navigation module functions, injecting
 *   `page` and `baseURL` automatically. Creates a `'nav'` child logger.
 *
 * - `btpWorkZone` — creates a BTP WorkZone manager for dual-frame environments.
 *
 * Cross-fixture dependencies (`pramanConfig`, `rootLogger`) are declared
 * as `option` placeholders (PW-MERGE-1) so they can be provided by
 * `coreTest` via `mergeTests()`.
 *
 * @example
 * ```typescript
 * import { navTest } from '#fixtures/nav-fixtures.js';
 *
 * navTest('navigates to app', async ({ ui5Navigation }) => {
 *   await ui5Navigation.navigateToApp('PurchaseOrder-manage');
 * });
 * ```
 *
 * @module fixtures
 */

import { test as base } from '@playwright/test';
import type { Logger } from 'pino';

import type { NavigationIntent, NavigationOptions } from '../modules/navigation.js';
import {
  getCurrentHash,
  navigateBack,
  navigateForward,
  navigateToApp,
  navigateToHash,
  navigateToHome,
  navigateToIntent,
  navigateToTile,
  searchAndOpenApp,
} from '../modules/navigation.js';
import type { BTPWorkZoneManager } from '../modules/workzone.js';
import { createWorkZoneManager } from '../modules/workzone.js';

import { resetPageInjection } from '#bridge/injection.js';
import type { PramanConfig } from '#core/config/index.js';
import { createLogger } from '#core/logging/index.js';

/**
 * UI5 Navigation API provided by the `ui5Navigation` fixture.
 *
 * @ai
 * @aiContext Use to navigate between SAP Fiori Launchpad apps and views.
 *
 * @remarks
 * Wraps all 9 FLP navigation module functions. The `page` argument is
 * injected automatically from the Playwright fixture system.
 *
 * @example
 * ```typescript
 * test('navigate to app', async ({ ui5Navigation }) => {
 *   await ui5Navigation.navigateToApp('PurchaseOrder-manage');
 *   const hash = await ui5Navigation.getCurrentHash();
 * });
 * ```
 */
export interface UI5NavigationAPI {
  /**
   * Navigates to a SAP app by semantic object hash.
   *
   * @ai
   * @aiContext Use to open a Fiori app by its semantic object hash.
   *
   * @param appId - Semantic object hash (e.g., 'PurchaseOrder-manage').
   * @param options - Navigation options.
   *
   * @example
   * ```typescript
   * await ui5Navigation.navigateToApp('PurchaseOrder-manage');
   * ```
   */
  navigateToApp(appId: string, options?: NavigationOptions): Promise<void>;

  /**
   * Navigates to an FLP tile by its title text.
   *
   * @ai
   * @aiContext Use to click a Fiori Launchpad tile by its visible title.
   *
   * @param title - Title text of the FLP tile.
   * @param options - Navigation options.
   *
   * @example
   * ```typescript
   * await ui5Navigation.navigateToTile('Purchase Orders');
   * ```
   */
  navigateToTile(title: string, options?: NavigationOptions): Promise<void>;

  /**
   * Navigates to an SAP intent with optional parameters.
   *
   * @ai
   * @aiContext Use to navigate via semantic object + action with params.
   *
   * @param intent - Semantic object and action descriptor.
   * @param params - Optional query parameters for the intent.
   * @param options - Navigation options.
   *
   * @example
   * ```typescript
   * await ui5Navigation.navigateToIntent(
   *   { semanticObject: 'PurchaseOrder', action: 'manage' },
   *   { CompanyCode: '1000' },
   * );
   * ```
   */
  navigateToIntent(
    intent: NavigationIntent,
    params?: Readonly<Record<string, string>>,
    options?: NavigationOptions,
  ): Promise<void>;

  /**
   * Navigates to a specific hash directly.
   *
   * @ai
   * @aiContext Use to navigate directly to a URL hash fragment.
   *
   * @param hash - The hash to navigate to (without leading '#').
   * @param options - Navigation options.
   *
   * @example
   * ```typescript
   * await ui5Navigation.navigateToHash('Shell-home');
   * ```
   */
  navigateToHash(hash: string, options?: NavigationOptions): Promise<void>;

  /**
   * Navigates to the FLP home screen.
   *
   * @ai
   * @aiContext Use to return to the Fiori Launchpad home page.
   *
   * @param options - Navigation options.
   *
   * @example
   * ```typescript
   * await ui5Navigation.navigateToHome();
   * ```
   */
  navigateToHome(options?: NavigationOptions): Promise<void>;

  /**
   * Navigates back in browser history.
   *
   * @ai
   * @aiContext Use to go back to the previous page in history.
   *
   * @param options - Navigation options.
   *
   * @example
   * ```typescript
   * await ui5Navigation.navigateBack();
   * ```
   */
  navigateBack(options?: NavigationOptions): Promise<void>;

  /**
   * Navigates forward in browser history.
   *
   * @ai
   * @aiContext Use to go forward to the next page in history.
   *
   * @param options - Navigation options.
   *
   * @example
   * ```typescript
   * await ui5Navigation.navigateForward();
   * ```
   */
  navigateForward(options?: NavigationOptions): Promise<void>;

  /**
   * Searches for an app in the FLP shell search bar and opens it.
   *
   * @ai
   * @aiContext Use to find and launch a Fiori app via shell search.
   *
   * @param title - Title of the app to search for.
   * @param options - Navigation options.
   *
   * @example
   * ```typescript
   * await ui5Navigation.searchAndOpenApp('Purchase Orders');
   * ```
   */
  searchAndOpenApp(title: string, options?: NavigationOptions): Promise<void>;

  /**
   * Returns the current URL hash (without leading '#').
   *
   * @ai
   * @aiContext Use to read the current navigation hash for assertions.
   *
   * @returns The current hash string.
   *
   * @example
   * ```typescript
   * const hash = await ui5Navigation.getCurrentHash();
   * ```
   */
  getCurrentHash(): Promise<string>;
}

/**
 * Navigation fixture types for Playwright's `test.extend()`.
 *
 * @ai
 * @aiContext Fixture types for FLP navigation and BTP WorkZone.
 *
 * @example
 * ```typescript
 * import type { NavFixtures } from '#fixtures/nav-fixtures.js';
 * ```
 */
export interface NavFixtures {
  /** Wraps all 9 FLP navigation functions with automatic page injection. */
  ui5Navigation: UI5NavigationAPI;
  /** BTP WorkZone manager for dual-frame environments. */
  btpWorkZone: BTPWorkZoneManager;
}

/**
 * Worker-scoped cross-fixture dependencies provided by coreTest via mergeTests.
 *
 * @remarks
 * Declared as `{ option: true, scope: 'worker' }` placeholders (PW-MERGE-1).
 */
export interface NavWorkerDeps {
  pramanConfig: Readonly<PramanConfig>;
  rootLogger: Logger;
}

// ── NavigationPage / WorkZonePage compatibility ──────────────────────
//
// The module functions accept minimal `NavigationPage` / `WorkZonePage`
// interfaces. Playwright's `Page` satisfies both at runtime. Using
// `as never` casts here to avoid importing Playwright's full `Page` type
// while maintaining type safety at the module boundary.

/**
 * Playwright test object extended with navigation fixtures.
 *
 * @remarks
 * Provides `ui5Navigation` (all 9 nav functions) and `btpWorkZone`
 * (WorkZone manager). Dependencies from coreTest (`pramanConfig`,
 * `rootLogger`) are declared as option placeholders.
 *
 * @example
 * ```typescript
 * import { navTest } from '#fixtures/nav-fixtures.js';
 *
 * navTest('navigate to app', async ({ ui5Navigation }) => {
 *   await ui5Navigation.navigateToApp('PurchaseOrder-manage');
 * });
 * ```
 */
export const navTest = base.extend<NavFixtures, NavWorkerDeps>({
  // ── Cross-fixture option placeholders (PW-MERGE-1) ────────────────

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- PW-MERGE-1: placeholder overridden by mergeTests
  pramanConfig: [undefined!, { option: true, scope: 'worker' }],
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- PW-MERGE-1: placeholder overridden by mergeTests
  rootLogger: [undefined!, { option: true, scope: 'worker' }],

  // ── ui5Navigation fixture ─────────────────────────────────────────

  ui5Navigation: async ({ page, pramanConfig, rootLogger }, use) => {
    const log = createLogger('nav', rootLogger);
    log.debug('Initializing ui5Navigation fixture');

    const baseURL = pramanConfig.auth?.baseUrl;

    const nav: UI5NavigationAPI = {
      navigateToApp: async (appId, options?) =>
        navigateToApp(
          page as never,
          appId,
          baseURL !== undefined ? { baseURL, ...options } : options,
        ),
      navigateToTile: async (title, options?) => navigateToTile(page as never, title, options),
      navigateToIntent: async (intent, params?, options?) =>
        navigateToIntent(page as never, intent, params, options),
      navigateToHash: async (hash, options?) => navigateToHash(page as never, hash, options),
      navigateToHome: async (options?) => navigateToHome(page as never, options),
      navigateBack: async (options?) => navigateBack(page as never, options),
      navigateForward: async (options?) => navigateForward(page as never, options),
      searchAndOpenApp: async (title, options?) => searchAndOpenApp(page as never, title, options),
      getCurrentHash: async () => getCurrentHash(page as never),
    };

    await use(nav);
  },

  // ── btpWorkZone fixture ───────────────────────────────────────────

  btpWorkZone: async ({ page }, use) => {
    // Create a minimal WorkZoneAdapter shim that delegates to page-level injection
    const adapterShim = {
      async init(): Promise<void> {
        // No-op: bridge injection is handled lazily by ensureBridgeInjected
      },
      resetInjectionState(): void {
        resetPageInjection(page);
      },
    };
    const manager = createWorkZoneManager(page as never, adapterShim as never);
    await use(manager);
  },
});
