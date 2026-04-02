/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * SAP ARIA attribute injector — browser initScript for `praman snapshot`.
 *
 * @remarks
 * Decorates every rendered UI5 control's root DOM element with diagnostic
 * `data-sap-*` attributes so that regular `playwright-cli snapshot` output
 * already contains SAP semantic information without any extra tooling:
 *
 * - `data-sap-ui`      — control ID (e.g. `__button0`)
 * - `data-sap-type`    — fully-qualified control type (e.g. `sap.m.Button`)
 * - `data-sap-binding` — JSON array of `{property,path,model}` binding descriptors
 *
 * Uses a `MutationObserver` to re-apply attributes whenever the DOM changes
 * (SPA navigation, dialog open/close, table scroll). Falls back to a polling
 * loop while `sap.ui.core` is not yet available.
 *
 * This file is intentionally plain JavaScript (no TypeScript, no imports) so
 * it can be used directly as an `addInitScript` payload or inlined as a string.
 *
 * @example
 * ```javascript
 * // playwright.config.ts — Track A: initScript attribute injection
 * import sapAriaInjector from 'playwright-praman/cli/scripts/sap-aria-injector.js';
 * export default { use: { initScripts: [sapAriaInjector] } };
 * ```
 */

/* global sap, MutationObserver */

(function sapAriaInjector() {
  'use strict';

  /** Avoid duplicate registration across multiple script injections. */
  if (window.__praman_aria_injector) {
    return;
  }
  window.__praman_aria_injector = true;

  /** Maximum number of retries while waiting for sap.ui.core to load. */
  var MAX_RETRIES = 120;
  /** Poll interval in ms while waiting for SAP to bootstrap. */
  var POLL_INTERVAL_MS = 250;

  /**
   * Collects binding descriptors for a single UI5 control.
   *
   * @param {object} ctrl - A sap.ui.core.ManagedObject instance.
   * @returns {Array<{property: string, path: string, model: string}>}
   */
  function collectBindings(ctrl) {
    var result = [];
    try {
      var bindingInfos = ctrl.mBindingInfos;
      if (!bindingInfos || typeof bindingInfos !== 'object') {
        return result;
      }
      var keys = Object.keys(bindingInfos);
      for (var i = 0; i < keys.length; i++) {
        var property = keys[i];
        var info = bindingInfos[property];
        if (!info) continue;
        var path = info.path || (info.parts && info.parts[0] && info.parts[0].path) || '';
        var model = info.model || (info.parts && info.parts[0] && info.parts[0].model) || '';
        result.push({ property: property, path: String(path), model: String(model) });
      }
    } catch (_) {
      // Swallow — binding access can throw on destroyed controls
    }
    return result;
  }

  /**
   * Decorates a single UI5 control's DOM root with `data-sap-*` attributes.
   *
   * @param {object} ctrl - A sap.ui.core.ManagedObject instance.
   */
  function decorateControl(ctrl) {
    try {
      var domRef = typeof ctrl.getDomRef === 'function' ? ctrl.getDomRef() : null;
      if (!domRef) return;
      var id = typeof ctrl.getId === 'function' ? ctrl.getId() : '';
      var type =
        ctrl.getMetadata && typeof ctrl.getMetadata === 'function'
          ? ctrl.getMetadata().getName()
          : '';
      var bindings = collectBindings(ctrl);
      if (id) {
        domRef.setAttribute('data-sap-ui', id);
      }
      if (type) {
        domRef.setAttribute('data-sap-type', type);
      }
      if (bindings.length > 0) {
        domRef.setAttribute('data-sap-binding', JSON.stringify(bindings));
      }
    } catch (_) {
      // Swallow — DOM may be stale or control already destroyed
    }
  }

  /**
   * Iterates all registered UI5 controls and decorates their DOM roots.
   */
  function decorateAll() {
    try {
      var registry = null;
      if (
        typeof sap !== 'undefined' &&
        sap.ui &&
        sap.ui.core &&
        sap.ui.core.ElementRegistry
      ) {
        registry = sap.ui.core.ElementRegistry;
      } else if (typeof sap !== 'undefined' && sap.ui && sap.ui.getCore) {
        var core = sap.ui.getCore();
        registry = core && core.getElements ? { all: function () { return core.getElements(); } } : null;
      }
      if (!registry) return;
      var elements = registry.all();
      if (!elements || typeof elements !== 'object') return;
      var ids = Object.keys(elements);
      for (var i = 0; i < ids.length; i++) {
        decorateControl(elements[ids[i]]);
      }
    } catch (_) {
      // Swallow — framework may not be ready yet
    }
  }

  /**
   * Installs a MutationObserver that re-decorates on DOM tree changes.
   */
  function installObserver() {
    var observer = new MutationObserver(function () {
      decorateAll();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
    // Initial decoration pass
    decorateAll();
  }

  /**
   * Polls until `sap.ui.core` is available, then installs the observer.
   *
   * @param {number} retries - Remaining retry attempts.
   */
  function waitAndInstall(retries) {
    var sapReady =
      typeof sap !== 'undefined' &&
      sap.ui &&
      (sap.ui.core || (sap.ui.getCore && sap.ui.getCore()));
    if (sapReady) {
      installObserver();
    } else if (retries > 0) {
      setTimeout(function () {
        waitAndInstall(retries - 1);
      }, POLL_INTERVAL_MS);
    }
    // If retries exhausted on a non-UI5 page, silently exit — no-op
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      waitAndInstall(MAX_RETRIES);
    });
  } else {
    waitAndInstall(MAX_RETRIES);
  }
})();
