/**
 * Core bridge injection script for UI5 framework integration.
 *
 * @remarks
 * Generates the main JavaScript string that sets up `window.__praman_bridge`
 * with all required helper functions, module references, and version-aware
 * API resolution. This is the foundation for all other browser scripts.
 *
 * Key decisions implemented:
 * - W14: Lazy-only injection via `page.evaluate()`
 * - D19: 3-tier API resolution (Element.getElementById → ElementRegistry.get → Core.byId)
 * - A.7: Version-split DOM-to-Control conversion
 * - A.9: Version-aware matcher creation
 *
 * @module bridge/browser-scripts
 */

import { BRIDGE_GLOBALS } from '../bridge-constants.js';

/**
 * Creates the core bridge injection script.
 *
 * @remarks
 * The returned script initializes `window.__praman_bridge` with:
 * - UI5 module references (RecordReplay, Element, Log)
 * - Version detection
 * - Object map for non-control storage (UUID-keyed)
 * - `getById()` with 3-tier API resolution (D19)
 * - Helper functions: `isPrimitive`, `getCircularReplacer`, `saveObject`, `getObject`, `deleteObject`
 *
 * Idempotent — checks `window.__praman_ready` before re-injection.
 *
 * @returns JavaScript string that initializes the complete bridge namespace.
 *
 * @example
 * ```typescript
 * const script = createBridgeInjectionScript();
 * await page.evaluate(script);
 * ```
 */
export function createBridgeInjectionScript(): string {
  const ns = BRIDGE_GLOBALS.NAMESPACE;
  const readyFlag = BRIDGE_GLOBALS.READY_FLAG;

  return `(function() {
    try {
      if (window.${readyFlag}) {
        return;
      }

      var bridge = {};
      bridge.version = '1.0.0';
      bridge.injectedAt = Date.now();
      bridge.ready = false;

      var ui5Version = '0.0.0';
      try {
        if (typeof sap !== 'undefined' && sap.ui && sap.ui.version) {
          ui5Version = sap.ui.version;
        }
      } catch (e) {
        ui5Version = '0.0.0';
      }
      bridge.ui5Version = ui5Version;

      bridge.objectMap = new Map();

      bridge.saveObject = function saveObject(obj, type) {
        var uuid = crypto.randomUUID();
        bridge.objectMap.set(uuid, {
          value: obj,
          type: type || 'unknown',
          storedAt: Date.now()
        });
        return uuid;
      };

      bridge.getObject = function getObject(uuid) {
        var entry = bridge.objectMap.get(uuid);
        return entry ? entry.value : undefined;
      };

      bridge.deleteObject = function deleteObject(uuid) {
        return bridge.objectMap.delete(uuid);
      };

      bridge.isPrimitive = function isPrimitive(value) {
        if (value === null || value === undefined) {
          return true;
        }
        var t = typeof value;
        return t === 'string' || t === 'number' || t === 'boolean';
      };

      bridge.getCircularReplacer = function getCircularReplacer() {
        var seen = new WeakSet();
        return function(key, value) {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular]';
            }
            seen.add(value);
          }
          return value;
        };
      };

      bridge.getById = function getById(id) {
        try {
          if (typeof sap !== 'undefined') {
            if (sap.ui && sap.ui.core && sap.ui.core.Element
                && sap.ui.core.Element.getElementById) {
              var el = sap.ui.core.Element.getElementById(id);
              if (el) return el;
            }
            if (sap.ui && sap.ui.core && sap.ui.core.ElementRegistry
                && sap.ui.core.ElementRegistry.get) {
              var el2 = sap.ui.core.ElementRegistry.get(id);
              if (el2) return el2;
            }
            if (sap.ui && sap.ui.getCore) {
              var core = sap.ui.getCore();
              if (core && core.byId) {
                var el3 = core.byId(id);
                if (el3) return el3;
              }
            }
          }
          return null;
        } catch (e) {
          return null;
        }
      };

      bridge.RecordReplay = null;
      bridge.Element = null;
      bridge.Log = null;

      bridge.utils = {
        retrieveControlMethods: function retrieveControlMethods(controlId) {
          var ctrl = bridge.getById(controlId);
          if (!ctrl) return [];
          var methods = [];
          var proto = Object.getPrototypeOf(ctrl);
          while (proto && proto !== Object.prototype) {
            var names = Object.getOwnPropertyNames(proto);
            for (var i = 0; i < names.length; i++) {
              var name = names[i];
              if (typeof proto[name] === 'function' && methods.indexOf(name) === -1) {
                methods.push(name);
              }
            }
            proto = Object.getPrototypeOf(proto);
          }
          return methods;
        },
        controlExists: function controlExists(controlId) {
          return bridge.getById(controlId) !== null;
        }
      };

      try {
        if (typeof sap !== 'undefined' && sap.ui && sap.ui.require) {
          sap.ui.require([
            'sap/ui/test/RecordReplay',
            'sap/ui/core/Element',
            'sap/base/Log'
          ], function(RecordReplay, Element, Log) {
            bridge.RecordReplay = RecordReplay || null;
            bridge.Element = Element || null;
            bridge.Log = Log || null;
          });
        }
      } catch (e) {
        // Module loading is best-effort
      }

      window.${ns} = bridge;
      window.${readyFlag} = true;
      bridge.ready = true;
    } catch (e) {
      // Fatal injection error — bridge remains uninitialized
    }
  })()`;
}
