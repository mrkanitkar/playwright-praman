/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Browser script for UI5 framework version detection.
 *
 * @remarks
 * Generates a JavaScript string that runs in the browser context via
 * `page.evaluate()`. Detects the UI5 version using multiple fallback
 * strategies for maximum compatibility.
 *
 * @module bridge/browser-scripts
 */

/**
 * Creates a browser script that detects the running UI5 framework version.
 *
 * @returns JavaScript string that returns the UI5 version (e.g. `'1.120.0'`),
 *   or `'0.0.0'` if version detection fails.
 *
 * @example
 * ```typescript
 * const script = createGetVersionScript();
 * const version = await page.evaluate(new Function(script));
 * // '1.120.0'
 * ```
 */
export function createGetVersionScript(): string {
  return `(function() {
    try {
      if (typeof sap !== 'undefined' && sap.ui) {
        if (sap.ui.version) {
          return sap.ui.version;
        }
        if (sap.ui.getVersionInfo) {
          var info = sap.ui.getVersionInfo();
          if (info && info.version) {
            return info.version;
          }
        }
        if (sap.ui.Global && sap.ui.Global.version) {
          return sap.ui.Global.version;
        }
      }
      return '0.0.0';
    } catch (e) {
      return '0.0.0';
    }
  })()`;
}
