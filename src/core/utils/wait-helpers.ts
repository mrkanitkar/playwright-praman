/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * UI5 stability wait helpers using Playwright-native `page.waitForFunction()`.
 *
 * @remarks
 * Implements a three-tier stability system:
 * 1. {@link waitForUI5Stable} — Full UI5 pending-request wait (Tier 1)
 * 2. {@link briefDOMSettle} — Lightweight DOM mutation settling (Tier 2)
 * 3. {@link waitForUI5Bootstrap} — Initial UI5 library load detection (Tier 3)
 *
 * All functions use Playwright-native APIs (`page.waitForFunction`,
 * `page.evaluate`). `page.waitForTimeout()` is banned per Principle 8.
 *
 * M7 tracked issue: `skipStabilityWait` precedence
 * (per-call &gt; selectors config &gt; top-level config) is resolved by the
 * caller, not this module. This module only respects the final boolean.
 *
 * @example
 * ```typescript
 * import {
 *   waitForUI5Stable,
 *   briefDOMSettle,
 *   waitForUI5Bootstrap,
 * } from '#core/utils/wait-helpers.js';
 *
 * await waitForUI5Bootstrap(page);
 * await waitForUI5Stable(page, { timeout: 10_000 });
 * await briefDOMSettle(page, 200);
 * ```
 *
 * @module utils
 */

import { ErrorCode } from '#core/errors/codes.js';
import { TimeoutError } from '#core/errors/timeout-error.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';

/**
 * Minimal subset of Playwright's `Page` used by wait helpers.
 *
 * @remarks
 * Avoids importing the full `@playwright/test` dependency at the type level.
 * Consumers pass a real Playwright `Page`; we only call the methods listed here.
 */
interface WaitPage {
  waitForFunction(
    pageFunction: (() => boolean) | string,
    options?: { readonly timeout?: number; readonly polling?: number },
  ): Promise<unknown>;
  evaluate(pageFunction: ((...args: never[]) => unknown) | string, arg?: unknown): Promise<unknown>;
}

/**
 * Options for {@link waitForUI5Stable}.
 *
 * @example
 * ```typescript
 * const opts: WaitForUI5StableOptions = {
 *   timeout: 10_000,
 *   polling: 200,
 *   skipStabilityWait: false,
 * };
 * ```
 */
export interface WaitForUI5StableOptions {
  /** Maximum wait time in ms. Defaults to {@link DEFAULT_TIMEOUTS.UI5_WAIT}. */
  readonly timeout?: number;
  /** Polling interval in ms. Defaults to {@link DEFAULT_TIMEOUTS.POLLING_INTERVAL}. */
  readonly polling?: number;
  /** Human-readable message for timeout errors. */
  readonly message?: string;
  /** If true, skip full UI5 stability wait and only perform a brief DOM settle. */
  readonly skipStabilityWait?: boolean;
  /** URL patterns to ignore during auto-wait (reserved for future use). */
  readonly ignoreAutoWaitUrls?: readonly string[];
}

/**
 * Waits for SAP UI5 to report zero pending async operations.
 *
 * @remarks
 * Uses `page.waitForFunction()` to poll `sap.ui.getCore().getUIPending() === 0`.
 * When `skipStabilityWait` is true, falls back to {@link briefDOMSettle} instead.
 *
 * Timeout errors are wrapped in {@link TimeoutError} with
 * code `ERR_TIMEOUT_OPERATION`.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param options - Wait configuration options.
 *
 * @example
 * ```typescript
 * await waitForUI5Stable(page, { timeout: 10_000, polling: 200 });
 * ```
 */
