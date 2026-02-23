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

import type { Page } from '@playwright/test';

import { BRIDGE_GLOBALS } from '../bridge-constants.js';

import type { InteractionStrategy } from './strategy.js';

import { ErrorCode } from '#core/errors/codes.js';
import { ControlError } from '#core/errors/control-error.js';

/** Shape returned by browser-side interaction scripts. */
interface BridgeResult {
  readonly success: boolean;
  readonly error?: string;
}

const SUGGESTION_RECORDREPLAY = 'Verify RecordReplay API is available (UI5 >= 1.94)';

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
  async press(page: Page, controlId: string): Promise<void> {
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const timeout = this.config.interactionTimeout;
    const result: BridgeResult = await page.evaluate(
      `(function() {
        var bridge = window.${ns};
        if (!bridge || !bridge.RecordReplay) {
          var ctrl = bridge && bridge.getById('${controlId}');
          if (!ctrl) return { success: false, error: 'Control not found: ${controlId}' };
          var fired = false;
          if (typeof ctrl.firePress === 'function') { ctrl.firePress(); fired = true; }
          if (typeof ctrl.fireSelect === 'function') { ctrl.fireSelect(); fired = true; }
          if (fired) return { success: true };
          return { success: false, error: 'RecordReplay not available and no fire* methods on: ${controlId}' };
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
    if (!result.success) {
      throw new ControlError({
        code: ErrorCode.ERR_CONTROL_INTERACTION_FAILED,
        message: result.error ?? `Press failed on control: ${controlId}`,
        attempted: `press('${controlId}') via opa5 strategy`,
        retryable: true,
        details: { controlId, strategy: this.name },
        suggestions: [
          SUGGESTION_RECORDREPLAY,
          'Check if the control ID exists in the UI5 view',
          'Try using ui5-native strategy as fallback',
        ],
      });
    }
  }

  /** {@inheritDoc InteractionStrategy.enterText} */
  async enterText(page: Page, controlId: string, text: string): Promise<void> {
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const timeout = this.config.interactionTimeout;
    const escaped = text.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
    const result: BridgeResult = await page.evaluate(
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
    if (!result.success) {
      throw new ControlError({
        code: ErrorCode.ERR_CONTROL_INTERACTION_FAILED,
        message: result.error ?? `Enter text failed on control: ${controlId}`,
        attempted: `enterText('${controlId}', '${text}') via opa5 strategy`,
        retryable: true,
        details: { controlId, text, strategy: this.name },
        suggestions: [SUGGESTION_RECORDREPLAY, 'Check if the control accepts text input'],
      });
    }
  }

  /** {@inheritDoc InteractionStrategy.select} */
  async select(page: Page, controlId: string, itemId: string): Promise<void> {
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const timeout = this.config.interactionTimeout;
    const result: BridgeResult = await page.evaluate(
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
    if (!result.success) {
      throw new ControlError({
        code: ErrorCode.ERR_CONTROL_INTERACTION_FAILED,
        message: result.error ?? `Select failed on control: ${controlId}`,
        attempted: `select('${controlId}', '${itemId}') via opa5 strategy`,
        retryable: true,
        details: { controlId, itemId, strategy: this.name },
        suggestions: [SUGGESTION_RECORDREPLAY, 'Check if the control supports selection'],
      });
    }
  }
}
