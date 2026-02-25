/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Browser scripts for UI5 control method execution (string-form).
 *
 * @remarks
 * Generates JavaScript strings for executing methods on UI5 controls and
 * non-control objects with 7-type return detection (A.4) and special-case
 * aggregation handling (A.6) for ComboBox, MultiComboBox, PlanningCalendar.
 *
 * These string-form scripts are used by `ui5-handler.ts` (Path B).
 * For function-form scripts (preferred), see `execute-method-fn.ts`.
 *
 * @module bridge/browser-scripts
 */

import { BRIDGE_GLOBALS } from '../bridge-constants.js';

/**
 * Creates a browser script that executes a method on a UI5 control.
 *
 * @remarks
 * Return type detection (A.4):
 * - `empty`: Array with length 0
 * - `aggregation`: Array of controls (items have `.getParent()`)
 * - `result`: Primitive value or non-control array
 * - `element`: Same control returned (setter chaining)
 * - `newElement`: Different control returned
 * - `object`: Non-control UI5 object (stored with UUID)
 * - `none`: `undefined` or `null` result
 *
 * Special cases (A.6):
 * - ComboBox/MultiComboBox: Checks `data('InputWithSuggestionsListItem')`
 * - PlanningCalendar: Appends `-CLI` suffix to extracted ID
 *
 * @returns JavaScript string for control method execution.
 *
 * @example
 * ```typescript
 * const script = createExecuteMethodScript();
 * const result = await page.evaluate(
 *   new Function('controlId', 'methodName', 'args', script),
 *   'btn1', 'getText', []
 * );
 * ```
 */
export function createExecuteMethodScript(): string {
  const ns = BRIDGE_GLOBALS.NAMESPACE;

  return `(function() {
    try {
      var bridge = window.${ns};
      if (!bridge) {
        return { success: false, returnType: 'none', error: 'Bridge not initialized', duration: 0 };
      }

      var controlId = arguments[0];
      var methodName = arguments[1];
      var args = arguments[2] || [];
      var startTime = Date.now();

      var ctrl = bridge.getById(controlId);
      if (!ctrl) {
        return {
          success: false,
          returnType: 'none',
          error: 'Control not found: ' + controlId,
          duration: Date.now() - startTime
        };
      }

      if (typeof ctrl[methodName] !== 'function') {
        return {
          success: false,
          returnType: 'none',
          error: 'Method not found: ' + methodName,
          duration: Date.now() - startTime
        };
      }

      var result = ctrl[methodName].apply(ctrl, args);
      var duration = Date.now() - startTime;

      if (result === undefined || result === null) {
        return { success: true, returnType: 'none', duration: duration };
      }

      if (Array.isArray(result)) {
        if (result.length === 0) {
          return { success: true, returnType: 'empty', value: [], duration: duration };
        }

        var firstItem = result[0];
        if (firstItem && typeof firstItem.getParent === 'function') {
          var ids = [];
          var types = [];
          for (var i = 0; i < result.length; i++) {
            var item = result[i];
            var itemId = item.getId ? item.getId() : '';

            try {
              var domRef = item.getDomRef ? item.getDomRef() : null;
              if (domRef) {
                var listItemData = null;
                if (typeof item.data === 'function') {
                  listItemData = item.data('InputWithSuggestionsListItem');
                }
                if (listItemData && listItemData.getId) {
                  itemId = listItemData.getId();
                }
              }

              if (itemId && itemId.indexOf('PlanningCalendar') !== -1
                  && itemId.indexOf('-CLI') === -1) {
                itemId = itemId + '-CLI';
              }
            } catch (e) {
              // Special case extraction failed, use original ID
            }

            ids.push(itemId);
            var meta = item.getMetadata ? item.getMetadata() : null;
            types.push(meta && meta.getName ? meta.getName() : 'unknown');
          }
          return {
            success: true,
            returnType: 'aggregation',
            uuids: ids,
            objectTypes: types,
            isArray: true,
            duration: duration
          };
        }

        return { success: true, returnType: 'result', value: result, isArray: true, duration: duration };
      }

      if (result === ctrl) {
        return {
          success: true,
          returnType: 'element',
          value: { id: ctrl.getId ? ctrl.getId() : controlId },
          duration: duration
        };
      }

      if (bridge.isPrimitive(result)) {
        return { success: true, returnType: 'result', value: result, duration: duration };
      }

      if (typeof result.getId === 'function' && typeof result.getParent === 'function') {
        var resultId = result.getId();
        var existingControl = bridge.getById(resultId);
        if (existingControl) {
          var meta = result.getMetadata ? result.getMetadata() : null;
          var typeName = meta && meta.getName ? meta.getName() : 'unknown';
          return {
            success: true,
            returnType: 'newElement',
            value: { id: resultId, controlType: typeName },
            duration: duration
          };
        }
        // Not in element registry — fall through to object storage
        // (e.g., ManagedObject subclasses not yet rendered, or non-Element objects
        // like BindingContext that happen to have getId/getParent)
      }

      var uuid = bridge.saveObject(result, 'object');
      // Do NOT JSON.stringify non-serializable objects — objects like
      // sap.ui.model.Context reference the entire model tree and deep
      // serialization blocks the main thread for seconds, risking
      // "Execution context destroyed" errors. The proxy only needs the
      // UUID to call methods on the saved object via the bridge.
      return {
        success: true,
        returnType: 'object',
        uuid: uuid,
        objectType: typeof result,
        value: null,
        duration: duration
      };
    } catch (e) {
      return {
        success: false,
        returnType: 'none',
        error: e && e.message ? e.message : String(e),
        duration: Date.now() - (typeof startTime !== 'undefined' ? startTime : Date.now())
      };
    }
  })()`;
}

