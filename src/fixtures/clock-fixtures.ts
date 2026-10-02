/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Clock fixtures — Playwright fixture wrapping {@link Ui5Clock}.
 *
 * @ai
 * @aiContext Provides the `ui5Clock` fixture for deterministic time control in
 * SAP tests. The clock is NOT installed automatically — call
 * `ui5Clock.install()` in tests that need it.
 *
 * @remarks
 * The fixture only constructs the handler; it never installs the fake clock.
 * SAP authentication is time-sensitive — session tokens, SAML assertions and
 * CSRF tokens all carry validity windows — so a globally installed fake clock
 * could invalidate a session mid-test or mask a genuine expiry bug.
 *
 * @example
 * ```typescript
 * import { clockTest } from '#fixtures/clock-fixtures.js';
 *
 * clockTest('posting blocked after period close', async ({ page, ui5Clock }) => {
 *   await ui5Clock.install('2026-03-31T23:59:00Z');
 *   await page.goto('/');
 *   await ui5Clock.fastForward('02:00'); // past midnight, period closed
 * });
 * ```
 *
 * @module fixtures
 */

import type { Page } from '@playwright/test';
import { test as base } from '@playwright/test';

import { Ui5Clock } from './clock-handler.js';

// ── Public fixture types ───────────────────────────────────────────────────

/**
 * Fixture types for deterministic time control.
 *
 * @example
 * ```typescript
 * import type { ClockFixtures } from '#fixtures/clock-fixtures.js';
 * ```
 */
export interface ClockFixtures {
  /** Browser clock control. Not installed until `install()` is called. */
  ui5Clock: Ui5Clock;
}

// ── Fixture definition ─────────────────────────────────────────────────────

/**
 * Playwright test object extended with the `ui5Clock` fixture.
 *
 * @remarks
 * Constructing the fixture has no effect on the page. Nothing changes until a
 * test calls `install()`, which keeps time-sensitive SAP auth flows untouched
 * in every test that does not opt in.
 *
 * @capability ui5Clock.install
 *
 * @example
 * ```typescript
 * clockTest('validity date boundary', async ({ page, ui5Clock }) => {
 *   await ui5Clock.install('2026-12-31T23:59:00Z');
 *   await page.goto('/');
 * });
 * ```
 */
export const clockTest = base.extend<ClockFixtures>({
  ui5Clock: async ({ page }: { page: Page }, use) => {
    await use(new Ui5Clock({ page }));
  },
});
