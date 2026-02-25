/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Core module — re-exports config, errors, logging, telemetry, utils, compat.
 *
 * @remarks
 * Sub-Phase 1.2 GATE: All core infrastructure modules are complete.
 *
 * @module core
 */

// ── Config ──────────────────────────────────────────────────────────
export { defineConfig, loadConfig, PramanConfigSchema } from './config/index.js';
export type { LoadConfigOptions, PramanConfig, PramanConfigInput } from './config/index.js';

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
} from './errors/index.js';

// ── Logging ─────────────────────────────────────────────────────────
export { createLogger, createRootLogger, REDACTION_PATHS } from './logging/index.js';

// ── Telemetry ───────────────────────────────────────────────────────
export { createSpanName, getNoOpTracer, initTelemetry, spanAttributes } from './telemetry/index.js';
export type { SpanWrapper, TracerWrapper } from './telemetry/index.js';

// ── Utils ───────────────────────────────────────────────────────────
export {
  calculateBackoff,
  DEFAULT_TIMEOUTS,
  retry,
  waitForUI5Bootstrap,
  waitForUI5Stable,
} from './utils/index.js';

// ── Compat ──────────────────────────────────────────────────────────
export {
  assertMinVersion,
  getPlaywrightFeatures,
  getPlaywrightVersion,
  hasFeature,
} from './compat/index.js';
export type { PlaywrightFeatures, PlaywrightVersion } from './compat/index.js';
