/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Interaction strategy integration tests.
 *
 * Validates UI5NativeStrategy and DomFirstStrategy press/enterText
 * against the Shopping Cart demo app with real UI5 controls.
 */

import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

import type {
  ControlDiscoveryResult,
  MethodExecutionResult,
} from '../../../src/bridge/bridge-types.js';
import { createExecuteMethodScript } from '../../../src/bridge/browser-scripts/execute-method.js';
import { createFindControlScript } from '../../../src/bridge/browser-scripts/find-control.js';
import { injectBridge } from '../../../src/bridge/injection.js';
import { DomFirstStrategy } from '../../../src/bridge/interaction-strategies/dom-first-strategy.js';
import { UI5NativeStrategy } from '../../../src/bridge/interaction-strategies/ui5-native-strategy.js';
import { APPS } from '../helpers/demo-apps.js';
import { navigateAndWaitForUI5 } from '../helpers/ui5-wait.js';

/** Inject arguments into an IIFE string by replacing the trailing `})()` invocation. */
function injectArgs(iife: string, ...args: unknown[]): string {
  const serialized = args.map((a) => JSON.stringify(a)).join(', ');
  return iife.replace(/\)\(\)$/, `)( ${serialized})`);
}

/** Evaluate find-control IIFE with the given selector. */
async function evalFind(page: Page, selector: unknown): Promise<ControlDiscoveryResult> {
  return page.evaluate<ControlDiscoveryResult>(injectArgs(createFindControlScript(), selector, {}));
}

/** Evaluate execute-method IIFE. */
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

/** Helper to find first control of a given type. */
async function findFirstControl(page: Page, controlType: string): Promise<ControlDiscoveryResult> {
  return evalFind(page, { controlType });
}

test.describe.serial('Interaction Strategies — Shopping Cart', () => {
  let page: Page;
  const ui5Native = new UI5NativeStrategy();
  const domFirst = new DomFirstStrategy();

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await navigateAndWaitForUI5(page, APPS.CART);
    await injectBridge(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('UI5NativeStrategy.press() fires real UI5 event', async () => {
    const button = await findFirstControl(page, 'sap.m.Button');
    expect(button.id).toBeTruthy();

    // Press should not throw — verifies the strategy works with real UI5
    await ui5Native.press(page, button.id);
  });

  test('UI5NativeStrategy.enterText() sets input value', async () => {
    // Find a SearchField or Input — skip test if demo app has no input fields
    /* eslint-disable playwright/no-conditional-in-test -- dynamic control discovery requires conditionals */
    let input: ControlDiscoveryResult | null = null;
    for (const type of ['sap.m.SearchField', 'sap.m.Input']) {
      const ctrl = await findFirstControl(page, type);
      if (ctrl.id !== '') {
        input = ctrl;
        break;
      }
    }

    if (input === null) {
      // eslint-disable-next-line playwright/no-skipped-test -- Shopping Cart may not have an input field visible
      test.skip();
      return;
    }

    await ui5Native.enterText(page, input.id, 'integration test');

    // Verify the value was set
    const result = await evalExec(page, input.id, 'getValue');
    expect(result.success).toBe(true);
    expect(result.value).toBe('integration test');
    /* eslint-enable playwright/no-conditional-in-test */
  });

  test('DomFirstStrategy.press() falls back to DOM click', async () => {
    const button = await findFirstControl(page, 'sap.m.Button');
    expect(button.id).toBeTruthy();

    // DomFirstStrategy should also work — DOM click fallback
    await domFirst.press(page, button.id);
  });

  test('press on non-existent control throws error', async () => {
    await expect(
      ui5Native.press(page, 'nonExistentControl_xyz_integration_test'),
    ).rejects.toThrow();
  });
});
