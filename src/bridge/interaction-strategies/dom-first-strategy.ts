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
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const result: BridgeResult = await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return { success: false, error: 'Bridge not available' };
        var ctrl = bridge.getById('${controlId}');
        if (!ctrl) return { success: false, error: 'Control not found: ${controlId}' };
        var dom = ctrl.getDomRef ? ctrl.getDomRef() : null;
        if (dom) { dom.click(); return { success: true }; }
        var fired = false;
        if (typeof ctrl.firePress === 'function') { ctrl.firePress(); fired = true; }
        if (typeof ctrl.fireSelect === 'function') { ctrl.fireSelect(); fired = true; }
        if (fired) return { success: true };
        if (typeof ctrl.fireTap === 'function') { ctrl.fireTap(); return { success: true }; }
        return { success: false, error: 'No interaction method available for: ${controlId}' };
      })()`,
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
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const escaped = text.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
    const result: BridgeResult = await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return { success: false, error: 'Bridge not available' };
        var ctrl = bridge.getById('${controlId}');
        if (!ctrl) return { success: false, error: 'Control not found: ${controlId}' };
        var dom = ctrl.getFocusDomRef ? ctrl.getFocusDomRef() : (ctrl.getDomRef ? ctrl.getDomRef() : null);
        if (dom && dom.tagName === 'INPUT') {
          dom.value = '${escaped}';
          dom.dispatchEvent(new Event('input', { bubbles: true }));
          dom.dispatchEvent(new Event('change', { bubbles: true }));
          return { success: true };
        }
        if (typeof ctrl.setValue === 'function') { ctrl.setValue('${escaped}'); }
        if (typeof ctrl.fireChange === 'function') { ctrl.fireChange({ value: '${escaped}' }); }
        return { success: true };
      })()`,
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
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const result: BridgeResult = await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return { success: false, error: 'Bridge not available' };
        var ctrl = bridge.getById('${controlId}');
        if (!ctrl) return { success: false, error: 'Control not found: ${controlId}' };
        if (typeof ctrl.setSelectedKey === 'function') { ctrl.setSelectedKey('${itemId}'); }
        if (typeof ctrl.fireSelectionChange === 'function') {
          ctrl.fireSelectionChange({ selectedItem: bridge.getById('${itemId}') });
        } else if (typeof ctrl.fireChange === 'function') {
          ctrl.fireChange({ selectedItem: bridge.getById('${itemId}') });
        }
        return { success: true };
      })()`,
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
