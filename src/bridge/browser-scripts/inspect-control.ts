/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Browser script for deep UI5 control inspection.
 *
 * @remarks
 * Generates a JavaScript string that retrieves full metadata for a
 * discovered UI5 control: controlType, id, visibility, enabled state,
 * all properties with current values, aggregation names, and binding paths.
 *
 * Used by `UI5Handler.inspect()` to provide a standalone discovery API
 * at the fixture level (analogous to `controlDiscovery.inspect()`).
 *
 * @module bridge/browser-scripts
 */

import { BRIDGE_GLOBALS } from '../bridge-constants.js';

/**
 * Creates a browser script that inspects a UI5 control by ID and returns full metadata.
 *
 * @remarks
 * The script expects a `controlId` argument passed via `page.evaluate()`.
 * It introspects the control's metadata to extract:
 * - All property names and their current values via `getProperty()`
 * - All aggregation names from the metadata
 * - All binding paths for bound properties
 * - Visibility and enabled state
 * - DOM reference ID (if rendered)
 *
 * @returns JavaScript string for control inspection.
 *
 * @example
 * ```typescript
 * const script = createInspectControlScript();
 * const withArgs = script.replace(/\)\(\)$/, `)(${JSON.stringify(controlId)})`);
 * const result = await page.evaluate(withArgs);
 * ```
 */
export function createInspectControlScript(): string {
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

      var meta = ctrl.getMetadata ? ctrl.getMetadata() : null;
      var controlType = meta && meta.getName ? meta.getName() : 'unknown';
      var id = ctrl.getId ? ctrl.getId() : controlId;

      // Visibility
      var visible = typeof ctrl.getVisible === 'function' ? ctrl.getVisible() : true;

      // Enabled state
      var enabled = typeof ctrl.getEnabled === 'function' ? ctrl.getEnabled() : true;

      // DOM reference
      var domRef = typeof ctrl.getDomRef === 'function' ? ctrl.getDomRef() : null;
      var domId = domRef ? (domRef.id || null) : null;

      // Properties: iterate metadata properties, call getProperty() for each
      var properties = {};
      if (meta && typeof meta.getAllProperties === 'function') {
        var allProps = meta.getAllProperties();
        var propNames = Object.keys(allProps);
        for (var pi = 0; pi < propNames.length; pi++) {
          var propName = propNames[pi];
          try {
            if (typeof ctrl.getProperty === 'function') {
              var val = ctrl.getProperty(propName);
              // Only include serializable values
              if (val === null || val === undefined
                  || typeof val === 'string' || typeof val === 'number'
                  || typeof val === 'boolean') {
                properties[propName] = val;
              } else {
                properties[propName] = String(val);
              }
            }
          } catch (e) {
            // Skip properties that throw on access
          }
        }
      }

      // Aggregation names
      var aggregationNames = [];
      if (meta && typeof meta.getAllAggregations === 'function') {
        var allAggs = meta.getAllAggregations();
        aggregationNames = Object.keys(allAggs);
      }

      // Binding paths: check each property for bindings
      var bindingPaths = {};
      if (typeof ctrl.getBindingInfo === 'function' && meta && typeof meta.getAllProperties === 'function') {
        var bProps = meta.getAllProperties();
        var bPropNames = Object.keys(bProps);
        for (var bi = 0; bi < bPropNames.length; bi++) {
          var bPropName = bPropNames[bi];
          try {
            var bindingInfo = ctrl.getBindingInfo(bPropName);
            if (bindingInfo && bindingInfo.parts && bindingInfo.parts.length > 0) {
              bindingPaths[bPropName] = bindingInfo.parts[0].path || '';
            } else if (bindingInfo && bindingInfo.path) {
              bindingPaths[bPropName] = bindingInfo.path;
            }
          } catch (e) {
            // Skip bindings that throw
          }
        }
      }

      return {
        id: id,
        controlType: controlType,
        visible: visible,
        enabled: enabled,
        domId: domId,
        properties: properties,
        aggregationNames: aggregationNames,
        bindingPaths: bindingPaths
      };
    } catch (e) {
      return null;
    }
  })()`;
}
