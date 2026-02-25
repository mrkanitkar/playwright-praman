/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Browser script for reverse-selector generation.
 *
 * @remarks
 * Generates a JavaScript string that creates a UI5-compatible selector
 * from a DOM element or control reference. Used for recording and
 * debugging (G5 carry-forward).
 *
 * @module bridge/browser-scripts
 */

import { BRIDGE_GLOBALS } from '../bridge-constants.js';

/**
 * Creates a browser script that generates a UI5 selector from a control.
 *
 * @remarks
 * Prioritizes selector strategies:
 * 1. Control ID (if stable / not auto-generated)
 * 2. Control type + distinguishing properties (text, name, etc.)
 * 3. Control type + ancestor context
 *
 * The script expects `controlId` to be passed as an argument.
 *
 * @returns JavaScript string for reverse selector generation.
 *
 * @example
 * ```typescript
 * const script = createGetSelectorScript();
 * const selector = await page.evaluate(
 *   new Function('controlId', script),
 *   'btn1'
 * );
 * ```
 */
export function createGetSelectorScript(): string {
  const ns = BRIDGE_GLOBALS.NAMESPACE;

  return `(function() {
    try {
      var bridge = window.${ns};
      if (!bridge) {
        return null;
      }

      var controlId = arguments[0];
      if (!controlId) {
        return null;
      }

      var ctrl = bridge.getById(controlId);
      if (!ctrl) {
        return null;
      }

      var id = ctrl.getId ? ctrl.getId() : '';
      var meta = ctrl.getMetadata ? ctrl.getMetadata() : null;
      var controlType = meta && meta.getName ? meta.getName() : '';

      if (id && id.indexOf('__') !== 0) {
        return { selector: { id: id }, strategy: 'id' };
      }

      var properties = {};
      if (meta && meta.getAllProperties) {
        var allProps = meta.getAllProperties();
        var propKeys = Object.keys(allProps);
        for (var i = 0; i < propKeys.length; i++) {
          var key = propKeys[i];
          if (key === 'text' || key === 'name' || key === 'title'
              || key === 'placeholder' || key === 'value') {
            try {
              var getter = 'get' + key.charAt(0).toUpperCase() + key.slice(1);
              if (typeof ctrl[getter] === 'function') {
                var val = ctrl[getter]();
                if (val && typeof val === 'string' && val.length > 0) {
                  properties[key] = val;
                }
              }
            } catch (e) {
              // Property access failed
            }
          }
        }
      }

      if (Object.keys(properties).length > 0) {
        return {
          selector: { controlType: controlType, properties: properties },
          strategy: 'properties'
        };
      }

      return {
        selector: { controlType: controlType, id: id },
        strategy: 'fallback'
      };
    } catch (e) {
      return null;
    }
  })()`;
}
