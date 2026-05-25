/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Proxy chaining integration tests.
 *
 * Validates fluent method chaining, cache behavior, and return type
 * classification against the Worklist demo app.
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

import { UI5NativeStrategy } from '../../../src/bridge/interaction-strategies/ui5-native-strategy.js';
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

test.describe.serial('Proxy Chaining — Cart', () => {
  let page: Page;
  let handler: UI5Handler;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await navigateAndWaitForUI5(page, APPS.CART);
    handler = createHandler(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('getAggregation returns child controls', async () => {
    const app = await handler.control({ controlType: 'sap.m.App' });
    const pages = await app.getAggregation('pages');
    expect(pages).toBeInstanceOf(Array);
    expect(pages.length).toBeGreaterThan(0);
    expect(pages[0]?.id).toBeTruthy();
  });

  test('getProperty returns real values', async () => {
    const app = await handler.control({ controlType: 'sap.m.App' });
    const visible = await app.getProperty('visible');
    expect(visible).toBe(true);
  });

  test('same selector returns same control id', async () => {
    const selector = { controlType: 'sap.m.App' as const };
    const ctrl1 = await handler.control(selector);
    const ctrl2 = await handler.control(selector);
    expect(ctrl1.id).toBe(ctrl2.id);
  });

  test('clearCache forces re-discovery', async () => {
    const selector = { controlType: 'sap.m.App' as const };
    const ctrl1 = await handler.control(selector);
    handler.clearCache();
    const ctrl2 = await handler.control(selector);
    // Same control ID but potentially new proxy instance
    expect(ctrl2.id).toBe(ctrl1.id);
  });

  test('getVisible and getId return correct types', async () => {
    const app = await handler.control({ controlType: 'sap.m.App' });

    const visible = await app.getVisible();
    expect(typeof visible).toBe('boolean');
    expect(visible).toBe(true);

    const id = await app.getId();
    expect(typeof id).toBe('string');
    expect(id).toBeTruthy();
  });

  test('getControlType matches proxy controlType', async () => {
    const app = await handler.control({ controlType: 'sap.m.App' });
    const type = await app.getControlType();
    expect(type).toBe('sap.m.App');
    expect(type).toBe(app.controlType);
  });
});
