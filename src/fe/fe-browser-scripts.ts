/**
 * Browser-side string constants for SAP Fiori Elements OPA5 test library integration.
 *
 * @remarks
 * All scripts are self-contained IIFEs intended for injection via `page.evaluate()`.
 * Per P12, these are pure string constants — no module-level functions are serialized.
 * This file has ZERO imports from the rest of the codebase.
 *
 * Scripts that accept arguments (`FE_INIT_OPA_SCRIPT`, `FE_ADD_TO_QUEUE_SCRIPT`) are
 * non-self-executing IIFEs — `(function(arg) { ... })` without trailing `()`.
 * They are invoked via `page.evaluate(script, arg)`.
 *
 * Scripts that take no arguments (`FE_LOAD_LIBRARIES_SCRIPT`, `FE_EMPTY_QUEUE_SCRIPT`,
 * `FE_DETECT_WORKZONE_SCRIPT`) are self-executing IIFEs with trailing `()`.
 *
 * @module fe
 */

/**
 * Script to load SAP Fiori Elements test libraries.
 *
 * @remarks
 * Requires SAP UI5 runtime with FE test library modules available (UI5 \>= 1.100).
 * Loads `sap/fe/test/ListReport`, `sap/fe/test/ObjectPage`, `sap/fe/test/Shell`.
 * Stores classes on `window.fe_bridge` for subsequent scripts.
 * Self-executing IIFE — no arguments needed.
 *
 * @example
 * ```typescript
 * await page.evaluate(FE_LOAD_LIBRARIES_SCRIPT);
 * ```
 */
export const FE_LOAD_LIBRARIES_SCRIPT = `(function() {
  try {
    if (window.fe_bridge && window.fe_bridge.loaded) {
      return { type: 'success', message: 'FE test libraries already loaded' };
    }

    window.fe_bridge = window.fe_bridge || {};
    window.fe_bridge.Log = [];

    return new Promise(function(resolve) {
      sap.ui.require([
        'sap/fe/test/ListReport',
        'sap/fe/test/ObjectPage',
        'sap/fe/test/Shell'
      ], function(ListReport, ObjectPage, Shell) {
        window.fe_bridge.ListReport = ListReport;
        window.fe_bridge.ObjectPage = ObjectPage;
        window.fe_bridge.Shell = Shell;
        window.fe_bridge.loaded = true;
        resolve({ type: 'success', message: 'FE test libraries loaded' });
      }, function(err) {
        resolve({ type: 'error', message: 'Failed to load FE test libraries: ' + (err && err.message ? err.message : String(err)) });
      });
    });
  } catch (e) {
    return { type: 'error', message: 'FE_LOAD_LIBRARIES_SCRIPT error: ' + (e && e.message ? e.message : String(e)) };
  }
})()`;

/**
 * Script to initialize OPA5 with page object configuration.
 *
 * @remarks
 * Creates page objects from `TestLibraryConfig`, initializes `Opa5.createPageObjects()`,
 * configures OPA5 timeouts, and sets up assertion logging via `Opa5.assert.ok`.
 * Must be called AFTER {@link FE_LOAD_LIBRARIES_SCRIPT}.
 * Non-self-executing — accepts serialized `TestLibraryConfig` as argument
 * via `page.evaluate(script, config)`.
 *
 * @example
 * ```typescript
 * await page.evaluate(FE_INIT_OPA_SCRIPT, config);
 * ```
 */
export const FE_INIT_OPA_SCRIPT = `(function(config) {
  try {
    if (!window.fe_bridge || !window.fe_bridge.loaded) {
      return ['error', 'FE test libraries not loaded. Call FE_LOAD_LIBRARIES_SCRIPT first.'];
    }

    var pageObjects = {};
    var pageKeys = Object.keys(config);

    for (var i = 0; i < pageKeys.length; i++) {
      var pageKey = pageKeys[i];
      var pageConfig = config[pageKey];
      var classKeys = Object.keys(pageConfig);
      var actions = [];
      var assertions = [];

      for (var j = 0; j < classKeys.length; j++) {
        var classKey = classKeys[j];
        var ClassRef = window.fe_bridge[classKey];

        if (!ClassRef) {
          return ['error', 'Unknown FE test library class: ' + classKey];
        }

        var instance = new ClassRef(pageConfig[classKey] || {}, pageKey);
        if (instance.actions) actions.push(instance.actions);
        if (instance.assertions) assertions.push(instance.assertions);
      }

      pageObjects[pageKey] = {
        actions: actions,
        assertions: assertions
      };
    }

    sap.ui.require(['sap/ui/test/Opa5'], function(Opa5) {
      Opa5.createPageObjects(pageObjects);

      var originalAssert = Opa5.assert;
      if (originalAssert && originalAssert.ok) {
        var origOk = originalAssert.ok.bind(originalAssert);
        originalAssert.ok = function(value, message) {
          if (message) {
            window.fe_bridge.Log.push(message);
          }
          return origOk(value, message);
        };
      }
    });

    return ['success', 'OPA5 initialized with ' + pageKeys.length + ' page objects'];
  } catch (e) {
    return ['error', 'FE_INIT_OPA_SCRIPT error: ' + (e && e.message ? e.message : String(e))];
  }
})`;

