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
 * Enhanced matching helpers for Tier 2 registry scan (GAP-02).
 *
 * @remarks
 * Provides property matching, viewName traversal, bindingPath matching,
 * and a full matchesSelector function used in the string-form IIFE.
 */
const ENHANCED_MATCHING_SNIPPET = `
  function matchesProperties(ctrl, properties) {
    var propNames = Object.keys(properties);
    for (var pi = 0; pi < propNames.length; pi++) {
      var propName = propNames[pi];
      var getterName = 'get' + propName.charAt(0).toUpperCase() + propName.slice(1);
      if (typeof ctrl[getterName] !== 'function') return false;
      if (ctrl[getterName]() !== properties[propName]) return false;
    }
    return true;
  }

  function isInView(ctrl, viewName) {
    var current = ctrl;
    while (current) {
      if (current.getMetadata && current.getMetadata().getName && current.getMetadata().getName() === viewName) {
        return true;
      }
      current = typeof current.getParent === 'function' ? current.getParent() : null;
    }
    return false;
  }

  function matchesBindingPath(ctrl, bindingPath) {
    var expectedPath = bindingPath.path;
    if (!expectedPath) return false;
    if (typeof ctrl.getBinding !== 'function') return false;
    var binding = ctrl.getBinding('value') || ctrl.getBinding('text');
    if (!binding) return false;
    var actualPath = binding.getPath ? binding.getPath() : '';
    return actualPath === expectedPath;
  }

  function matchesFullSelector(ctrl, sel) {
    if (sel.controlType) {
      if (!ctrl.getMetadata || ctrl.getMetadata().getName() !== sel.controlType) return false;
    }
    if (sel.properties && !matchesProperties(ctrl, sel.properties)) return false;
    if (sel.viewName && !isInView(ctrl, sel.viewName)) return false;
    if (sel.bindingPath && !matchesBindingPath(ctrl, sel.bindingPath)) return false;
    return true;
  }
`;

/**
 * Creates a browser script that finds a single UI5 control.
 *
 * @remarks
 * Uses 3-tier discovery:
 * 1. getById exact match (for full ID selectors)
 * 2. Registry scan with enhanced matching: exact/suffix/RegExp ID,
 *    controlType, properties, viewName, bindingPath. Prefers visible controls.
 * 3. RecordReplay.findDOMElementByControlSelector (for controlType + properties selectors)
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
      ${ENHANCED_MATCHING_SNIPPET}

      var selector = arguments[0];
      if (!selector) {
        return empty;
      }

      // Tier 1: Direct ID lookup via registry (exact match)
      var selectorId = typeof selector === 'string' ? selector : selector.id;
      if (selectorId) {
        var directCtrl = bridge.getById(selectorId);
        if (directCtrl) {
          if (!selector.controlType
              || (directCtrl.getMetadata && directCtrl.getMetadata().getName() === selector.controlType)) {
            return buildResult(directCtrl);
          }
        }
      }

      // Tier 2: Registry scan with enhanced matching (GAP-02)
      // Supports: exact ID, suffix (--id), RegExp ID (/pattern/),
      // controlType, properties, viewName, bindingPath.
      // Prefers visible controls (GAP-21) when selector is an object.
      if (typeof sap !== 'undefined' && sap.ui && sap.ui.core) {
        var registry = sap.ui.core.Element && sap.ui.core.Element.registry
          ? sap.ui.core.Element.registry
          : (sap.ui.core.ElementRegistry || null);
        if (registry && registry.all) {
          var suffix = selectorId ? '--' + selectorId : null;
          var isRegExp = selectorId && typeof selectorId === 'string'
            && selectorId.charAt(0) === '/' && selectorId.charAt(selectorId.length - 1) === '/'
            && selectorId.length > 2;
          var allMap = registry.all();
          var ids = Object.keys(allMap);
          var firstMatch = null;
          var visibleMatch = null;
          for (var ri = 0; ri < ids.length; ri++) {
            var regCtrl = allMap[ids[ri]];
            if (!regCtrl || !regCtrl.getId) continue;
            var regId = regCtrl.getId();
            // ID matching
            if (selectorId) {
              if (isRegExp) {
                var pattern = new RegExp(selectorId.slice(1, -1));
                if (!pattern.test(regId)) continue;
              } else if (regId !== selectorId && !(regId.length > suffix.length && regId.indexOf(suffix) === regId.length - suffix.length)) {
                continue;
              }
            }
            // Full selector matching
            if (!matchesFullSelector(regCtrl, selector)) continue;
            if (!firstMatch) firstMatch = regCtrl;
            if (regCtrl.getVisible && regCtrl.getVisible()) {
              if (!visibleMatch) visibleMatch = regCtrl;
            }
          }
          var bestMatch = visibleMatch || firstMatch;
          if (bestMatch) return buildResult(bestMatch);
        }
      }

      // Tier 3: RecordReplay (for controlType + properties selectors)
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
