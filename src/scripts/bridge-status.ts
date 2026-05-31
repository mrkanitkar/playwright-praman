/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Pre-built run-code script that returns Praman bridge diagnostics.
 *
 * @remarks
 * Retrieves bridge readiness, UI5 version, bridge version, object map size,
 * RecordReplay availability, total control count, and a timestamp.
 * Shell-safe: contains no double quotes, backticks, or dollar signs.
 *
 * @example
 * ```bash
 * playwright --run-code "$(cat dist/scripts/bridge-status.js)"
 * ```
 *
 * @module scripts
 */

/**
 * A pre-built browser script string that returns quick bridge diagnostics.
 *
 * @remarks
 * Returns UI5 version, bridge version, object map size, RecordReplay status,
 * total control count, and an ISO timestamp.
 *
 * @example
 * ```bash
 * playwright --run-code "$(cat dist/scripts/bridge-status.js)"
 * ```
 */
export const BRIDGE_STATUS_SCRIPT = `async page => {
  return await page.evaluate(() => {
    var bridge = window.__praman_bridge;
    var ready = bridge ? bridge.ready === true : false;
    var ui5Version = sap.ui.version ? sap.ui.version : 'unknown';
    var bridgeVersion = bridge && bridge.version ? bridge.version : 'unknown';
    var objectMapSize = bridge && bridge.objectMap ? Object.keys(bridge.objectMap).length : 0;
    var hasRecordReplay = bridge && bridge.recordReplay ? true : false;
    var ER = sap.ui.require('sap/ui/core/ElementRegistry');
    var registry = ER ? ER.all() : {};
    var controlCount = Object.keys(registry).length;
    return {
      ready: ready,
      ui5Version: ui5Version,
      bridgeVersion: bridgeVersion,
      objectMapSize: objectMapSize,
      hasRecordReplay: hasRecordReplay,
      controlCount: controlCount,
      timestamp: new Date().toISOString()
    };
  });
}`;
