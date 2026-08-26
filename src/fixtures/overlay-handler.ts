/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Overlay interruption handler — automatic handling of SAP overlays that
 * interrupt an action.
 *
 * @ai
 * @aiContext Registers Playwright locator handlers for SAP overlays that appear
 * unpredictably mid-action (unexpected modal dialogs, cookie banners, product
 * tours). Detects and reports by default; dismisses only when a rule explicitly
 * supplies a `dismiss` function.
 *
 * @remarks
 * Built on `page.addLocatorHandler()`, available since Playwright 1.42 and
 * therefore below Praman's 1.57 floor — no version gate is required.
 *
 * Three design constraints are deliberate and load-bearing:
 *
 * 1. **Detect, don't dismiss.** A handler that silently answers a dialog can
 *    turn a genuine failure into a passing test. Rules report by default;
 *    dismissal is opt-in per rule and always logged at `warn`.
 * 2. **Busy state is not an overlay.** `BusyIndicator` and the UI5 block layer
 *    are handled by {@link waitForUI5Stable}. Registering a handler for them
 *    too would put two independent wait mechanisms on every action, with no
 *    defined precedence when they disagree.
 * 3. **Plain CSS only, for built-ins.** Playwright evaluates every registered
 *    locator before every action and assertion. The `ui5=` selector engine
 *    walks the whole UI5 control tree, so built-in rules use SAP's stable class
 *    names instead. User-defined rules may use `ui5=` where control semantics
 *    are genuinely needed.
 *
 * @example
 * ```typescript
 * import { OverlayHandler } from '#fixtures/overlay-handler.js';
 *
 * const overlays = new OverlayHandler({ page });
 * await overlays.register({
 *   name: 'cookie-consent',
 *   selector: '#cookieBanner',
 *   dismiss: async (overlay) => overlay.getByRole('button', { name: 'Accept' }).click(),
 * });
 * ```
 *
 * @module fixtures
 */

import type { Locator, Page } from '@playwright/test';
import type { Logger } from 'pino';

import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { createLogger } from '#core/logging/logger.js';

/** Default cap on how many times a single rule may fire within one test. */
const DEFAULT_TIMES = 5;

/** Maximum characters of overlay text retained in a detection record. */
const MAX_TEXT_LENGTH = 200;

/**
 * A rule describing one overlay that may interrupt an action.
 *
 * @remarks
 * Omit `dismiss` to detect and report only — the recommended default. Supply
 * `dismiss` only when answering the overlay cannot change the meaning of the
 * test.
 *
 * @example
 * ```typescript
 * const rule: OverlayRule = {
 *   name: 'product-tour',
 *   selector: '.myTourPopover',
 *   dismiss: async (overlay) => overlay.getByRole('button', { name: 'Skip' }).click(),
 * };
 * ```
 */
export interface OverlayRule {
  /** Stable identifier, used in logs and report attachments. */
  readonly name: string;
  /**
   * Playwright selector locating the overlay. Prefer plain CSS — this is
   * evaluated before every action.
   */
  readonly selector: string;
  /**
   * How to dismiss the overlay. When omitted the overlay is recorded and
   * reported but never touched.
   */
  readonly dismiss?: (overlay: Locator) => Promise<void>;
  /** Maximum times this rule may fire per test. Defaults to 5. */
  readonly times?: number;
}

/**
 * A single occurrence of an overlay interrupting an action.
 *
 * @example
 * ```typescript
 * const detection: OverlayDetection = handler.detections[0];
 * logger.info(detection.rule); // 'unexpected-dialog'
 * ```
 */
export interface OverlayDetection {
  /** Name of the rule that fired. */
  readonly rule: string;
  /** Trimmed text content of the overlay, for diagnosis. */
  readonly text: string;
  /** Whether a dismiss function ran successfully. */
  readonly dismissed: boolean;
  /** Message from a failed dismissal, when one occurred. */
  readonly error?: string;
}

/**
 * Options for constructing an {@link OverlayHandler}.
 *
 * @example
 * ```typescript
 * const options: OverlayHandlerOptions = { page };
 * ```
 */
export interface OverlayHandlerOptions {
  readonly page: Page;
  /** Optional parent logger. A child logger is created when omitted. */
  readonly logger?: Logger;
}

/**
 * Overlay rules registered by default.
 *
 * @remarks
 * Deliberately minimal and strictly non-destructive. The one built-in turns an
 * opaque "action timed out" into a named diagnosis — "a modal dialog reading
 * *Session Expiring* blocked this click" — without answering the dialog.
 *
 * Which overlays actually appear is highly system-specific (What's New,
 * cookie consent, custom Z-dialogs), so dismissal rules belong in the
 * consuming project rather than shipped as guesses.
 *
 * @example
 * ```typescript
 * import { BUILT_IN_OVERLAY_RULES } from '#fixtures/overlay-handler.js';
 *
 * for (const rule of BUILT_IN_OVERLAY_RULES) {
 *   await overlays.register(rule);
 * }
 * ```
 */
export const BUILT_IN_OVERLAY_RULES: readonly OverlayRule[] = [
  {
    name: 'unexpected-dialog',
    // `.sapMDialog` is the stable container class for sap.m.Dialog, already
    // relied on by src/scripts/dialog-controls.ts.
    selector: '.sapMDialog',
  },
];

