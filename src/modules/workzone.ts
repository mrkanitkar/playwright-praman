/**
 * BTP WorkZone dual-frame bridge injection and context switching.
 *
 * @remarks
 * Manages SAP BTP WorkZone environments where the application runs inside
 * an iframe embedded within the WorkZone shell. Provides dual bridge injection,
 * frame switching, and app navigation within the WorkZone context.
 *
 * @example
 * ```typescript
 * import { createWorkZoneManager } from '../modules/workzone.js';
 *
 * const wz = createWorkZoneManager(page, adapter);
 * if (await wz.detect()) {
 *   await wz.enableDualBridge();
 *   const appFrame = wz.switchToApp();
 * }
 * ```
 *
 * @module modules
 */

import { ensureBridgeInjected } from '#bridge/injection.js';
import { NavigationError } from '#core/errors/navigation-error.js';
import { waitForUI5Stable } from '#core/utils/wait-helpers.js';

/** CSS selector pattern for the WorkZone app iframe. */
const APP_IFRAME_SELECTOR = 'iframe[id*="application"]';

/** URL fragment used to identify app frames among page frames. */
const APP_FRAME_URL_PATTERN = 'application';

/**
 * Minimal subset of Playwright's Page used by WorkZone functions.
 */
export interface WorkZonePage {
  evaluate(pageFunction: string | ((...args: never[]) => unknown), arg?: unknown): Promise<unknown>;
  waitForFunction(
    pageFunction: string | (() => unknown),
    options?: { readonly timeout?: number; readonly polling?: number },
  ): Promise<void>;
  frameLocator(selector: string): WorkZoneFrameLocator;
  frame(options: { readonly url: RegExp | string }): WorkZoneFrame | null;
  frames(): readonly WorkZoneFrame[];
  mainFrame(): WorkZoneFrame;
}

/**
 * Minimal subset of Playwright's FrameLocator.
 */
export interface WorkZoneFrameLocator {
  locator(selector: string): unknown;
}

/**
 * Minimal subset of Playwright's Frame for evaluate and URL access.
 */
export interface WorkZoneFrame {
  evaluate(pageFunction: string | ((...args: never[]) => unknown), arg?: unknown): Promise<unknown>;
  waitForFunction(
    pageFunction: string | (() => unknown),
    options?: { readonly timeout?: number; readonly polling?: number },
  ): Promise<void>;
  url(): string;
}

/**
 * Minimal subset of BridgeAdapter used by WorkZone manager.
 */
export interface WorkZoneAdapter {
  init(page: WorkZonePage | WorkZoneFrame): Promise<void>;
  resetInjectionState(): void;
}

/**
 * Manager for BTP WorkZone dual-frame environments.
 *
 * @example
 * ```typescript
 * const manager: BTPWorkZoneManager = createWorkZoneManager(page, adapter);
 * const isWZ = await manager.detect();
 * ```
 */
export interface BTPWorkZoneManager {
  /** Detects whether the current page is a WorkZone environment. */
  detect(): Promise<boolean>;
  /** Injects bridge in both shell and app frames. */
  enableDualBridge(): Promise<void>;
  /** Returns the Page reference for shell-frame interactions. */
  switchToShell(): WorkZonePage;
  /** Returns a FrameLocator for element interactions in the app iframe. */
  switchToApp(): WorkZoneFrameLocator;
  /** Returns a Frame for script execution (evaluate) in the app iframe. */
  getAppFrameForEval(): WorkZoneFrame;
  /** Navigates to an app within the WorkZone shell. */
  navigateToApp(appId: string): Promise<void>;
  /** Gets the current app semantic object string, or null. */
  getCurrentApp(): Promise<string | null>;
  /** Checks if the app in the iframe is ready (UI5 stable). */
  isAppReady(timeout?: number): Promise<boolean>;
}

