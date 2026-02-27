/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * DOM-first interaction strategy.
 *
 * @remarks
 * Prioritizes DOM events (click, input) with UI5 fallback.
 * Better for form elements and scenarios where UI5 events
 * are unreliable.
 *
 * All browser-side scripts use `page.evaluate(fn, args)` to safely
 * pass arguments via Playwright's structured clone serialization,
 * eliminating string interpolation injection risks (P17).
 *
 * @module interaction-strategies
 */

import type { Page } from '@playwright/test';

import { BRIDGE_GLOBALS } from '../bridge-constants.js';

import type { InteractionStrategy } from './strategy.js';

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';

/**
 * Shape returned by browser-side interaction scripts.
 *
 * @see `BridgeResult` in `#core/types/bridge.js` for the canonical 4-field envelope.
 * This is intentionally narrower (2 fields) because browser IIFEs don't return `duration` or `data`.
 */
interface BridgeResult {
  readonly success: boolean;
  readonly error?: string;
}

/** Arguments passed to the browser-side press script. */
interface PressArgs {
  readonly ns: string;
  readonly controlId: string;
}

/** Arguments passed to the browser-side enterText script. */
interface EnterTextArgs {
  readonly ns: string;
  readonly controlId: string;
  readonly text: string;
}

/** Arguments passed to the browser-side select script. */
interface SelectArgs {
  readonly ns: string;
  readonly controlId: string;
  readonly itemId: string;
}

/**
 * Interaction strategy using DOM events first, UI5 fallback second.
 *
 * @example
 * ```typescript
 * const strategy = new DomFirstStrategy();
 * await strategy.press(page, 'btnSubmit');
 * ```
 */
export class DomFirstStrategy implements InteractionStrategy {
  /** {@inheritDoc InteractionStrategy.name} */
  readonly name = 'dom-first';

