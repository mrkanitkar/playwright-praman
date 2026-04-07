/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Browser script for serializing the entire UI5 control registry into a hierarchical tree.
 *
 * @ai
 * @aiContext Produces a {@link ControlTreeSnapshot} JSON artifact for Playwright test attachments.
 * Runs in the browser context via `page.evaluate()`. Does NOT require bridge injection —
 * accesses `sap.ui.core.Element.registry` directly for maximum reliability on failure.
 *
 * @browserContext This script executes inside the browser. All functions must be self-contained
 * with no closures over Node.js objects.
 *
 * @remarks
 * The script uses a string-form IIFE pattern (consistent with `get-version.ts` and
 * `inspect-control.ts`). It accepts `maxDepth` and `maxControls` parameters injected
 * via template literals at script creation time.
 *
 * Algorithm:
 * 1. Resolve the UI5 element registry (dual-path for version compat)
 * 2. Single-pass: build flat node map + parent-child adjacency map
 * 3. Identify root nodes (no parent or parent not in registry)
 * 4. Recursive tree assembly with cycle protection (visited Set) and depth limit
 * 5. Return {@link ControlTreeSnapshot} or `null` on failure
 *
 * @example
 * ```typescript
 * const script = createControlTreeScript({ maxDepth: 10, maxControls: 5000 });
 * const snapshot = await page.evaluate(script);
 * if (snapshot !== null) {
 *   await testInfo.attach('ui5-control-tree', {
 *     contentType: 'application/json',
 *     body: Buffer.from(JSON.stringify(snapshot, null, 2)),
 *   });
 * }
 * ```
 *
 * @module bridge/browser-scripts
 */

// ── Script parameter types ───────────────────────────────────────────

/**
 * Parameters for the control tree serialization script.
 *
 * @example
 * ```typescript
 * const params: ControlTreeScriptParams = { maxDepth: 10, maxControls: 5000 };
 * const script = createControlTreeScript(params);
 * ```
 */
export interface ControlTreeScriptParams {
  /** Maximum tree depth before truncation (default: 10). */
  readonly maxDepth?: number;
  /** Maximum control count before truncation at reduced depth (default: 5000). */
  readonly maxControls?: number;
}

// ── Snippet constants ────────────────────────────────────────────────

/**
 * Browser-side snippet: detects UI5 version with fallback chain.
 *
 * @remarks
 * Same fallback logic as `get-version.ts`: `sap.ui.version` → `getVersionInfo()`.
 */
const VERSION_DETECTION_SNIPPET = `
    function detectUI5Version() {
      try {
        if (typeof sap !== 'undefined' && sap.ui) {
          if (sap.ui.version) return sap.ui.version;
          if (sap.ui.getVersionInfo) {
            var info = sap.ui.getVersionInfo();
            if (info && info.version) return info.version;
          }
        }
        return '0.0.0';
      } catch (e) {
        return '0.0.0';
      }
    }`;

/**
 * Browser-side snippet: resolves the UI5 element registry with version-aware fallback.
 *
 * @remarks
 * Dual-path resolution matching `find-control-fn.ts`:
 * - `sap.ui.core.Element.registry` (UI5 \>= 1.67)
 * - `sap.ui.core.ElementRegistry` (alternative path)
 * Returns the registry map via `.all()`, or `null` if unavailable.
 */
const REGISTRY_RESOLUTION_SNIPPET = `
    function getRegistryMap() {
      try {
        if (typeof sap === 'undefined' || !sap.ui || !sap.ui.core) return null;
        var element = sap.ui.core.Element;
        var registry = element ? element.registry : undefined;
        if (!registry) {
          registry = sap.ui.core.ElementRegistry;
        }
        if (!registry || typeof registry.all !== 'function') return null;
        return registry.all();
      } catch (e) {
        return null;
      }
    }`;

/**
 * Browser-side snippet: safely extracts a method function from an object.
 */
