/**
 * Praman v1.0 — AI-First SAP UI5 Test Automation Platform for Playwright.
 *
 * @remarks
 * Phase 1 GATE: Core infrastructure, selectors, and matchers complete.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * import { test, expect } from 'playwright-praman';
 *
 * test('create purchase order', async ({ page, ui5, navigation }) => {
 *   await navigation.openTileByTitle('Create Purchase Order');
 *   const input = await ui5.control({ id: 'vendorInput' });
 *   await input.setValue('V001');
 * });
 * ```
 */
export { test, expect } from '@playwright/test';

// ── Config ──────────────────────────────────────────────────────────
export { defineConfig, loadConfig } from './core/config/index.js';
export type { PramanConfig, PramanConfigInput, LoadConfigOptions } from './core/config/index.js';

// ── Errors ──────────────────────────────────────────────────────────
export {
  AIError,
  AuthError,
  BridgeError,
  ConfigError,
  ControlError,
  ErrorCode,
  NavigationError,
  ODataError,
  PluginError,
  PramanError,
  SelectorError,
  TimeoutError,
} from './core/errors/index.js';

// ── Logging ─────────────────────────────────────────────────────────
export { createLogger, createRootLogger } from './core/logging/index.js';

// ── Telemetry ───────────────────────────────────────────────────────
export { initTelemetry } from './core/telemetry/index.js';

// ── Utils ───────────────────────────────────────────────────────────
export {
  DEFAULT_TIMEOUTS,
  retry,
  waitForUI5Bootstrap,
  waitForUI5Stable,
} from './core/utils/index.js';

// ── Compat ──────────────────────────────────────────────────────────
export { getPlaywrightVersion, hasFeature } from './core/compat/index.js';

// ── Selectors ───────────────────────────────────────────────────────
export {
  createUI5SelectorEngineScript,
  isUI5SelectorString,
  parseUI5Selector,
  serializeUI5Selector,
  validateUI5Selector,
} from './selectors/index.js';

// ── Matchers ────────────────────────────────────────────────────────
export {
  checkUI5CellText,
  checkUI5Enabled,
  checkUI5Property,
  checkUI5RowCount,
  checkUI5SelectedRows,
  checkUI5Text,
  checkUI5ValueState,
  checkUI5Visible,
} from './matchers/index.js';
export type { MatcherResult } from './matchers/index.js';

/**
 * Praman library version.
 *
 * @example
 * ```typescript
 * import { VERSION } from 'playwright-praman';
 * console.log(VERSION);
 * ```
 */
export const VERSION = '1.0.0-dev' as const;
