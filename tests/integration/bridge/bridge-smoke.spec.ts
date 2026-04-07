/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Bridge integration smoke tests (Issue #19 — INT1).
 *
 * Validates the real round-trip of bridge injection, version detection,
 * control discovery, and method execution against public UI5 demo apps.
 * No authentication required — runs against ui5.sap.com CDN.
 */

import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

import { BRIDGE_GLOBALS } from '../../../src/bridge/bridge-constants.js';
import type {
  ControlDiscoveryResult,
  MethodExecutionResult,
} from '../../../src/bridge/bridge-types.js';
import { createExecuteMethodScript } from '../../../src/bridge/browser-scripts/execute-method.js';
import {
  createFindAllControlsScript,
  createFindControlScript,
} from '../../../src/bridge/browser-scripts/find-control.js';
import { createGetVersionScript } from '../../../src/bridge/browser-scripts/get-version.js';
import {
  ensureBridgeInjected,
  injectBridge,
  isBridgeReady,
  resetPageInjection,
} from '../../../src/bridge/injection.js';
import { BridgeError } from '../../../src/core/errors/bridge-error.js';
import { APPS, UI5_VERSION } from '../helpers/demo-apps.js';
import { navigateAndWaitForUI5 } from '../helpers/ui5-wait.js';

/** Inject arguments into an IIFE string by replacing the trailing `})()` invocation. */
function injectArgs(iife: string, ...args: unknown[]): string {
  const serialized = args.map((a) => JSON.stringify(a)).join(', ');
  return iife.replace(/\)\(\)$/, `)( ${serialized})`);
}

/** Evaluate the find-control IIFE with the given selector and options. */
async function evalFind(
  page: Page,
  selector: unknown,
  options: unknown = {},
): Promise<ControlDiscoveryResult> {
  return page.evaluate<ControlDiscoveryResult>(
    injectArgs(createFindControlScript(), selector, options),
  );
}

/** Evaluate the find-all-controls IIFE with the given selector and options. */
async function evalFindAll(
  page: Page,
  selector: unknown,
  options: unknown = {},
): Promise<ControlDiscoveryResult[]> {
  return page.evaluate<ControlDiscoveryResult[]>(
    injectArgs(createFindAllControlsScript(), selector, options),
  );
}

/** Evaluate the execute-method IIFE with controlId, methodName, args. */
async function evalExec(
  page: Page,
  controlId: string,
  methodName: string,
  args: unknown[] = [],
): Promise<MethodExecutionResult> {
  return page.evaluate<MethodExecutionResult>(
    injectArgs(createExecuteMethodScript(), controlId, methodName, args),
  );
}

// ── Group 1: Bridge Injection ────────────────────────────────────────

test.describe.serial('Bridge Injection', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await navigateAndWaitForUI5(page, APPS.CART);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('bridge injects successfully into UI5 app', async () => {
    await injectBridge(page);
    const ready = await isBridgeReady(page);
    expect(ready).toBe(true);

    const bridgeExists = await page.evaluate(
      `!!(window.${BRIDGE_GLOBALS.NAMESPACE} && window.${BRIDGE_GLOBALS.NAMESPACE}.ready)`,
    );
    expect(bridgeExists).toBe(true);
  });

  test('version detection returns real semver', async () => {
    const script = createGetVersionScript();
    const version = await page.evaluate(script);
    expect(version).toMatch(/^\d+\.\d+\.\d+/);
    const escaped = UI5_VERSION.replaceAll('.', '\\.');
    // eslint-disable-next-line security/detect-non-literal-regexp -- pinned version constant, not user input
    expect(version).toMatch(new RegExp(`^${escaped}`));
  });

  test('bridge is idempotent on re-injection', async () => {
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const timestampBefore = await page.evaluate(`window.${ns}.injectedAt`);
    expect(timestampBefore).toBeGreaterThan(0);

    // Second injection should be a no-op
    await injectBridge(page);

    const timestampAfter = await page.evaluate(`window.${ns}.injectedAt`);
    expect(timestampAfter).toBe(timestampBefore);
  });

  test('ensureBridgeInjected skips when already injected', async () => {
    const start = Date.now();
    await ensureBridgeInjected(page);
    const elapsed = Date.now() - start;

    // WeakSet fast path should return near-instantly
    expect(elapsed).toBeLessThan(100);
  });
});

