/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Convenience span helpers for common telemetry operations.
 *
 * @remarks
 * Provides utility functions for creating standardized span names and
 * extracting OpenTelemetry-compatible attributes from UI5 selectors.
 *
 * @example
 * ```typescript
 * import { createSpanName, spanAttributes } from '#core/telemetry/spans.js';
 *
 * const name = createSpanName('bridge', 'findControl');
 * const attrs = spanAttributes({ controlType: 'sap.m.Button', id: 'btn1' });
 * ```
 *
 * @module telemetry
 */

import type { UI5Selector } from '#core/types/selectors.js';

/**
 * Creates a standardized OpenTelemetry span name.
 *
 * @remarks
 * Format: `'praman.<module>.<operation>'`. This convention ensures all
 * Praman spans are easily identifiable in telemetry backends.
 *
 * @param module - The module name (e.g., 'config', 'bridge', 'proxy')
 * @param operation - The operation name (e.g., 'load', 'findControl')
 * @returns A formatted span name string
 *
 * @example
 * ```typescript
 * const name = createSpanName('config', 'load');
 * // Returns: 'praman.config.load'
 * ```
 */
export function createSpanName(module: string, operation: string): string {
  return `praman.${module}.${operation}`;
}

/**
 * Extracts OpenTelemetry-standard attributes from a UI5 selector.
 *
 * @remarks
 * Maps UI5 selector fields to OTel attribute keys:
 * - `controlType` becomes `'ui5.controlType'`
 * - `id` becomes `'ui5.id'` (RegExp is converted to its string representation)
 * - `viewName` becomes `'ui5.viewName'`
 *
 * Undefined fields are skipped. Returns an empty object if the selector
 * is undefined or has no relevant fields.
 *
 * @param selector - An optional UI5 selector to extract attributes from
 * @returns A record of OTel-compatible string attributes
 *
 * @example
 * ```typescript
 * const attrs = spanAttributes({
 *   controlType: 'sap.m.Button',
 *   id: 'submitBtn',
 *   viewName: 'Main',
 * });
 * // Returns: { 'ui5.controlType': 'sap.m.Button', 'ui5.id': 'submitBtn', 'ui5.viewName': 'Main' }
 * ```
 */
export function spanAttributes(selector?: UI5Selector): Record<string, string> {
  if (selector === undefined) {
    return {};
  }

  const attrs: Record<string, string> = {};

  if (selector.controlType !== undefined) {
    attrs['ui5.controlType'] = selector.controlType;
  }

  if (selector.id !== undefined) {
    attrs['ui5.id'] = selector.id instanceof RegExp ? selector.id.toString() : selector.id;
  }

  if (selector.viewName !== undefined) {
    attrs['ui5.viewName'] = selector.viewName;
  }

  return attrs;
}
