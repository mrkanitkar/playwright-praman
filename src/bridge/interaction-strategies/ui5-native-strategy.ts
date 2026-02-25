/**
 * UI5-native interaction strategy.
 *
 * @remarks
 * Uses direct UI5 fire* methods for control interaction.
 * Fallback chain: firePress → fireSelect → fireTap → DOM click.
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

const SUGGESTION_CHECK_BRIDGE = 'Check if the bridge is injected and ready';

/**
 * Interaction strategy using native UI5 event firing.
 *
 * @remarks
 * Default strategy. Fast and reliable for standard UI5 controls.
 *
 * @example
 * ```typescript
 * const strategy = new UI5NativeStrategy();
 * await strategy.press(page, 'btnSubmit');
 * ```
 */
export class UI5NativeStrategy implements InteractionStrategy {
  /** {@inheritDoc InteractionStrategy.name} */
  readonly name = 'ui5-native';

  /** {@inheritDoc InteractionStrategy.press} */
  async press(page: Page, controlId: string): Promise<void> {
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const result: BridgeResult = await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return { success: false, error: 'Bridge not available' };
        var ctrl = bridge.getById('${controlId}');
        if (!ctrl) return { success: false, error: 'Control not found: ${controlId}' };
        var fired = false;
        if (typeof ctrl.firePress === 'function') { ctrl.firePress(); fired = true; }
        if (typeof ctrl.fireSelect === 'function') { ctrl.fireSelect(); fired = true; }
        if (fired) return { success: true };
        if (typeof ctrl.fireTap === 'function') { ctrl.fireTap(); return { success: true }; }
        var dom = ctrl.getDomRef ? ctrl.getDomRef() : null;
        if (dom) { dom.click(); return { success: true }; }
        return { success: false, error: 'No interaction method available for: ${controlId}' };
      })()`,
    );
    if (!result.success) {
      throw new ControlError({
        code: ErrorCode.ERR_CONTROL_INTERACTION_FAILED,
        message: result.error ?? `Press failed on control: ${controlId}`,
        attempted: `press('${controlId}') via ui5-native strategy`,
        retryable: true,
        details: { controlId, strategy: this.name },
        suggestions: [
          'Verify the control ID exists in the UI5 view',
          SUGGESTION_CHECK_BRIDGE,
          'Try using dom-first strategy as fallback',
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
        if (typeof ctrl.setValue === 'function') { ctrl.setValue('${escaped}'); }
        if (typeof ctrl.fireLiveChange === 'function') { ctrl.fireLiveChange({ value: '${escaped}' }); }
        if (typeof ctrl.fireChange === 'function') { ctrl.fireChange({ value: '${escaped}' }); }
        return { success: true };
      })()`,
    );
    if (!result.success) {
      throw new ControlError({
        code: ErrorCode.ERR_CONTROL_INTERACTION_FAILED,
        message: result.error ?? `Enter text failed on control: ${controlId}`,
        attempted: `enterText('${controlId}', '${text}') via ui5-native strategy`,
        retryable: true,
        details: { controlId, text, strategy: this.name },
        suggestions: [
          'Verify the control ID exists and accepts text input',
          SUGGESTION_CHECK_BRIDGE,
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
        attempted: `select('${controlId}', '${itemId}') via ui5-native strategy`,
        retryable: true,
        details: { controlId, itemId, strategy: this.name },
        suggestions: [
          'Verify the control ID exists and supports selection',
          SUGGESTION_CHECK_BRIDGE,
        ],
      });
    }
  }
}
