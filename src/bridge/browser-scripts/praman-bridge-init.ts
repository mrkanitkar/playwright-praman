/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Standalone Praman bridge initialization script for Playwright CLI `initScript`.
 *
 * @intent Enable agent-driven SAP UI5 test automation by establishing a browser-side
 * bridge (`window.__praman_bridge`) that exposes control discovery, method execution,
 * and object storage APIs — without requiring the SAP test framework to be loaded first.
 * Lazy injection (W14) is chosen over eager injection because SAP UI5 bootstraps
 * asynchronously and `sap.ui.require` may not be available at page load. Polling at
 * 100ms intervals balances responsiveness against CPU overhead. The 3-tier `getById`
 * resolution (D19) ensures compatibility across UI5 1.38–1.130+ by falling back through
 * `Element.getElementById` → `ElementRegistry.get` → `Core.byId`.
 *
 * @remarks
 * This file is bundled by esbuild into `dist/browser/praman-bridge-init.js` as an IIFE.
 * It runs in the browser context (no Node.js APIs) and initializes
 * `window.__praman_bridge` with UI5 control discovery capabilities.
 *
 * Used by Playwright CLI config:
 * ```json
 * { "browser": { "initScript": ["./node_modules/playwright-praman/dist/browser/praman-bridge-init.js"] } }
 * ```
 *
 * Key design decisions:
 * - W14: Lazy-only injection via polling for `sap.ui.require`
 * - D19: 3-tier API resolution (Element.getElementById → ElementRegistry.get → Core.byId)
 * - Idempotent: checks `window.__praman_ready` before re-initializing
 * - Polls at 100ms intervals with 30s timeout for UI5 availability
 *
 * @module bridge/browser-scripts
 */

/* ------------------------------------------------------------------ *
 * IMPORTANT: This file is a self-executing browser script.           *
 * - NO Node.js APIs (require, process, __dirname, Buffer, import)    *
 * - NO TypeScript imports — pure browser JS wrapped in .ts for build *
 * - All code runs directly in the browser page context               *
 * ------------------------------------------------------------------ */

/* eslint-disable @typescript-eslint/no-unsafe-assignment --
   Browser context: all SAP globals (window.sap.*) are untyped */
/* eslint-disable @typescript-eslint/no-unsafe-member-access --
   Browser context: accessing SAP APIs requires traversing untyped chains */
/* eslint-disable @typescript-eslint/no-unsafe-call --
   Browser context: calling SAP APIs (sap.ui.require, core.byId, etc.) */
/* eslint-disable @typescript-eslint/no-unsafe-return --
   Browser context: returning SAP control references */
/* eslint-disable @typescript-eslint/strict-boolean-expressions --
   Browser context: truthy checks on SAP globals (if win.sap.ui) */
/* eslint-disable @typescript-eslint/prefer-optional-chain --
   Browser context: explicit null checks for SAP global chains */
/* eslint-disable @typescript-eslint/naming-convention --
   SAP module names are PascalCase (RecordReplay, Element, Log) */
/* eslint-disable @typescript-eslint/no-unused-vars --
   Catch-all error vars (_e) required by ESLint no-empty-catch */
/* eslint-disable security/detect-object-injection --
   Dynamic bracket access on window using known constant keys (NAMESPACE, READY_FLAG) */
/* eslint-disable sonarjs/cognitive-complexity --
   3-tier getById resolution requires nested null-checks (cannot simplify) */
/* eslint-disable sonarjs/no-ignored-exceptions --
   Catch blocks intentionally ignore errors for graceful degradation */
/* eslint-disable n/no-unsupported-features/node-builtins --
   crypto.randomUUID() is a browser API (Web Crypto), not a Node.js API */
/* eslint-disable @typescript-eslint/no-explicit-any --
   Browser context: interacting with untyped SAP globals and window properties */

// Inline constants (cannot import from bridge-constants.ts — browser-only file)
const NAMESPACE = '__praman_bridge';
const READY_FLAG = '__praman_ready';
const POLLING_INTERVAL = 100;
const INJECTION_TIMEOUT = 30_000;

/**
 * Idempotency guard: if the bridge is already initialized, exit immediately.
 */
if (!(window as any)[READY_FLAG]) {
  initBridge();
}

/**
 * Initializes the Praman bridge on the current page.
 *
 * @remarks
 * Sets up `window.__praman_bridge` with version info, object map,
 * helper utilities, and 3-tier `getById()` resolution. Then polls
 * for `sap.ui.require` availability (100ms interval, 30s timeout)
 * to load UI5 modules (RecordReplay, Element, Log).
 */
