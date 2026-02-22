/**
 * Node-side bridge injection engine (W14: lazy + eager injection).
 *
 * @remarks
 * Manages the lifecycle of bridge injection into the browser context.
 * Supports two injection modes:
 *
 * - **Lazy** (default): Triggered on first UI5 operation via `ensureBridgeInjected()`.
 * - **Eager**: Registered via `addInitScript()` before any page loads,
 *   ensuring the bridge is available as soon as UI5 initializes.
 *
 * Pattern: Every adapter public method calls `ensureBridgeInjected()`
 * before executing browser operations (W19).
 *
 * @module bridge
 */

import type { BrowserContext, Page } from '@playwright/test';

import { BRIDGE_GLOBALS, BRIDGE_TIMEOUTS } from './bridge-constants.js';
import { createBridgeInjectionScript } from './browser-scripts/inject-ui5.js';

/** Tracks which pages have been lazily injected (WeakSet avoids memory leaks). */
const injectedPages = new WeakSet<Page>();

/** Tracks which targets have been eagerly injected via `addInitScript()`. */
const eagerInjectedTargets = new WeakSet<Page | BrowserContext>();

/**
 * Eagerly injects the bridge via `addInitScript()`.
 *
 * @remarks
 * Uses Playwright's `addInitScript()` to inject the bridge code before any
 * page loads. This ensures the bridge is available even when UI5 loads before
 * test code runs (e.g., during page navigation or SPA routing).
 *
 * The eager script includes a poller that waits for `sap.ui.require` to become
 * available, then initializes the bridge. This handles the timing gap between
 * page load and UI5 framework initialization.
 *
 * Idempotent --- calling multiple times on the same target is a no-op.
 *
 * @param target - Playwright Page or BrowserContext to inject into.
 *
 * @example
 * ```typescript
 * // Inject before any navigation (recommended for auth flows)
 * await injectBridgeEager(page);
 * await page.goto('https://sap-system.example.com/app');
 * // Bridge is already available when UI5 loads
 * ```
 */
export async function injectBridgeEager(target: Page | BrowserContext): Promise<void> {
  if (eagerInjectedTargets.has(target)) {
    return;
  }

  const bridgeScript = createBridgeInjectionScript();

  const timeoutMs = BRIDGE_TIMEOUTS.INJECTION;

  const eagerScript = `(function waitForUI5AndInject() {
  var deadline = Date.now() + ${String(timeoutMs)};
  function tryInject() {
    if (typeof sap !== 'undefined' && sap.ui && typeof sap.ui.require === 'function') {
      ${bridgeScript}
    } else if (Date.now() > deadline) {
      console.warn('[praman] Eager bridge injection timed out after ${String(timeoutMs)}ms — page may not be a UI5 application');
    } else {
      setTimeout(tryInject, ${String(BRIDGE_TIMEOUTS.POLLING_INTERVAL)});
    }
  }
  tryInject();
})();`;

  await target.addInitScript(eagerScript);
  eagerInjectedTargets.add(target);
}

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
export async function isBridgeReady(page: Page): Promise<boolean> {
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
export async function injectBridge(page: Page): Promise<void> {
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
export async function ensureBridgeInjected(page: Page): Promise<void> {
  if (injectedPages.has(page)) {
    return;
  }
  await injectBridge(page);
}

/**
 * Resets injection tracking for a page, allowing re-injection.
 *
 * @remarks
 * Called after page navigation invalidates the bridge.
 * The next call to `ensureBridgeInjected()` will re-inject.
 *
 * @param page - The page to reset injection state for.
 *
 * @example
 * ```typescript
 * resetPageInjection(page);
 * // Next ensureBridgeInjected() call will re-inject
 * ```
 */
export function resetPageInjection(page: Page): void {
  injectedPages.delete(page);
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
export async function waitForBridgeReady(page: Page, timeout?: number): Promise<void> {
  const readyFlag = BRIDGE_GLOBALS.READY_FLAG;
  await page.waitForFunction(`window.${readyFlag} === true`, {
    timeout: timeout ?? BRIDGE_TIMEOUTS.INJECTION,
  });
}
