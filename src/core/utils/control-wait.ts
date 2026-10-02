/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Per-control wait predicates.
 *
 * @ai
 * @aiContext Waits until one specific control satisfies a predicate — binding
 * refreshed, busy cleared, aggregation populated. Complements
 * `waitForUI5Stable()`, which is global.
 *
 * @remarks
 * This is **additive** to {@link waitForUI5Stable}, not a replacement. UI5
 * stability is a global property read off the core, so a page-wide wait cannot
 * express "*this* list finished its refresh" and a per-control wait cannot
 * express "the application is idle". Both exist on purpose.
 *
 * **Compatibility policy (degrade, don't throw).** `locator.waitForFunction()`
 * arrives in Playwright 1.62, above Praman's 1.57 floor. Unlike the Web Storage
 * API — where no equivalent exists and the right answer is a loud
 * `ERR_COMPAT_FEATURE_UNAVAILABLE` — a page-scoped `page.waitForFunction()` with
 * a control-id predicate expresses the same thing. Throwing would deny users a
 * capability Praman can actually deliver, so below 1.62 this degrades
 * transparently and logs at `debug` which path it took.
 *
 * The rule, stated once so it need not be re-derived: **throw when the floor has
 * no equivalent; degrade when it does.**
 *
 * @example
 * ```typescript
 * import { waitForControlState } from '#core/utils/control-wait.js';
 *
 * await waitForControlState(
 *   page.locator('ui5=[controlType="sap.m.List"]'),
 *   (el) => el.querySelectorAll('li').length > 0,
 * );
 * ```
 *
 * @module core/utils
 */

import type { Locator } from '@playwright/test';

import { hasFeature } from '#core/compat/playwright-compat.js';
import { ErrorCode } from '#core/errors/codes.js';
import { TimeoutError } from '#core/errors/timeout-error.js';
import { createLogger } from '#core/logging/logger.js';
import { DEFAULT_TIMEOUTS } from '#core/utils/constants.js';

/** Which implementation satisfied the wait. */
export type ControlWaitStrategy = 'locator' | 'page';

/**
 * Options for {@link waitForControlState}.
 *
 * @example
 * ```typescript
 * const options: WaitForControlStateOptions = { timeout: 15_000 };
 * ```
 */
export interface WaitForControlStateOptions {
  /** Maximum wait in ms. Defaults to the configured UI5 wait timeout. */
  readonly timeout?: number;
  /** Message used when the wait times out. */
  readonly message?: string;
}

/**
 * Outcome of a per-control wait.
 *
 * @example
 * ```typescript
 * const result = await waitForControlState(locator, predicate);
 * logger.debug(result.strategy); // 'locator' on 1.62+, 'page' below
 * ```
 */
export interface ControlWaitResult {
  /** Which implementation ran — useful when diagnosing version differences. */
  readonly strategy: ControlWaitStrategy;
}

/**
 * A browser-side predicate receiving the control's DOM element.
 *
 * @remarks
 * Must be a real function, not a source string. Playwright evaluates a string
 * as an *expression*: the source of an arrow function evaluates to a function
 * object, which is truthy, so a string predicate would resolve instantly and
 * silently pass. Verified against a live browser.
 */
export type ControlPredicate = (element: Element) => boolean;

/** Signature of `locator.waitForFunction`, added in Playwright 1.62. */
type LocatorWaitFn = (
  pageFunction: ControlPredicate,
  arg?: unknown,
  options?: { timeout?: number },
) => Promise<void>;

/**
 * Reads the UI5 control id from a DOM element, via the modern UI5 API.
 *
 * @remarks
 * A real function, not a source string: Playwright evaluates a string as an
 * *expression*, so arrow-function source would return the function object rather
 * than calling it. Uses `sap/ui/core/Element.closestTo()` rather than the
 * deprecated `sap.ui.getCore().byId()`.
 */
/* v8 ignore start -- browser-context function, not executable in Node tests */
function readControlId(el: Element): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call -- browser context: sap global is a UI5 runtime object with no Node.js type declarations
  const ui5Element = (window as any).sap?.ui?.require?.('sap/ui/core/Element') as
    { closestTo?: (node: Element) => { getId: () => string } | undefined } | undefined;
  const control =
    typeof ui5Element?.closestTo === 'function' ? ui5Element.closestTo(el) : undefined;
  return control === undefined ? el.id : control.getId();
}
/* v8 ignore stop */

