/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Pre-built run-code script that discovers controls inside open SAP UI5 dialogs.
 *
 * @remarks
 * Iterates the UI5 element registry, filters for controls whose DOM reference
 * is inside a `.sapMDialog` container, and groups them by dialog.
 * Each control includes id, type, methods, properties, and required status.
 * Shell-safe: contains no double quotes, backticks, or dollar signs.
 *
 * @example
 * ```bash
 * playwright --run-code "$(cat dist/scripts/dialog-controls.js)"
 * ```
 *
 * @module scripts
 */

/**
 * A pre-built browser script string that discovers controls inside open dialogs.
 *
 * @remarks
 * Groups discovered controls by their parent dialog element, returning
 * methods, common properties, and required status for each control.
 *
 * @example
 * ```bash
 * playwright --run-code "$(cat dist/scripts/dialog-controls.js)"
 * ```
 */
export const DIALOG_CONTROLS_SCRIPT = `async page => {
  return await page.evaluate(() => {
    var bridge = window.__praman_bridge;
    if (!bridge || !bridge.ready) return { error: 'Bridge not ready. Ensure --config includes initScript.' };
    var registry = sap.ui.require('sap/ui/core/ElementRegistry').all();
    var controls = Object.values(registry);
    var dialogs = {};
    controls.forEach(function(ctrl) {
      var domRef = ctrl.getDomRef ? ctrl.getDomRef() : null;
      if (!domRef) return;
      var dialogEl = domRef.closest('.sapMDialog');
      if (!dialogEl) return;
      var dialogId = dialogEl.id ? dialogEl.id : 'unknown-dialog';
      if (!dialogs[dialogId]) dialogs[dialogId] = [];
      var id = ctrl.getId();
      dialogs[dialogId].push({
        id: id,
        type: ctrl.getMetadata().getName(),
        methods: bridge.utils.retrieveControlMethods(id),
        properties: {
          text: ctrl.getText ? ctrl.getText() : undefined,
          value: ctrl.getValue ? ctrl.getValue() : undefined,
          title: ctrl.getTitle ? ctrl.getTitle() : undefined,
          placeholder: ctrl.getPlaceholder ? ctrl.getPlaceholder() : undefined
        },
        required: ctrl.getRequired ? ctrl.getRequired() : false
      });
    });
    var dialogIds = Object.keys(dialogs);
    return {
      dialogCount: dialogIds.length,
      dialogs: dialogs
    };
  });
}`;
