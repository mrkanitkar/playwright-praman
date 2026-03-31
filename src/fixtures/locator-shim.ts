/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Locator shim — wraps a Playwright Locator in a UI5ControlBase-compatible interface.
 *
 * @remarks
 * When `ui5.control()` fails to find a UI5 control but detects that the selector
 * targets a DOM element (non-UI5), this shim wraps a Playwright `Locator` so that
 * common methods like `press()`, `getText()`, `getValue()` work seamlessly.
 * UI5-specific methods (`getAggregation()`, `getBindingInfo()`, `getModel()`, etc.)
 * throw a {@link ControlError} with code `ERR_CONTROL_NOT_UI5`.
 *
 * @example
 * ```typescript
 * import { createLocatorShim } from '#fixtures/locator-shim.js';
 *
 * const shim = createLocatorShim(page.locator('#loginBtn'), { id: 'loginBtn' });
 * await shim.press();           // delegates to locator.click()
 * await shim.getText();         // delegates to locator.textContent()
 * await shim.getAggregation('items');  // throws ERR_CONTROL_NOT_UI5
 * ```
 *
 * @module fixtures
 */

import type { Locator } from '@playwright/test';

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';
import type { UI5ControlBase } from '#core/types/controls.js';
import type { UI5Selector } from '#core/types/selectors.js';

/** Sentinel control type returned by the shim. */
const DOM_ELEMENT_TYPE = 'dom-element';

/**
 * Extended UI5ControlBase interface for locator shims.
 *
 * @remarks
 * Adds common interaction methods that Playwright locators can fulfil
 * without a real UI5 control: `press()`, `getText()`, `getValue()`.
 */
export interface LocatorShimControl extends UI5ControlBase {
  /** Clicks the element (delegates to `locator.click()`). */
  press(): Promise<void>;
  /** Returns the text content (delegates to `locator.textContent()`). */
  getText(): Promise<string>;
  /** Returns the input value (delegates to `locator.inputValue()`). */
  getValue(): Promise<string>;
}

/**
 * Creates a ControlError for UI5-only operations on a non-UI5 element.
 *
 * @param methodName - The UI5 method that was called.
 * @param selector - The original selector used for discovery.
 * @returns A ControlError with ERR_CONTROL_NOT_UI5 code.
 */
function createNotUI5Error(methodName: string, selector: UI5Selector): ControlError {
  return new ControlError({
    code: ErrorCode.ERR_CONTROL_NOT_UI5,
    message: `Cannot call ${methodName}() on a non-UI5 DOM element (selector: ${JSON.stringify(selector)})`,
    attempted: `Call UI5-specific method ${methodName}() on a Playwright locator shim`,
    retryable: false,
    suggestions: [
      'This element is a standard DOM element, not a UI5 control',
      'Use Playwright native methods (page.locator()) for non-UI5 elements',
      'If this should be a UI5 control, verify the control type and view',
    ],
  });
}

/**
 * Extracts the id string from a UI5Selector, returning 'unknown' if absent or RegExp.
 *
 * @param selector - The UI5 selector.
 * @returns The id string or 'unknown'.
 */
function extractId(selector: UI5Selector): string {
  if (typeof selector.id === 'string') {
    return selector.id;
  }
  return 'unknown';
}

/**
 * Creates a Playwright Locator wrapped in a UI5ControlBase-compatible shim.
 *
 * @param locator - The Playwright Locator for the DOM element.
 * @param selector - The original UI5Selector used for discovery.
 * @returns An object satisfying UI5ControlBase with delegated Locator methods.
 *
 * @example
 * ```typescript
 * import { createLocatorShim } from '#fixtures/locator-shim.js';
 *
 * const shim = createLocatorShim(page.locator('#loginBtn'), { id: 'loginBtn' });
 * await shim.press();      // delegates to locator.click()
 * await shim.getText();    // delegates to locator.textContent()
 * ```
 */
export function createLocatorShim(locator: Locator, selector: UI5Selector): LocatorShimControl {
  const id = extractId(selector);

  /* eslint-disable @typescript-eslint/require-await -- interface conformance: UI5ControlBase methods return Promise */
  return {
    // ── Static properties ───────────────────────────────────────────
    controlType: DOM_ELEMENT_TYPE,
    id,

    // ── Delegated methods (Playwright Locator) ──────────────────────
    async getId(): Promise<string> {
      return id;
    },
    async getControlType(): Promise<string> {
      return DOM_ELEMENT_TYPE;
    },
    /* eslint-enable @typescript-eslint/require-await */
    async press(): Promise<void> {
      await locator.click();
    },
    async getText(): Promise<string> {
      const text = await locator.textContent();
      return text ?? '';
    },
    async getValue(): Promise<string> {
      return locator.inputValue();
    },
    async getProperty(name: string): Promise<unknown> {
      return locator.getAttribute(name);
    },
    async getVisible(): Promise<boolean> {
      return locator.isVisible();
    },

    // ── UI5-only methods (throw ERR_CONTROL_NOT_UI5) ─────────────────
    /* eslint-disable @typescript-eslint/require-await -- interface conformance: throw inside async to match Promise return type */
    async setProperty(): Promise<void> {
      throw createNotUI5Error('setProperty', selector);
    },
    async getAggregation(): Promise<readonly UI5ControlBase[]> {
      throw createNotUI5Error('getAggregation', selector);
    },
    async getBindingInfo(): Promise<unknown> {
      throw createNotUI5Error('getBindingInfo', selector);
    },
    async getDomRef(): Promise<Element | null> {
      throw createNotUI5Error('getDomRef', selector);
    },
    async isBound(): Promise<boolean> {
      throw createNotUI5Error('isBound', selector);
    },
    async getModel(): Promise<unknown> {
      throw createNotUI5Error('getModel', selector);
    },
    async toLocator(): Promise<Locator> {
      return locator;
    },
    /* eslint-enable @typescript-eslint/require-await */
  } satisfies LocatorShimControl;
}