/**
 * Builds the page-scoped fallback as an IIFE expression.
 *
 * @param controlId - Resolved UI5 control id.
 * @param predicate - The predicate to apply to the element.
 * @returns A JavaScript expression evaluating to a boolean.
 */
function buildFallbackExpression(controlId: string, predicate: ControlPredicate): string {
  return `(() => { const el = document.getElementById(${JSON.stringify(controlId)}); return el ? (${predicate.toString()})(el) : false; })()`;
}

/**
 * Waits until a specific control satisfies a predicate.
 *
 * @remarks
 * On Playwright 1.62+ the predicate receives the control's DOM element directly.
 * Below that it runs page-scoped against the element resolved from the control
 * id, which is equivalent but slightly less precise if the id changes mid-wait.
 *
 * Controls are resolved with `sap/ui/core/Element.closestTo()` rather than the
 * deprecated `sap.ui.getCore().byId()`, so this adds no new
 * `praman/no-deprecated-ui5-globals` findings.
 *
 * @param locator - Locator for the control.
 * @param predicate - Browser-side predicate receiving the control's element.
 * @param options - Timeout and message overrides.
 * @returns Which strategy satisfied the wait.
 * @throws {@link TimeoutError} when the predicate does not become true in time.
 *
 * @capability ui5Wait.forControlState
 *
 * @example
 * ```typescript
 * await waitForControlState(
 *   table,
 *   (el) => !el.classList.contains('sapUiLocalBusy'),
 *   { timeout: 20_000 },
 * );
 * ```
 */
export async function waitForControlState(
  locator: Locator,
  predicate: ControlPredicate,
  options?: WaitForControlStateOptions,
): Promise<ControlWaitResult> {
  const log = createLogger('control-wait');
  const timeout = options?.timeout ?? DEFAULT_TIMEOUTS.UI5_WAIT;

  // Flag first, then a runtime probe. A flag can be correct while a runtime is
  // patched or shimmed, and a raw TypeError would be a poor error message.
  // Reflect.get keeps TypeScript from narrowing away the runtime check, which is
  // the whole point of having one.
  const locatorWaitFn = hasFeature('hasLocatorWaitForFunction')
    ? (Reflect.get(locator, 'waitForFunction') as LocatorWaitFn | undefined)
    : undefined;
  const strategy: ControlWaitStrategy = typeof locatorWaitFn === 'function' ? 'locator' : 'page';

  log.debug({ strategy, timeout }, 'Waiting for control state');

  try {
    if (typeof locatorWaitFn === 'function') {
      await locatorWaitFn.call(locator, predicate, undefined, { timeout });
    } else {
      const controlId = await locator.evaluate(readControlId);
      // An IIFE *expression*, not a function source: Playwright evaluates a
      // string as an expression, so arrow-function source would yield a truthy
      // function object and resolve immediately. This also avoids `new Function`,
      // which SAP's strict CSP blocks.
      await locator
        .page()
        .waitForFunction(buildFallbackExpression(controlId, predicate), undefined, { timeout });
    }
  } catch (error: unknown) {
    const base = {
      code: ErrorCode.ERR_TIMEOUT_OPERATION,
      message: options?.message ?? `Control state wait timed out after ${String(timeout)}ms`,
      attempted: 'Wait for a control to satisfy a predicate',
      timeoutMs: timeout,
      details: { strategy },
      suggestions: [
        'Increase the timeout if the control is slow to update',
        'Check the predicate against the control in the browser console',
        'Use waitForUI5Stable() instead if you need application-wide idleness',
      ],
    };
    throw new TimeoutError(error instanceof Error ? { ...base, cause: error } : base);
  }

  return { strategy };
}
