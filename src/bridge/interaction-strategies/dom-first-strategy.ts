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

import type { BridgePage } from '../adapter.js';
import { BRIDGE_GLOBALS } from '../bridge-constants.js';

import type { InteractionStrategy } from './strategy.js';

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
  async press(page: BridgePage, controlId: string): Promise<void> {
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return { success: false };
        var ctrl = bridge.getById('${controlId}');
        if (!ctrl) return { success: false };
        var dom = ctrl.getDomRef ? ctrl.getDomRef() : null;
        if (dom) { dom.click(); return { success: true }; }
        if (typeof ctrl.firePress === 'function') { ctrl.firePress(); return { success: true }; }
        if (typeof ctrl.fireTap === 'function') { ctrl.fireTap(); return { success: true }; }
        return { success: false };
      })()`,
    );
  }

  /** {@inheritDoc InteractionStrategy.enterText} */
  async enterText(page: BridgePage, controlId: string, text: string): Promise<void> {
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const escaped = text.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
    await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge) return { success: false };
        var ctrl = bridge.getById('${controlId}');
        if (!ctrl) return { success: false };
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
  }

  /** {@inheritDoc InteractionStrategy.select} */
  async select(page: BridgePage, controlId: string, itemId: string): Promise<void> {
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