/**
 * Registers and tracks SAP overlay interruption handlers for one page.
 *
 * @remarks
 * Handlers registered through `page.addLocatorHandler()` live for the lifetime
 * of the page, so a handler must be disposed at the end of the test that
 * registered it. {@link dispose} does that.
 *
 * @capability ui5Overlays.register
 *
 * @example
 * ```typescript
 * const overlays = new OverlayHandler({ page });
 * await overlays.register({ name: 'tour', selector: '.tourPopover' });
 * // ... test body ...
 * await overlays.dispose();
 * ```
 */
export class OverlayHandler {
  readonly #page: Page;
  readonly #log: Logger;
  readonly #registered = new Map<string, Locator>();
  readonly #detections: OverlayDetection[] = [];

  constructor(options: OverlayHandlerOptions) {
    this.#page = options.page;
    this.#log = createLogger('overlay-handler', options.logger);
  }

  /**
   * Every overlay interruption recorded so far, in the order they occurred.
   *
   * @example
   * ```typescript
   * if (overlays.detections.length > 0) {
   *   logger.warn(`${overlays.detections.length} overlays interrupted this test`);
   * }
   * ```
   */
  get detections(): readonly OverlayDetection[] {
    return this.#detections;
  }

  /**
   * Registers one overlay rule with Playwright.
   *
   * @param rule - The overlay rule to register.
   * @throws {@link PramanError} with `ERR_CONFIG_INVALID` when the rule name is
   *   already registered.
   *
   * @capability ui5Overlays.register
   *
   * @example
   * ```typescript
   * await overlays.register({ name: 'cookie-consent', selector: '#cookieBar' });
   * ```
   */
  async register(rule: OverlayRule): Promise<void> {
    if (this.#registered.has(rule.name)) {
      throw new PramanError({
        code: ErrorCode.ERR_CONFIG_INVALID,
        message: `Overlay rule "${rule.name}" is already registered.`,
        attempted: `Register overlay rule "${rule.name}"`,
        retryable: false,
        details: { rule: rule.name, selector: rule.selector },
        suggestions: [
          'Give each overlay rule a unique name',
          'Call overlays.dispose() before re-registering rules',
        ],
      });
    }

    const locator = this.#page.locator(rule.selector);
    const isDetectOnly = rule.dismiss === undefined;

    await this.#page.addLocatorHandler(locator, async (overlay) => this.#onOverlay(rule, overlay), {
      times: rule.times ?? DEFAULT_TIMES,
      // Nothing dismissed a detect-only overlay, so waiting for it to hide
      // would stall the action until timeout and bury the diagnosis.
      noWaitAfter: isDetectOnly,
    });

    this.#registered.set(rule.name, locator);
    this.#log.debug(
      { rule: rule.name, selector: rule.selector, detectOnly: isDetectOnly },
      'Overlay rule registered',
    );
  }

  /**
   * Registers several overlay rules.
   *
   * @param rules - The overlay rules to register.
   *
   * @capability ui5Overlays.registerAll
   *
   * @example
   * ```typescript
   * await overlays.registerAll(BUILT_IN_OVERLAY_RULES);
   * ```
   */
  async registerAll(rules: readonly OverlayRule[]): Promise<void> {
    for (const rule of rules) {
      await this.register(rule);
    }
  }

  /**
   * Unregisters every rule this handler registered.
   *
   * @remarks
   * Safe to call on a closed page — removal failures are logged and swallowed,
   * because teardown must never mask the test's own result.
   *
   * @capability ui5Overlays.dispose
   *
   * @example
   * ```typescript
   * await overlays.dispose();
   * ```
   */
  async dispose(): Promise<void> {
    for (const [name, locator] of this.#registered) {
      try {
        await this.#page.removeLocatorHandler(locator);
      } catch (error: unknown) {
        this.#log.debug(
          { rule: name, error: error instanceof Error ? error.message : String(error) },
          'Overlay rule removal failed (page likely closed)',
        );
      }
    }
    this.#registered.clear();
  }

  /** Runs when a registered overlay interrupts an action. */
  async #onOverlay(rule: OverlayRule, overlay: Locator): Promise<void> {
    const text = await this.#readText(overlay);

    if (rule.dismiss === undefined) {
      this.#detections.push({ rule: rule.name, text, dismissed: false });
      this.#log.warn(
        { rule: rule.name, text },
        'Overlay interrupted an action and was left in place (detect-only rule)',
      );
      return;
    }

    try {
      await rule.dismiss(overlay);
      this.#detections.push({ rule: rule.name, text, dismissed: true });
      // Deliberately `warn`, not `debug`: a dismissal changed what the test saw,
      // and that must be visible when reviewing a pass.
      this.#log.warn({ rule: rule.name, text }, 'Overlay dismissed automatically');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.#detections.push({ rule: rule.name, text, dismissed: false, error: message });
      this.#log.warn(
        { rule: rule.name, text, error: message },
        'Overlay dismissal failed; leaving the action to fail on its own terms',
      );
    }
  }

  /** Reads overlay text defensively — diagnosis must never throw. */
  async #readText(overlay: Locator): Promise<string> {
    try {
      const raw = await overlay.first().textContent();
      return (raw ?? '').trim().slice(0, MAX_TEXT_LENGTH);
    } catch {
      return '';
    }
  }
}
