/**
 * Praman v1.0 — AI-First SAP UI5 Test Automation Platform for Playwright.
 *
 * @remarks
 * Phase 2 GATE: Core + Bridge + Proxy layers complete.
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

// ── Bridge ──────────────────────────────────────────────────────────
export {
  createBridgeAdapter,
  ClassicUI5Adapter,
  HybridAdapter,
  WebComponentAdapter,
  ensureBridgeInjected,
  isBridgeReady,
  waitForBridgeReady,
} from './bridge/index.js';
export type {
  BridgeAdapter,
  BridgePage,
  AdapterMode,
  MethodExecutionResult,
} from './bridge/index.js';

// ── Proxy ───────────────────────────────────────────────────────────
export {
  createControlProxy,
  ControlProxyCache,
  discoverControl,
  UI5Object,
  UI5ObjectCache,
} from './proxy/index.js';
export type { ControlProxyState } from './proxy/index.js';

// ── Version ──────────────────────────────────────────────────────────
export { PACKAGE_NAME, VERSION } from './version.js';