/**
 * Creates a browser script that executes a method on a non-control UI5 object.
 *
 * @remarks
 * Retrieves the target object from the bridge's object map by UUID, then
 * executes the specified method. Uses the same return type detection
 * as control method execution.
 *
 * @returns JavaScript string for object method execution.
 *
 * @example
 * ```typescript
 * const script = createExecuteObjectMethodScript();
 * const result = await page.evaluate(
 *   new Function('uuid', 'methodName', 'args', script),
 *   'abc-123', 'getProperty', ['/path']
 * );
 * ```
 */
export function createExecuteObjectMethodScript(): string {
  const ns = BRIDGE_GLOBALS.NAMESPACE;

  return `(function() {
    try {
      var bridge = window.${ns};
      if (!bridge) {
        return { success: false, returnType: 'none', error: 'Bridge not initialized', duration: 0 };
      }

      var uuid = arguments[0];
      var methodName = arguments[1];
      var args = arguments[2] || [];
      var startTime = Date.now();

      var obj = bridge.getObject(uuid);
      if (!obj) {
        return {
          success: false,
          returnType: 'none',
          error: 'Object not found: ' + uuid,
          duration: Date.now() - startTime
        };
      }

      if (typeof obj[methodName] !== 'function') {
        return {
          success: false,
          returnType: 'none',
          error: 'Method not found: ' + methodName,
          duration: Date.now() - startTime
        };
      }

      var result = obj[methodName].apply(obj, args);
      var duration = Date.now() - startTime;

      if (result === undefined || result === null) {
        return { success: true, returnType: 'none', duration: duration };
      }

      if (bridge.isPrimitive(result)) {
        return { success: true, returnType: 'result', value: result, duration: duration };
      }

      var savedUuid = bridge.saveObject(result, 'object');
      return {
        success: true,
        returnType: 'object',
        uuid: savedUuid,
        objectType: typeof result,
        duration: duration
      };
    } catch (e) {
      return {
        success: false,
        returnType: 'none',
        error: e && e.message ? e.message : String(e),
        duration: Date.now() - (typeof startTime !== 'undefined' ? startTime : Date.now())
      };
    }
  })()`;
}
