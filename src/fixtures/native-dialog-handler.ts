/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Native browser dialog observation and policy.
 *
 * @remarks
 * These are the browser's own dialogs — `alert`, `confirm`, `prompt` and
 * `beforeunload` — **not** `sap.m.Dialog`. For UI5 dialogs use
 * `#modules/dialog.js`; the two share a word and nothing else.
 *
 * Why SAP tests care: Praman already ships `hasPendingChanges()` for UI5 OData
 * dirty state, and its own API docs give the use case as *"detect unsaved
 * changes before navigation to prevent data loss warnings"*. That warning is a
 * native `beforeunload` dialog. Until now Praman could work around it but
 * never see it — navigating away silently auto-dismissed it.
 *
 * **The two events have opposite risk profiles, which is why they are separate
 * methods here:**
 *
 * - {@link NativeDialogHandler.observe} uses `dialogclosed` (Playwright 1.63+),
 *   which is purely observational and cannot change behaviour. Verified by
 *   probe: `dialogclosed` fires even for dialogs Playwright auto-dismissed
 *   with no `dialog` listener present, which is exactly the case detect-only
 *   depends on and the one its type documentation does not state.
 * - {@link NativeDialogHandler.register} uses `dialog`, which **changes
 *   behaviour by existing**. While no `dialog` listener is attached Playwright
 *   auto-dismisses everything; attach one and it becomes responsible for every
 *   dialog, and one left unanswered freezes the page so that every later
 *   action times out. That event exists at the 1.57 floor, so it needs no
 *   feature gate — but it is opt-in only, and this class guarantees that once
 *   a policy exists **no dialog goes unanswered**, including types no rule
 *   covers.
 *
 * @example
 * ```typescript
 * const handler = new NativeDialogHandler({ page });
 *
 * handler.observe(); // safe: records, changes nothing
 *
 * handler.register({ name: 'discard', types: ['beforeunload'], action: 'accept' });
 * // ... run the test ...
 * handler.dispose();
 * ```
 *
 * @module fixtures
 */

import type { Dialog, Page } from '@playwright/test';
import type { Logger } from 'pino';

import { hasFeature } from '#core/compat/playwright-compat.js';
import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { createLogger } from '#core/logging/logger.js';

/** Minimum Playwright version providing the `dialogclosed` event. */
const MIN_DIALOG_CLOSED_VERSION = '1.63.0';

/** Default cap on how many times one rule may fire per test. */
const DEFAULT_TIMES = 5;

/** The native dialog types a browser can raise. */
export type NativeDialogType = 'alert' | 'beforeunload' | 'confirm' | 'prompt';

/** How to answer a native dialog. */
export type NativeDialogAction = 'accept' | 'dismiss';

/**
 * A policy for answering one kind of native dialog.
 *
 * @example
 * ```typescript
 * const rule: NativeDialogRule = {
 *   name: 'discard-unsaved',
 *   types: ['beforeunload'],
 *   action: 'accept',
 * };
 * ```
 */
export interface NativeDialogRule {
  /** Stable identifier, used in logs and records. */
  readonly name: string;
  /** Dialog types this rule answers. Must not be empty. */
  readonly types: readonly NativeDialogType[];
  /** Whether to accept or dismiss. */
  readonly action: NativeDialogAction;
  /** Text supplied when accepting a `prompt`. Ignored for other types. */
  readonly promptText?: string;
  /** Maximum times this rule may fire per test. Defaults to 5. */
  readonly times?: number;
}

/**
 * One native dialog, as observed or answered.
 *
 * @example
 * ```typescript
 * const record: NativeDialogRecord = handler.records[0];
 * logger.info(record.type); // 'beforeunload'
 * ```
 */
export interface NativeDialogRecord {
  /** The dialog type reported by the browser. */
  readonly type: string;
  /** The dialog's message text. */
  readonly message: string;
  /**
   * Which rule answered it, or `'observed'` when only watching, or
   * `'unmatched'` when a policy was active but no rule covered the type.
   */
  readonly handledBy: string;
  /** What was done. `'observed'` means the dialog was not touched. */
  readonly action: NativeDialogAction | 'observed';
  /** Message from a failed accept/dismiss, when one occurred. */
  readonly error?: string;
}

