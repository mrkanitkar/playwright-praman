/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Node-side bridge injection engine (W14: lazy + eager injection).
 *
 * @intent Enable test code running in Node.js to communicate with SAP UI5
 * controls that live in the browser. UI5 has no remote API — the only way to
 * discover controls, read properties, or invoke methods is to execute
 * JavaScript inside the browser where `sap.ui.getCore()` is available. This
 * module injects a thin "bridge" script into the page that exposes those
 * capabilities to Playwright's `page.evaluate()` channel, so every subsequent
 * proxy / fixture call can reach UI5 without re-injecting.
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

import { BridgeError } from '#core/errors/bridge-error.js';

/**
 * Minimal page interface for bridge injection operations.
 *
 * @remarks
 * Decouples bridge injection from Playwright's full `Page` type, allowing
 * callers with narrower page interfaces (e.g., `WorkZonePage`) to use
 * bridge injection without type casts.
 *
 * @example
 * ```typescript
 * const page: BridgeInjectablePage = { evaluate: ..., waitForFunction: ... };
 * await ensureBridgeInjected(page);
 * ```
 */
export interface BridgeInjectablePage {
  /** Executes a script in the browser context. */
  evaluate(script: string, arg?: unknown): Promise<unknown>;
  /** Waits for a condition to be true in the browser context. */
  waitForFunction(
    pageFunction: string | (() => unknown),
    options?: { timeout?: number },
  ): Promise<unknown>;
}

/** Tracks which pages have been lazily injected (WeakSet avoids memory leaks). */
const injectedPages = new WeakSet();

/** Tracks which targets have been eagerly injected via `addInitScript()`. */
const eagerInjectedTargets = new WeakSet<Page | BrowserContext>();

/**
 * Eagerly injects the bridge via `addInitScript()`.
 *
 * @intent Pre-register the bridge so it is available the instant UI5
 * initializes, before any test code runs. Required for auth flows or
 * pre-navigation setup where lazy injection would be too late.
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
 * Currently not wired into the default fixture lifecycle (lazy injection
 * via `ensureBridgeInjected()` is used instead). Kept as a public extension
 * point for advanced users who need bridge availability before the first
 * UI5 operation — e.g., auth flows or pre-navigation setup scripts.
 * Wire into fixture lifecycle when eager injection is needed by default.
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
      // NOTE: This console.warn runs in browser context (addInitScript), not Node.js
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
 * @intent Allow callers to probe bridge state without side-effects — useful
 * for conditional logic that should only run when the bridge is already
 * injected (e.g., skipping re-injection or choosing a fallback path).
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
export async function isBridgeReady(page: BridgeInjectablePage): Promise<boolean> {
  const ns = BRIDGE_GLOBALS.NAMESPACE;
  return page.evaluate(`!!(window.${ns} && window.${ns}.ready)`) as Promise<boolean>;
}

/**
 * Injects the bridge into the browser context.
 *
 * @intent Perform the actual three-step injection sequence (wait for UI5,
 * evaluate bridge script, confirm readiness) so that all subsequent
 * `page.evaluate()` calls can use `window.__praman_bridge` to reach UI5
 * controls. This is the low-level primitive; most callers should use
 * `ensureBridgeInjected()` instead for idempotent injection.
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
export async function injectBridge(page: BridgeInjectablePage): Promise<void> {
  const timeout = BRIDGE_TIMEOUTS.INJECTION;
  const readyFlag = BRIDGE_GLOBALS.READY_FLAG;

  try {
    // Step 1: Wait for UI5 framework availability
    await page.waitForFunction(
      'typeof sap !== "undefined" && sap.ui && typeof sap.ui.require === "function"',
      { timeout },
    );
  } catch (error: unknown) {
    throw new BridgeError({
      code: 'ERR_BRIDGE_TIMEOUT',
      message: `UI5 framework not detected within ${String(timeout)}ms — page may not be a UI5 application`,
      attempted: 'Wait for sap.ui.require to become available',
      retryable: false,
      ...(error instanceof Error ? { cause: error } : {}),
      suggestions: [
        'Verify the page URL points to a UI5/Fiori application',
        'Check if the page has fully loaded before calling UI5 operations',
        'For non-UI5 pages, use Playwright native methods instead of ui5.control()',
        'Increase BRIDGE_TIMEOUTS.INJECTION if the app loads slowly',
      ],
    });
  }

  // Step 2: Execute bridge injection script
  await page.evaluate(createBridgeInjectionScript());

  try {
    // Step 3: Wait for bridge readiness
    await page.waitForFunction(`window.${readyFlag} === true`, { timeout });
  } catch (error: unknown) {
    throw new BridgeError({
      code: 'ERR_BRIDGE_INJECTION',
      message: `Bridge injection script executed but bridge did not become ready within ${String(timeout)}ms`,
      attempted: 'Wait for bridge readiness flag',
      retryable: true,
      ...(error instanceof Error ? { cause: error } : {}),
      suggestions: [
        'This may be a transient UI5 initialization timing issue',
        'Try increasing the bridge injection timeout',
        'Check browser console for JavaScript errors',
      ],
    });
  }

  injectedPages.add(page);
}

/**
 * Ensures the bridge is injected, skipping if already done.
 *
 * @intent Serve as the single entry point that every adapter method calls
 * before executing browser operations. Guarantees the bridge exists without
 * redundant re-injection — the WeakSet lookup makes repeated calls a no-op,
 * so adapters don't need to track injection state themselves.
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
export async function ensureBridgeInjected(page: BridgeInjectablePage): Promise<void> {
  if (injectedPages.has(page)) {
    return;
  }
  await injectBridge(page);
}

/**
 * Resets injection tracking for a page, allowing re-injection.
 *
 * @intent Invalidate the cached injection state after navigation destroys
 * the browser-side bridge (e.g., full page reload, cross-origin navigation).
 * Without this reset, `ensureBridgeInjected()` would skip injection on a
 * page that no longer has the bridge, causing all subsequent UI5 calls to fail.
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
export function resetPageInjection(page: BridgeInjectablePage): void {
  injectedPages.delete(page);
}

/**
 * Waits for the bridge to become ready on the given page.
 *
 * @intent Block until the bridge readiness flag is set, providing a
 * synchronization point for callers that injected the bridge through an
 * external mechanism (e.g., eager injection) and need to wait for it to
 * finish initializing before issuing UI5 operations.
 *
 * @param page - The Playwright page to wait on.
 * @param timeout - Maximum wait time in ms (defaults to `BRIDGE_TIMEOUTS.INJECTION`).
 *
 * @example
 * ```typescript
 * await waitForBridgeReady(page, 5000);
 * ```
 */
export async function waitForBridgeReady(
  page: BridgeInjectablePage,
  timeout?: number,
): Promise<void> {
  const readyFlag = BRIDGE_GLOBALS.READY_FLAG;
  const effectiveTimeout = timeout ?? BRIDGE_TIMEOUTS.INJECTION;
  try {
    await page.waitForFunction(`window.${readyFlag} === true`, {
      timeout: effectiveTimeout,
    });
  } catch (error: unknown) {
    throw new BridgeError({
      code: 'ERR_BRIDGE_NOT_READY',
      message: `Bridge did not become ready within ${String(effectiveTimeout)}ms`,
      attempted: 'Wait for bridge readiness',
      retryable: true,
      ...(error instanceof Error ? { cause: error } : {}),
      suggestions: [
        'The page may not be a UI5 application',
        'Try calling ensureBridgeInjected() first',
        'Increase the timeout for slow-loading applications',
      ],
    });
  }
}