  /** {@inheritDoc InteractionStrategy.press} */
  async press(page: Page, controlId: string): Promise<void> {
    const result: BridgeResult = await page.evaluate(
      /* v8 ignore start -- browser-context: executed in Chromium, not Node.js */
      (args: PressArgs) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- browser context: bridge is injected at runtime on window
        const bridge = (window as any)[args.ns] as
          | { getById?: (id: string) => Record<string, unknown> | undefined }
          | undefined;
        // eslint-disable-next-line sonarjs/no-duplicate-string -- browser-context: module-level constants are not serialized by page.evaluate()
        if (bridge === undefined) return { success: false, error: 'Bridge not available' };
        const ctrl = bridge.getById !== undefined ? bridge.getById(args.controlId) : undefined;
        if (ctrl === undefined) {
          return { success: false, error: `Control not found: ${args.controlId}` };
        }
        const getDomRef = ctrl['getDomRef'] as (() => HTMLElement | null) | undefined;
        const dom = getDomRef !== undefined ? getDomRef.call(ctrl) : null;
        if (dom !== null) {
          dom.click();
          return { success: true };
        }
        let fired = false;
        const firePress = ctrl['firePress'] as (() => void) | undefined;
        if (firePress !== undefined) {
          firePress.call(ctrl);
          fired = true;
        }
        const fireSelect = ctrl['fireSelect'] as (() => void) | undefined;
        if (fireSelect !== undefined) {
          fireSelect.call(ctrl);
          fired = true;
        }
        if (fired) return { success: true };
        const fireTap = ctrl['fireTap'] as (() => void) | undefined;
        if (fireTap !== undefined) {
          fireTap.call(ctrl);
          return { success: true };
        }
        return { success: false, error: `No interaction method available for: ${args.controlId}` };
      },
      /* v8 ignore stop */
      { ns: BRIDGE_GLOBALS.NAMESPACE, controlId },
    );
    if (!result.success) {
      throw new ControlError({
        code: ErrorCode.ERR_CONTROL_INTERACTION_FAILED,
        message: result.error ?? `Press failed on control: ${controlId}`,
        attempted: `press('${controlId}') via dom-first strategy`,
        retryable: true,
        details: { controlId, strategy: this.name },
        suggestions: [
          'Verify the control ID exists in the UI5 view',
          'Check if the control has a DOM reference',
          'Try using ui5-native strategy as alternative',
        ],
      });
    }
  }

  /** {@inheritDoc InteractionStrategy.enterText} */
  async enterText(page: Page, controlId: string, text: string): Promise<void> {
    const result: BridgeResult = await page.evaluate(
      /* v8 ignore start -- browser-context: executed in Chromium, not Node.js */
      (args: EnterTextArgs) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- browser context: bridge is injected at runtime on window
        const bridge = (window as any)[args.ns] as
          | { getById?: (id: string) => Record<string, unknown> | undefined }
          | undefined;
        if (bridge === undefined) return { success: false, error: 'Bridge not available' };
        const ctrl = bridge.getById !== undefined ? bridge.getById(args.controlId) : undefined;
        if (ctrl === undefined) {
          return { success: false, error: `Control not found: ${args.controlId}` };
        }
        const getFocusDomRef = ctrl['getFocusDomRef'] as (() => HTMLElement | null) | undefined;
        const getDomRef = ctrl['getDomRef'] as (() => HTMLElement | null) | undefined;
        let dom: HTMLElement | null = null;
        if (getFocusDomRef !== undefined) {
          dom = getFocusDomRef.call(ctrl);
        } else if (getDomRef !== undefined) {
          dom = getDomRef.call(ctrl);
        }
        if (dom !== null && dom.tagName === 'INPUT') {
          (dom as HTMLInputElement).value = args.text;
          dom.dispatchEvent(new Event('input', { bubbles: true }));
          dom.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true };
        }
        const setValue = ctrl['setValue'] as ((v: string) => void) | undefined;
        if (setValue !== undefined) {
          setValue.call(ctrl, args.text);
        }
        const fireChange = ctrl['fireChange'] as
          | ((params: { value: string }) => void)
          | undefined;
        if (fireChange !== undefined) {
          fireChange.call(ctrl, { value: args.text });
        }
        return { success: true };
      },
      /* v8 ignore stop */
      { ns: BRIDGE_GLOBALS.NAMESPACE, controlId, text },
    );
    if (!result.success) {
      throw new ControlError({
        code: ErrorCode.ERR_CONTROL_INTERACTION_FAILED,
        message: result.error ?? `Enter text failed on control: ${controlId}`,
        attempted: `enterText('${controlId}', '${text}') via dom-first strategy`,
        retryable: true,
        details: { controlId, text, strategy: this.name },
        suggestions: [
          'Verify the control ID exists and accepts text input',
          'Check if the control has a DOM input element',
        ],
      });
    }
  }

  /** {@inheritDoc InteractionStrategy.select} */
  async select(page: Page, controlId: string, itemId: string): Promise<void> {
    const result: BridgeResult = await page.evaluate(
      /* v8 ignore start -- browser-context: executed in Chromium, not Node.js */
      (args: SelectArgs) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- browser context: bridge is injected at runtime on window
        const bridge = (window as any)[args.ns] as
          | { getById?: (id: string) => Record<string, unknown> | undefined }
          | undefined;
        if (bridge === undefined) return { success: false, error: 'Bridge not available' };
        const ctrl = bridge.getById !== undefined ? bridge.getById(args.controlId) : undefined;
        if (ctrl === undefined) {
          return { success: false, error: `Control not found: ${args.controlId}` };
        }
        const setSelectedKey = ctrl['setSelectedKey'] as ((key: string) => void) | undefined;
        if (setSelectedKey !== undefined) {
          setSelectedKey.call(ctrl, args.itemId);
        }
        const fireSelectionChange = ctrl['fireSelectionChange'] as
          | ((params: { selectedItem: unknown }) => void)
          | undefined;
        const fireChange = ctrl['fireChange'] as
          | ((params: { selectedItem: unknown }) => void)
          | undefined;
        const selectedItem = bridge.getById !== undefined ? bridge.getById(args.itemId) : undefined;
        if (fireSelectionChange !== undefined) {
          fireSelectionChange.call(ctrl, { selectedItem });
        } else if (fireChange !== undefined) {
          fireChange.call(ctrl, { selectedItem });
        }
        return { success: true };
      },
      /* v8 ignore stop */
      { ns: BRIDGE_GLOBALS.NAMESPACE, controlId, itemId },
    );
    if (!result.success) {
      throw new ControlError({
        code: ErrorCode.ERR_CONTROL_INTERACTION_FAILED,
        message: result.error ?? `Select failed on control: ${controlId}`,
        attempted: `select('${controlId}', '${itemId}') via dom-first strategy`,
        retryable: true,
        details: { controlId, itemId, strategy: this.name },
        suggestions: [
          'Verify the control ID exists and supports selection',
          'Check if the bridge is injected and ready',
        ],
      });
    }
  }
}