/**
 * Options for constructing a {@link NativeDialogHandler}.
 *
 * @example
 * ```typescript
 * const options: NativeDialogHandlerOptions = { page };
 * ```
 */
export interface NativeDialogHandlerOptions {
  readonly page: Page;
  /** Optional parent logger. A child logger is created when omitted. */
  readonly logger?: Logger;
}

/**
 * Observes and optionally answers native browser dialogs.
 *
 * @example
 * ```typescript
 * const handler = new NativeDialogHandler({ page });
 * handler.observe();
 * ```
 */
export class NativeDialogHandler {
  readonly #page: Page;
  readonly #log: Logger;
  readonly #rules: NativeDialogRule[] = [];
  readonly #firedCounts = new Map<string, number>();
  readonly #records: NativeDialogRecord[] = [];
  #dialogListener: ((dialog: Dialog) => void) | undefined;
  #closedListener: ((dialog: Dialog) => void) | undefined;

  constructor(options: NativeDialogHandlerOptions) {
    this.#page = options.page;
    this.#log = options.logger ?? createLogger('native-dialog');
  }

  /** Every dialog seen so far, in order. */
  get records(): readonly NativeDialogRecord[] {
    return this.#records;
  }

  /**
   * Starts recording dialogs **without changing behaviour**.
   *
   * @remarks
   * Attaches only `dialogclosed`, never `dialog`, so Playwright keeps
   * auto-dismissing exactly as it would without Praman. Safe to call
   * unconditionally; calling it twice is a no-op.
   *
   * Degrades to no diagnostics below Playwright
   * {@link MIN_DIALOG_CLOSED_VERSION} and logs that it did. It does not throw:
   * there is no floor equivalent for *watching* a dialog without taking
   * responsibility for it, and observation is additive, so silence is the
   * honest degrade rather than denying the caller a working test.
   *
   * @example
   * ```typescript
   * handler.observe();
   * ```
   */
  observe(): void {
    if (this.#closedListener !== undefined) return;

    if (!hasFeature('hasDialogClosedEvent')) {
      this.#log.debug(
        { requiredVersion: MIN_DIALOG_CLOSED_VERSION, feature: 'hasDialogClosedEvent' },
        'Native dialog diagnostics unavailable — dialogs will be auto-dismissed unobserved',
      );
      return;
    }

    const listener = (dialog: Dialog): void => {
      this.#records.push({
        type: dialog.type(),
        message: dialog.message(),
        handledBy: 'observed',
        action: 'observed',
      });
      this.#log.debug({ type: dialog.type(), message: dialog.message() }, 'Native dialog closed');
    };

    this.#closedListener = listener;
    this.#page.on('dialogclosed', listener);
  }

  /**
   * Opts into answering dialogs according to a rule.
   *
   * @remarks
   * The first call attaches the single `dialog` listener. From that moment
   * Playwright stops auto-dismissing, so this class answers **every** dialog:
   * a type no rule covers, or a rule that has hit its `times` cap, is
   * dismissed and logged at `warn` rather than left to freeze the page.
   *
   * @param rule - The policy to add.
   * @throws PramanError with `ERR_CONFIG_INVALID` for an empty `types` list or
   *   a duplicate rule name.
   *
   * @example
   * ```typescript
   * handler.register({ name: 'discard', types: ['beforeunload'], action: 'accept' });
   * ```
   */
  register(rule: NativeDialogRule): void {
    if (rule.types.length === 0) {
      throw new PramanError({
        code: ErrorCode.ERR_CONFIG_INVALID,
        message: `Native dialog rule "${rule.name}" lists no dialog types.`,
        attempted: `Register native dialog rule "${rule.name}"`,
        retryable: false,
        details: { rule: rule.name },
        suggestions: ["Add at least one type, e.g. types: ['confirm']"],
      });
    }

    if (this.#rules.some((existing) => existing.name === rule.name)) {
      throw new PramanError({
        code: ErrorCode.ERR_CONFIG_INVALID,
        message: `Native dialog rule "${rule.name}" is already registered.`,
        attempted: `Register native dialog rule "${rule.name}"`,
        retryable: false,
        details: { rule: rule.name },
        suggestions: ['Give each rule a distinct name'],
      });
    }

    this.#rules.push(rule);
    this.#attachDialogListener();
    this.#log.debug({ rule: rule.name, types: rule.types }, 'Native dialog rule registered');
  }

  /**
   * Registers several rules in order.
   *
   * @param rules - The policies to add.
   *
   * @example
   * ```typescript
   * handler.registerAll([{ name: 'a', types: ['alert'], action: 'dismiss' }]);
   * ```
   */
  registerAll(rules: readonly NativeDialogRule[]): void {
    for (const rule of rules) {
      this.register(rule);
    }
  }

  /**
   * Removes every listener this handler attached.
   *
   * @remarks
   * Removing the `dialog` listener hands dialogs back to Playwright, which
   * resumes auto-dismissing them. Safe to call when nothing was registered.
   *
   * @example
   * ```typescript
   * handler.dispose();
   * ```
   */
  dispose(): void {
    if (this.#dialogListener !== undefined) {
      this.#page.off('dialog', this.#dialogListener);
      this.#dialogListener = undefined;
    }
    if (this.#closedListener !== undefined) {
      this.#page.off('dialogclosed', this.#closedListener);
      this.#closedListener = undefined;
    }
  }

  /** Attaches the single `dialog` listener, once. */
  #attachDialogListener(): void {
    if (this.#dialogListener !== undefined) return;

    const listener = (dialog: Dialog): void => {
      void this.#onDialog(dialog);
    };
    this.#dialogListener = listener;
    this.#page.on('dialog', listener);
  }

  /** Answers one dialog, guaranteeing it is never left unanswered. */
  async #onDialog(dialog: Dialog): Promise<void> {
    const type = dialog.type();
    const rule = this.#matchRule(type);

    if (rule === undefined) {
      await this.#answer(dialog, 'dismiss', 'unmatched');
      this.#log.warn(
        { type, message: dialog.message(), rules: this.#rules.map((r) => r.name) },
        'Native dialog matched no rule — dismissed to keep the page responsive',
      );
      return;
    }

    this.#firedCounts.set(rule.name, (this.#firedCounts.get(rule.name) ?? 0) + 1);
    await this.#answer(dialog, rule.action, rule.name, rule.promptText);
  }

  /** Finds the first rule covering this type that has fire budget left. */
  #matchRule(type: string): NativeDialogRule | undefined {
    return this.#rules.find((rule) => {
      if (!rule.types.includes(type as NativeDialogType)) return false;
      const fired = this.#firedCounts.get(rule.name) ?? 0;
      return fired < (rule.times ?? DEFAULT_TIMES);
    });
  }

  /**
   * Performs the accept/dismiss and records it.
   *
   * @remarks
   * A rejection is recorded rather than rethrown. This runs inside a Playwright
   * event listener, where a thrown error does not reach the test but *would*
   * leave the dialog unanswered — the one outcome worse than a failed action.
   */
  async #answer(
    dialog: Dialog,
    action: NativeDialogAction,
    handledBy: string,
    promptText?: string,
  ): Promise<void> {
    try {
      if (action === 'accept') {
        await (promptText === undefined ? dialog.accept() : dialog.accept(promptText));
      } else {
        await dialog.dismiss();
      }
      this.#records.push({
        type: dialog.type(),
        message: dialog.message(),
        handledBy,
        action,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.#records.push({
        type: dialog.type(),
        message: dialog.message(),
        handledBy,
        action,
        error: message,
      });
      this.#log.warn({ err: error, handledBy }, 'Failed to answer native dialog');
    }
  }
}
