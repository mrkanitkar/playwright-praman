/**
 * @license
 * Copyright (c) ZesTest 2025-2030. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file may contain AI-assisted code.
 * See LICENSE and NOTICE files for details.
 */

/**
 * Dialog Handling Example -- open, interact, confirm, dismiss.
 *
 * @remarks
 * This example demonstrates how to work with SAP UI5 dialogs using Praman:
 *
 * 1. **Open a dialog** by pressing a button that triggers it
 * 2. **Find controls inside dialogs** using `searchOpenDialogs: true`
 * 3. **Verify dialog state** with `isOpen()`
 * 4. **Interact with dialog fields** using `ui5.fill()` and `ui5.press()`
 * 5. **Close dialogs** via `close()` or by pressing Cancel/OK buttons
 *
 * The `searchOpenDialogs: true` option is **critical** for dialog controls.
 * Without it, `ui5.control()` only searches the main view and will not
 * find controls rendered inside an `sap.m.Dialog`.
 *
 * Prerequisites:
 * - Authentication handled via setup project (see {@link auth-setup.ts})
 * - App with a Create/Edit dialog must be accessible
 *
 * @example
 * ```bash
 * npx playwright test examples/dialog-handling.spec.ts
 * ```
 */

import { test, expect } from 'playwright-praman';

test.describe('Dialog Handling', () => {
  test('open dialog, fill fields, and dismiss', async ({ page, ui5 }) => {
    await test.step('Navigate to app', async () => {
      await page.goto(process.env['SAP_CLOUD_BASE_URL']!);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveTitle(/Home/, { timeout: 60_000 });

      await expect(async () => {
        await ui5.press({
          controlType: 'sap.m.GenericTile',
          properties: { header: 'My App' },
        });
      }).toPass({ timeout: 60_000, intervals: [5000, 10_000] });

      await ui5.waitForUI5();
    });

    await test.step('Open Create dialog', async () => {
      // Press the Create button to open a dialog
      await ui5.press({
        controlType: 'sap.m.Button',
        properties: { text: 'Create' },
      });
      await ui5.waitForUI5();
    });

    await test.step('Verify dialog structure', async () => {
      // searchOpenDialogs: true is REQUIRED to find controls inside dialogs.
      // Without it, ui5.control() only searches the main view.
      const nameField = await ui5.control({
        id: 'createDialog--nameField',
        searchOpenDialogs: true,
      });

      const controlType = await nameField.getControlType();
      expect(controlType).toBe('sap.ui.comp.smartfield.SmartField');

      // Check if the field is required
      const isRequired = await nameField.getRequired();
      expect(isRequired).toBe(true);

      // Verify dialog buttons exist
      const okBtn = await ui5.control({
        id: 'createDialog--okBtn',
        searchOpenDialogs: true,
      });
      const cancelBtn = await ui5.control({
        id: 'createDialog--cancelBtn',
        searchOpenDialogs: true,
      });

      const okText = await okBtn.getProperty('text');
      const cancelText = await cancelBtn.getProperty('text');
      expect(okText).toBe('Create');
      expect(cancelText).toBe('Cancel');
    });

    await test.step('Fill dialog fields', async () => {
      // Use ui5.fill() for atomic setValue + fireChange + waitForUI5.
      // Always include searchOpenDialogs: true for dialog controls.
      await ui5.fill(
        { id: 'createDialog--nameInput', searchOpenDialogs: true },
        'Test Entry',
      );
      await ui5.waitForUI5();

      // Verify the value was set
      const value = await ui5.getValue({
        id: 'createDialog--nameInput',
        searchOpenDialogs: true,
      });
      expect(value).toBe('Test Entry');
    });

    await test.step('Dismiss dialog with Cancel', async () => {
      // Press Cancel to close the dialog without saving
      await ui5.press({
        id: 'createDialog--cancelBtn',
        searchOpenDialogs: true,
      });
      await ui5.waitForUI5();

      // Verify dialog is closed -- the Cancel button should no longer be findable.
      // Use a try/catch because ui5.control() will throw if the control is not found.
      let dialogClosed = false;
      try {
        await ui5.control({
          id: 'createDialog--cancelBtn',
          searchOpenDialogs: true,
        });
      } catch {
        // Control not found -- dialog is closed
        dialogClosed = true;
      }
      expect(dialogClosed).toBe(true);
    });
  });

  test('confirm dialog with value help', async ({ page, ui5 }) => {
    await test.step('Navigate to app', async () => {
      await page.goto(process.env['SAP_CLOUD_BASE_URL']!);
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveTitle(/Home/, { timeout: 60_000 });

      await expect(async () => {
        await ui5.press({
          controlType: 'sap.m.GenericTile',
          properties: { header: 'My App' },
        });
      }).toPass({ timeout: 60_000, intervals: [5000, 10_000] });

      await ui5.waitForUI5();
    });

    await test.step('Open value help dialog', async () => {
      // Value help icons open a secondary dialog
      await ui5.press({
        id: 'myField-input-vhi',
        searchOpenDialogs: true,
      });

      // Verify the value help dialog opened
      const vhDialog = await ui5.control({
        id: 'myField-input-valueHelpDialog',
        searchOpenDialogs: true,
      });
      const isOpen = await vhDialog.isOpen();
      expect(isOpen).toBe(true);
    });

    await test.step('Close value help dialog', async () => {
      const vhDialog = await ui5.control({
        id: 'myField-input-valueHelpDialog',
        searchOpenDialogs: true,
      });

      // close() calls the UI5 Dialog.close() method directly
      await vhDialog.close();
      await ui5.waitForUI5();
    });
  });
});