// ── Group 2: Control Discovery ───────────────────────────────────────

test.describe.serial('Control Discovery', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await navigateAndWaitForUI5(page, APPS.CART);
    await injectBridge(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('findControl discovers control by controlType', async () => {
    const result = await evalFind(page, { controlType: 'sap.m.App' });
    expect(result.id).toBeTruthy();
    expect(result.controlType).toBe('sap.m.App');
    expect(result.methods).toBeInstanceOf(Array);
    expect(result.methods.length).toBeGreaterThan(0);
  });

  test('findControl discovers control by specific controlType', async () => {
    const result = await evalFind(page, { controlType: 'sap.m.Button' });
    expect(result.id).toBeTruthy();
    expect(result.controlType).toBe('sap.m.Button');
  });

  test('findAllControls returns multiple controls', async () => {
    const result = await evalFindAll(page, { controlType: 'sap.m.Button' });
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(1);
    for (const ctrl of result) {
      // RecordReplay matches subclasses (e.g. sap.m.ToggleButton extends sap.m.Button)
      expect(ctrl.controlType).toMatch(/^sap\.m\..*Button/);
    }
  });

  test('findControl returns empty for non-existent control', async () => {
    const result = await evalFind(page, { id: 'nonExistentControl_xyz_123_DoesNotExist' });
    expect(result.id).toBe('');
    expect(result.controlType).toBe('unknown');
  });
});

// ── Group 3: Method Execution ────────────────────────────────────────

test.describe.serial('Method Execution', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await navigateAndWaitForUI5(page, APPS.CART);
    await injectBridge(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('executeMethod returns real property value', async () => {
    const found = await evalFind(page, { controlType: 'sap.m.Button' });
    expect(found.id).toBeTruthy();

    // Use getVisible — a real UI5 method available on all controls
    const result = await evalExec(page, found.id, 'getVisible');
    expect(result.success).toBe(true);
    expect(result.value).toBe(true);
  });

  test('retrieveControlMethods returns real method list', async () => {
    const ns = BRIDGE_GLOBALS.NAMESPACE;
    const found = await evalFind(page, { controlType: 'sap.m.Button' });
    expect(found.id).toBeTruthy();

    // Use bridge.utils.retrieveControlMethods as the authoritative source
    const methods = await page.evaluate<string[]>(`
      (function() {
        var bridge = window.${ns};
        return bridge.utils.retrieveControlMethods('${found.id}');
      })()
    `);
    expect(methods).toBeInstanceOf(Array);
    expect(methods).toContain('getText');
    expect(methods).toContain('getEnabled');
    expect(methods).toContain('getVisible');
    expect(methods).toContain('getId');

    // found.methods from the IIFE may be populated depending on discovery path
    expect(found.methods).toBeInstanceOf(Array);
  });
});

// ── Group 4: Error Handling ──────────────────────────────────────────

test.describe('Error Handling', () => {
  test('bridge fails gracefully on non-UI5 page', async ({ browser }) => {
    const page = await browser.newPage();
    try {
      await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
      await expect(async () => {
        await injectBridge(page);
      }).rejects.toThrow(BridgeError);
    } finally {
      await page.close();
    }
  });

  test('resetPageInjection allows re-injection after navigation', async ({ browser }) => {
    const page = await browser.newPage();
    try {
      // Inject on Cart app
      await navigateAndWaitForUI5(page, APPS.CART);
      await injectBridge(page);
      const readyBefore = await isBridgeReady(page);
      expect(readyBefore).toBe(true);

      // Reset injection tracking
      resetPageInjection(page);

      // Navigate to a different app (destroys bridge)
      await navigateAndWaitForUI5(page, APPS.WORKLIST);

      // Re-inject on the new page
      await ensureBridgeInjected(page);
      const readyAfter = await isBridgeReady(page);
      expect(readyAfter).toBe(true);

      // Verify bridge works on the new page
      const version = await page.evaluate(createGetVersionScript());
      const escaped = UI5_VERSION.replaceAll('.', '\\.');
      // eslint-disable-next-line security/detect-non-literal-regexp -- pinned version constant, not user input
      expect(version).toMatch(new RegExp(`^${escaped}`));
    } finally {
      await page.close();
    }
  });
});
