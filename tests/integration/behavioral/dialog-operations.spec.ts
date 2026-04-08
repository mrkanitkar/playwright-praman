/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Dialog operations integration tests.
 *
 * Validates dialog detection, state queries, and dismissal
 * against the Shopping Cart demo app.
 */

import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

import { injectBridge } from '../../../src/bridge/injection.js';
import { getOpenDialogs, isDialogOpen } from '../../../src/modules/dialog.js';
import { APPS } from '../helpers/demo-apps.js';
import { navigateAndWaitForUI5 } from '../helpers/ui5-wait.js';

test.describe.serial('Dialog Operations — Shopping Cart', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await navigateAndWaitForUI5(page, APPS.CART);
    await injectBridge(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('getOpenDialogs returns empty when no dialog open', async () => {
    const dialogs = await getOpenDialogs(page);
    expect(dialogs).toBeInstanceOf(Array);
    expect(dialogs).toHaveLength(0);
  });

  test('isDialogOpen returns false for non-existent dialog', async () => {
    const open = await isDialogOpen(page, 'nonExistentDialog_xyz_123');
    expect(open).toBe(false);
  });

  test('dialog opens and is detected after triggering action', async () => {
    // Find a button that triggers a dialog (e.g., "Proceed" in the Cart).
    // If no dialog-triggering button exists, we create a temporary dialog for testing.
    const opened = await page.evaluate(`(function() {
      try {
        // Try to create a test dialog programmatically to verify detection
        sap.ui.require(['sap/m/Dialog', 'sap/m/Button'], function(Dialog, Button) {
          var dlg = new Dialog('__praman_test_dialog', {
            title: 'Integration Test Dialog',
            content: [],
            beginButton: new Button({ text: 'OK', press: function() { dlg.close(); } }),
          });
          dlg.open();
        });
        return true;
      } catch(e) {
        return false;
      }
    })()`);
    expect(opened).toBe(true);

    // Wait briefly for dialog to render
    await page.waitForFunction(
      `(function() {
        var c = sap.ui.getCore().byId('__praman_test_dialog');
        return c && c.isOpen && c.isOpen();
      })()`,
      { timeout: 5000 },
    );

    const dialogs = await getOpenDialogs(page);
    expect(dialogs.length).toBeGreaterThan(0);
    expect(dialogs.some((d) => d.id === '__praman_test_dialog')).toBe(true);

    const open = await isDialogOpen(page, '__praman_test_dialog');
    expect(open).toBe(true);
  });

  test('dialog closes and is no longer detected', async () => {
    // Close the test dialog
    await page.evaluate(`(function() {
      var dlg = sap.ui.getCore().byId('__praman_test_dialog');
      if (dlg && dlg.isOpen()) dlg.close();
    })()`);

    // Wait for dialog to close
    await page.waitForFunction(
      `(function() {
        var c = sap.ui.getCore().byId('__praman_test_dialog');
        return !c || !c.isOpen || !c.isOpen();
      })()`,
      { timeout: 5000 },
    );

    const open = await isDialogOpen(page, '__praman_test_dialog');
    expect(open).toBe(false);

    // Clean up
    await page.evaluate(`(function() {
      var dlg = sap.ui.getCore().byId('__praman_test_dialog');
      if (dlg) dlg.destroy();
    })()`);
  });
});
