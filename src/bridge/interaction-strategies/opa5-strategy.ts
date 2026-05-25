/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * OPA5 interaction strategy using RecordReplay.
 *
 * @remarks
 * Uses SAP RecordReplay.interactWithControl for interaction.
 * Most compatible with SAP testing standards but requires
 * RecordReplay API (UI5 \>= 1.94).
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

/** Arguments passed to the browser-side press script. */
interface PressArgs {
  readonly ns: string;
  readonly controlId: string;
  readonly timeout: number;
  readonly autoWait: boolean;
  readonly debug: boolean;
}

/** Arguments passed to the browser-side enterText script. */
interface EnterTextArgs {
  readonly ns: string;
  readonly controlId: string;
  readonly text: string;
  readonly timeout: number;
  readonly autoWait: boolean;
  readonly debug: boolean;
}

/** Arguments passed to the browser-side select script. */
interface SelectArgs {
  readonly ns: string;
  readonly controlId: string;
  readonly itemId: string;
  readonly timeout: number;
  readonly autoWait: boolean;
  readonly debug: boolean;
}

// ── Browser-context types (used inside page.evaluate) ─────────────────
// These mirror the shapes of objects available at runtime in the browser.
// They cannot reference Node-side imports.

/** Bridge shape as seen from the browser context. */
interface BrowserBridge {
  getById?: (id: string) => BrowserControl | null;
  RecordReplay?: BrowserRecordReplay;
}

/** RecordReplay API shape in the browser. */
interface BrowserRecordReplay {
  interactWithControl: (params: Record<string, unknown>) => void;
  waitForUI5: () => Promise<void>;
}

/** Minimal control shape for fallback interactions. */
interface BrowserControl {
  firePress?: () => void;
  fireSelect?: () => void;
  setValue?: (v: string) => void;
  setSelectedKey?: (key: string) => void;
}

/* v8 ignore start -- browser-context functions: executed inside page.evaluate() in Chromium, not reachable by Node.js V8 coverage */

/**
 * Browser-context: waits for UI5 to finish pending async operations.
 *
 * @remarks
 * Uses the official `RecordReplay.waitForUI5()` API (available since UI5 1.94).
 * Extracted as a named function to reduce cognitive complexity of the
 * main interaction functions. Called inside `page.evaluate()` callbacks.
 */
async function browserWaitForUI5(recordReplay: BrowserRecordReplay): Promise<void> {
  await recordReplay.waitForUI5();
}

// ── Browser-side script functions (P17 safe — function-form) ──────────

/** Browser-side debug log helper. */
const OPA5_LOG_PREFIX = '[praman:opa5]';

/**
 * Browser-context: press fallback when RecordReplay is unavailable.
 */
function browserPressFallback(bridge: BrowserBridge | undefined, controlId: string): BridgeResult {
  const ctrl = bridge?.getById?.(controlId) ?? null;
  if (ctrl === null) return { success: false, error: `Control not found: ${controlId}` };
  let fired = false;
  if (typeof ctrl.firePress === 'function') {
    ctrl.firePress();
    fired = true;
  }
  if (typeof ctrl.fireSelect === 'function') {
    ctrl.fireSelect();
    fired = true;
  }
  if (fired) return { success: true };
  return {
    success: false,
    error: `RecordReplay not available and no fire* methods on: ${controlId}`,
  };
}

/**
 * Browser-context: press interaction via RecordReplay with fallback.
 */
async function browserPress(args: PressArgs): Promise<BridgeResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- browser context: bridge is injected at runtime on window
  const bridge = (window as any)[args.ns] as BrowserBridge | undefined;
  if (bridge?.RecordReplay === undefined) return browserPressFallback(bridge, args.controlId);
  try {
    if (args.autoWait) await browserWaitForUI5(bridge.RecordReplay);
    bridge.RecordReplay.interactWithControl({
      selector: { id: args.controlId },
      interactionType: 'PRESS',
    });
    if (args.debug)
      // eslint-disable-next-line no-console -- browser-context debug logging, gated by debug flag
      console.log(OPA5_LOG_PREFIX, 'press', args.controlId, JSON.stringify({ success: true }));
    return { success: true };
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    if (args.debug)
      // eslint-disable-next-line no-console -- browser-context debug logging, gated by debug flag
      console.log(
        OPA5_LOG_PREFIX,
        'press',
        args.controlId,
        JSON.stringify({ success: false, error: errMsg }),
      );
    return { success: false, error: errMsg };
  }
}

