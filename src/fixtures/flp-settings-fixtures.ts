/**
 * FLP Settings fixtures — Playwright fixture wrapping FLPSettingsHandler.
 *
 * @ai
 * @aiContext Provides `flpSettings` fixture for reading SAP Fiori Launchpad user settings
 * (language, date/time/number formats, timezone) via the UShell Container API.
 *
 * @remarks
 * Provides an `flpSettings` fixture that creates an {@link FLPSettingsHandler}
 * with `page` auto-injected from the Playwright fixture system. The handler
 * is stateless — no teardown logic required.
 *
 * @example
 * ```typescript
 * import { flpSettingsTest } from '#fixtures/flp-settings-fixtures.js';
 *
 * flpSettingsTest('read user settings', async ({ flpSettings }) => {
 *   const lang = await flpSettings.getLanguage();
 *   const all = await flpSettings.getAllSettings();
 * });
 * ```
 *
 * @module fixtures
 */

import { test as base } from '@playwright/test';

import { FLPSettingsHandler } from './flp-settings-handler.js';

// ── Public fixture types ───────────────────────────────────────────────────

/**
 * Fixture types for the FLP settings handler.
 *
 * @example
 * ```typescript
 * import type { FLPSettingsFixtures } from '#fixtures/flp-settings-fixtures.js';
 * ```
 */
export interface FLPSettingsFixtures {
  /** FLP user settings reader (language, date/time/number formats, timezone). */
  flpSettings: FLPSettingsHandler;
}

// ── Fixture definition ─────────────────────────────────────────────────────

/**
 * Playwright test object extended with the FLP settings fixture.
 *
 * @remarks
 * The `flpSettings` fixture is a stateless wrapper — it creates an
 * {@link FLPSettingsHandler} instance on each test and requires no teardown.
 * The `page` dependency comes from Playwright's built-in fixture.
 *
 * @example
 * ```typescript
 * flpSettingsTest('verify locale settings', async ({ flpSettings }) => {
 *   const lang = await flpSettings.getLanguage();
 *   const dateFormat = await flpSettings.getDateFormat();
 *   const all = await flpSettings.getAllSettings();
 * });
 * ```
 */
export const flpSettingsTest = base.extend<FLPSettingsFixtures>({
  flpSettings: async ({ page }, use) => {
    await use(new FLPSettingsHandler({ page }));
  },
});
