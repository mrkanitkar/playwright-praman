/**
 * Shell & Footer fixtures — Playwright fixtures wrapping ShellHandler and FooterHandler.
 *
 * @ai
 * @aiContext Provides `ui5Shell` (ShellHandler: shell header, home nav, user menu, notifications)
 * and `ui5Footer` (FooterHandler: save, edit, cancel, message popover) fixtures.
 * Both are stateless — no teardown needed.
 *
 * @remarks
 * Provides `ui5Shell` and `ui5Footer` fixtures that create handler instances
 * with `page` auto-injected from the Playwright fixture system. Both are
 * stateless — no teardown logic required.
 *
 * Cross-fixture dependency (`page`) comes from Playwright's built-in fixture.
 *
 * @example
 * ```typescript
 * import { shellFooterTest } from '#fixtures/shell-footer-fixtures.js';
 *
 * shellFooterTest('verify shell and save', async ({ ui5Shell, ui5Footer }) => {
 *   await ui5Shell.expectShellHeader();
 *   await ui5Footer.clickSave();
 * });
 * ```
 *
 * @module fixtures
 */

import { test as base } from '@playwright/test';

import { FooterHandler } from './footer-handler.js';
import { ShellHandler } from './shell-handler.js';

// ── Public fixture types ───────────────────────────────────────────────────

/**
 * Fixture types for shell and footer handlers.
 *
 * @example
 * ```typescript
 * import type { ShellFooterFixtures } from '#fixtures/shell-footer-fixtures.js';
 * ```
 */
export interface ShellFooterFixtures {
  /** Shell header operations (home, user menu, notifications). */
  ui5Shell: ShellHandler;
  /** Footer bar button operations (save, edit, cancel, etc.). */
  ui5Footer: FooterHandler;
}

// ── Fixture definition ─────────────────────────────────────────────────────

/**
 * Playwright test object extended with shell and footer fixtures.
 *
 * @remarks
 * Both fixtures are stateless wrappers — they create handler instances on
 * each test and require no teardown. The `page` dependency comes from
 * Playwright's built-in fixture.
 *
 * @example
 * ```typescript
 * shellFooterTest('shell operations', async ({ ui5Shell, ui5Footer }) => {
 *   await ui5Shell.expectShellHeader();
 *   await ui5Shell.clickHome();
 *   await ui5Footer.clickSave();
 * });
 * ```
 */
export const shellFooterTest = base.extend<ShellFooterFixtures>({
  ui5Shell: async ({ page }, use) => {
    await use(new ShellHandler({ page }));
  },

  ui5Footer: async ({ page }, use) => {
    await use(new FooterHandler({ page }));
  },
});
