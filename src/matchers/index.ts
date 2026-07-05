/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Barrel file for matchers module.
 *
 * @remarks
 * Re-exports all matcher functions and types for UI5 control assertions.
 *
 * @module matchers
 */
export {
  checkUI5Binding,
  checkUI5ControlType,
  checkUI5Enabled,
  checkUI5Property,
  checkUI5Text,
  checkUI5ValueState,
  checkUI5Visible,
} from './ui5-matchers.js';
export type { MatcherOptions, MatcherResult } from './ui5-matchers.js';
export { MATCHER_DEFAULT_TIMEOUT } from './matcher-utils.js';
export type { MatcherPage, UI5BindingInfo } from './matcher-utils.js';
export { checkUI5CellText, checkUI5RowCount, checkUI5SelectedRows } from './table-matchers.js';

// ── Custom matcher registration API ──────────────────────────────────
export {
  applyRegisteredMatchers,
  createUI5Matcher,
  getRegisteredMatcherCount,
  getRegisteredMatchers,
  isMatcherRegistryFrozen,
  registerUI5Matcher,
} from './matcher-registry.js';
export type { MatcherCheckFn, MatcherRegistryEntry, UI5MatcherFn } from './matcher-registry.js';