const SAFE_METHOD_SNIPPET = `
    function safeCall(obj, methodName) {
      try {
        if (obj && typeof obj[methodName] === 'function') {
          return obj[methodName].call(obj);
        }
        return undefined;
      } catch (e) {
        return undefined;
      }
    }`;

/**
 * Browser-side snippet: extracts curated properties from a control.
 *
 * @remarks
 * Captures the 13 most common debugging-relevant properties.
 * Only serializable values (string, number, boolean, null) are included.
 */
const PROPERTY_EXTRACTION_SNIPPET = `
    var CURATED_PROPS = [
      'text', 'value', 'selected', 'title', 'placeholder',
      'icon', 'type', 'valueState', 'editable', 'busy',
      'blocked', 'required', 'description'
    ];

    function extractProperties(ctrl) {
      var props = {};
      for (var i = 0; i < CURATED_PROPS.length; i++) {
        var propName = CURATED_PROPS[i];
        var getterName = 'get' + propName.charAt(0).toUpperCase() + propName.slice(1);
        var val = safeCall(ctrl, getterName);
        if (val !== undefined) {
          var t = typeof val;
          if (val === null || t === 'string' || t === 'number' || t === 'boolean') {
            props[propName] = val;
          }
        }
      }
      return props;
    }`;

/**
 * Browser-side snippet: extracts binding paths for data-bound properties.
 *
 * @remarks
 * Uses `getBindingInfo()` to discover OData/JSON model binding paths.
 * Falls back gracefully when bindings are unavailable.
 */
const BINDING_EXTRACTION_SNIPPET = `
    function extractBindingPaths(ctrl) {
      var paths = {};
      if (typeof ctrl.getBindingInfo !== 'function') return paths;
      var meta = safeCall(ctrl, 'getMetadata');
      if (!meta || typeof meta.getAllProperties !== 'function') return paths;
      try {
        var allProps = meta.getAllProperties();
        var propNames = Object.keys(allProps);
        for (var i = 0; i < propNames.length; i++) {
          var propName = propNames[i];
          try {
            var bindingInfo = ctrl.getBindingInfo(propName);
            if (bindingInfo && bindingInfo.parts && bindingInfo.parts.length > 0) {
              paths[propName] = bindingInfo.parts[0].path || '';
            } else if (bindingInfo && bindingInfo.path) {
              paths[propName] = bindingInfo.path;
            }
          } catch (e) {
            // Skip bindings that throw
          }
        }
      } catch (e) {
        // Skip if metadata access fails
      }
      return paths;
    }`;

/**
 * Browser-side snippet: builds a flat node data object from a control.
 */
const NODE_BUILDER_SNIPPET = `
    function buildNodeData(ctrl) {
      var id = safeCall(ctrl, 'getId') || '';
      var meta = safeCall(ctrl, 'getMetadata');
      var controlType = (meta && typeof meta.getName === 'function')
        ? meta.getName() : 'unknown';
      var domRef = safeCall(ctrl, 'getDomRef');
      var domId = (domRef && domRef.id) ? domRef.id : null;
      var visible = safeCall(ctrl, 'getVisible');
      if (visible === undefined) visible = true;
      var enabled = safeCall(ctrl, 'getEnabled');
      if (enabled === undefined) enabled = true;

      return {
        id: id,
        controlType: controlType,
        visible: !!visible,
        enabled: !!enabled,
        domId: domId,
        properties: extractProperties(ctrl),
        bindingPaths: extractBindingPaths(ctrl),
        children: []
      };
    }`;

/**
 * Browser-side snippet: recursively assembles the tree from roots.
 *
 * @remarks
 * Uses a `visited` Set for cycle protection and respects `maxDepth` limit.
 * Nodes beyond the depth limit receive `_truncated: true`.
 */
const TREE_ASSEMBLY_SNIPPET = `
    function assembleTree(nodeId, nodeMap, childrenMap, visited, depth, maxDepth) {
      if (visited.has(nodeId)) return null;
      visited.add(nodeId);

      var node = nodeMap[nodeId];
      if (!node) return null;

      var childIds = childrenMap[nodeId] || [];
      if (depth >= maxDepth && childIds.length > 0) {
        node._truncated = true;
        return node;
      }

      for (var i = 0; i < childIds.length; i++) {
        var child = assembleTree(
          childIds[i], nodeMap, childrenMap, visited, depth + 1, maxDepth
        );
        if (child !== null) {
          node.children.push(child);
        }
      }
      return node;
    }`;

