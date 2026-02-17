/**
 * OPA5 interaction strategy using RecordReplay.
 *
 * @remarks
 * Uses SAP RecordReplay.interactWithControl for interaction.
 * Most compatible with SAP testing standards but requires
 * RecordReplay API (UI5 \>= 1.94).
 *
 * @module interaction-strategies
 */

import type { BridgePage } from '../adapter.js';
import { BRIDGE_GLOBALS } from '../bridge-constants.js';

import type { InteractionStrategy } from './strategy.js';

/**
 * Configuration options for the OPA5 strategy.
 */
export interface Opa5StrategyConfig {
  /** Interaction timeout in milliseconds. */
  readonly interactionTimeout?: number;
  /** Whether to auto-wait for UI5 stability. */
  readonly autoWait?: boolean;
  /** Enable debug logging. */
  readonly debug?: boolean;
}

/** Default OPA5 strategy configuration. */
const DEFAULT_CONFIG: Required<Opa5StrategyConfig> = {
  interactionTimeout: 5000,
  autoWait: true,
  debug: false,
} as const;

/**
 * Interaction strategy using SAP OPA5 RecordReplay API.
 *
 * @example
 * ```typescript
 * const strategy = new Opa5Strategy({ interactionTimeout: 10_000 });
 * await strategy.press(page, 'btnSubmit');
 * ```
 */
export class Opa5Strategy implements InteractionStrategy {
  /** {@inheritDoc InteractionStrategy.name} */
  readonly name = 'opa5';

  private readonly config: Required<Opa5StrategyConfig>;

  constructor(config?: Opa5StrategyConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** {@inheritDoc InteractionStrategy.press} */
  async press(page: BridgePage, controlId: string): Promise<void> {
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const timeout = this.config.interactionTimeout;
    await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge || !bridge.RecordReplay) {
          var ctrl = bridge && bridge.getById('${controlId}');
          if (ctrl && typeof ctrl.firePress === 'function') { ctrl.firePress(); return { success: true }; }
          return { success: false, error: 'RecordReplay not available' };
        }
        try {
          bridge.RecordReplay.interactWithControl({
            selector: { id: '${controlId}' },
            interactionType: 'PRESS',
            interactionTimeout: ${String(timeout)}
          });
          return { success: true };
        } catch (e) {
          return { success: false, error: e.message };
        }
      })()`,
    );
  }

  /** {@inheritDoc InteractionStrategy.enterText} */
  async enterText(page: BridgePage, controlId: string, text: string): Promise<void> {
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const timeout = this.config.interactionTimeout;
    const escaped = text.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
    await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge || !bridge.RecordReplay) {
          var ctrl = bridge && bridge.getById('${controlId}');
          if (ctrl && typeof ctrl.setValue === 'function') { ctrl.setValue('${escaped}'); return { success: true }; }
          return { success: false, error: 'RecordReplay not available' };
        }
        try {
          bridge.RecordReplay.interactWithControl({
            selector: { id: '${controlId}' },
            interactionType: 'ENTER_TEXT',
            enterText: '${escaped}',
            interactionTimeout: ${String(timeout)}
          });
          return { success: true };
        } catch (e) {
          return { success: false, error: e.message };
        }
      })()`,
    );
  }

  /** {@inheritDoc InteractionStrategy.select} */
  async select(page: BridgePage, controlId: string, itemId: string): Promise<void> {
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const timeout = this.config.interactionTimeout;
    await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge || !bridge.RecordReplay) {
          var ctrl = bridge && bridge.getById('${controlId}');
          if (ctrl && typeof ctrl.setSelectedKey === 'function') { ctrl.setSelectedKey('${itemId}'); return { success: true }; }
          return { success: false, error: 'RecordReplay not available' };
        }
        try {
          bridge.RecordReplay.interactWithControl({
            selector: { id: '${controlId}' },
            interactionType: 'PRESS',
            interactionTimeout: ${String(timeout)}
          });
          return { success: true };
        } catch (e) {
          return { success: false, error: e.message };
        }
      })()`,
    );
  }
}
