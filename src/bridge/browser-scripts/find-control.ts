/**
 * Browser scripts for UI5 control discovery.
 *
 * @remarks
 * Generates JavaScript strings for discovering UI5 controls in the browser
 * using a 2-tier strategy (A.3): RecordReplay primary + getById fallback.
 * Returns `ControlDiscoveryResult`-shaped objects.
 *
 * @module bridge/browser-scripts
 */

import { BRIDGE_GLOBALS } from '../bridge-constants.js';

/**
 * Shared method-extraction logic used by both find scripts.
 *
 * @remarks
 * Traverses the control's prototype chain and filters out internal methods
 * (underscore prefix, Render suffix) and non-function properties.
 */
const METHOD_EXTRACTION_SNIPPET = `
  function extractMethods(ctrl) {
    var methods = [];
    var proto = Object.getPrototypeOf(ctrl);
    while (proto && proto !== Object.prototype) {
      var names = Object.getOwnPropertyNames(proto);
      for (var i = 0; i < names.length; i++) {
        var name = names[i];
        if (typeof proto[name] === 'function'
            && methods.indexOf(name) === -1
            && name.charAt(0) !== '_'
            && name.indexOf('Render') === -1) {
          methods.push(name);
        }
      }
      proto = Object.getPrototypeOf(proto);
    }
    return methods;
  }
`;

/**
 * Shared result-building logic for control discovery.
 */
const BUILD_RESULT_SNIPPET = `
  function buildResult(ctrl) {
    var id = ctrl.getId ? ctrl.getId() : '';
    var meta = ctrl.getMetadata ? ctrl.getMetadata() : null;
    var controlType = meta && meta.getName ? meta.getName() : 'unknown';
    var domRef = ctrl.getDomRef ? ctrl.getDomRef() : null;
    var domId = domRef ? domRef.id : null;
    var isVisible = ctrl.getVisible ? ctrl.getVisible() : true;
    return {
      id: id,
      controlType: controlType,
      methods: extractMethods(ctrl),
      domId: domId,
      visible: isVisible
    };
  }
`;

/**
 * Creates a browser script that finds a single UI5 control.
 *
 * @remarks
 * Uses 2-tier discovery (A.3):
 * 1. RecordReplay.findDOMElementByControlSelector (primary)
 * 2. getById fallback (for ID-only selectors)
 *
 * The script expects `selector` to be passed as an argument via `page.evaluate()`.
 *
 * @returns JavaScript string for single control discovery.
 *
 * @example
 * ```typescript
 * const script = createFindControlScript();
 * const result = await page.evaluate(new Function('selector', script), selector);
 * ```
 */
export function createFindControlScript(): string {
  const ns = BRIDGE_GLOBALS.NAMESPACE;

  return `(async function() {
    var empty = { id: '', controlType: 'unknown', methods: [], domId: null, visible: false };
    try {
      var bridge = window.${ns};
      if (!bridge) {
        return empty;
      }

      ${METHOD_EXTRACTION_SNIPPET}
      ${BUILD_RESULT_SNIPPET}

      var selector = arguments[0];
      if (!selector) {
        return empty;
      }

      if (typeof selector === 'string') {
        var ctrl = bridge.getById(selector);
        if (ctrl) {
          return buildResult(ctrl);
        }
      }

      if (bridge.RecordReplay) {
        try {
          var domElement = await bridge.RecordReplay.findDOMElementByControlSelector({ selector: selector });
          if (domElement) {
            var ui5Ctrl = null;

            if (typeof sap !== 'undefined' && sap.ui && sap.ui.core
                && sap.ui.core.Element && sap.ui.core.Element.closestTo) {
              ui5Ctrl = sap.ui.core.Element.closestTo(domElement);
            } else if (typeof jQuery !== 'undefined' && jQuery.fn && jQuery.fn.control) {
              ui5Ctrl = jQuery(domElement).control(0);
            }

            if (ui5Ctrl) {
              return buildResult(ui5Ctrl);
            }
          }
        } catch (e) {
          // RecordReplay failed, continue to fallback
        }
      }

      if (selector && selector.id) {
        var fallbackCtrl = bridge.getById(selector.id);
        if (fallbackCtrl) {
          return buildResult(fallbackCtrl);
        }
      }

      return empty;
    } catch (e) {
      return { id: '', controlType: 'unknown', methods: [], domId: null, visible: false };
    }
  })()`;
}

/**
 * Creates a browser script that finds all UI5 controls matching a selector.
 *
 * @remarks
 * Uses RecordReplay.findAllDOMElementsByControlSelector and maps
 * each result to a discovery result object.
 *
 * @returns JavaScript string for multi-control discovery.
 *
 * @example
 * ```typescript
 * const script = createFindAllControlsScript();
 * const results = await page.evaluate(new Function('selector', script), selector);
 * ```
 */
export function createFindAllControlsScript(): string {
  const ns = BRIDGE_GLOBALS.NAMESPACE;

  return `(async function() {
    try {
      var bridge = window.${ns};
      if (!bridge) {
        return [];
      }

      ${METHOD_EXTRACTION_SNIPPET}
      ${BUILD_RESULT_SNIPPET}

      var selector = arguments[0];
      if (!selector) {
        return [];
      }

      if (!bridge.RecordReplay) {
        return [];
      }

      var domElements = await bridge.RecordReplay.findAllDOMElementsByControlSelector({ selector: selector });
      if (!domElements || !domElements.length) {
        return [];
      }

      return domElements.map(function(domElement) {
        var ui5Ctrl = null;

        if (typeof sap !== 'undefined' && sap.ui && sap.ui.core
            && sap.ui.core.Element && sap.ui.core.Element.closestTo) {
          ui5Ctrl = sap.ui.core.Element.closestTo(domElement);
        } else if (typeof jQuery !== 'undefined' && jQuery.fn && jQuery.fn.control) {
          ui5Ctrl = jQuery(domElement).control(0);
        }

        if (ui5Ctrl) {
          return buildResult(ui5Ctrl);
        }
        return null;
      }).filter(function(item) { return item !== null; });
    } catch (e) {
      return [];
    }
  })()`;
}
