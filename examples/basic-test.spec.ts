/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Basic UI5 Control Discovery Test.
 *
 * @remarks
 * This is the simplest possible Praman test. It demonstrates:
 *
 * 1. Importing `test` and `expect` from `playwright-praman`
 * 2. Using the `ui5` fixture to discover a UI5 control by type and property
 * 3. Verifying a control property with a web-first assertion
 *
 * Prerequisites:
 * - SAP system is running and accessible
 * - Authentication is handled via a Playwright setup project (see {@link auth-setup.ts})
 * - `storageState` is configured in `playwright.config.ts`
 *
 * @example
 * ```bash
 * npx playwright test examples/basic-test.spec.ts
 * ```
 */

import { test, expect } from 'playwright-praman';

test.describe('Basic UI5 Control Discovery', () => {
  test('find a GenericTile by header text', async ({ page, ui5 }) => {
    await test.step('Navigate to Fiori Launchpad', async () => {
      await page.goto(process.env['SAP_CLOUD_BASE_URL']!);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveTitle(/Home/, { timeout: 60_000 });
    });

    await test.step('Discover tile control', async () => {
      // Use ui5.control() to find a GenericTile by its header property.
      // Praman injects the UI5 bridge automatically on first call.
      const tile = await ui5.control({
        controlType: 'sap.m.GenericTile',
        properties: { header: 'My App' },
      });

      // Verify the control type returned by the bridge
      const controlType = await tile.getControlType();
      expect(controlType).toBe('sap.m.GenericTile');

      // Read a property via the typed proxy
      const header = await tile.getProperty('header');
      expect(header).toBe('My App');
    });

    await test.step('Press the tile to navigate', async () => {
      // ui5.press() calls firePress() on the control and waits for UI5 stability
      await ui5.press({
        controlType: 'sap.m.GenericTile',
        properties: { header: 'My App' },
      });

      // Wait for the target app to finish loading
      await ui5.waitForUI5();
    });
  });
});