function initBridge(): void {
  const win = window as any;

  const bridge: Record<string, any> = {};
  bridge['version'] = '1.0.0';
  bridge['injectedAt'] = Date.now();
  bridge['ready'] = false;

  // ── Object Map (UUID-keyed non-control storage) ──────────────────

  bridge['objectMap'] = new Map();

  bridge['saveObject'] = function saveObject(obj: unknown, type?: string): string {
    const uuid = crypto.randomUUID();
    (bridge['objectMap'] as Map<string, unknown>).set(uuid, {
      value: obj,
      type: type ?? 'unknown',
      storedAt: Date.now(),
    });
    return uuid;
  };

  bridge['getObject'] = function getObject(uuid: string): unknown {
    const entry = (bridge['objectMap'] as Map<string, any>).get(uuid);
    return entry ? entry.value : undefined;
  };

  bridge['deleteObject'] = function deleteObject(uuid: string): boolean {
    return (bridge['objectMap'] as Map<string, unknown>).delete(uuid);
  };

  // ── Serialization Helpers ────────────────────────────────────────

  bridge['isPrimitive'] = function isPrimitive(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    const t = typeof value;
    return t === 'string' || t === 'number' || t === 'boolean';
  };

  bridge['getCircularReplacer'] = function getCircularReplacer(): (
    key: string,
    value: unknown,
  ) => unknown {
    const seen = new WeakSet();
    return function (_key: string, value: unknown): unknown {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    };
  };

  // ── 3-Tier getById (D19) ────────────────────────────────────────

  bridge['getById'] = function getById(id: string): unknown {
    try {
      if (typeof win.sap !== 'undefined') {
        // Tier 1: Element.getElementById (UI5 1.120+)
        if (
          win.sap.ui &&
          win.sap.ui.core &&
          win.sap.ui.core.Element &&
          win.sap.ui.core.Element.getElementById
        ) {
          const el = win.sap.ui.core.Element.getElementById(id);
          if (el) return el;
        }

        // Tier 2: ElementRegistry.get (UI5 1.67+)
        if (win.sap.ui && win.sap.ui.core) {
          const ER = win.sap.ui.require('sap/ui/core/ElementRegistry');
          if (ER && ER.get) {
            const el2 = ER.get(id);
            if (el2) return el2;
          }
        }

        // Tier 3: Core.byId (legacy, all versions)
        if (win.sap.ui && win.sap.ui.getCore) {
          const core = win.sap.ui.getCore();
          if (core && core.byId) {
            const el3 = core.byId(id);
            if (el3) return el3;
          }
        }
      }
      return null;
    } catch (_e) {
      return null;
    }
  };

  // ── Module placeholders (filled when UI5 modules load) ──────────

  bridge['RecordReplay'] = null;
  bridge['Element'] = null;
  bridge['Log'] = null;

  // ── Utility functions ───────────────────────────────────────────

  bridge['utils'] = {
    retrieveControlMethods: function retrieveControlMethods(controlId: string): string[] {
      const ctrl = (bridge['getById'] as (id: string) => unknown)(controlId);
      if (!ctrl) return [];
      const methods: string[] = [];
      let proto = Object.getPrototypeOf(ctrl);
      while (proto && proto !== Object.prototype) {
        const names = Object.getOwnPropertyNames(proto);
        for (const name of names) {
          if (typeof proto[name] === 'function' && !methods.includes(name)) {
            methods.push(name);
          }
        }
        proto = Object.getPrototypeOf(proto);
      }
      return methods;
    },
    controlExists: function controlExists(controlId: string): boolean {
      return (bridge['getById'] as (id: string) => unknown)(controlId) !== null;
    },
  };

  // ── Version detection helper ────────────────────────────────────

  function detectUI5Version(): string {
    try {
      if (typeof win.sap !== 'undefined' && win.sap.ui && win.sap.ui.version) {
        return win.sap.ui.version as string;
      }
    } catch (_e) {
      // Ignore — version detection is best-effort
    }
    return '0.0.0';
  }

  // ── Mark bridge as ready ────────────────────────────────────────

  function markReady(): void {
    bridge['ui5Version'] = detectUI5Version();
    bridge['ready'] = true;
    win[READY_FLAG] = true;
  }

  // ── Load UI5 modules via sap.ui.require ─────────────────────────

  function loadUI5Modules(): void {
    try {
      win.sap.ui.require(
        ['sap/ui/test/RecordReplay', 'sap/ui/core/Element', 'sap/base/Log'],
        function (RecordReplay: unknown, Element: unknown, Log: unknown): void {
          bridge['RecordReplay'] = RecordReplay ?? null;
          bridge['Element'] = Element ?? null;
          bridge['Log'] = Log ?? null;
          markReady();
        },
        function (): void {
          // Module loading failed — mark ready without RecordReplay
          markReady();
        },
      );
    } catch (_e) {
      // Module loading threw — mark ready without RecordReplay
      markReady();
    }
  }

  // ── Attach bridge to window ─────────────────────────────────────

  win[NAMESPACE] = bridge;

  // ── Poll for sap.ui.require availability ────────────────────────

  const pollStart = Date.now();

  function pollForUI5(): void {
    // Check if sap.ui.require is available
    if (typeof win.sap !== 'undefined' && win.sap.ui && win.sap.ui.require) {
      loadUI5Modules();
      return;
    }

    // Timeout reached — mark ready without UI5 modules
    if (Date.now() - pollStart >= INJECTION_TIMEOUT) {
      bridge['ui5Version'] = '0.0.0';
      markReady();
      return;
    }

    // Schedule next poll
    setTimeout(pollForUI5, POLLING_INTERVAL);
  }

  pollForUI5();
}
