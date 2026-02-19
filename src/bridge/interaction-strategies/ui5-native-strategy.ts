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
    await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return { success: false };
        var ctrl = bridge.getById('${controlId}');
        if (!ctrl) return { success: false };
        if (typeof ctrl.firePress === 'function') { ctrl.firePress(); return { success: true }; }
        if (typeof ctrl.fireTap === 'function') { ctrl.fireTap(); return { success: true }; }
        var dom = ctrl.getDomRef ? ctrl.getDomRef() : null;
        if (dom) { dom.click(); return { success: true }; }
        return { success: false };
      })()`,
    );
  }

  /** {@inheritDoc InteractionStrategy.enterText} */
  async enterText(page: Page, controlId: string, text: string): Promise<void> {
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const escaped = text.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
    await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return { success: false };
        var ctrl = bridge.getById('${controlId}');
        if (!ctrl) return { success: false };
        if (typeof ctrl.setValue === 'function') { ctrl.setValue('${escaped}'); }
        if (typeof ctrl.fireLiveChange === 'function') { ctrl.fireLiveChange({ value: '${escaped}' }); }
        if (typeof ctrl.fireChange === 'function') { ctrl.fireChange({ value: '${escaped}' }); }
        return { success: true };
      })()`,
    );
  }

  /** {@inheritDoc InteractionStrategy.select} */
  async select(page: Page, controlId: string, itemId: string): Promise<void> {
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return { success: false };
        var ctrl = bridge.getById('${controlId}');
        if (!ctrl) return { success: false };
        if (typeof ctrl.setSelectedKey === 'function') { ctrl.setSelectedKey('${itemId}'); }
        if (typeof ctrl.fireSelectionChange === 'function') {
          ctrl.fireSelectionChange({ selectedItem: bridge.getById('${itemId}') });
        } else if (typeof ctrl.fireChange === 'function') {
          ctrl.fireChange({ selectedItem: bridge.getById('${itemId}') });
        }
        return { success: true };
      })()`,
    );
  }
}
