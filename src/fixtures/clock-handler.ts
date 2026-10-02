/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Deterministic time control for SAP scenarios.
 *
 * @ai
 * @aiContext Wraps `page.clock` so SAP date-driven logic can be tested
 * deterministically — fiscal periods, validity dates, pricing conditions,
 * session expiry. Must be installed explicitly; it never installs itself.
 *
 * @remarks
 * `page.clock` has existed since Playwright 1.45, below Praman's 1.57 floor, so
 * this works everywhere. The `hasClockAPI` flag is still checked so that a
 * consumer who has somehow pinned an older Playwright gets a precise error
 * instead of a `TypeError`.
 *
 * **Installation is deliberately opt-in.** SAP authentication is time-sensitive:
 * session tokens, SAML assertions and CSRF tokens all carry validity windows. A
 * globally installed fake clock could invalidate a session mid-test, or mask a
 * genuine expiry bug. Install it only in tests that need it, and prefer
 * installing before navigation so the application sees the faked time from the
 * start.
 *
 * @example
 * ```typescript
 * import { Ui5Clock } from '#fixtures/clock-handler.js';
 *
 * const clock = new Ui5Clock({ page });
 * await clock.install('2026-03-31T12:00:00Z');  // last day of the fiscal period
 * await page.goto('/');
 * ```
 *
 * @module fixtures
 */

import type { Page } from '@playwright/test';
import type { Logger } from 'pino';

import { hasFeature } from '#core/compat/playwright-compat.js';
import { PramanError } from '#core/errors/base.js';
import { ErrorCode } from '#core/errors/codes.js';
import { createLogger } from '#core/logging/logger.js';

/** Minimum Playwright version providing `page.clock`. */
const MIN_CLOCK_VERSION = '1.45.0';

/** A point in time, as accepted by `page.clock`. */
type ClockTime = string | number | Date;

/**
 * Options for constructing a {@link Ui5Clock}.
 *
 * @example
 * ```typescript
 * const options: Ui5ClockOptions = { page };
 * ```
 */
export interface Ui5ClockOptions {
  readonly page: Page;
  /** Optional parent logger. A child logger is created when omitted. */
  readonly logger?: Logger;
}

/** Shape of `page.clock`, kept local so older type packages still compile. */
interface ClockApi {
  install: (options: { time?: ClockTime }) => Promise<void>;
  setFixedTime: (time: ClockTime) => Promise<void>;
  fastForward: (ticks: number | string) => Promise<void>;
  pauseAt: (time: ClockTime) => Promise<void>;
  resume: () => Promise<void>;
  runFor: (ticks: number | string) => Promise<void>;
}

/**
 * Controls the browser clock for date-driven SAP tests.
 *
 * @remarks
 * Call {@link install} first — the other methods throw until you do, because
 * Playwright silently ignores clock control on an uninstalled clock, which is a
 * confusing way to lose an afternoon.
 *
 * @capability ui5Clock.install
 *
 * @example
 * ```typescript
 * const clock = new Ui5Clock({ page });
 * await clock.install('2026-03-31T12:00:00Z');
 * await clock.fastForward('30:00'); // 30 minutes later
 * ```
 */
export class Ui5Clock {
  readonly #page: Page;
  readonly #log: Logger;
  #installed = false;

  constructor(options: Ui5ClockOptions) {
    this.#page = options.page;
    this.#log = createLogger('ui5-clock', options.logger);
  }

  /**
   * Whether {@link install} has run.
   *
   * @example
   * ```typescript
   * if (!clock.installed) await clock.install();
   * ```
   */
  get installed(): boolean {
    return this.#installed;
  }