export async function waitForUI5Stable(
  page: WaitPage,
  options?: WaitForUI5StableOptions,
): Promise<void> {
  if (options?.skipStabilityWait === true) {
    await briefDOMSettle(page);
    return;
  }

  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.UI5_WAIT;
  const polling = options?.polling ?? DEFAULT_TIMEOUTS.POLLING_INTERVAL;

  try {
    await page.waitForFunction(
      /* v8 ignore start -- browser-context function, not executable in Node tests */
      () => {
        // Type assertion: sap global is a UI5 runtime object with no Node.js type declarations
        interface SapWindow {
          sap?: { ui?: { getCore?: () => { getUIPending?: () => number } | undefined } };
        }
        return (window as unknown as SapWindow).sap?.ui?.getCore?.()?.getUIPending?.() === 0;
      },
      /* v8 ignore stop */
      { timeout, polling },
    );
  } catch (error: unknown) {
    const base = {
      code: ErrorCode.ERR_TIMEOUT_OPERATION,
      message: options?.message ?? `UI5 stability wait timed out after ${String(timeout)}ms`,
      attempted: 'Wait for UI5 pending operations to reach zero',
      timeoutMs: timeout,
      suggestions: [
        'Increase the timeout value if the application is slow to load',
        'Check for long-running OData requests blocking stability',
        'Use skipStabilityWait: true if stability detection is not needed',
      ],
    };
    throw new TimeoutError(error instanceof Error ? { ...base, cause: error } : base);
  }
}

/**
 * Performs a brief DOM settle wait using `page.evaluate` with `setTimeout`.
 *
 * @remarks
 * Uses `page.evaluate()` to create a browser-side `setTimeout` promise.
 * This is the approved alternative to the banned `page.waitForTimeout()`.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param durationMs - Settle duration in ms. Defaults to {@link DEFAULT_TIMEOUTS.DOM_SETTLE}.
 *
 * @example
 * ```typescript
 * await briefDOMSettle(page, 250);
 * ```
 */
export async function briefDOMSettle(page: WaitPage, durationMs?: number): Promise<void> {
  const ms = durationMs ?? DEFAULT_TIMEOUTS.DOM_SETTLE;
  await page.evaluate(
    /* v8 ignore start -- browser-context function, not executable in Node tests */
    // eslint-disable-next-line @typescript-eslint/promise-function-async -- browser-evaluated function cannot be async
    (timeout: number) =>
      new Promise<void>((resolve) => {
        setTimeout(resolve, timeout);
      }),
    /* v8 ignore stop */
    ms,
  );
}

/**
 * Waits for SAP UI5 to finish bootstrapping (core library loaded).
 *
 * @remarks
 * Polls for `window.sap?.ui?.getCore` existence using `page.waitForFunction()`.
 *
 * V16 tracked issue: Default timeout is {@link DEFAULT_TIMEOUTS.UI5_BOOTSTRAP}
 * (60 000 ms) to accommodate slow first-load scenarios on SAP BTP.
 *
 * @param page - Playwright Page (or compatible subset).
 * @param options - Optional timeout configuration.
 *
 * @example
 * ```typescript
 * await waitForUI5Bootstrap(page, { timeout: 30_000 });
 * ```
 */
export async function waitForUI5Bootstrap(
  page: WaitPage,
  options?: { readonly timeout?: number },
): Promise<void> {
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.UI5_BOOTSTRAP;

  try {
    await page.waitForFunction(
      /* v8 ignore start -- browser-context function, not executable in Node tests */
      () => {
        // Type assertion: sap global is a UI5 runtime object with no Node.js type declarations
        interface SapWindow {
          sap?: { ui?: { getCore?: unknown } };
        }
        return typeof (window as unknown as SapWindow).sap?.ui?.getCore === 'function';
      },
      /* v8 ignore stop */
      { timeout },
    );
  } catch (error: unknown) {
    const base = {
      code: ErrorCode.ERR_TIMEOUT_OPERATION,
      message: `UI5 bootstrap timed out after ${String(timeout)}ms`,
      attempted: 'Wait for SAP UI5 core library to load',
      timeoutMs: timeout,
      suggestions: [
        'Verify the page URL points to a valid UI5 application',
        'Check network connectivity to the SAP CDN or app server',
        'Increase the bootstrap timeout for slow environments',
      ],
    } as const;
    throw new TimeoutError(error instanceof Error ? { ...base, cause: error } : base);
  }
}