// ── Main script factory ──────────────────────────────────────────────

/**
 * Creates a self-contained browser script that serializes the UI5 control registry
 * into a hierarchical tree structure.
 *
 * @remarks
 * The returned string is an IIFE suitable for `page.evaluate()`. It does NOT
 * depend on bridge injection (`window.__praman_bridge`) — it accesses
 * `sap.ui.core.Element.registry` directly for maximum reliability during
 * test failure scenarios where the bridge may be corrupted.
 *
 * @param params - Optional depth and size limits for the serialized tree.
 * @returns JavaScript IIFE string that produces a `ControlTreeSnapshot | null`.
 *
 * @example
 * ```typescript
 * import { createControlTreeScript } from '#bridge/browser-scripts/control-tree.js';
 *
 * const script = createControlTreeScript({ maxDepth: 10, maxControls: 5000 });
 * const snapshot = await page.evaluate(script);
 * ```
 */
export function createControlTreeScript(params?: ControlTreeScriptParams): string {
  const maxDepth = params?.maxDepth ?? 10;
  const maxControls = params?.maxControls ?? 5_000;
  const truncatedDepth = 3;

  return `(function() {
    try {
      ${VERSION_DETECTION_SNIPPET}
      ${REGISTRY_RESOLUTION_SNIPPET}
      ${SAFE_METHOD_SNIPPET}
      ${PROPERTY_EXTRACTION_SNIPPET}
      ${BINDING_EXTRACTION_SNIPPET}
      ${NODE_BUILDER_SNIPPET}
      ${TREE_ASSEMBLY_SNIPPET}

      // Step 1: Resolve registry
      var allMap = getRegistryMap();
      if (!allMap) return null;

      var allIds = Object.keys(allMap);
      var totalCount = allIds.length;
      if (totalCount === 0) return null;

      // Step 2: Determine effective max depth
      var effectiveMaxDepth = ${String(maxDepth)};
      var truncated = false;
      if (totalCount > ${String(maxControls)}) {
        effectiveMaxDepth = ${String(truncatedDepth)};
        truncated = true;
      }

      // Step 3: Single-pass — build flat node map + parent-child adjacency
      var nodeMap = {};
      var childrenMap = {};
      var rootIds = [];

      for (var i = 0; i < allIds.length; i++) {
        var regId = allIds[i];
        var ctrl = allMap[regId];
        if (!ctrl) continue;

        var nodeData = buildNodeData(ctrl);
        var nodeId = nodeData.id || regId;
        nodeMap[nodeId] = nodeData;

        // Determine parent
        var parent = safeCall(ctrl, 'getParent');
        var parentId = parent ? safeCall(parent, 'getId') : null;

        if (parentId && allMap[parentId] !== undefined) {
          // Parent is in registry — record as child
          if (!childrenMap[parentId]) {
            childrenMap[parentId] = [];
          }
          childrenMap[parentId].push(nodeId);
        } else {
          // No parent or parent not in registry — this is a root
          rootIds.push(nodeId);
        }
      }

      // Step 4: Assemble tree from roots
      var visited = new Set();
      var roots = [];
      for (var r = 0; r < rootIds.length; r++) {
        var root = assembleTree(
          rootIds[r], nodeMap, childrenMap, visited, 0, effectiveMaxDepth
        );
        if (root !== null) {
          roots.push(root);
        }
      }

      // Step 5: Build snapshot
      return {
        capturedAt: new Date().toISOString(),
        ui5Version: detectUI5Version(),
        totalControlCount: totalCount,
        roots: roots,
        pageUrl: window.location.href,
        truncated: truncated
      };
    } catch (e) {
      return null;
    }
  })()`;
}
