/**
 * Node-side bridge injection engine (W14: lazy-only injection).
 *
 * @remarks
 * Manages the lifecycle of bridge injection into the browser context.
 * All injection is lazy — triggered on first UI5 operation, not at
 * fixture initialization (page is `about:blank` at that point).
 *
 * Pattern: Every adapter public method calls `ensureBridgeInjected()`
 * before executing browser operations (W19).
 *
 * @module bridge
 */

import type { BridgePage } from './adapter.js';
import { BRIDGE_GLOBALS, BRIDGE_TIMEOUTS } from './bridge-constants.js';
import { createBridgeInjectionScript } from './browser-scripts/inject-ui5.js';

/** Tracks which pages have been injected (WeakSet avoids memory leaks). */
const injectedPages = new WeakSet<BridgePage>();

/**
 * Checks whether the bridge is ready on the given page.
 *
 * @param page - The Playwright page to check.
 * @returns `true` if `window.__praman_bridge.ready === true`.
 *
 * @example
 * ```typescript
 * const ready = await isBridgeReady(page);
 * if (!ready) await injectBridge(page);
 * ```
 */
export async function isBridgeReady(page: BridgePage): Promise<boolean> {
  const ns = BRIDGE_GLOBALS.NAMESPACE;
  return page.evaluate<boolean>(`!!(window.${ns} && window.${ns}.ready)`);
}

/**
 * Injects the bridge into the browser context.
 *
 * @remarks
 * 1. Waits for UI5 to be available (`sap.ui.require` exists)
 * 2. Evaluates the bridge injection script
 * 3. Waits for bridge readiness (`__praman_bridge.ready === true`)
 *
 * @param page - The Playwright page to inject into.
 *
 * @example
 * ```typescript
 * await injectBridge(page);
 * // Bridge is now ready for operations
 * ```
 */
export async function injectBridge(page: BridgePage): Promise<void> {
  const timeout = BRIDGE_TIMEOUTS.INJECTION;
  const readyFlag = BRIDGE_GLOBALS.READY_FLAG;

  // Step 1: Wait for UI5 framework availability
  await page.waitForFunction(
    'typeof sap !== "undefined" && sap.ui && typeof sap.ui.require === "function"',
    { timeout },
  );

  // Step 2: Execute bridge injection script
  await page.evaluate(createBridgeInjectionScript());

  // Step 3: Wait for bridge readiness
  await page.waitForFunction(`window.${readyFlag} === true`, { timeout });

  injectedPages.add(page);
}

/**
 * Ensures the bridge is injected, skipping if already done.
 *
 * @remarks
 * Idempotent — safe to call multiple times. Tracks injection state
 * per page instance using a WeakSet.
 *
 * @param page - The Playwright page to ensure injection on.
 *
 * @example
 * ```typescript
 * // Called at the start of every adapter method
 * await ensureBridgeInjected(page);
 * ```
 */
export async function ensureBridgeInjected(page: BridgePage): Promise<void> {
  if (injectedPages.has(page)) {
    return;
  }
  await injectBridge(page);
}

/**
 * Waits for the bridge to become ready on the given page.
 *
 * @param page - The Playwright page to wait on.
 * @param timeout - Maximum wait time in ms (defaults to `BRIDGE_TIMEOUTS.INJECTION`).
 *
 * @example
 * ```typescript
 * await waitForBridgeReady(page, 5000);
 * ```
 */
export async function waitForBridgeReady(page: BridgePage, timeout?: number): Promise<void> {
  const readyFlag = BRIDGE_GLOBALS.READY_FLAG;
  await page.waitForFunction(`window.${readyFlag} === true`, {
    timeout: timeout ?? BRIDGE_TIMEOUTS.INJECTION,
  });
}
