/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Pre-built run-code script that polls for UI5 stability.
 *
 * @remarks
 * Waits up to 30 seconds for the Praman bridge to be ready and the
 * UI5 BusyIndicator to become inactive. Returns stability status,
 * elapsed time, and pending request count.
 * Shell-safe: contains no double quotes, backticks, or dollar signs.
 *
 * @example
 * ```bash
 * playwright --run-code "$(cat dist/scripts/wait-for-ui5.js)"
 * ```
 *
 * @module scripts
 */

/**
 * A pre-built browser script string that polls for UI5 readiness.
 *
 * @remarks
 * Polls every 500ms for up to 30 seconds checking both the Praman bridge
 * readiness and `sap.ui.core.BusyIndicator.isActive()` status.
 *
 * @example
 * ```bash
 * playwright --run-code "$(cat dist/scripts/wait-for-ui5.js)"
 * ```
 */
export const WAIT_FOR_UI5_SCRIPT = `async page => {
  return await page.evaluate(() => {
    var MAX_WAIT = 30000;
    var INTERVAL = 500;
    var start = Date.now();
    function poll(resolve) {
      var elapsed = Date.now() - start;
      var bridge = window.__praman_bridge;
      var bridgeReady = bridge ? bridge.ready === true : false;
      var busy = sap.ui.core.BusyIndicator ? sap.ui.core.BusyIndicator.isActive() : false;
      var pending = bridge && bridge.utils ? bridge.utils.getPendingRequestCount() : 0;
      if (bridgeReady && !busy && pending === 0) {
        resolve({ stable: true, elapsed: elapsed, pendingRequests: 0 });
        return;
      }
      if (elapsed >= MAX_WAIT) {
        resolve({ stable: false, elapsed: elapsed, pendingRequests: pending });
        return;
      }
      setTimeout(function() { poll(resolve); }, INTERVAL);
    }
    return new Promise(function(resolve) { poll(resolve); });
  });
}`;