  /**
   * Installs the fake clock, optionally at a specific time.
   *
   * @remarks
   * Install before navigating where possible, so the application sees the faked
   * time from its first render.
   *
   * @param time - Initial time. Omit to install at the current real time.
   * @throws {@link PramanError} with `ERR_COMPAT_FEATURE_UNAVAILABLE` when
   *   Playwright predates 1.45.
   *
   * @capability ui5Clock.install
   *
   * @example
   * ```typescript
   * await clock.install('2026-03-31T12:00:00Z');
   * ```
   */
  async install(time?: ClockTime): Promise<void> {
    this.#assertAvailable();

    await this.#clock().install(time === undefined ? {} : { time });
    this.#installed = true;

    // Deliberately `warn`: a faked clock changes what the application sees, and
    // SAP session/token validity is time-sensitive.
    this.#log.warn(
      { time: time === undefined ? 'current' : String(time) },
      'Fake clock installed — SAP session and token validity are time-sensitive',
    );
  }

  /**
   * Pins the clock to a fixed time without affecting timers.
   *
   * @param time - The time to report.
   *
   * @capability ui5Clock.setFixedTime
   *
   * @example
   * ```typescript
   * await clock.setFixedTime('2026-12-31T23:59:00Z');
   * ```
   */
  async setFixedTime(time: ClockTime): Promise<void> {
    this.#assertInstalled('setFixedTime');
    await this.#clock().setFixedTime(time);
  }

  /**
   * Jumps forward, firing any timers scheduled in between.
   *
   * @param ticks - Milliseconds, or a `"mm:ss"` / `"hh:mm:ss"` string.
   *
   * @capability ui5Clock.fastForward
   *
   * @example
   * ```typescript
   * await clock.fastForward('30:00'); // 30 minutes
   * ```
   */
  async fastForward(ticks: number | string): Promise<void> {
    this.#assertInstalled('fastForward');
    await this.#clock().fastForward(ticks);
  }

  /**
   * Advances to a time, pausing there.
   *
   * @param time - The time to pause at.
   *
   * @capability ui5Clock.pauseAt
   *
   * @example
   * ```typescript
   * await clock.pauseAt('2026-06-30T00:00:00Z'); // period close
   * ```
   */
  async pauseAt(time: ClockTime): Promise<void> {
    this.#assertInstalled('pauseAt');
    await this.#clock().pauseAt(time);
  }

  /**
   * Resumes normal time flow after a pause.
   *
   * @capability ui5Clock.resume
   *
   * @example
   * ```typescript
   * await clock.resume();
   * ```
   */
  async resume(): Promise<void> {
    this.#assertInstalled('resume');
    await this.#clock().resume();
  }

  /**
   * Runs the clock forward, firing timers, without jumping.
   *
   * @param ticks - Milliseconds, or a `"mm:ss"` / `"hh:mm:ss"` string.
   *
   * @capability ui5Clock.runFor
   *
   * @example
   * ```typescript
   * await clock.runFor(5_000);
   * ```
   */
  async runFor(ticks: number | string): Promise<void> {
    this.#assertInstalled('runFor');
    await this.#clock().runFor(ticks);
  }

  /** Narrowed accessor for the clock API. */
  #clock(): ClockApi {
    return (this.#page as Page & { clock: ClockApi }).clock;
  }

  /** Fails precisely rather than with a TypeError on an older Playwright. */
  #assertAvailable(): void {
    if (hasFeature('hasClockAPI')) return;
    throw new PramanError({
      code: ErrorCode.ERR_COMPAT_FEATURE_UNAVAILABLE,
      message: `page.clock requires Playwright ${MIN_CLOCK_VERSION} or later.`,
      attempted: 'Install the fake clock',
      retryable: false,
      details: { requiredVersion: MIN_CLOCK_VERSION, feature: 'hasClockAPI' },
      suggestions: [
        `Upgrade Playwright: npm install -D @playwright/test@${MIN_CLOCK_VERSION}`,
        'Check your installed version: npx playwright --version',
      ],
    });
  }

  /** Guards against silent no-ops on an uninstalled clock. */
  #assertInstalled(operation: string): void {
    if (this.#installed) return;
    throw new PramanError({
      code: ErrorCode.ERR_CONFIG_INVALID,
      message: `Cannot ${operation} before the clock is installed.`,
      attempted: `Call ${operation} on an uninstalled clock`,
      retryable: false,
      details: { operation },
      suggestions: [
        'Call await clock.install() first, ideally before page.goto()',
        'Playwright silently ignores clock control when the clock is not installed',
      ],
    });
  }
}