/**
 * Script to add method calls to the OPA5 queue.
 *
 * @remarks
 * Processes `ProxyMethodCall[]`, resolves each to the correct
 * OPA5 scope (arrangements/actions/assertions), and executes the
 * method chain on the page object.
 * Must be called AFTER {@link FE_INIT_OPA_SCRIPT}.
 * Non-self-executing — accepts serialized `ProxyMethodCall[]` as argument.
 *
 * @example
 * ```typescript
 * await page.evaluate(FE_ADD_TO_QUEUE_SCRIPT, methodCalls);
 * ```
 */
export const FE_ADD_TO_QUEUE_SCRIPT = `(function(methodCalls) {
  try {
    if (!window.fe_bridge || !window.fe_bridge.loaded) {
      return { type: 'error', message: 'FE test libraries not loaded' };
    }

    var scopeMap = {
      'Given': 'arrangements',
      'When': 'actions',
      'Then': 'assertions'
    };

    for (var i = 0; i < methodCalls.length; i++) {
      var call = methodCalls[i];
      var scope = scopeMap[call.type];

      if (!scope) {
        return { type: 'error', message: 'Invalid scope type: ' + call.type + '. Expected Given, When, or Then.' };
      }

      var opaScope = call.type;
      var current = window[opaScope];

      if (call.target && current && current[call.target]) {
        current = current[call.target];
      }

      var methods = call.methods || [];
      for (var j = 0; j < methods.length; j++) {
        var method = methods[j];
        if (method.accessor) {
          if (current && current[method.name] !== undefined) {
            current = current[method.name];
          }
        } else {
          if (current && typeof current[method.name] === 'function') {
            current = current[method.name].apply(current, method.args || []);
          } else {
            return {
              type: 'error',
              message: 'Method not found: ' + method.name + ' on ' + call.type + '.' + call.target
            };
          }
        }
      }
    }

    return { type: 'success', message: 'Added ' + methodCalls.length + ' calls to OPA5 queue' };
  } catch (e) {
    return { type: 'error', message: 'FE_ADD_TO_QUEUE_SCRIPT error: ' + (e && e.message ? e.message : String(e)) };
  }
})`;

/**
 * Script to execute all queued OPA5 actions and collect logs.
 *
 * @remarks
 * Calls `Opa.emptyQueue()`, collects assertion logs from
 * `window.fe_bridge.Log`, clears the log, and returns results.
 * Must be called AFTER {@link FE_ADD_TO_QUEUE_SCRIPT}.
 * Self-executing IIFE — no arguments needed.
 *
 * @example
 * ```typescript
 * const result = await page.evaluate(FE_EMPTY_QUEUE_SCRIPT);
 * ```
 */
export const FE_EMPTY_QUEUE_SCRIPT = `(function() {
  try {
    if (!window.fe_bridge || !window.fe_bridge.loaded) {
      return { type: 'error', message: 'FE test libraries not loaded' };
    }

    return new Promise(function(resolve) {
      sap.ui.require(['sap/ui/test/Opa5', 'sap/ui/test/Opa'], function(Opa5, Opa) {
        Opa.emptyQueue()
          .done(function() {
            var logs = window.fe_bridge.Log ? window.fe_bridge.Log.slice() : [];
            window.fe_bridge.Log = [];
            resolve({ type: 'success', feLogs: logs, message: 'Queue executed successfully' });
          })
          .fail(function(err) {
            var logs = window.fe_bridge.Log ? window.fe_bridge.Log.slice() : [];
            window.fe_bridge.Log = [];
            resolve({
              type: 'error',
              feLogs: logs,
              message: 'OPA5 queue execution failed: ' + (err && err.message ? err.message : String(err))
            });
          });
      });
    });
  } catch (e) {
    return { type: 'error', message: 'FE_EMPTY_QUEUE_SCRIPT error: ' + (e && e.message ? e.message : String(e)) };
  }
})()`;

/**
 * Script to detect BTP WorkZone environment.
 *
 * @remarks
 * Checks for iframe presence and shell indicators
 * (`[id*="shell-"]`, `sap.ushell.Container`).
 * Returns detection result with boolean flags.
 * Self-executing IIFE — no arguments needed.
 *
 * @example
 * ```typescript
 * const detection = await page.evaluate(FE_DETECT_WORKZONE_SCRIPT);
 * if (detection.isWorkZone) {
 *   // Handle WorkZone dual-context scenario
 * }
 * ```
 */
export const FE_DETECT_WORKZONE_SCRIPT = `(function() {
  try {
    var hasIframe = document.querySelectorAll('iframe').length > 0;
    var hasShellElement = !!document.querySelector('[id*="shell-"]');
    var hasUShellAPI = false;

    try {
      hasUShellAPI = !!(window.sap && window.sap.ushell && window.sap.ushell.Container);
    } catch (e) {
      // sap namespace may not exist in non-SAP environments
    }

    var isWorkZone = hasIframe && (hasShellElement || hasUShellAPI);

    return {
      isWorkZone: isWorkZone,
      hasShell: hasShellElement || hasUShellAPI,
      hasIframe: hasIframe
    };
  } catch (e) {
    return {
      isWorkZone: false,
      hasShell: false,
      hasIframe: false
    };
  }
})()`;
