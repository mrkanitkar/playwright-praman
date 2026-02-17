/**
 * Browser scripts for UI5 control method execution.
 *
 * @remarks
 * Generates JavaScript strings for executing methods on UI5 controls and
 * non-control objects with 7-type return detection (A.4) and special-case
 * aggregation handling (A.6) for ComboBox, MultiComboBox, PlanningCalendar.
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
        return {
          success: true,
          returnType: 'newElement',
          value: { id: result.getId() },
          duration: duration
        };
      }

      var uuid = bridge.saveObject(result, 'object');
      var collapsed;
      try {
        collapsed = JSON.parse(JSON.stringify(result, bridge.getCircularReplacer()));
      } catch (e) {
        collapsed = { _serializationError: true };
      }
      return {
        success: true,
        returnType: 'object',
        uuid: uuid,
        objectType: typeof result,
        value: collapsed,
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