/**
 * Browser-context: enterText interaction via RecordReplay with fallback.
 */
async function browserEnterText(args: EnterTextArgs): Promise<BridgeResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- browser context: bridge is injected at runtime on window
  const bridge = (window as any)[args.ns] as BrowserBridge | undefined;
  if (bridge?.RecordReplay === undefined) {
    const ctrl = bridge?.getById?.(args.controlId) ?? null;
    if (ctrl !== null && typeof ctrl.setValue === 'function') {
      ctrl.setValue(args.text);
      return { success: true };
    }
    return { success: false, error: 'RecordReplay not available' };
  }
  try {
    if (args.autoWait) await browserWaitForUI5(bridge.RecordReplay);
    bridge.RecordReplay.interactWithControl({
      selector: { id: args.controlId },
      interactionType: 'ENTER_TEXT',
      enterText: args.text,
    });
    if (args.debug)
      // eslint-disable-next-line no-console -- browser-context debug logging, gated by debug flag
      console.log(
        OPA5_LOG_PREFIX,
        'enterText',
        args.controlId,
        JSON.stringify({ success: true, text: args.text }),
      );
    return { success: true };
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    if (args.debug)
      // eslint-disable-next-line no-console -- browser-context debug logging, gated by debug flag
      console.log(
        OPA5_LOG_PREFIX,
        'enterText',
        args.controlId,
        JSON.stringify({ success: false, error: errMsg }),
      );
    return { success: false, error: errMsg };
  }
}

/**
 * Browser-context: select interaction via RecordReplay with fallback.
 */
async function browserSelect(args: SelectArgs): Promise<BridgeResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- browser context: bridge is injected at runtime on window
  const bridge = (window as any)[args.ns] as BrowserBridge | undefined;
  if (bridge?.RecordReplay === undefined) {
    const ctrl = bridge?.getById?.(args.controlId) ?? null;
    if (ctrl !== null && typeof ctrl.setSelectedKey === 'function') {
      ctrl.setSelectedKey(args.itemId);
      return { success: true };
    }
    return { success: false, error: 'RecordReplay not available' };
  }
  try {
    if (args.autoWait) await browserWaitForUI5(bridge.RecordReplay);
    bridge.RecordReplay.interactWithControl({
      selector: { id: args.controlId },
      interactionType: 'PRESS',
    });
    if (args.debug)
      // eslint-disable-next-line no-console -- browser-context debug logging, gated by debug flag
      console.log(
        OPA5_LOG_PREFIX,
        'select',
        args.controlId,
        JSON.stringify({ success: true, itemId: args.itemId }),
      );
    return { success: true };
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : String(e);
    if (args.debug)
      // eslint-disable-next-line no-console -- browser-context debug logging, gated by debug flag
      console.log(
        OPA5_LOG_PREFIX,
        'select',
        args.controlId,
        JSON.stringify({ success: false, error: errMsg }),
      );
    return { success: false, error: errMsg };
  }
}

/* v8 ignore stop */

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
    const result: BridgeResult = await page.evaluate(
      /* v8 ignore next -- browser-context: executed in Chromium, not Node.js */
      browserPress,
      {
        ns: BRIDGE_GLOBALS.NAMESPACE,
        controlId,
        timeout: this.config.interactionTimeout,
        autoWait: this.config.autoWait,
        debug: this.config.debug,
      },
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
    const result: BridgeResult = await page.evaluate(
      /* v8 ignore next -- browser-context: executed in Chromium, not Node.js */
      browserEnterText,
      {
        ns: BRIDGE_GLOBALS.NAMESPACE,
        controlId,
        text,
        timeout: this.config.interactionTimeout,
        autoWait: this.config.autoWait,
        debug: this.config.debug,
      },
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
    const result: BridgeResult = await page.evaluate(
      /* v8 ignore next -- browser-context: executed in Chromium, not Node.js */
      browserSelect,
      {
        ns: BRIDGE_GLOBALS.NAMESPACE,
        controlId,
        itemId,
        timeout: this.config.interactionTimeout,
        autoWait: this.config.autoWait,
        debug: this.config.debug,
      },
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
