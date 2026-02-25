/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Browser scripts for UUID-based object storage and TTL cleanup.
 *
 * @remarks
 * Generates JavaScript strings for managing non-control UI5 objects
 * (Models, BindingContexts, etc.) across the `page.evaluate()` boundary.
 * Objects are stored with timestamps for TTL-based cleanup (Decision D20).
 *
 * @module bridge/browser-scripts
 */

import { BRIDGE_GLOBALS, BRIDGE_TIMEOUTS } from '../bridge-constants.js';

/**
 * Creates a browser script that initializes the object map on the bridge namespace.
 *
 * @remarks
 * Sets up `saveObject()`, `getObject()`, and `deleteObject()` functions on
 * `window.__praman_bridge`. Uses `crypto.randomUUID()` for key generation.
 * Idempotent — does not re-create if the objectMap already exists.
 *
 * @returns JavaScript string that initializes the object storage system.
 *
 * @example
 * ```typescript
 * const script = createObjectMapScript();
 * await page.evaluate(new Function(script));
 * ```
 */
export function createObjectMapScript(): string {
  const ns = BRIDGE_GLOBALS.NAMESPACE;

  return `(function() {
    var bridge = window.${ns};
    if (!bridge) {
      throw new Error('Bridge not initialized: ${ns} not found');
    }
    if (bridge.objectMap) {
      return;
    }

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
  })()`;
}

/**
 * Creates a browser script that removes expired objects from the object map.
 *
 * @remarks
 * Iterates over stored objects and removes entries older than the configured
 * TTL (`BRIDGE_TIMEOUTS.OBJECT_TTL`, default 300,000 ms / 5 minutes).
 * Returns the count of removed entries for diagnostics.
 *
 * @returns JavaScript string that cleans up expired objects and returns removal count.
 *
 * @example
 * ```typescript
 * const script = createObjectCleanupScript();
 * const removed = await page.evaluate(new Function(script));
 * // 3 (number of expired objects removed)
 * ```
 */
export function createObjectCleanupScript(): string {
  const ns = BRIDGE_GLOBALS.NAMESPACE;
  const ttl = BRIDGE_TIMEOUTS.OBJECT_TTL;

  return `(function() {
    var bridge = window.${ns};
    if (!bridge || !bridge.objectMap) {
      return 0;
    }

    var now = Date.now();
    var removed = 0;

    bridge.objectMap.forEach(function(entry, uuid) {
      if (now - entry.storedAt > ${String(ttl)}) {
        bridge.objectMap.delete(uuid);
        removed++;
      }
    });

    return removed;
  })()`;
}
