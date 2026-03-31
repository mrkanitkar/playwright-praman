/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Selectors module — parsing, serialization, validation, and engine for UI5 selectors.
 *
 * @module selectors
 */

export {
  isUI5SelectorString,
  parseUI5Selector,
  serializeUI5Selector,
  serializeUI5SelectorToCSS,
  validateUI5Selector,
} from './selector-parser.js';
