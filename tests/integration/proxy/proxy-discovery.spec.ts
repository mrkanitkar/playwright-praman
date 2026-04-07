/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Proxy layer discovery integration tests (Issue #21 — INT2, first half).
 *
 * Validates UI5Handler control discovery, proxy creation, and method
 * forwarding against the Browse Orders demo app.
 */

import { test, expect  } from '@playwright/test';
import type {Page} from '@playwright/test';

import { UI5NativeStrategy } from '../../../src/bridge/interaction-strategies/ui5-native-strategy.js';
import { TimeoutError } from '../../../src/core/errors/timeout-error.js';
import { UI5Handler } from '../../../src/fixtures/ui5-handler.js';
import { APPS } from '../helpers/demo-apps.js';
import { navigateAndWaitForUI5 } from '../helpers/ui5-wait.js';

function createHandler(page: Page): UI5Handler {
  return new UI5Handler({
    page,
    interactionStrategy: new UI5NativeStrategy(),
    discoveryStrategies: ['direct-id', 'registry'],
    config: {
      controlDiscoveryTimeout: 15_000,
      skipStabilityWait: true,
    },
  });
}

test.describe.serial('Proxy Discovery — Browse Orders', () => {
  let page: Page;
  let handler: UI5Handler;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await navigateAndWaitForUI5(page, APPS.BROWSE_ORDERS);
    handler = createHandler(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('UI5Handler.control() discovers by controlType', async () => {
    const control = await handler.control({ controlType: 'sap.m.List' });
    expect(control.id).toBeTruthy();
    expect(control.controlType).toBe('sap.m.List');
  });

  test('UI5Handler.control() discovers App', async () => {
    const control = await handler.control({ controlType: 'sap.m.App' });
    expect(control.id).toBeTruthy();
    expect(control.controlType).toBe('sap.m.App');
  });

  test('UI5Handler.controls() returns multiple proxies', async () => {
    const controls = await handler.controls({ controlType: 'sap.m.Button' });
    expect(controls.length).toBeGreaterThan(0);
    for (const ctrl of controls) {
      expect(ctrl.controlType).toBe('sap.m.Button');
      expect(ctrl.id).toBeTruthy();
    }
  });

  test('proxy.getProperty() returns real value', async () => {
    const app = await handler.control({ controlType: 'sap.m.App' });
    const visible = await app.getProperty('visible');
    expect(visible).toBe(true);
  });

  test('proxy.getVisible() returns boolean', async () => {
    const app = await handler.control({ controlType: 'sap.m.App' });
    const visible = await app.getVisible();
    expect(typeof visible).toBe('boolean');
    expect(visible).toBe(true);
  });

  test('proxy.getControlType() matches controlType property', async () => {
    const app = await handler.control({ controlType: 'sap.m.App' });
    const type = await app.getControlType();
    expect(type).toBe('sap.m.App');
    expect(type).toBe(app.controlType);
  });

  test('proxy.getId() returns control id', async () => {
    const app = await handler.control({ controlType: 'sap.m.App' });
    const id = await app.getId();
    expect(typeof id).toBe('string');
    expect(id).toBe(app.id);
  });

  // eslint-disable-next-line playwright/expect-expect -- waitFor resolving without error IS the assertion
  test('UI5Handler.waitFor() succeeds for existing control', async () => {
    await handler.waitFor({ controlType: 'sap.m.App' }, { timeout: 5000 });
  });

  test('UI5Handler.waitFor() throws TimeoutError for missing control', async () => {
    await expect(
      handler.waitFor({ id: 'doesNotExist_xyz_integration_test' }, { timeout: 2000 }),
    ).rejects.toThrow(TimeoutError);
  });

  test('UI5Handler.inspect() returns full metadata', async () => {
    const info = await handler.inspect({ controlType: 'sap.m.App' });
    expect(info.id).toBeTruthy();
    expect(info.controlType).toBe('sap.m.App');
    expect(info.visible).toBe(true);
    expect(info.properties).toBeDefined();
    expect(typeof info.properties).toBe('object');
  });
});
