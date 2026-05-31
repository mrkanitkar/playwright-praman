/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Browser scripts for UI5 control discovery.
 *
 * @intent Provide robust control discovery across all SAP UI5 versions and dialog
 * states via a multi-tier strategy (A.3). Tier 0 (static area scan) handles open
 * dialogs/popovers where controls live outside the normal DOM tree. Tier 1 (direct
 * `getById`) is the fast path for known IDs. Tier 2 (registry scan with enhanced
 * matching) supports suffix IDs, RegExp patterns, controlType, properties, viewName,
 * and bindingPath — enabling flexible selector strategies for AI-generated tests.
 * Tier 3 (RecordReplay) is the SAP-provided fallback for controlType+properties
 * selectors. Visible-control preference (GAP-21) ensures tests interact with the
 * topmost visible control when duplicates exist (e.g., behind/in-front-of dialogs).
 *
 * @remarks
 * Generates JavaScript strings for discovering UI5 controls in the browser
 * using a 2-tier strategy (A.3): RecordReplay primary + getById fallback.
 * Returns `ControlDiscoveryResult`-shaped objects.
 *
 * **LOC exception**: This file exceeds 300 LOC (~400 lines) because the string-form
 * snippets (method extraction, result building, enhanced matching, static area scan)
 * must be inlined into the generated IIFE. These snippets are constants that cannot
 * be split across files without breaking the single-string evaluation contract.
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
 * Static area scan snippet for open dialog control prioritization.
 *
 * @remarks
 * When `searchOpenDialogs` is true in the selector, this snippet scans the
 * `sap-ui-static` UI area for controls inside open dialogs before the normal
 * registry scan. If a match is found, it is returned immediately.
 */
const STATIC_AREA_SCAN_SNIPPET = `
  var DIALOG_TYPES = {
    'sap.m.Dialog': true, 'sap.m.Popover': true,
    'sap.m.ResponsivePopover': true, 'sap.m.SelectDialog': true,
    'sap.m.TableSelectDialog': true, 'sap.m.BusyDialog': true,
    'sap.m.ViewSettingsDialog': true,
    'sap.ui.comp.valuehelpdialog.ValueHelpDialog': true,
    'sap.ui.comp.p13n.P13nDialog': true
  };

  function isInsideOpenDialog(ctrl) {
    var cur = ctrl;
    while (cur) {
      if (cur.getMetadata) {
        var tn = cur.getMetadata().getName ? cur.getMetadata().getName() : '';
        if (DIALOG_TYPES[tn]) {
          if (typeof cur.isOpen === 'function' && cur.isOpen()) return true;
        }
      }
      cur = typeof cur.getParent === 'function' ? cur.getParent() : null;
    }
    return false;
  }

  function tryStaticAreaScan(selector, selectorId, preferVisible) {
    if (typeof sap === 'undefined' || !sap.ui || !sap.ui.getCore) return null;
    var core = sap.ui.getCore();
    if (!core || !core.getUIArea) return null;
    var area = core.getUIArea('sap-ui-static');
    if (!area || !area.getContent) return null;
    var content = area.getContent();
    var aControls = [];
    for (var ci = 0; ci < content.length; ci++) {
      aControls.push(content[ci]);
      if (typeof content[ci].findAggregatedObjects === 'function') {
        var children = content[ci].findAggregatedObjects(true);
        for (var chi = 0; chi < children.length; chi++) {
          aControls.push(children[chi]);
        }
      }
    }
    var suffix = selectorId ? '--' + selectorId : null;
    var isRegExp = selectorId && typeof selectorId === 'string'
      && selectorId.charAt(0) === '/' && selectorId.charAt(selectorId.length - 1) === '/'
      && selectorId.length > 2;
    var firstMatch = null;
    var visibleMatch = null;
    for (var si = 0; si < aControls.length; si++) {
      var sc = aControls[si];
      if (!isInsideOpenDialog(sc)) continue;
      if (selectorId && sc.getId) {
        var scId = sc.getId();
        if (isRegExp) {
          var pat = new RegExp(selectorId.slice(1, -1));
          if (!pat.test(scId)) continue;
        } else if (scId !== selectorId && !(scId.length > suffix.length && scId.indexOf(suffix) === scId.length - suffix.length)) {
          continue;
        }
      }
      if (!matchesFullSelector(sc, selector)) continue;
      if (!preferVisible) return buildResult(sc);
      if (!firstMatch) firstMatch = sc;
      if (sc.getVisible && sc.getVisible()) {
        if (!visibleMatch) visibleMatch = sc;
      }
    }
    var best = preferVisible ? (visibleMatch || firstMatch) : firstMatch;
    return best ? buildResult(best) : null;
  }
`;

/**
 * Creates a browser script that finds a single UI5 control.
 *
 * @remarks
 * Uses 3-tier discovery (plus Tier 0 for open dialogs):
 * 0. Static area scan when `searchOpenDialogs` is true (prioritizes dialog controls)
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
      ${STATIC_AREA_SCAN_SNIPPET}

      var selector = arguments[0];
      var findOptions = arguments[1] || {};
      var preferVisible = findOptions.preferVisibleControls !== false;
      var forceRegistryScan = findOptions.forceRegistryScan === true;
      if (!selector) {
        return empty;
      }

      var selectorId = typeof selector === 'string' ? selector : selector.id;

      // Tier 0: Static area scan for open dialogs (priority when searchOpenDialogs)
      if (selector.searchOpenDialogs === true) {
        var tier0 = tryStaticAreaScan(selector, selectorId, preferVisible);
        if (tier0) return tier0;
      }

      // Tier 1: Direct ID lookup via registry (exact match) — skip when forceRegistryScan
      if (selectorId && !forceRegistryScan) {
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
          : (sap.ui.require('sap/ui/core/ElementRegistry') || null);
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
          var bestMatch = preferVisible ? (visibleMatch || firstMatch) : firstMatch;
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
