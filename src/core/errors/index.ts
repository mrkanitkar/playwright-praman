/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Errors module barrel — re-exports all error classes, codes, and types.
 *
 * @module errors
 */

// ── Error codes ──────────────────────────────────────────────────────
export { ErrorCode } from './codes.js';
export type { ErrorCategory, ErrorCode as ErrorCodeType, ErrorCodePattern } from './codes.js';

// ── Base error class ─────────────────────────────────────────────────
export { PramanError } from './base.js';
export type { AIErrorContext, PramanErrorOptions, SerializedPramanError } from './base.js';

// ── Error subclasses ─────────────────────────────────────────────────
export { AIError } from './ai-error.js';
export type { AIErrorOptions, TokenUsage } from './ai-error.js';

export { AuthError } from './auth-error.js';
export type { AuthErrorOptions } from './auth-error.js';

export { BridgeError } from './bridge-error.js';
export type { BridgeErrorOptions } from './bridge-error.js';

export { ConfigError } from './config-error.js';
export type { ConfigErrorOptions } from './config-error.js';

export { ControlError } from './control-error.js';
export type { ControlErrorOptions } from './control-error.js';

export { FLPError } from './flp-error.js';
export type { FLPErrorOptions } from './flp-error.js';

export { NavigationError } from './navigation-error.js';
export type { NavigationErrorOptions } from './navigation-error.js';

export { ODataError } from './odata-error.js';
export type { ODataErrorOptions } from './odata-error.js';

export { PluginError } from './plugin-error.js';
export type { PluginErrorOptions } from './plugin-error.js';

export { SelectorError } from './selector-error.js';
export type { SelectorErrorOptions } from './selector-error.js';

export { TimeoutError } from './timeout-error.js';
export type { TimeoutErrorOptions } from './timeout-error.js';

export { VocabularyError } from './vocabulary-error.js';
export type { VocabularyErrorOptions } from './vocabulary-error.js';

export { IntentError } from './intent-error.js';
export type { IntentErrorOptions } from './intent-error.js';

export { TelemetryError } from './telemetry-error.js';
export type { TelemetryErrorOptions } from './telemetry-error.js';