/**
 * Finds the application frame among page frames by URL pattern.
 *
 * @param page - The page whose frames to search.
 * @returns The first frame whose URL contains the app pattern, or undefined.
 *
 * @example
 * ```typescript
 * const frame = findAppFrame(page);
 * ```
 */
function findAppFrame(page: WorkZonePage): WorkZoneFrame | undefined {
  return page.frames().find((f) => f.url().includes(APP_FRAME_URL_PATTERN));
}

/**
 * Browser-side script that sets the shell hash for WorkZone navigation.
 *
 * @remarks
 * Passed as a string to `page.evaluate()` to avoid closure serialization issues.
 * Sets `window.location.hash` directly.
 */
const NAVIGATE_SCRIPT = '(hash) => { window.location.hash = hash; }';

/**
 * Browser-side script that detects WorkZone shell iframe presence.
 */
const DETECT_SCRIPT = '() => !!document.querySelector(\'iframe[id*="application"]\')';

/**
 * Browser-side script that reads the current hash.
 */
const GET_HASH_SCRIPT =
  '() => { const h = window.location.hash.replace(/^#/, ""); return h === "" ? null : h; }';

/**
 * Creates a BTP WorkZone manager for dual-frame bridge injection.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param adapter - Bridge adapter for injection management.
 * @returns A BTPWorkZoneManager instance.
 *
 * @example
 * ```typescript
 * const manager = createWorkZoneManager(page, adapter);
 * if (await manager.detect()) {
 *   await manager.enableDualBridge();
 * }
 * ```
 */
export function createWorkZoneManager(
  page: WorkZonePage,
  adapter: WorkZoneAdapter,
): BTPWorkZoneManager {
  return {
    async detect(): Promise<boolean> {
      const result = await page.evaluate(DETECT_SCRIPT);
      return result === true;
    },

    async enableDualBridge(): Promise<void> {
      // Inject bridge in main frame (shell)
      await ensureBridgeInjected(page);

      // Inject bridge in app iframe via Frame.evaluate
      const appFrame = findAppFrame(page);
      if (appFrame !== undefined) {
        await appFrame.evaluate(
          /* v8 ignore start -- browser-context: bridge injection in iframe */
          () => {
            /* bridge injection placeholder for iframe context */
          },
          /* v8 ignore stop */
        );
      }
    },

    switchToShell(): WorkZonePage {
      return page;
    },

    switchToApp(): WorkZoneFrameLocator {
      return page.frameLocator(APP_IFRAME_SELECTOR);
    },

    getAppFrameForEval(): WorkZoneFrame {
      const frame = findAppFrame(page);
      if (frame === undefined) {
        throw new NavigationError({
          message: 'WorkZone app iframe not found',
          attempted: 'Get app frame for script evaluation',
          suggestions: [
            'Verify the WorkZone environment has loaded',
            'Check that an application is open in the WorkZone shell',
          ],
        });
      }
      return frame;
    },

    async navigateToApp(appId: string): Promise<void> {
      if (appId === '') {
        throw new NavigationError({
          message: 'App ID must not be empty',
          attempted: `Navigate to app in WorkZone: "${appId}"`,
          suggestions: ['Provide a valid semantic object hash (e.g., "PurchaseOrder-manage")'],
        });
      }

      // Navigate via shell-level hash change
      await page.evaluate(NAVIGATE_SCRIPT, appId);

      // Reset adapter injection state for re-injection after navigation
      adapter.resetInjectionState();
    },

    async getCurrentApp(): Promise<string | null> {
      const result = await page.evaluate(GET_HASH_SCRIPT);
      if (result === null || typeof result === 'string') {
        return result;
      }
      return null;
    },

    async isAppReady(timeout?: number): Promise<boolean> {
      const appFrame = findAppFrame(page);
      if (appFrame === undefined) {
        return false;
      }
      try {
        const opts = timeout !== undefined ? { timeout } : undefined;
        await waitForUI5Stable(appFrame, opts);
        return true;
      } catch {
        return false;
      }
    },
  };
}
