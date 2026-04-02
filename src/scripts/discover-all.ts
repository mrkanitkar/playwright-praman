/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Pre-built run-code script that discovers all UI5 controls on the current page.
 *
 * @remarks
 * Returns up to {@link MAX_CONTROLS} controls with their type, visibility,
 * enabled state, available methods, and common property values.
 * The script string is shell-safe (no double quotes, backticks, or dollar signs)
 * so it can be passed directly to `playwright --run-code`.
 *
 * @example
 * ```bash
 * playwright --run-code "$(cat dist/scripts/discover-all.js)"
 * ```
 *
 * @module scripts
 */

/**
 * Maximum number of controls to return from the discovery script.
 */
const MAX_CONTROLS = 100;

/**
 * A pre-built browser script string that discovers all UI5 controls with methods.
 *
 * @remarks
 * Uses `sap.ui.core.ElementRegistry.all()` to enumerate controls and
 * `bridge.utils.retrieveControlMethods()` to get available methods per control.
 * Shell-safe: contains no double quotes, backticks, or dollar signs.
 *
 * @example
 * ```bash
 * playwright --run-code "$(cat dist/scripts/discover-all.js)"
 * ```
 */
export const DISCOVER_ALL_SCRIPT = `async page => {
  return await page.evaluate(() => {
    const bridge = window.__praman_bridge;
    if (!bridge || !bridge.ready) return { error: 'Bridge not ready. Ensure --config includes initScript.' };
    const registry = sap.ui.core.ElementRegistry.all();
    const controls = Object.values(registry);
    return {
      total: controls.length,
      showing: Math.min(controls.length, ${String(MAX_CONTROLS)}),
      controls: controls.slice(0, ${String(MAX_CONTROLS)}).map(ctrl => {
        const id = ctrl.getId();
        return {
          id: id,
          type: ctrl.getMetadata().getName(),
          visible: ctrl.getVisible ? ctrl.getVisible() : true,
          enabled: ctrl.getEnabled ? ctrl.getEnabled() : true,
          methods: bridge.utils.retrieveControlMethods(id),
          properties: {
            text: ctrl.getText ? ctrl.getText() : undefined,
            value: ctrl.getValue ? ctrl.getValue() : undefined,
            title: ctrl.getTitle ? ctrl.getTitle() : undefined,
            placeholder: ctrl.getPlaceholder ? ctrl.getPlaceholder() : undefined
          }
        };
      })
    };
  });
}`;
